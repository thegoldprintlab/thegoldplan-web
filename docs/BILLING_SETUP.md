# 🚀 Fasa B — Billing & Payment (Stripe)

> B1: Stripe Checkout · B2: Auto-provision · B3: Premium gating
> ✅ STATUS: LIVE. Semua dah di-set & verified.

## Apa yang dah LIVE (production)

| Perkara | Nilai |
|---|---|
| Stripe account | `thegoldprintlab@gmail.com` (MY, charges + payouts enabled) |
| Monthly plan | $19/month → https://buy.stripe.com/9B68wP8y89Svdp2eRP4ko00 |
| Lifetime plan | $149 one-time → https://buy.stripe.com/cNi8wPeWw5CfacQ9xv4ko01 |
| Webhook endpoint | https://thegoldplan-web.vercel.app/api/stripe-webhook |
| Webhook events | checkout.session.completed, customer.subscription.created/updated/deleted |
| Gating | `VITE_BILLING_ENABLED=true` (production + preview + development) |
| Publishable key | `VITE_STRIPE_PUBLISHABLE_KEY` (pk_live, public) |

## Seni bina webhook

```
Pengguna bayar di Stripe Payment Link
  → Stripe hantar checkout.session.completed
  → Vercel function /api/stripe-webhook (verify signature HMAC)
  → baca client_reference_id (user UUID, app pass auto)
  → upsert public.subscriptions (direct Postgres pooler)
  → app baca row tu → unlock fitur pro
```

Webhook guna **Vercel serverless function** (`api/stripe-webhook.js`) — bukan
Supabase edge function. Ini sebab deployment lebih senang (Vercel dah linked) dan
function tulis terus ke DB pooler guna `DATABASE_URL`.

## Env yang di-set di Vercel

| Key | Type | Nota |
|---|---|---|
| `DATABASE_URL` | secret | `postgres://postgres.gtblm...:PASS@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres` |
| `STRIPE_SECRET_KEY` | secret | sk_live (tidak pernah commit) |
| `STRIPE_WEBHOOK_SECRET` | secret | whsec (dari webhook endpoint create) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | config | pk_live (public, selamat dalam bundle) |
| `VITE_STRIPE_LINK_MONTHLY` | config | URL Payment Link monthly |
| `VITE_STRIPE_LINK_LIFETIME` | config | URL Payment Link lifetime |
| `VITE_BILLING_ENABLED` | config | true |

## Migration DB (dah run)

```sql
-- supabase/billing.sql   (subscriptions + RLS)
-- supabase/admin.sql     (profiles + admin RPCs)
```

Kedua-dua dah apply ke live DB. Verify:
- `public.subscriptions` wujud
- `public.profiles` wujud
- Bos (`arfasyrf@gmail.com`) = admin + lifetime/active

## Tukar harga / plan

1. `src/lib/plans.ts` — edit harga & nama.
2. Stripe Dashboard — buat Payment Link baru (atau edit existing).
3. Update `VITE_STRIPE_LINK_MONTHLY` / `VITE_STRIPE_LINK_LIFETIME` di Vercel.

## Nota

- `client_reference_id` = user UUID — webhook hanya percaya `stripe-signature`
  yang sah, jadi UUID tak boleh dipalsukan.
- Kalau nak tengok log webhook: Vercel → Project → Functions → `api/stripe-webhook`.
- Test production guna Payment Link sebenar + bayar guna test card `4242 4242 4242 4242`.
