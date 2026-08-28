import { useState } from 'react'
import { useData } from '../context/DataContext'
import type { Settings } from '../lib/types'

export default function SettingsPage() {
  const { settings, updateSettings } = useData()
  const [form, setForm] = useState<Settings>({
    ...settings,
    account_capitals: settings.account_capitals ?? {},
  })
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  function updateList(key: 'setups' | 'sessions' | 'emotions' | 'accounts', value: string) {
    setForm({ ...form, [key]: value.split('\n').map((s) => s.trim()).filter(Boolean) })
  }

  function setCapital(account: string, value: string) {
    const caps = { ...(form.account_capitals ?? {}) }
    const n = parseFloat(value)
    if (!Number.isFinite(n) || n <= 0) {
      delete caps[account]
    } else {
      caps[account] = n
    }
    setForm({ ...form, account_capitals: caps })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await updateSettings({
      ...form,
      max_daily_loss: Number(form.max_daily_loss) || 0,
      account_capitals: form.account_capitals ?? {},
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function copyToken() {
    if (!settings.api_token) return
    await navigator.clipboard.writeText(settings.api_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortcutBody = settings.api_token
    ? `{
  "token": "${settings.api_token}",
  "entry": 2320.50,
  "exit": 2325.00,
  "direction": "BUY"
}`.replace(/\n/g, '\n')
    : ''

  return (
    <div>
      <div className="page-head">
        <h1>Settings</h1>
        <p className="muted">Configure setups, sessions, emotions, accounts, daily loss limit, dan Quick Log API.</p>
      </div>

      <div className="panel">
        <h2>⚡ Quick Log API (iOS Shortcuts)</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Guna token ini untuk log trade terus dari Home Screen tanpa buka app. Bina Shortcut dengan blok
          "Get Contents of URL" (POST) ke endpoint di bawah.
        </p>
        <div className="field">
          <label>Endpoint (POST JSON)</label>
          <input readOnly value="https://gtblmwijohoetczqngpr.supabase.co/rest/v1/rpc/api_log_trade" onFocus={(e) => e.target.select()} />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>API Token anda</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input readOnly value={settings.api_token ?? 'Menjana…'} onFocus={(e) => e.target.select()} />
            <button className="btn btn-secondary" onClick={copyToken}>{copied ? '✓ Copied' : 'Copy'}</button>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Contoh JSON Body (untuk Shortcut)</label>
          <textarea readOnly rows={5} value={shortcutBody} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 0.82 }} />
        </div>
        <div style={{ marginTop: 12, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 0.85, color: 'var(--ink-muted)', marginBottom: 8 }}>Header yang diperlukan:</div>
          <code>apikey: &lt;anon-key&gt;</code><br />
          <code>Authorization: Bearer &lt;anon-key&gt;</code><br />
          <code>Content-Type: application/json</code>
          <div style={{ fontSize: 0.82, color: 'var(--ink-subtle)', marginTop: 8 }}>
            Anon key boleh diambil dari halaman ini: <b>Settings → API → anon public</b>.
          </div>
        </div>
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
          <label>Starting Capital per Account ($)</label>
          <p className="muted" style={{ fontSize: 0.82, margin: '0 0 10px' }}>
            Set modal permulaan untuk setiap akaun — ROI dikira sebagai Net P&amp;L ÷ starting capital.
            Kosongkan = tiada ROI untuk akaun itu.
          </p>
          {form.accounts.length === 0 && (
            <p className="muted">Tiada akaun lagi — tambah akaun di kotak di atas.</p>
          )}
          {form.accounts.map((a) => (
            <div key={a} className="cap-row">
              <span className="cap-name">{a}</span>
              <span className="cap-input-wrap">
                <span className="cap-dollar">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="cth. 10000"
                  value={form.account_capitals?.[a] ?? ''}
                  onChange={(e) => setCapital(a, e.target.value)}
                />
              </span>
            </div>
          ))}
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
