-- ============================================================
-- THE GOLD PLAN TRADING JOURNEY — READY-TO-RUN SQL
-- Run this ENTIRE file in the Supabase SQL Editor:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
-- User: arfasyrf@gmail.com (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3)
-- ============================================================

1|-- The Gold Plan Trading Journey — Supabase schema
2|-- Run this in the Supabase SQL Editor (or `supabase db push`).
3|
4|-- ---------------------------------------------------------------
5|-- trades: one row per logged trade
6|-- ---------------------------------------------------------------
7|create table if not exists public.trades (
8|  id uuid primary key default gen_random_uuid(),
9|  created_at timestamptz not null default now(),
10|  user_id uuid not null references auth.users (id) on delete cascade,
11|  trade_date date not null,
12|  account text not null,
13|  session text not null,
14|  setup text not null,
15|  direction text not null check (direction in ('BUY', 'SELL')),
16|  entry_price numeric(12,2) not null,
17|  exit_price numeric(12,2) not null,
18|  pips numeric(12,1) not null,
19|  profit_loss numeric(12,2) not null,
20|  emotion text not null,
21|  notes text not null default ''
22|);
23|
24|create index if not exists trades_user_date_idx on public.trades (user_id, trade_date desc);
25|create index if not exists trades_user_created_idx on public.trades (user_id, created_at desc);
26|
27|-- ---------------------------------------------------------------
28|-- settings: per-user dropdowns + daily loss limit
29|-- ---------------------------------------------------------------
30|create table if not exists public.settings (
31|  id uuid primary key default gen_random_uuid(),
32|  user_id uuid not null unique references auth.users (id) on delete cascade,
33|  setups text[] not null,
34|  sessions text[] not null,
35|  emotions text[] not null,
36|  accounts text[] not null,
37|  max_daily_loss numeric(12,2) not null default 100,
38|  updated_at timestamptz not null default now()
39|);
40|
41|-- ---------------------------------------------------------------
42|-- Row Level Security: a user can only read/write their own rows
43|-- ---------------------------------------------------------------
44|alter table public.trades enable row level security;
45|alter table public.settings enable row level security;
46|
47|drop policy if exists "trades_select_own" on public.trades;
48|create policy "trades_select_own" on public.trades
49|  for select using (auth.uid() = user_id);
50|
51|drop policy if exists "trades_insert_own" on public.trades;
52|create policy "trades_insert_own" on public.trades
53|  for insert with check (auth.uid() = user_id);
54|
55|drop policy if exists "trades_delete_own" on public.trades;
56|create policy "trades_delete_own" on public.trades
57|  for delete using (auth.uid() = user_id);
58|
59|drop policy if exists "settings_select_own" on public.settings;
60|create policy "settings_select_own" on public.settings
61|  for select using (auth.uid() = user_id);
62|
63|drop policy if exists "settings_insert_own" on public.settings;
64|create policy "settings_insert_own" on public.settings
65|  for insert with check (auth.uid() = user_id);
66|
67|drop policy if exists "settings_update_own" on public.settings;
68|create policy "settings_update_own" on public.settings
69|  for update using (auth.uid() = user_id);
70|

