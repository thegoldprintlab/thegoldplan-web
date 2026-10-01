# Gold Plan Web — thegoldplan.my

App The Gold Plan — jurnal trading XAUUSD dengan analitik. Live di **Vercel**.
React 18 + Vite + TypeScript + Recharts. DB: **Supabase**.
Repo: `thegoldprintlab/thegoldplan-web` · Branch: `main`

## Status (kemas kini 2026-10-01)
- **thegoldplan.my LIVE penuh** (www + cert sah). Domain + SEO + Stripe webhook siap.
- GSC TXT verified live.

## Fail penting
- `src/content.ts` / komponen — teks + statistik laman.
- Statistik strip (1,517 trade / 3 akaun) = **angka bos, STATIK** — bukan dari DB.
- Demo: 4 akaun / 107 trade dalam `src/demo/seed.ts`. **Jangan campur dua ni.**
- `docs/DOMAIN_SETUP.md` + `URL_POLICY` — status domain & SEO.

## Perangkap
- **Jangan** tambah redirect `vercel.app` — ia **pecahkan Stripe webhook POST**.
  Kekal 301 `www` sahaja.
- README lama kata "GitHub Pages" — **basi**, sebenar Vercel.

## Seterusnya
- (kemas kini di sini bila kerja baru bermula)
