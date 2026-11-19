-- Trading Plan Generator: saved plans (one row per generated plan).
-- Premium feature. Run in Supabase SQL editor or via psql. Idempotent.

create table if not exists public.trading_plans (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  balance numeric not null check (balance > 0),
  target_pct numeric not null check (target_pct > 0),
  risk_pct numeric not null check (risk_pct > 0),
  max_dd_pct numeric not null check (max_dd_pct > 0),
  horizon_days integer not null check (horizon_days > 0),
  result jsonb not null
);

create index if not exists trading_plans_user_idx
  on public.trading_plans (user_id, created_at desc);

alter table public.trading_plans enable row level security;

drop policy if exists "trading_plans_own" on public.trading_plans;
create policy "trading_plans_own" on public.trading_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
