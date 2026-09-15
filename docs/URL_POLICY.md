# ◈ The Gold Plan — Workflow Fix: Tiada Domain (Zero-Cost)

> Konteks: domain `thegoldplan.app` TAK dibeli (kekangan kos). Semua link
> kena guna URL hidup: **https://thegoldplan-web.vercel.app**
> Kalau ada duit nanti, tukar balik — tapi JANGAN tulis domain yang belum wujud.

## Rule

1. **Satu URL sahaja** dalam semua tempat: `thegoldplan-web.vercel.app`
   - ✅ Share card watermark
   - ✅ Landing footer
   - ✅ `og:url` dalam `index.html`
   - ✅ Docs (HOW_TO_USE, PROJECT_DOCUMENTATION)
   - ❌ JANGAN tulis `thegoldplan.app` sebelum domain dibeli — link mati = bunuh conversion

2. Sebelum commit apa-apa yang sentuh URL: verify ia hidup.
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://thegoldplan-web.vercel.app
   # 200 = OK. 000 = domain tak wujud, JANGAN guna.
   ```

3. Kalau nak beli domain kemudian, semak dulu:
   ```bash
   cd ~/gold-plan-web
   vercel domains inspect thegoldplan.app   # "Domain not found" = belum beli
   vercel domains buy thegoldplan.app
   vercel domains add thegoldplan.app thegoldplan-web
   ```
   Lepas beli, update 4 tempat di atas + Stripe webhook URL.
   (URL pendek lebih kredibel untuk produk berbayar — tapi tak wajib untuk mula jual.)

## Nota env

- Vercel inject `NEXT_PUBLIC_*` dan `POSTGRES_*` walaupun ni projek Vite.
  Vite hanya baca `VITE_*`. `NEXT_PUBLIC_*` dah dibuang dari `.env.production`
  (duplikat — nilai sama ada dalam `VITE_*`/`SUPABASE_*`). Jangan tambah balik.

## Kalau guna link pendek percuma (pilihan)

Alternatif domain berbayar: guna redirect percuma (cth. Cloudflare Pages /
`bit.ly`) untuk link share, tapi kekalkan `.vercel.app` dalam card/OG tags
sebagai canonical, sebab redirect boleh mati bila-bila masa.
