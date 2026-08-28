import { useState } from 'react'
import { useData } from '../context/DataContext'
import type { Settings } from '../lib/types'

export default function SettingsPage() {
  const { settings, updateSettings } = useData()
  const [form, setForm] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)

  function updateList(key: 'setups' | 'sessions' | 'emotions' | 'accounts', value: string) {
    setForm({ ...form, [key]: value.split('\n').map((s) => s.trim()).filter(Boolean) })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await updateSettings({ ...form, max_daily_loss: Number(form.max_daily_loss) || 0 })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="page-head">
        <h1>Settings</h1>
        <p className="muted">Configure setups, sessions, emotions, accounts, and your daily loss limit.</p>
      </div>

      <form onSubmit={save} className="panel form-grid">
        <div className="field">
          <label>Trading Setups (one per line)</label>
          <textarea rows={6} value={form.setups.join('\n')} onChange={(e) => updateList('setups', e.target.value)} />
        </div>
        <div className="field">
          <label>Sessions (one per line)</label>
          <textarea rows={6} value={form.sessions.join('\n')} onChange={(e) => updateList('sessions', e.target.value)} />
        </div>
        <div className="field">
          <label>Emotional States (one per line)</label>
          <textarea rows={6} value={form.emotions.join('\n')} onChange={(e) => updateList('emotions', e.target.value)} />
        </div>
        <div className="field">
          <label>Trading Accounts (one per line)</label>
          <textarea rows={6} value={form.accounts.join('\n')} onChange={(e) => updateList('accounts', e.target.value)} />
        </div>
        <div className="field">
          <label>Max Daily Loss Limit ($)</label>
          <input type="number" min="0" step="1" value={form.max_daily_loss} onChange={(e) => setForm({ ...form, max_daily_loss: Number(e.target.value) })} />
        </div>
        <div className="field span2">
          <button className="btn btn-primary" type="submit">Save Settings</button>
          {saved && <span className="form-ok">Saved ✅</span>}
        </div>
      </form>
    </div>
  )
}
