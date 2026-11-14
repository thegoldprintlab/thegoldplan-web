-- ================================================================
-- Simulator (replay) — sesi + trade
-- Jalankan di Supabase SQL Editor. Selamat dijalankan berulang.
-- ================================================================

create table if not exists public.sim_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null default 'XAUUSD',
  start_month text not null,
  end_month text not null,
  tf int not null default 15,
  start_balance numeric(12,2) not null default 10000,
  end_balance numeric(12,2) not null default 10000,
  trades int not null default 0,
  net_pnl numeric(12,2) not null default 0,
  max_drawdown numeric(12,2) not null default 0,
  margin_calls int not null default 0
);

create table if not exists public.sim_trades (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sim_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  side text not null check (side in ('BUY', 'SELL')),
  lots numeric(8,2) not null,
  entry_price numeric(12,2) not null,
  exit_price numeric(12,2) not null,
  sl numeric(12,2),
  tp numeric(12,2),
  open_time timestamptz not null,
  close_time timestamptz not null,
  pnl numeric(12,2) not null,
  reason text not null check (reason in ('SL', 'TP', 'MANUAL')),
  seq int not null default 0
);

create index if not exists sim_sessions_user_idx on public.sim_sessions (user_id, created_at desc);
create index if not exists sim_trades_session_idx on public.sim_trades (session_id, seq);

alter table public.sim_sessions enable row level security;
alter table public.sim_trades enable row level security;

drop policy if exists "own sim_sessions" on public.sim_sessions;
create policy "own sim_sessions" on public.sim_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sim_trades" on public.sim_trades;
create policy "own sim_trades" on public.sim_trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.sim_sessions to authenticated;
grant select, insert, update, delete on public.sim_trades to authenticated;
