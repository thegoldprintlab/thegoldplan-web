# 🌐 D1 — Domain Rasmi The Gold Plan

> Status: **SIAP DIPILIH, TUNGGU BAYARAN** (29 Sep 2026).
> Link hidup sekarang: **https://thegoldplan-web.vercel.app**
> Semua link dalam kod/docs KEKAL guna URL hidup sampai domain betul-betul aktif.
> Rujuk `docs/URL_POLICY.md`. Jangan tukar apa-apa sebelum domain pass HTTPS.

## Keputusan (29 Sep 2026)

Calon: **`thegoldplan.my`** — daftar di **Porkbun** (sama akaun dengan `alunara.my`).

| Tempat beli | Harga tahun 1 | Renewal | Nota |
|---|---|---|---|
| **Porkbun** ⭐ | $2.37 (RM9.67, +SST ≈ RM10.45) | $26.06 (RM115) | promosi tahun pertama |
| Vercel | $19.99 (RM88) | $38.99 (RM171) | **jangan** — 9x harga Porkbun |
| Exabytes (MYNIC) | promo RM1–7.99 (Double Day je) | RM139 | promo tamat 16 Sep 2026 |

Availability disahkan 29 Sep 2026 (bukan tebakan):
- `thegoldplan.my` → MYNIC RDAP: *"available for registration"* + Porkbun API `avail=yes`
- `goldplan.my` → available juga (backup)
- `thegoldplan.com` / `goldplan.com` / `goldplan.info` / `goldplan.store` → **dah diambil** (parking Afternic, jual balik mahal)

### ⚠️ Risiko kena tahu awal

1. **Renewal cliff.** RM10 tahun pertama → RM115 tahun kedua. Bukan harga tetap.
   Alternatif lari: `.com` @ Porkbun $11.08 flat (RM49 pertama DAN renewal) — tapi tak bawah RM10.
2. **`.my` tiada WHOIS privacy** (`whoisPrivacySupported: false`). Nama + alamat registrant
   jadi **publik** dalam WHOIS. Guna alamat bisnes, bukan alamat rumah.
3. **MYNIC wajib dokumen.** Domain tak aktif sampai MyKad/passport dihantar & diverify
   (Triple-I policy, biasa 24–48 jam). Bukan blocker, tapi ada langkah manual.

## Cara Beli

```bash
# 1. Topup + verify — WAJIB. API/create akan gagal tanpa ni.
#    Balance sekarang $0.00 (semak: python3 -c ... /account/balance)
#    Verifikasi email + no. telefon akaun Porkbun (Dashboard → Account)
#    Topup sekurang-kurangnya $2.37 (≈RM10)

# 2. Beli (DUA pilihan)
#    (a) Dashboard Porkbun — paling selamat, nampak harga & auto-renew toggle
#    (b) CLI Vercel TIDAK BOLEH guna agent (purchase_requires_user):
cd ~/gold-plan-web && vercel domains buy thegoldplan.my   # kena taip sendiri, interaktif

# 3. Upload dokumen MyKad bila Porkbun/MYNIC minta (email, 24–48 jam)
```

> API Porkbun pun ada: `POST /domain/create/thegoldplan.my` dengan
> `{"cost": 237, "agreeToTerms": "yes"}` (cost = US cents, kena padan quote
> `/domain/checkDomain`). Tapi akaun kena verified + ada balance dulu.
> Tool sedia ada: `~/tools/porkbun.py` (kredensial di `~/.config/porkbun/env`).

## DNS (sama macam alunara.my — proven)

Selepas beli, di Porkbun DNS:

| Type | Host | Content |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

## Pasang ke Project

```bash
cd ~/gold-plan-web
vercel domains add thegoldplan.my thegoldplan-web
vercel domains verify thegoldplan.my
vercel alias set thegoldplan.my thegoldplan-web
curl -s -o /dev/null -w "%{http_code}\n" https://thegoldplan.my   # 200 = hidup
```

## Selepas Domain Aktif — Checklist 7 Tempat

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
   tambah property `thegoldplan.my`, verify guna TXT record Porkbun
   (contoh TXT sedia ada di alunara.my: `google-site-verification=...`)

## Nota

- Selepas domain hidup, `thegoldplan-web.vercel.app` kekal jalan sebagai fallback.
  Set `thegoldplan.my` sebagai **primary** dalam Vercel → Settings → Domains.
- Auto-renew: Porkbun default OFF (macam `alunara.my`, `autoRenew: 0`). Set ON
  kalau tak nak domain mati — tapi sedar renewal RM115/tahun.
- `securityLock` hidupkan selepas aktif (halang transfer tanpa kebenaran).
