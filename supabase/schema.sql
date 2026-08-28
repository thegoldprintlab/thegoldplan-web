-- The Gold Plan Trading Journey — Supabase schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).

-- ---------------------------------------------------------------
-- trades: one row per logged trade
-- ---------------------------------------------------------------
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trade_date date not null,
  account text not null,
  session text not null,
  setup text not null,
  direction text not null check (direction in ('BUY', 'SELL')),
  entry_price numeric(12,2) not null,
  exit_price numeric(12,2) not null,
  pips numeric(12,1) not null,
  profit_loss numeric(12,2) not null,
  emotion text not null,
  notes text not null default ''
);

create index if not exists trades_user_date_idx on public.trades (user_id, trade_date desc);
create index if not exists trades_user_created_idx on public.trades (user_id, created_at desc);

-- ---------------------------------------------------------------
-- settings: per-user dropdowns + daily loss limit
-- ---------------------------------------------------------------
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  setups text[] not null,
  sessions text[] not null,
  emotions text[] not null,
  accounts text[] not null,
  max_daily_loss numeric(12,2) not null default 100,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row Level Security: a user can only read/write their own rows
-- ---------------------------------------------------------------
alter table public.trades enable row level security;
alter table public.settings enable row level security;

drop policy if exists "trades_select_own" on public.trades;
create policy "trades_select_own" on public.trades
  for select using (auth.uid() = user_id);

drop policy if exists "trades_insert_own" on public.trades;
create policy "trades_insert_own" on public.trades
  for insert with check (auth.uid() = user_id);

drop policy if exists "trades_delete_own" on public.trades;
create policy "trades_delete_own" on public.trades
  for delete using (auth.uid() = user_id);

drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own" on public.settings
  for select using (auth.uid() = user_id);

drop policy if exists "settings_insert_own" on public.settings;
create policy "settings_insert_own" on public.settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.settings;
create policy "settings_update_own" on public.settings
  for update using (auth.uid() = user_id);
