import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

const MIN_PASSWORD = 8

// Shown when the user arrives from a "Lupa password" link: Supabase already
// signed them in from the URL token, they only need to choose a new password.
export default function SetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) {
      setMsg(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (password !== confirm) {
      setMsg('Passwords do not match.')
      return
    }
    setBusy(true)
    setMsg(null)
    const { error } = await getSupabase().auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setMsg(error.message)
      return
    }
    // Drop the one-time recovery token so a refresh does not reopen this form.
    history.replaceState(null, '', window.location.pathname)
    onDone()
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-sub">Choose a password you will remember. At least {MIN_PASSWORD} characters.</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            required
            minLength={MIN_PASSWORD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            required
            minLength={MIN_PASSWORD}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Saving…' : 'Save password'}
          </button>
        </form>
        {msg && <div className="auth-msg">{msg}</div>}
      </div>
    </div>
  )
}
