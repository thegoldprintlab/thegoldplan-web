import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const sb = getSupabase()
    const { error } =
      mode === 'signup'
        ? await sb.auth.signUp({ email, password })
        : await sb.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'signup') setMsg('Account created! Check your email to confirm, then log in.')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">◈ The Gold Plan Trading Journey</div>
        <p className="auth-sub">XAUUSD journal · dashboard · discipline tracking</p>
        <form onSubmit={submit} className="auth-form">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <label>Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
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
