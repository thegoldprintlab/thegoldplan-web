# 🌐 D1 — Domain Rasmi (thegoldplan.app)

> Status: DOMAIN TERSEDIA. Tunggu bos beli & verify.

## Keputusan

| Domain | Status | Harga |
|---|---|---|
| **thegoldplan.app** ⭐ | ✅ TERSEDIA | $9.99/tahun (renewal $15) |
| thegoldplan.com | ❌ Dah diambil orang | — |
| goldplan.app | ✅ TERSEDIA | backup |

**Cadangan:** beli `thegoldplan.app` — padan dengan watermark sedia ada
("thegoldplan.app") yang dah guna dalam Share Card & landing footer.

## Cara Beli (paling senang — terus dari Vercel)

```bash
cd ~/gold-plan-web
vercel domains buy thegoldplan.app
```

Ikut prompt — domain akan di-register atas nama akaun Vercel `thegoldprintlab1`.
DNS & SSL diurus Vercel automatik.

## Pasang ke Project

```bash
# 1. Beli / add domain
vercel domains buy thegoldplan.app

# 2. Attach ke project (auto-deploy + HTTPS)
vercel domains add thegoldplan.app thegoldplan-web

# 3. Verify DNS (biasanya automatik bila beli di Vercel)
vercel domains verify thegoldplan.app

# 4. Set sebagai domain utama
vercel alias set thegoldplan.app thegoldplan-web
```

## Selepas Domain Aktif

1. Update `vercel.json` / env kalau guna domain dalam kod
2. Update Stripe webhook URL kalau perlu:
   - Sekarang: `https://thegoldplan-web.vercel.app/api/stripe-webhook`
   - Selepas: `https://thegoldplan.app/api/stripe-webhook`
   - > ⚠️ Kalau tukar URL, kena update webhook endpoint di Stripe Dashboard
3. Update `VITE_STRIPE_LINK_*` redirect URL kalau ada hardcode
4. Share Card watermark dah guna `thegoldplan.app` — konsisten

## Nota

- `.app` TLD diurus Google Registry — HTTPS wajib (HSTS preload), bagus untuk trust
- Domain beli di Vercel = DNS + SSL auto, tak payah manual A/CNAME
- Kalau nak beli di luar (GoDaddy/Namecheap), kena point DNS ke Vercel:
  - A record: `76.76.21.21`
  - CNAME `www`: `cname.vercel-dns.com`
