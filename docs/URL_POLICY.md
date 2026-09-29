# ◈ The Gold Plan — Polisi URL

> Status (29 Sep 2026): domain **LIVE dan rasmi** — **https://thegoldplan.my**
> Semua link dalam kod, docs, vault, dan bank caption mesti guna URL ni.

## Rule

1. **Satu URL sahaja** dalam semua tempat: `https://thegoldplan.my`
   - ✅ Share card watermark
   - ✅ Landing footer
   - ✅ `og:url` + `<link rel="canonical">` dalam `index.html`
   - ✅ Docs + vault + bank caption cron
   - ❌ JANGAN tulis `thegoldplan.app` — domain tu tak wujud, link mati = bunuh conversion

2. Sebelum commit apa-apa yang sentuh URL: verify ia hidup.
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://thegoldplan.my
   # 200 = OK. 000 = domain tak wujud, JANGAN guna.
   ```

3. **Canonical + redirect (dah diset, jangan usik):**
   - `www.thegoldplan.my` → 308 redirect ke apex (dalam `vercel.json`)
   - Canonical tag → `https://thegoldplan.my/` (statik + dinamik per-route)
   - ❌ **JANGAN tambah redirect untuk `thegoldplan-web.vercel.app`** — ia pecahkan
     Stripe webhook (POST jadi GET bila redirect). Duplicate-content dikendalikan
     oleh canonical tag sahaja.

4. `.vercel.app` = **fallback kekal**. Ia mesti terus berfungsi:
   - Stripe webhook endpoint lama masih point ke situ (sehingga bos tukar manual)
   - Jangan padam domain `.vercel.app` dari projek Vercel

## Nota env

- Vercel inject `NEXT_PUBLIC_*` dan `POSTGRES_*` walaupun projek ni Vite.
  Vite hanya baca `VITE_*`. `NEXT_PUBLIC_*` dah dibuang dari `.env.production`
  (duplikat — nilai sama ada dalam `VITE_*`/`SUPABASE_*`). Jangan tambah balik.
- Tiada URL hardcoded dalam `api/` — semua guna `VERCEL_URL` / relative path.
  Jangan hardcode `thegoldplan.my` dalam fungsi server.

## Sejarah (kenapa dokumen ni wujud)

Dulu domain belum dibeli (kekangan kos), jadi semua link guna
`thegoldplan-web.vercel.app` supaya tiada link mati. Domain dibeli 29 Sep 2026,
go-live automatik lepas DNS propagate. Rujuk `docs/DOMAIN_SETUP.md` untuk detail penuh.
