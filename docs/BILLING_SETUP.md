# 🚀 Fasa B — Billing & Payment (Stripe)

> B1: Stripe Checkout · B2: Auto-provision · B3: Premium gating
> Semua kod dah dibina. Yang tinggal: aktifkan Stripe & set env.

## 1. Run migration SQL

Buka **Supabase → SQL Editor** → run fail:

```
supabase/billing.sql
```

Ia cipta table `subscriptions` + RLS (user baca row sendiri sahaja).

## 2. Deploy webhook edge function

```bash
cd ~/gold-plan-web
supabase functions deploy stripe-webhook \
  --project-ref gtblmwijohoetczqngpr
```

> Kalau `supabase` CLI belum ada: `npm i -g supabase` (atau guna Docker).

## 3. Set secrets untuk function

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  --project-ref gtblmwijohoetczqngpr
```

`SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` auto di-inject oleh platform
Supabase, tak perlu set manual.

## 4. Daftar webhook di Stripe

Stripe Dashboard → Developers → Webhooks → Add endpoint:

```
https://gtblmwijohoetczqngpr.supabase.co/functions/v1/stripe-webhook
```

Events (hantar ini sahaja):

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

> Ambil signing secret (`whsec_...`) dan set sebagai `STRIPE_WEBHOOK_SECRET` (langkah 3).

## 5. Buat Payment Links

Stripe Dashboard → Payments → Payment links → Create:

| Plan | Amount | Mode |
|---|---|---|
| Monthly | $19 | Recurring |
| Lifetime | $149 | One-time |

> Webhook infer plan dari mode/amount: subscription (recurring) = monthly,
> one-time ≥ $100 = lifetime. Kalau harga berubah, update logik dalam
> `supabase/functions/stripe-webhook/index.ts`.

## 6. Set env di Vercel

Vercel → Project `thegoldplan-web` → Settings → Environment Variables:

```
VITE_BILLING_ENABLED=true
VITE_STRIPE_LINK_MONTHLY=https://buy.stripe.com/...
VITE_STRIPE_LINK_LIFETIME=https://buy.stripe.com/...
```

Redeploy production.

## 7. Test end-to-end

1. Sign up / login di app.
2. Pergi `/pricing`, klik plan → redirect ke Stripe checkout.
3. Bayar guna test card `4242 4242 4242 4242` (test mode).
4. Webhook trigger → `subscriptions` table terisi → `/account` tunjuk Active.
5. Fitur pro (Share Card, Quick Log API) ter-unlock.

---

## Aliran auto-provision (B2)

```
Pengguna bayar di Stripe Payment Link
  → Stripe hantar `checkout.session.completed`
  → webhook verify signature
  → baca `client_reference_id` (user UUID, app pass auto)
  → upsert row `subscriptions` (service role, bypass RLS)
  → app baca row tu → unlock fitur
```

## Nota

- Gating OFF by default (`VITE_BILLING_ENABLED=false`). App kekal fully open
  sampai ko sedia charge orang.
- `client_reference_id` = user UUID — webhook hanya percaya `stripe-signature`
  yang sah, jadi UUID tak boleh dipalsukan.
- Kalau nak tukar harga/plan, edit `src/lib/plans.ts` + update Payment Links.
