-- The Gold Plan — Admin & Roles (Fasa C)
-- Run in Supabase SQL Editor or via direct DB. Safe to re-run (idempotent).

-- ---------------------------------------------------------------
-- profiles: role + disabled flag per user
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Security-definer helpers (callable via RPC by the app)
-- ---------------------------------------------------------------

-- Is the CURRENT user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where user_id = auth.uid()), false)
$$;

-- Is the CURRENT user disabled?
create or replace function public.current_user_disabled()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select disabled from public.profiles where user_id = auth.uid()), false)
$$;

-- Admin: list every user with profile + subscription. Returns 0 rows for non-admins.
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  role text,
  disabled boolean,
  created_at timestamptz,
  plan text,
  sub_status text,
  current_period_end timestamptz
)
language sql stable security definer set search_path = public
as $$
  select
    u.id,
    u.email,
    coalesce(p.role, 'user'),
    coalesce(p.disabled, false),
    u.created_at,
    s.plan,
    s.status,
    s.current_period_end
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  left join public.subscriptions s on s.user_id = u.id
  where public.is_admin()
  order by u.created_at asc
$$;

-- Admin: set role / disabled for a target user.
create or replace function public.admin_set_user(
  target uuid,
  p_role text default null,
  p_disabled boolean default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  insert into public.profiles (user_id, role, disabled)
  values (target, coalesce(p_role, 'user'), coalesce(p_disabled, false))
  on conflict (user_id) do update set
    role = coalesce(p_role, public.profiles.role),
    disabled = coalesce(p_disabled, public.profiles.disabled),
    updated_at = now();
end;
$$;

-- Ensure the authenticated role can execute these RPCs.
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.current_user_disabled() to authenticated, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user(uuid, text, boolean) to authenticated;
