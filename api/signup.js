// Vercel serverless function — interim signup path.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS (and why it should go away)
//
// Supabase's built-in mailer is capped at ~2 emails/hour and is documented as
// testing-only. Real signups were hitting `over_email_send_rate_limit` (429),
// never received a confirmation link, and could not log in.
//
// This endpoint is a STOPGAP: it creates the user server-side so signup is not
// blocked on that mailer. It is NOT the desired end state.
//
// END STATE: configure Custom SMTP in Supabase (Auth → SMTP Settings). Once that
// is live, set VITE_REQUIRE_EMAIL_VERIFICATION=true and the frontend goes back to
// the native sb.auth.signUp() flow (which sends a real confirmation email). This
// file then becomes dead code and should be deleted.
// ─────────────────────────────────────────────────────────────────────────────
//
// SECURITY: this is a PUBLIC endpoint holding the service_role key, so it is an
// account-creation faucet by definition. Mitigations:
//   - durable rate limit in Postgres (per-email + per-IP). An in-memory counter
//     is useless on serverless: each instance has its own memory and it resets
//     on cold start, so the previous version had effectively NO limit.
//   - email shape + password length validation
//   - payload size cap
// It intentionally does NOT verify email ownership — that is exactly the gap the
// Custom SMTP migration closes.

import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
  ssl: { rejectUnauthorized: false },
  max: 2,
})

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_BODY = 4096

// Per-hour caps.
const MAX_PER_EMAIL = 3
const MAX_PER_IP = 15

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > MAX_BODY) reject(new Error('payload too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim().slice(0, 64)
  return String(req.socket?.remoteAddress || 'unknown').slice(0, 64)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SERVICE_KEY || !process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Signup is not configured on the server.' })
  }

  let payload
  try {
    const raw =
      typeof req.body === 'string' || req.body === undefined ? await readBody(req) : JSON.stringify(req.body)
    payload = JSON.parse(raw || '{}')
  } catch {
    return res.status(400).json({ error: 'Invalid request.' })
  }

  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')
  const ip = clientIp(req)

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }

  const client = await pool.connect()
  try {
    // Durable rate limit — survives cold starts and is shared across instances.
    const { rows } = await client.query(
      `select
         (select count(*) from public.signup_attempts
           where lower(email) = $1 and created_at > now() - interval '1 hour') as by_email,
         (select count(*) from public.signup_attempts
           where ip = $2 and created_at > now() - interval '1 hour') as by_ip`,
      [email, ip]
    )

    const byEmail = Number(rows[0].by_email)
    const byIp = Number(rows[0].by_ip)

    if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) {
      return res.status(429).json({ error: 'Too many signup attempts. Please try again later.' })
    }

    await client.query('insert into public.signup_attempts (email, ip) values ($1, $2)', [email, ip])

    // Opportunistic retention cleanup (IPs are personal data).
    if (Math.random() < 0.02) {
      client.query('select public.prune_signup_attempts()').catch(() => {})
    }

    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })

    const body = await r.json().catch(() => ({}))

    if (r.ok) {
      return res.status(200).json({ ok: true, userId: body.id || null })
    }

    const detail = String(body.msg || body.message || body.error_description || body.error || '')
    if (r.status === 422 || /already been registered|already exists|duplicate/i.test(detail)) {
      return res.status(409).json({ error: 'That email is already registered. Try logging in instead.' })
    }

    console.error('signup admin error', r.status, detail)
    return res.status(502).json({ error: 'Could not create the account. Please try again.' })
  } catch (err) {
    console.error('signup exception', err && err.message)
    return res.status(500).json({ error: 'Could not create the account. Please try again.' })
  } finally {
    client.release()
  }
}
