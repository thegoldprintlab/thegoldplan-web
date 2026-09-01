import { useState } from 'react'
import { useData } from '../context/DataContext'
import type { Settings } from '../lib/types'

export default function SettingsPage() {
  const { settings, updateSettings } = useData()
  const [form, setForm] = useState<Settings>({
    ...settings,
    account_capitals: settings.account_capitals ?? {},
    account_daily_loss_limits: settings.account_daily_loss_limits ?? {},
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

  function setDailyLimit(account: string, value: string) {
    const limits = { ...(form.account_daily_loss_limits ?? {}) }
    const n = parseFloat(value)
    if (!Number.isFinite(n) || n <= 0) {
      delete limits[account]
    } else {
      limits[account] = n
    }
    setForm({ ...form, account_daily_loss_limits: limits })
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
        <div>
          <div className="kicker">Configuration</div>
          <h1>Settings</h1>
          <p className="page-sub">Setups, sessions, emotions, accounts, daily loss limits, and the Quick Log API.</p>
        </div>
      </div>

      <div className="panel">
        <h2>Quick Log API (iOS Shortcuts)</h2>
        <p className="muted" style={{ marginBottom: 18, fontSize: '0.88rem' }}>
          Use this token to log a trade straight from your Home Screen without opening the app. Build a Shortcut with
          a “Get Contents of URL” block (POST) to the endpoint below.
        </p>
        <div className="field">
          <label htmlFor="endpoint">Endpoint (POST JSON)</label>
          <input id="endpoint" readOnly value="https://gtblmwijohoetczqngpr.supabase.co/rest/v1/rpc/api_log_trade" onFocus={(e) => e.target.select()} />
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="api-token">Your API Token</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="api-token" readOnly value={settings.api_token ?? 'Generating…'} onFocus={(e) => e.target.select()} />
            <button className="btn" onClick={copyToken}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="json-sample">Example JSON Body (for Shortcut)</label>
          <textarea id="json-sample" readOnly rows={5} value={shortcutBody} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }} />
        </div>
        <div style={{ marginTop: 14, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-md)', padding: 14 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: 8, fontWeight: 600 }}>Required headers:</div>
          <code>apikey: &lt;anon key&gt;</code>
          <br />
          <code>Authorization: Bearer &lt;anon key&gt;</code>
          <br />
          <code>Content-Type: application/json</code>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-subtle)', marginTop: 8 }}>
            The anon key is available from this page: <b>Settings → API → anon public</b>.
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Daily Loss Limit per Account ($)</h2>
        <p className="muted" style={{ fontSize: '0.82rem', margin: '0 0 12px' }}>
          Per-account daily limit. Leave empty to use the global <b>Max Daily Loss Limit</b>.
        </p>
        {form.accounts.length === 0 && (
          <p className="muted">No accounts yet — add an account below first.</p>
        )}
        {form.accounts.map((a) => (
          <div key={a} className="cap-row">
            <span className="cap-name">{a}</span>
            <span className="cap-input-wrap">
              <span className="cap-dollar">$</span>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="Default"
                aria-label={`Daily loss limit for ${a}`}
                value={form.account_daily_loss_limits?.[a] ?? ''}
                onChange={(e) => setDailyLimit(a, e.target.value)}
              />
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="panel form-grid">
        <div className="field">
          <label htmlFor="setups">Trading Setups (one per line)</label>
          <textarea id="setups" rows={6} value={form.setups.join('\n')} onChange={(e) => updateList('setups', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sessions">Sessions (one per line)</label>
          <textarea id="sessions" rows={6} value={form.sessions.join('\n')} onChange={(e) => updateList('sessions', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="emotions">Emotional States (one per line)</label>
          <textarea id="emotions" rows={6} value={form.emotions.join('\n')} onChange={(e) => updateList('emotions', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="accounts">Trading Accounts (one per line)</label>
          <textarea id="accounts" rows={6} value={form.accounts.join('\n')} onChange={(e) => updateList('accounts', e.target.value)} />
        </div>
        <div className="field">
          <label>Starting Capital per Account ($)</label>
          <p className="muted" style={{ fontSize: '0.82rem', margin: '0 0 10px' }}>
            Starting capital per account — ROI is calculated as Net P&amp;L ÷ starting capital. Empty = no ROI for that
            account.
          </p>
          {form.accounts.length === 0 && <p className="muted">No accounts yet — add an account above.</p>}
          {form.accounts.map((a) => (
            <div key={a} className="cap-row">
              <span className="cap-name">{a}</span>
              <span className="cap-input-wrap">
                <span className="cap-dollar">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 10000"
                  aria-label={`Starting capital for ${a}`}
                  value={form.account_capitals?.[a] ?? ''}
                  onChange={(e) => setCapital(a, e.target.value)}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="field">
          <label htmlFor="max-loss">Max Daily Loss Limit ($)</label>
          <input id="max-loss" type="number" min="0" step="1" value={form.max_daily_loss} onChange={(e) => setForm({ ...form, max_daily_loss: Number(e.target.value) })} />
        </div>
        <div className="field span2">
          <button className="btn btn-primary" type="submit">Save Settings</button>
          {saved && <span className="form-ok">Saved</span>}
        </div>
      </form>
    </div>
  )
}
