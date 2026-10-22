// Vercel serverless function — Stripe webhook → Supabase auto-provisioning.
// Receives checkout.session.completed / customer.subscription.* events and
// upserts into public.subscriptions (direct Postgres, bypasses RLS).
import crypto from 'node:crypto'
import pg from 'pg'

const { Pool } = pg

// POSTGRES_URL carries sslmode=require, which pg treats as verify-full and then
// rejects Supabase's cert (SELF_SIGNED_CERT_IN_CHAIN). Strip it and pass our own
// ssl object instead. Verified against production 22 Oct 2026.
function connStr() {
  const raw = process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
  if (!raw) return ''
  try {
    const u = new URL(raw)
    u.searchParams.delete('sslmode')
    u.searchParams.delete('ssl')
    return u.toString()
  } catch {
    return raw
  }
}

const pool = new Pool({
  // POSTGRES_URL first: DATABASE_URL on this project has a corrupted password
  // (16 chars vs 15 -> 28P01), which silently broke payment provisioning and
  // made every signup return 500. Verified 22 Oct 2026.
  connectionString: connStr(),
  ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
  max: 2,
})

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Verify Stripe signature: signed_payload = timestamp + '.' + rawBody
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SIG_TOLERANCE_SEC = 300

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false
  const entry = signatureHeader.split(',').map((p) => p.trim().split('=')).find(([k]) => k === 'v1')
  const ts = signatureHeader.split(',').map((p) => p.trim().split('=')).find(([k]) => k === 't')
  if (!entry || !ts) return false
  if (Math.abs(Date.now() / 1000 - Number(ts[1])) > SIG_TOLERANCE_SEC) return false
  const signedPayload = `${ts[1]}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest()
  const received = Buffer.from(entry[1], 'hex')
  if (expected.length !== received.length) return false
  return crypto.timingSafeEqual(expected, received)
}

async function upsertSubscription(userId, plan, status, periodEnd, stripeCustomerId, stripeSubscriptionId, eventCreated) {
  await pool.query(
    `insert into public.subscriptions
       (user_id, plan, status, current_period_end, stripe_customer_id, stripe_subscription_id, updated_at)
     values ($1, coalesce($2, 'monthly'), $3, $4, $5, $6, to_timestamp($7))
     on conflict (user_id) do update set
       plan = coalesce($2, public.subscriptions.plan),
       status = $3, current_period_end = $4,
       stripe_customer_id = coalesce($5, public.subscriptions.stripe_customer_id),
       stripe_subscription_id = coalesce($6, public.subscriptions.stripe_subscription_id),
       updated_at = to_timestamp($7)
     where to_timestamp($7) > subscriptions.updated_at`,
    [userId, plan, status, periodEnd, stripeCustomerId, stripeSubscriptionId, eventCreated],
  )
}

function planFromSession(session) {
  if (session.mode === 'subscription') return 'monthly'
  const amount = Number(session.amount_total ?? 0)
  return amount >= 10000 ? 'lifetime' : 'monthly'
}

async function customerUserId(stripe, customerId) {
  if (!customerId) return null
  try {
    const cust = await stripe.customers.retrieve(customerId)
    if (!cust.deleted && cust.metadata?.user_id) return cust.metadata.user_id
  } catch (e) {
    console.error('customer retrieve failed', e.message)
  }
  return null
}

async function fetchPeriodEnd(stripe, subscriptionId) {
  if (!subscriptionId) return null
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    return sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
  } catch (e) {
    console.error('subscription retrieve failed', e.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rawBody = await readRawBody(req)
  const signature = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const stripe = {
    customers: {
      retrieve: async (id) => {
        const r = await fetch(`https://api.stripe.com/v1/customers/${id}`, {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}` },
        })
        if (!r.ok) throw new Error(`stripe ${r.status}`)
        return r.json()
      },
    },
    subscriptions: {
      retrieve: async (id) => {
        const r = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ''}` },
        })
        if (!r.ok) throw new Error(`stripe ${r.status}`)
        return r.json()
      },
    },
  }

  try {
    const obj = event.data?.object ?? {}

    if (event.type === 'checkout.session.completed') {
      const session = obj
      const ref = session.client_reference_id
      let userId = (ref && UUID_RE.test(ref)) ? ref : (session.metadata?.user_id || null)
      if (!userId && typeof session.customer === 'string') {
        userId = await customerUserId(stripe, session.customer)
      }
      if (!userId) {
        res.status(200).json({ received: true, skipped: 'no user_id' })
        return
      }
      const plan = planFromSession(session)
      const periodEnd = await fetchPeriodEnd(stripe, typeof session.subscription === 'string' ? session.subscription : null)
      await upsertSubscription(
        userId,
        plan,
        'active',
        periodEnd,
        typeof session.customer === 'string' ? session.customer : null,
        typeof session.subscription === 'string' ? session.subscription : null,
        event.created,
      )
      res.status(200).json({ received: true, provisioned: userId })
      return
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const sub = obj
      let userId = sub.metadata?.user_id || null
      if (!userId && typeof sub.customer === 'string') {
        userId = await customerUserId(stripe, sub.customer)
      }
      if (!userId) {
        res.status(200).json({ received: true, skipped: 'no user_id' })
        return
      }
      await upsertSubscription(
        userId,
        sub.metadata?.plan === 'lifetime' ? 'lifetime' : 'monthly',
        sub.status || 'active',
        sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        typeof sub.customer === 'string' ? sub.customer : null,
        sub.id || null,
        event.created,
      )
      res.status(200).json({ received: true, updated: userId })
      return
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = obj
      const userId = sub.metadata?.user_id || (typeof sub.customer === 'string' ? await customerUserId(stripe, sub.customer) : null)
      if (!userId) {
        res.status(200).json({ received: true, skipped: 'no user_id' })
        return
      }
      await upsertSubscription(
        userId,
        null, // jangan turunkan lifetime ke monthly bila subscription dipadam
        'canceled',
        sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        typeof sub.customer === 'string' ? sub.customer : null,
        sub.id || null,
        event.created,
      )
      res.status(200).json({ received: true, canceled: userId })
      return
    }

    res.status(200).json({ received: true })
  } catch (e) {
    console.error('webhook handler error', e)
    res.status(500).json({ error: e.message })
  }
}

// Untuk ujian sahaja (tests/stripe-webhook.test.mjs).
export { verifyStripeSignature, UUID_RE }