-- ============================================================
-- SEED DATA (151 historical trades + settings)
-- ============================================================
1|-- Seed historical trades from the Gold Plan Google Sheet.
2|-- Replace 35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3 with the Supabase auth.users id of the account
3|-- you log in with, then run this file in the SQL Editor.
4|
5|insert into public.trades
6|  (user_id, trade_date, account, session, setup, direction,
7|   entry_price, exit_price, pips, profit_loss, emotion, notes)
8|values
9|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-01', 'Prop Firm 2', 'New York (NY)', 'SNR + SND', 'BUY', 2315.62, 2317.32, 17, 170.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
10|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-01', 'Compunding Account', 'New York (NY)', 'SND Rejection', 'SELL', 2319.91, 2316.31, 36, 360.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
11|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-01', 'Prop Firm 2', 'New York (NY)', 'SND Rejection', 'SELL', 2317.65, 2308.55, 91, 910.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
12|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-01', 'Compunding Account', 'London (Lon)', 'Others', 'BUY', 2329.63, 2334.63, 50, 500.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
13|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-01', 'Personal Account', 'New York (NY)', 'SND Rejection', 'SELL', 2314.91, 2306.01, 89, 890.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
14|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-01', 'Prop Firm 2', 'Tokyo (Tok)', 'SNR Breakout', 'SELL', 2317.44, 2313.94, 35, 350.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
15|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-01', 'Personal Account', 'New York (NY)', 'SND Rejection', 'SELL', 2333.69, 2337.49, -38, -380.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
16|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-02', 'Prop Firm 1', 'Tokyo (Tok)', 'SNR Breakout', 'SELL', 2327.74, 2319.54, 82, 820.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
17|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-02', 'Compunding Account', 'London (Lon)', 'SNR Breakout', 'BUY', 2326.64, 2330.44, 38, 380.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
18|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-02', 'Prop Firm 2', 'New York (NY)', 'SNR Breakout', 'SELL', 2338.62, 2345.82, -72, -720.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
19|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-02', 'Prop Firm 1', 'Australia (Aus)', 'SNR + SND', 'BUY', 2340.58, 2333.98, -66, -660.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
20|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-02', 'Personal Account', 'New York (NY)', 'SNR + SND', 'BUY', 2329.36, 2322.26, -71, -710.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
21|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-02', 'Prop Firm 1', 'London (Lon)', 'SNR + SND', 'BUY', 2328.22, 2322.92, -53, -530.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
22|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-02', 'Prop Firm 2', 'New York (NY)', 'SNR + SND', 'BUY', 2325.73, 2322.63, -31, -310.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
23|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-03', 'Prop Firm 1', 'New York (NY)', 'SND Rejection', 'BUY', 2326.14, 2333.44, 73, 730.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
24|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-03', 'Compunding Account', 'New York (NY)', 'Others', 'BUY', 2330.29, 2335.89, 56, 560.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
25|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-03', 'Personal Account', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2328.74, 2320.74, 80, 800.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
26|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-03', 'Prop Firm 2', 'Tokyo (Tok)', 'Others', 'SELL', 2325.65, 2331.25, -56, -560.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
27|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-03', 'Personal Account', 'Tokyo (Tok)', 'Others', 'BUY', 2319.62, 2314.42, -52, -520.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
28|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-03', 'Personal Account', 'New York (NY)', 'SND Rejection', 'SELL', 2333.64, 2327.54, 61, 610.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
29|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-03', 'Compunding Account', 'Tokyo (Tok)', 'SNR + SND', 'SELL', 2336.16, 2332.16, 40, 400.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
30|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-04', 'Personal Account', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2321.26, 2312.46, 88, 880.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
31|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-04', 'Prop Firm 2', 'Tokyo (Tok)', 'Others', 'BUY', 2344.86, 2351.66, 68, 680.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
32|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-04', 'Compunding Account', 'New York (NY)', 'SND Rejection', 'BUY', 2332.94, 2336.54, 36, 360.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
33|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-04', 'Personal Account', 'London (Lon)', 'SNR Breakout', 'SELL', 2343.32, 2346.22, -29, -290.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
34|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-04', 'Personal Account', 'Tokyo (Tok)', 'SNR + SND', 'SELL', 2341.04, 2345.64, -46, -460.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
35|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-04', 'Prop Firm 2', 'New York (NY)', 'Others', 'SELL', 2338.97, 2345.87, -69, -690.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
36|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-04', 'Compunding Account', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2335.48, 2338.28, -28, -280.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
37|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-05', 'Personal Account', 'Tokyo (Tok)', 'Others', 'SELL', 2326.75, 2332.35, -56, -560.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
38|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-05', 'Prop Firm 1', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2325.88, 2320.28, 56, 560.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
39|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-05', 'Personal Account', 'London (Lon)', 'Others', 'BUY', 2328.51, 2324.21, -43, -430.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
40|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-05', 'Compunding Account', 'Tokyo (Tok)', 'Others', 'SELL', 2336.47, 2339.17, -27, -270.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
41|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-05', 'Personal Account', 'London (Lon)', 'SNR Breakout', 'BUY', 2330.12, 2324.82, -53, -530.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
42|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-05', 'Compunding Account', 'London (Lon)', 'SND Rejection', 'BUY', 2328.34, 2321.54, -68, -680.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
43|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-05', 'Prop Firm 2', 'Tokyo (Tok)', 'SNR + SND', 'SELL', 2327.89, 2330.39, -25, -250.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
44|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-08', 'Prop Firm 2', 'Tokyo (Tok)', 'SNR + SND', 'SELL', 2328.32, 2332.02, -37, -370.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
45|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-08', 'Compunding Account', 'New York (NY)', 'SNR Breakout', 'SELL', 2321.76, 2328.46, -67, -670.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
46|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-08', 'Compunding Account', 'London (Lon)', 'SND Rejection', 'BUY', 2339.44, 2332.84, -66, -660.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
47|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-08', 'Compunding Account', 'Australia (Aus)', 'SNR + SND', 'SELL', 2330.74, 2335.64, -49, -490.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
48|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-08', 'Compunding Account', 'London (Lon)', 'SNR + SND', 'BUY', 2321.67, 2314.27, -74, -740.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
49|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-08', 'Prop Firm 2', 'London (Lon)', 'SNR + SND', 'SELL', 2332.28, 2336.98, -47, -470.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
50|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-08', 'Personal Account', 'Tokyo (Tok)', 'SNR Breakout', 'BUY', 2326.8, 2334.5, 77, 770.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
51|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-09', 'Personal Account', 'New York (NY)', 'SNR + SND', 'SELL', 2336.34, 2330.84, 55, 550.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
52|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-09', 'Personal Account', 'Tokyo (Tok)', 'Others', 'BUY', 2349.35, 2358.45, 91, 910.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
53|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-09', 'Prop Firm 1', 'New York (NY)', 'SNR Breakout', 'BUY', 2329.42, 2334.62, 52, 520.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
54|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-09', 'Compunding Account', 'Australia (Aus)', 'SNR + SND', 'SELL', 2352.99, 2357.89, -49, -490.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
55|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-09', 'Compunding Account', 'New York (NY)', 'SNR Breakout', 'SELL', 2353.95, 2358.75, -48, -480.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
56|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-09', 'Personal Account', 'London (Lon)', 'SNR + SND', 'BUY', 2361.53, 2363.73, 22, 220.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
57|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-09', 'Personal Account', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2342.89, 2339.19, 37, 370.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
58|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-10', 'Prop Firm 1', 'New York (NY)', 'SNR Breakout', 'BUY', 2334.32, 2340.12, 58, 580.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
59|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-10', 'Personal Account', 'Tokyo (Tok)', 'SND Rejection', 'BUY', 2354.27, 2350.17, -41, -410.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
60|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-10', 'Personal Account', 'New York (NY)', 'Others', 'BUY', 2348.99, 2344.89, -41, -410.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
61|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-10', 'Prop Firm 2', 'Tokyo (Tok)', 'SNR Breakout', 'BUY', 2357.86, 2362.06, 42, 420.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
62|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-10', 'Compunding Account', 'New York (NY)', 'SNR + SND', 'SELL', 2347.09, 2351.49, -44, -440.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
63|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-10', 'Personal Account', 'Australia (Aus)', 'Others', 'BUY', 2354.64, 2347.94, -67, -670.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
64|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-10', 'Personal Account', 'London (Lon)', 'SNR + SND', 'SELL', 2337.87, 2345.17, -73, -730.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
65|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-11', 'Compunding Account', 'New York (NY)', 'SND Rejection', 'SELL', 2344.54, 2348.34, -38, -380.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
66|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-11', 'Prop Firm 1', 'New York (NY)', 'SND Rejection', 'BUY', 2330.47, 2334.17, 37, 370.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
67|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-11', 'Compunding Account', 'Tokyo (Tok)', 'SNR + SND', 'BUY', 2332.4, 2338.4, 60, 600.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
68|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-11', 'Prop Firm 2', 'London (Lon)', 'SND Rejection', 'BUY', 2328.88, 2333.08, 42, 420.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
69|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-11', 'Compunding Account', 'Tokyo (Tok)', 'SNR Breakout', 'BUY', 2346.31, 2339.11, -72, -720.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
70|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-11', 'Personal Account', 'Australia (Aus)', 'SNR Breakout', 'SELL', 2332.87, 2340.47, -76, -760.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
71|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-11', 'Compunding Account', 'London (Lon)', 'SNR + SND', 'SELL', 2316.68, 2311.78, 49, 490.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
72|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-12', 'Personal Account', 'New York (NY)', 'SNR + SND', 'BUY', 2312.44, 2305.74, -67, -670.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
73|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-12', 'Compunding Account', 'Australia (Aus)', 'SND Rejection', 'SELL', 2322.8, 2316.3, 65, 650.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
74|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-12', 'Prop Firm 1', 'Tokyo (Tok)', 'SNR Breakout', 'BUY', 2323.5, 2332.7, 92, 920.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
75|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-12', 'Compunding Account', 'New York (NY)', 'Others', 'BUY', 2334.01, 2337.51, 35, 350.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
76|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-12', 'Prop Firm 2', 'New York (NY)', 'SND Rejection', 'SELL', 2320.11, 2316.41, 37, 370.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
77|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-12', 'Prop Firm 1', 'New York (NY)', 'SNR Breakout', 'BUY', 2335.81, 2344.61, 88, 880.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
78|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-12', 'Prop Firm 1', 'Australia (Aus)', 'SNR + SND', 'BUY', 2343.83, 2347.23, 34, 340.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
79|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-15', 'Personal Account', 'New York (NY)', 'SND Rejection', 'SELL', 2343.11, 2340.11, 30, 300.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
80|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-15', 'Prop Firm 1', 'New York (NY)', 'Others', 'SELL', 2335.7, 2328.9, 68, 680.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
81|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-15', 'Prop Firm 1', 'New York (NY)', 'SND Rejection', 'SELL', 2342.05, 2347.45, -54, -540.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
82|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-15', 'Compunding Account', 'London (Lon)', 'SNR + SND', 'BUY', 2325.3, 2317.5, -78, -780.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
83|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-15', 'Prop Firm 1', 'London (Lon)', 'SNR + SND', 'BUY', 2343, 2336.2, -68, -680.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
84|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-15', 'Prop Firm 1', 'New York (NY)', 'SNR Breakout', 'BUY', 2336.73, 2333.33, -34, -340.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
85|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-15', 'Personal Account', 'New York (NY)', 'SNR Breakout', 'SELL', 2313.17, 2307.97, 52, 520.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
86|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-16', 'Prop Firm 1', 'New York (NY)', 'Others', 'SELL', 2325.87, 2332.97, -71, -710.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
87|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-16', 'Prop Firm 1', 'Tokyo (Tok)', 'SNR Breakout', 'BUY', 2305.23, 2310.33, 51, 510.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
88|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-16', 'Personal Account', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2299.96, 2294.36, 56, 560.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
89|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-16', 'Personal Account', 'New York (NY)', 'Others', 'SELL', 2327.82, 2322.32, 55, 550.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
90|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-16', 'Prop Firm 2', 'Tokyo (Tok)', 'SNR + SND', 'BUY', 2308.68, 2314.38, 57, 570.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
91|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-16', 'Personal Account', 'Australia (Aus)', 'SNR + SND', 'SELL', 2312.59, 2307.39, 52, 520.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
92|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-16', 'Personal Account', 'New York (NY)', 'SND Rejection', 'BUY', 2298.16, 2303.86, 57, 570.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
93|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-17', 'Prop Firm 2', 'Australia (Aus)', 'SND Rejection', 'SELL', 2316.16, 2310.76, 54, 540.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
94|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-17', 'Personal Account', 'London (Lon)', 'Others', 'BUY', 2310.04, 2303.74, -63, -630.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
95|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-17', 'Compunding Account', 'New York (NY)', 'SND Rejection', 'BUY', 2325.06, 2322.16, -29, -290.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
96|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-17', 'Personal Account', 'Tokyo (Tok)', 'SNR + SND', 'SELL', 2316.3, 2307.2, 91, 910.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
97|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-17', 'Personal Account', 'Australia (Aus)', 'SNR + SND', 'BUY', 2304.96, 2300.36, -46, -460.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
98|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-17', 'Prop Firm 2', 'New York (NY)', 'SNR Breakout', 'SELL', 2313.41, 2304.81, 86, 860.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
99|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-17', 'Prop Firm 1', 'Tokyo (Tok)', 'Others', 'BUY', 2298.19, 2302.99, 48, 480.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
100|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-18', 'Compunding Account', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2322.53, 2318.53, 40, 400.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
101|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-18', 'Prop Firm 2', 'Australia (Aus)', 'SND Rejection', 'SELL', 2298.83, 2291.53, 73, 730.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
102|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-18', 'Compunding Account', 'Tokyo (Tok)', 'SNR Breakout', 'BUY', 2306.97, 2308.97, 20, 200.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
103|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-18', 'Personal Account', 'New York (NY)', 'Others', 'SELL', 2321.26, 2324.76, -35, -350.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
104|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-18', 'Prop Firm 2', 'New York (NY)', 'Others', 'SELL', 2313.78, 2309.78, 40, 400.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
105|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-18', 'Prop Firm 1', 'New York (NY)', 'SNR Breakout', 'BUY', 2297.7, 2306.8, 91, 910.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
106|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-18', 'Personal Account', 'New York (NY)', 'Others', 'BUY', 2313.14, 2305.44, -77, -770.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
107|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-19', 'Personal Account', 'Tokyo (Tok)', 'SNR + SND', 'BUY', 2307.02, 2315.02, 80, 800.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
108|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-19', 'Prop Firm 2', 'New York (NY)', 'Others', 'SELL', 2304.91, 2299.11, 58, 580.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
109|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-19', 'Prop Firm 2', 'New York (NY)', 'SND Rejection', 'BUY', 2296.76, 2305.16, 84, 840.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
110|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-19', 'Prop Firm 1', 'New York (NY)', 'SNR + SND', 'SELL', 2300.88, 2294.88, 60, 600.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
111|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-19', 'Compunding Account', 'Tokyo (Tok)', 'SNR Breakout', 'SELL', 2310.68, 2303.28, 74, 740.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
112|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-19', 'Prop Firm 2', 'London (Lon)', 'SND Rejection', 'BUY', 2300.77, 2295.37, -54, -540.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
113|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-19', 'Prop Firm 2', 'London (Lon)', 'SND Rejection', 'BUY', 2290.79, 2299.89, 91, 910.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
114|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-22', 'Compunding Account', 'New York (NY)', 'Others', 'SELL', 2306.54, 2299.94, 66, 660.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
115|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-22', 'Compunding Account', 'Tokyo (Tok)', 'SNR Breakout', 'SELL', 2309.62, 2302.62, 70, 700.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
116|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-22', 'Prop Firm 1', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2307.46, 2304.46, 30, 300.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
117|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-22', 'Compunding Account', 'New York (NY)', 'SNR + SND', 'BUY', 2291.55, 2284.55, -70, -700.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
118|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-22', 'Personal Account', 'New York (NY)', 'SND Rejection', 'SELL', 2298.14, 2293.54, 46, 460.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
119|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-22', 'Prop Firm 2', 'Tokyo (Tok)', 'Others', 'BUY', 2286.73, 2292.93, 62, 620.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
120|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-22', 'Prop Firm 1', 'Tokyo (Tok)', 'SND Rejection', 'BUY', 2281.12, 2277.82, -33, -330.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
121|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-23', 'Compunding Account', 'London (Lon)', 'Others', 'BUY', 2282.11, 2290.11, 80, 800.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
122|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-23', 'Compunding Account', 'London (Lon)', 'SNR Breakout', 'BUY', 2288.61, 2282.41, -62, -620.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
123|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-23', 'Prop Firm 1', 'London (Lon)', 'Others', 'BUY', 2291.96, 2287.46, -45, -450.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
124|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-23', 'Prop Firm 2', 'Tokyo (Tok)', 'SND Rejection', 'BUY', 2302.88, 2295.68, -72, -720.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
125|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-23', 'Compunding Account', 'Australia (Aus)', 'SNR + SND', 'BUY', 2291.54, 2299.84, 83, 830.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
126|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-23', 'Prop Firm 2', 'New York (NY)', 'SNR + SND', 'SELL', 2307.72, 2301.62, 61, 610.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
127|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-23', 'Compunding Account', 'New York (NY)', 'SND Rejection', 'BUY', 2304.35, 2307.95, 36, 360.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
128|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-24', 'Personal Account', 'Australia (Aus)', 'SNR Breakout', 'BUY', 2312.24, 2307.74, -45, -450.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
129|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-24', 'Prop Firm 1', 'New York (NY)', 'SNR + SND', 'BUY', 2298.41, 2305.01, 66, 660.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
130|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-24', 'Prop Firm 1', 'New York (NY)', 'SNR + SND', 'SELL', 2312.71, 2316.81, -41, -410.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
131|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-24', 'Prop Firm 1', 'London (Lon)', 'Others', 'BUY', 2305.53, 2300.93, -46, -460.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
132|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-24', 'Prop Firm 1', 'New York (NY)', 'SND Rejection', 'SELL', 2292.27, 2294.87, -26, -260.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
133|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-24', 'Prop Firm 1', 'London (Lon)', 'SND Rejection', 'SELL', 2298.83, 2292.23, 66, 660.00, 'FOMO / Chasing Price', 'Got lucky on this move despite poor entry mindset.'),
134|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-24', 'Prop Firm 2', 'Tokyo (Tok)', 'SND Rejection', 'BUY', 2290.11, 2297.01, 69, 690.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
135|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-25', 'Personal Account', 'Tokyo (Tok)', 'SNR Breakout', 'BUY', 2285.33, 2292.83, 75, 750.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
136|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-25', 'Prop Firm 2', 'Tokyo (Tok)', 'SNR Breakout', 'SELL', 2293.7, 2291.5, 22, 220.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
137|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-25', 'Prop Firm 2', 'Tokyo (Tok)', 'SNR + SND', 'SELL', 2306.71, 2301.61, 51, 510.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
138|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-25', 'Compunding Account', 'London (Lon)', 'SNR + SND', 'BUY', 2299.79, 2294.69, -51, -510.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
139|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-25', 'Prop Firm 1', 'London (Lon)', 'SNR Breakout', 'BUY', 2287.62, 2280.72, -69, -690.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
140|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-25', 'Personal Account', 'Australia (Aus)', 'SNR + SND', 'SELL', 2307.64, 2300.34, 73, 730.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
141|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-26', 'Personal Account', 'New York (NY)', 'SNR + SND', 'BUY', 2307.21, 2310.91, 37, 370.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
142|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-26', 'Personal Account', 'New York (NY)', 'SND Rejection', 'SELL', 2311.42, 2307.02, 44, 440.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
143|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-26', 'Prop Firm 1', 'Australia (Aus)', 'SND Rejection', 'SELL', 2289.76, 2286.96, 28, 280.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
144|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-26', 'Prop Firm 2', 'New York (NY)', 'SND Rejection', 'BUY', 2298.03, 2299.73, 17, 170.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
145|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-26', 'Personal Account', 'New York (NY)', 'Others', 'BUY', 2312.63, 2315.83, 32, 320.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
146|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-26', 'Prop Firm 2', 'London (Lon)', 'SNR + SND', 'BUY', 2299.71, 2295.11, -46, -460.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
147|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-29', 'Compunding Account', 'London (Lon)', 'Others', 'SELL', 2291.41, 2298.81, -74, -740.00, 'FOMO / Chasing Price', 'Chased the red/green candle without waiting for structural retest.'),
148|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-29', 'Prop Firm 1', 'New York (NY)', 'SNR + SND', 'BUY', 2300.31, 2303.41, 31, 310.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
149|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-29', 'Personal Account', 'London (Lon)', 'Others', 'BUY', 2310.02, 2313.42, 34, 340.00, 'FOMO / Chasing Price', 'Got lucky on this move despite poor entry mindset.'),
150|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-29', 'Personal Account', 'Tokyo (Tok)', 'SND Rejection', 'SELL', 2291.41, 2286.01, 54, 540.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
151|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-29', 'Prop Firm 2', 'London (Lon)', 'SNR Breakout', 'BUY', 2316.66, 2311.66, -50, -500.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.'),
152|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-29', 'Compunding Account', 'London (Lon)', 'SNR Breakout', 'SELL', 2303.08, 2308.18, -51, -510.00, 'Calm & Focused', 'Standard stop loss hit. Setup valid but market invalidated zone.'),
153|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-30', 'Prop Firm 1', 'New York (NY)', 'SNR Breakout', 'SELL', 2300.01, 2293.01, 70, 700.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
154|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-30', 'Prop Firm 1', 'New York (NY)', 'SND Rejection', 'BUY', 2327.06, 2331.96, 49, 490.00, 'Calm & Focused', 'Perfect execution. Followed daily trading rules cleanly.'),
155|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-30', 'Prop Firm 1', 'London (Lon)', 'SND Rejection', 'SELL', 2300.68, 2303.38, -27, -270.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
156|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-30', 'Prop Firm 2', 'Australia (Aus)', 'Others', 'SELL', 2299.37, 2297.67, 17, 170.00, 'Hesistant', 'Hesitated before clicking entry. Took partials too early.'),
157|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-30', 'Prop Firm 2', 'New York (NY)', 'Others', 'SELL', 2313.01, 2315.91, -29, -290.00, 'Hesistant', 'Fear of missing out caused a late bad entry structure.'),
158|  (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3, '2026-06-30', 'Compunding Account', 'Tokyo (Tok)', 'Others', 'BUY', 2315.6, 2309.9, -57, -570.00, 'Revenge Trading', 'Overleveraged and forced a trade trying to make back previous losses.');
159|
160|-- 150 rows generated (1 duplicate rows skipped).
161|
162|-- Seed default settings for the same user:
163|insert into public.settings (user_id, setups, sessions, emotions, accounts, max_daily_loss)
164|values (35c9f356-3d7d-4af2-9eb6-4d7dc1a7e5b3,
165|  array['SNR Breakout','SND Rejection','SNR + SND','Others'],
166|  array['Australia (Aus)','Tokyo (Tok)','London (Lon)','New York (NY)'],
167|  array['Calm & Focused','FOMO / Chasing Price','Revenge Trading','Hesitant'],
168|  array['Personal Account','Prop Firm 1','Prop Firm 2','Compounding Account'],
169|  100);
170|

-- ============================================================
-- VERIFY (run and check counts)
-- ============================================================
-- select count(*) as trade_count from public.trades;
-- select * from public.settings;
