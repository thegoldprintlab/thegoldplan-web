# 🌐 D1 — Domain Rasmi The Gold Plan

> Status (29 Sep 2026, 16:47): **DAH DIBELI — MENUNGGU PROPAGATION DNS.**
> `thegoldplan.my` = ACTIVE di Porkbun + MYNIC. DNS Vercel dah diset di Porkbun.
> Tapi registry `e.nic.my` belum delegate NS ke Porkbun → A record belum resolve
> dari internet. Ini normal (minit → beberapa jam). URL rasmi KEKAL
> `thegoldplan-web.vercel.app` sampai `curl -s -o /dev/null -w "%{http_code}"`
> pulang 200. Rujuk `docs/URL_POLICY.md`.

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
> `RECORD_CONFLICT`. Kena delete parking dulu. Watcher handle ni automatik.

## Vercel

```bash
cd ~/gold-plan-web
vercel domains add thegoldplan.my thegoldplan-web   # ✅ dah buat
vercel domains verify thegoldplan.my                # → invalid-configuration (tunggu propagate)
vercel alias set thegoldplan.my thegoldplan-web     # ✅ dah buat
```

`vercel domains verify` pulang `invalid-configuration` sekarang SEBAB A record
belum resolve — bukan salah config. Re-run bila propagation siap.

## Watcher automatik

- `~/tools/watch-thegoldplan.py` — idempotent: tunggu ACTIVE → buang parking →
  set DNS → `vercel alias set` → poll HTTPS 5x60s.
- Cron `thegoldplan-live-watch` (`9ce3ac810298`, tiap 20 min, 72 kali) —
  check HTTPS senyap; **hantar Telegram bila domain hidup**.

## Selepas Domain Hidup — Checklist 7 Tempat

Kod:
1. `src/components/ShareCard.tsx` (~baris 72) — watermark share card
2. `src/pages/Landing.tsx` (~baris 209) — footer note
3. `index.html` (~baris 13) — `og:url`

Docs dalam repo:
4. `docs/URL_POLICY.md`, `docs/DOMAIN_SETUP.md` (fail ni)
5. `docs/MARKETING_PLAN.md`, `docs/X_CONTENT_PLAYBOOK.md`, `docs/X_CONTENT_WEEK2.md`
6. `docs/BILLING_SETUP.md` + **Stripe Dashboard → webhook endpoint**:
   `https://thegoldplan-web.vercel.app/api/stripe-webhook` → `https://thegoldplan.my/api/stripe-webhook`

Luar kod:
7. **Google Search Console** (akaun `mozacsuck48@gmail.com` — sama macam alunara.my):
   tambah property `thegoldplan.my`, verify guna TXT record Porkbun.

## Nota

- Selepas domain hidup, set `thegoldplan.my` sebagai **primary** dalam Vercel →
  Settings → Domains. `.vercel.app` kekal sebagai fallback.
- Auto-renew dah ON. Sedar renewal RM115/tahun pada 2027-09-29.
- `securityLock` dah ON (clientTransferProhibited + clientDeleteProhibited).
