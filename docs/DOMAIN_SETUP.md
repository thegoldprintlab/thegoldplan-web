# 🌐 D1 — Domain Rasmi The Gold Plan

> Status (29 Sep 2026, 17:35): **✅ LIVE + SEO SIAP.**
> `thegoldplan.my` → HTTPS 200, cert Let's Encrypt sah. `www` → 308 redirect ke apex.
> Canonical, robots.txt, sitemap.xml semua live. Kod + docs dah tukar ke URL baru.
>
> Yang tinggal Cuma 2 kerja manual (perlu login, tak boleh automate):
> Stripe webhook endpoint + Google Search Console.

## Fakta Pendaftaran (verified via Porkbun API + MYNIC RDAP)

| Perkara | Nilai |
|---|---|
| Domain | `thegoldplan.my` |
| Registrar | Porkbun LLC (NS: curitiba/fortaleza/maceio/salvador.ns.porkbun.com) |
| Didaftar | 2026-09-29 16:42 UTC |
| Expire | 2027-09-29 |
| Auto-renew | **ON** |
| Harga thn 1 | $2.37 ≈ RM10.45 (termasuk 8% SST) |
| Renewal | $26.06 ≈ RM115/tahun |
| WHOIS privacy | **Tidak disokong `.my`** — nama + alamat registrant publik |
| Security lock | ON (`client transfer prohibited` + `client delete prohibited`) |

## DNS (dah diset di Porkbun)

| Type | Host | Content |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

> ⚠️ **Gotcha:** Porkbun auto-letak parking record masa beli —
> `ALIAS @ → pixie.porkbun.com` + wildcard `CNAME * → pixie.porkbun.com`.
> Wildcard CNAME tu **berkonflik** dengan A record (RFC 1034: CNAME tak boleh
> wujud sama-sama dengan record lain pada nama sama) — Porkbun tolak A dengan
> `RECORD_CONFLICT`. Kena delete parking dulu.

## SEO — dah siap (29 Sep 2026)

| Item | Status | Nota |
|---|---|---|
| `<link rel="canonical">` | ✅ | Statik dalam `index.html` + dinamik per-route (`CanonicalRouteTracker.tsx`) |
| `robots.txt` | ✅ | `public/robots.txt` — disallow `/app/`, `/admin`, `/api/` |
| `sitemap.xml` | ✅ | `public/sitemap.xml` — 4 URL publik |
| `www` → apex | ✅ | 308 redirect (Vercel guna 308, bukan 301 — kekal method, POST-safe) |
| OG + Twitter meta | ✅ | og:site_name, twitter:card/title/description |

> ⚠️ **JANGAN tambah redirect untuk `thegoldplan-web.vercel.app`.** Aku pernah cuba
> dan ia **pecahkan Stripe webhook** — endpoint webhook terima POST, dan redirect
> buat POST jadi GET. Apex tak redirect supaya webhook lama kekal berfungsi.
> Duplicate-content vercel.app dikendalikan oleh canonical tag, bukan redirect.

## Vercel

```bash
cd ~/gold-plan-web
vercel domains add thegoldplan.my thegoldplan-web       # ✅ dah buat
vercel domains add www.thegoldplan.my thegoldplan-web   # ✅ dah buat (perlu, kalau tak www = 000)
vercel alias set thegoldplan.my thegoldplan-web         # ✅ dah buat
vercel alias set www.thegoldplan.my thegoldplan-web     # ✅ dah buat
```

## Selepas Domain Hidup — Checklist (SUDAH SIAP)

Kod (✅ semua dah tukar):
1. `src/components/ShareCard.tsx` — watermark share card → `thegoldplan.my`
2. `src/pages/Landing.tsx` — footer note → `thegoldplan.my`
3. `index.html` — `og:url` + canonical + OG/Twitter meta

Docs dalam repo (✅ semua dah tukar):
4. `docs/URL_POLICY.md`, `docs/DOMAIN_SETUP.md`
5. `docs/MARKETING_PLAN.md`, `docs/X_CONTENT_PLAYBOOK.md`, `docs/X_CONTENT_WEEK1/2.md`
6. `docs/BILLING_SETUP.md`, `docs/PROJECT_DOCUMENTATION.md`, `docs/HOW_TO_USE.md`
   + Vault Obsidian (21 fail) + bank caption cron (`~/.hermes/scripts/data/*.json`)

## ✅ 2 Kerja Manual — SUDAH SIAP (29 Sep 2026)

1. **Stripe webhook** — endpoint `https://thegoldplan.my/api/stripe-webhook` ditambah.
   - Endpoint lama (`thegoldplan-web.vercel.app`) kekal hidup sebagai fallback.
   - ⚠️ Pengesahan sebenar = hantar **test event** dari Stripe Dashboard dan pastikan
     ia pulang 200. Endpoint pulang 400 untuk POST tanpa signature (betul — itu
     signature check, bukan error).
2. **Google Search Console** — property `thegoldplan.my` ditambah + TXT verify.
   - TXT live di DNS: `google-site-verification=0kUBueXDtrUiY-v_itQJfIBCPVMC0-L02WCqL-FITh8`
   - Sitemap: `https://thegoldplan.my/sitemap.xml` (200, application/xml)

## Nota

- Auto-renew dah ON. Sedar renewal RM115/tahun pada 2027-09-29.
- `securityLock` dah ON (clientTransferProhibited + clientDeleteProhibited).
- `.vercel.app` kekal berfungsi sebagai fallback (dan untuk webhook Stripe lama).
