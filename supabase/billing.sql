-- The Gold Plan — Billing (Fasa B)
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).

-- ---------------------------------------------------------------
-- subscriptions: one row per paying user
-- The Stripe webhook (edge function, service role) is the writer.
-- The web app only reads this table (RLS: own row only).
-- ---------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'lifetime')),
  status text not null default 'incomplete'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Service role bypasses RLS and writes via the webhook edge function.
-- If you ever want the web app itself to insert (you don't — the webhook does),
-- add an insert policy here. Keeping insert service-role-only is the safe default.
