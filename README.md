# The Gold Plan Trading Journey

A web app migrated from the **"The Gold Plan Trading Journey"** Google Sheet —
an XAUUSD (gold) trading journal with data-driven analytics.

## Stack (all free tier)

- **Frontend**: React 18 + Vite + TypeScript + Recharts
- **Auth & Database**: Supabase (Postgres + Row Level Security)
- **Hosting**: GitHub Pages

## Features

- Email/password auth (Supabase Auth)
- **Input Form** — log trades with live pips / P&L calculation
- **Trading Log** — filterable database of all trades (delete supported)
- **Dashboard** — net P&L, win rate, profit factor, daily equity curve,
  emotion-vs-P&L chart, and setup/session/emotion scoreboards
- **Settings** — editable setups, sessions, emotions, accounts, daily loss limit

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

## Database setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor.
3. Seed historical trades:
   ```bash
   python3 scripts/gen_seed.py /path/to/3_Trading_Log.csv > supabase/seed_trades.sql
   ```
   Then replace `:USER_ID` in the generated file with your auth user id
   and run it in the SQL Editor.

## Deploy

- Push to GitHub and enable **Actions → Pages** (Source: GitHub Actions).
- Add repo secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
