-- The Gold Plan — Promo Codes (1 month free, unique codes)
-- Run in Supabase SQL Editor or via direct DB. Safe to re-run (idempotent).

-- ---------------------------------------------------------------
-- promo_codes: one row per unique code
-- ---------------------------------------------------------------
create table if not exists public.promo_codes (
  code text primary key,
  max_uses int not null default 1,
  used_count int not null default 0,
  duration_days int not null default 30,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- promo_redemptions: who redeemed what (max 1 promo per user)
-- ---------------------------------------------------------------
create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.promo_codes (code) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

-- No user-facing select policies on these tables — the only path is the
-- redeem_promo RPC below (security definer). Admins list via admin_list_promos().

-- ---------------------------------------------------------------
-- Redeem a promo code for the CURRENT user (self-serve, own email)
-- ---------------------------------------------------------------
create or replace function public.redeem_promo(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_code   public.promo_codes%rowtype;
  v_uid    uuid := auth.uid();
  v_period timestamptz;
  v_lifetime boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_code
  from public.promo_codes
  where code = upper(trim(p_code));

  if not found then
    raise exception 'Invalid promo code';
  end if;
  if not v_code.active then
    raise exception 'Promo code is no longer active';
  end if;
  if v_code.used_count >= v_code.max_uses then
    raise exception 'Promo code has already been used';
  end if;
  if exists (select 1 from public.promo_redemptions where user_id = v_uid) then
    raise exception 'You have already redeemed a promo code';
  end if;

  -- Never downgrade an existing lifetime plan.
  select (plan = 'lifetime' and status in ('active', 'trialing'))
  into v_lifetime
  from public.subscriptions
  where user_id = v_uid;

  if v_lifetime then
    raise exception 'You already have lifetime access';
  end if;

  insert into public.promo_redemptions (code, user_id)
  values (v_code.code, v_uid);

  update public.promo_codes
  set used_count = used_count + 1
  where code = v_code.code;

  -- Extend from now, or from an existing active period if still running.
  select coalesce(
    (select current_period_end
     from public.subscriptions
     where user_id = v_uid
       and status in ('active', 'trialing', 'past_due')
       and current_period_end > now()),
    now()
  ) + make_interval(days => v_code.duration_days)
  into v_period;

  insert into public.subscriptions (user_id, plan, status, current_period_end)
  values (v_uid, 'monthly', 'active', v_period)
  on conflict (user_id) do update set
    plan = 'monthly',
    status = 'active',
    current_period_end = excluded.current_period_end,
    updated_at = now();

  return jsonb_build_object(
    'plan', 'monthly',
    'status', 'active',
    'current_period_end', v_period,
    'code', v_code.code
  );
end;
$$;

grant execute on function public.redeem_promo(text) to authenticated;

-- ---------------------------------------------------------------
-- Admin: list promo codes + who redeemed them
-- ---------------------------------------------------------------
create or replace function public.admin_list_promos()
returns table (
  code text,
  max_uses int,
  used_count int,
  duration_days int,
  active boolean,
  created_at timestamptz,
  note text,
  redeemed_by text
)
language sql stable security definer set search_path = public
as $$
  select
    c.code,
    c.max_uses,
    c.used_count,
    c.duration_days,
    c.active,
    c.created_at,
    c.note,
    r.email
  from public.promo_codes c
  left join public.promo_redemptions pr on pr.code = c.code
  left join auth.users r on r.id = pr.user_id
  where public.is_admin()
  order by c.created_at asc
$$;

grant execute on function public.admin_list_promos() to authenticated;
