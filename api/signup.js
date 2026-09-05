// Vercel serverless function — signup without Supabase's built-in mailer.
//
// WHY: Supabase's built-in SMTP is capped at ~2 emails/hour and is documented as
// testing-only. Real customers were hitting `over_email_send_rate_limit` (HTTP 429)
// and never received a confirmation link, so they could not log in after signing up.
//
// This endpoint creates the user server-side via the GoTrue admin API with
// email_confirm: true, so no confirmation email is required at all.
//
// SECURITY NOTE: this endpoint is intentionally public (it is the signup path) and
// email addresses are therefore NOT verified. That is an accepted tradeoff here
// because feature access is gated by payment/promo, not by email ownership.
// Guards applied below: email shape validation, password length, payload cap, and
// a per-email cooldown to blunt scripted abuse.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_BODY = 4096

// Per-instance cooldown. Not a hard guarantee across lambda instances, just a cheap
// brake on repeated hits with the same address.
const recent = new Map()
const COOLDOWN_MS = 5000

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Signup is not configured on the server.' })
  }

  let payload
  try {
    const raw = typeof req.body === 'string' || req.body === undefined ? await readBody(req) : JSON.stringify(req.body)
    payload = JSON.parse(raw || '{}')
  } catch {
    return res.status(400).json({ error: 'Invalid request.' })
  }

  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  const now = Date.now()
  const last = recent.get(email)
  if (last && now - last < COOLDOWN_MS) {
    return res.status(429).json({ error: 'Please wait a moment and try again.' })
  }
  recent.set(email, now)
  if (recent.size > 500) recent.clear()

  try {
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
  }
}
