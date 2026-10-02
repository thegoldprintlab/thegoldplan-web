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

## Analytics (2026-10-02)
- **GA4** (`VITE_GA_ID`) — guna cookie, jadi hanya kira pelawat yang tekan "Accept".
  Kekal untuk funnel/event (`sign_up`, `begin_checkout`, `mt5_import_success`).
- **Vercel Web Analytics** (`src/lib/webAnalytics.ts`) — cookieless, kira SEMUA
  pelawat. Ini angka "berapa ramai orang datang". GA4 akan nampak jauh lebih kecil.
- Semak: `python3 ~/tools/pelawat-laman.py` (kedua-dua laman) atau Vercel → Analytics.
- Toggle mesti HIDUP di Vercel — kod sahaja tak cukup. Detail: skill `vercel-web-analytics`.

## Seterusnya
- (kemas kini di sini bila kerja baru bermula)
