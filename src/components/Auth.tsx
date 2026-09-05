import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

// Email verification is gated behind a flag because it only works once Supabase
// Custom SMTP is configured. With the built-in mailer (~2 emails/hour) turning this
// on would strand every new signup waiting for a link that never arrives.
//
//   false -> signup goes through /api/signup (created pre-confirmed, auto-login)
//   true  -> native Supabase signUp, user must click the emailed confirmation link
//
// Flip VITE_REQUIRE_EMAIL_VERIFICATION=true in Vercel after SMTP is live.
const REQUIRE_VERIFICATION = import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION === 'true'

const MIN_PASSWORD = 8

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [msg, setMsg] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const sb = getSupabase()

    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) {
        // GoTrue returns this when email_confirmed_at is null.
        if (/email not confirmed/i.test(error.message)) {
          setMsg('Please confirm your email first — check your inbox for the link.')
        } else {
          setMsg(error.message)
        }
      }
      return
    }

    if (password.length < MIN_PASSWORD) {
      setBusy(false)
      setMsg(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }

    if (REQUIRE_VERIFICATION) {
      // Native flow — Supabase sends the confirmation email.
      const { error } = await sb.auth.signUp({ email, password })
      setBusy(false)
      if (error) {
        setMsg(error.message)
        return
      }
      setSentTo(email)
      return
    }

    // Interim flow — see api/signup.js for why this exists.
    try {
      const r = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await r.json().catch(() => ({}))

      if (!r.ok) {
        setBusy(false)
        setMsg(body.error || 'Could not create the account. Please try again.')
        return
      }

      const { error } = await sb.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) setMsg('Account created. Please log in.')
    } catch {
      setBusy(false)
      setMsg('Network error. Please try again.')
    }
  }

  async function resend() {
    setBusy(true)
    setMsg(null)
    const sb = getSupabase()
    const { error } = await sb.auth.resend({ type: 'signup', email: sentTo || email })
    setBusy(false)
    setMsg(error ? error.message : 'Confirmation email sent again.')
  }

  if (sentTo) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="var(--primary)" />
              <path d="M12 7 16.5 12 12 17 7.5 12 12 7Z" fill="var(--surface)" />
            </svg>
          </div>
          <h1 className="auth-title">Confirm your email</h1>
          <p className="auth-sub">
            We sent a confirmation link to <b>{sentTo}</b>. Click it, then log in.
          </p>
          <div className="auth-form">
            <button className="btn btn-ghost" type="button" disabled={busy} onClick={resend}>
              {busy ? 'Sending…' : 'Resend email'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setSentTo(null)
                setMode('login')
                setMsg(null)
              }}
            >
              Back to log in
            </button>
          </div>
          {msg && <div className="auth-msg">{msg}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="var(--primary)" />
            <path d="M12 7 16.5 12 12 17 7.5 12 12 7Z" fill="var(--surface)" />
          </svg>
        </div>
        <h1 className="auth-title">The Gold Plan</h1>
        <p className="auth-sub">XAUUSD journal · dashboard · discipline tracking</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={mode === 'signup' ? MIN_PASSWORD : 6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' && (
            <p className="auth-hint">At least {MIN_PASSWORD} characters.</p>
          )}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMsg(null)
            }}
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </form>
        {msg && <div className="auth-msg">{msg}</div>}
      </div>
    </div>
  )
}
