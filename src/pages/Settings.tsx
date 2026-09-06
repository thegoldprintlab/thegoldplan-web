import { useState } from 'react'
import UpgradeGate from '../components/UpgradeGate'
import { useData } from '../context/DataContext'
import type { Settings } from '../lib/types'

const DEFAULT_SETUPS = ['SNR Breakout', 'SND Rejection', 'SNR + SND', 'Others']
const DEFAULT_SESSIONS = ['Australia (Aus)', 'Tokyo (Tok)', 'London (Lon)', 'New York (NY)']
const DEFAULT_EMOTIONS = ['Calm & Focused', 'FOMO / Chasing Price', 'Revenge Trading', 'Hesitant']
const MAX_ACCOUNTS = 4

export default function SettingsPage() {
  const { settings, updateSettings } = useData()
  const [form, setForm] = useState<Settings>({
    ...settings,
    account_capitals: settings.account_capitals ?? {},
    account_daily_loss_limits: settings.account_daily_loss_limits ?? {},
  })
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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

  function updateAccountName(idx: number, value: string) {
    const next = form.accounts.slice()
    const old = next[idx]
    next[idx] = value
    setForm({
      ...form,
      accounts: next,
      account_capitals: (() => {
        const caps = { ...(form.account_capitals ?? {}) }
        if (old && value && old !== value) {
          caps[value] = caps[old]
          delete caps[old]
        }
        return caps
      })(),
      account_daily_loss_limits: (() => {
        const limits = { ...(form.account_daily_loss_limits ?? {}) }
        if (old && value && old !== value) {
          limits[value] = limits[old]
          delete limits[old]
        }
        return limits
      })(),
    })
  }

  function addAccount() {
    if (form.accounts.length >= MAX_ACCOUNTS) return
    setForm({ ...form, accounts: [...form.accounts, ''] })
  }

  function removeAccount(idx: number) {
    setForm({
      ...form,
      accounts: form.accounts.filter((_, i) => i !== idx),
      account_capitals: (() => {
        const caps = { ...(form.account_capitals ?? {}) }
        const removed = form.accounts[idx]
        if (removed) delete caps[removed]
        return caps
      })(),
      account_daily_loss_limits: (() => {
        const limits = { ...(form.account_daily_loss_limits ?? {}) }
        const removed = form.accounts[idx]
        if (removed) delete limits[removed]
        return limits
      })(),
    })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setSaved(false)
    try {
      // Trim accounts and drop empties before persisting.
      const cleanAccounts = form.accounts.map((a) => a.trim()).filter(Boolean)
      const cleanCaps: Record<string, number> = {}
      for (const a of cleanAccounts) {
        const v = form.account_capitals?.[a]
        if (typeof v === 'number' && v > 0) cleanCaps[a] = v
      }
      const cleanLimits: Record<string, number> = {}
      for (const a of cleanAccounts) {
        const v = form.account_daily_loss_limits?.[a]
        if (typeof v === 'number' && v > 0) cleanLimits[a] = v
      }
      await updateSettings({
        ...form,
        setups: DEFAULT_SETUPS,
        sessions: DEFAULT_SESSIONS,
        emotions: DEFAULT_EMOTIONS,
        accounts: cleanAccounts,
        max_daily_loss: Number(form.max_daily_loss) || 0,
        account_capitals: cleanCaps,
        account_daily_loss_limits: cleanLimits,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
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
}`
    : ''

  const canAddMore = form.accounts.length < MAX_ACCOUNTS

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Configuration</div>
          <h1>Settings</h1>
          <p className="page-sub">Setups, sessions, emotions, accounts, daily loss limits, and the Quick Log API.</p>
        </div>
      </div>

      <UpgradeGate feature="Quick Log API">
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
            <code>apikey: *** key&gt;</code>
            <br />
            <code>Authorization: Bearer *** key&gt;</code>
            <br />
            <code>Content-Type: application/json</code>
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-subtle)', marginTop: 8 }}>
              The anon key is available from this page: <b>Settings → API → anon public</b>.
            </div>
          </div>
        </div>
      </UpgradeGate>

      <form onSubmit={save} className="panel form-grid">
        <div className="field">
          <label htmlFor="setups">Trading Setups (fixed)</label>
          <textarea
            id="setups"
            rows={4}
            value={DEFAULT_SETUPS.join('\n')}
            readOnly
            onChange={() => {}}
          />
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
            Same list for every user.
          </p>
        </div>
        <div className="field">
          <label htmlFor="sessions">Sessions (fixed)</label>
          <textarea
            id="sessions"
            rows={4}
            value={DEFAULT_SESSIONS.join('\n')}
            readOnly
            onChange={() => {}}
          />
        </div>
        <div className="field">
          <label htmlFor="emotions">Emotional States (fixed)</label>
          <textarea
            id="emotions"
            rows={4}
            value={DEFAULT_EMOTIONS.join('\n')}
            readOnly
            onChange={() => {}}
          />
        </div>
        <div className="field span2">
          <label>Trading Accounts · max {MAX_ACCOUNTS}</label>
          <p className="muted" style={{ fontSize: '0.82rem', margin: '0 0 10px' }}>
            Add up to {MAX_ACCOUNTS} trading accounts. Capital and daily loss limit per account appear below.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.accounts.map((a, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={a}
                  onChange={(e) => updateAccountName(idx, e.target.value)}
                  placeholder={`Account ${idx + 1}`}
                  aria-label={`Account ${idx + 1} name`}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeAccount(idx)}
                  aria-label={`Remove account ${a || idx + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={addAccount}
              disabled={!canAddMore}
            >
              {canAddMore ? `+ Add account (${form.accounts.length}/${MAX_ACCOUNTS})` : `Max ${MAX_ACCOUNTS} accounts reached`}
            </button>
          </div>
        </div>
        <div className="field">
          <label>Starting Capital per Account ($)</label>
          <p className="muted" style={{ fontSize: '0.82rem', margin: '0 0 10px' }}>
            Starting capital per account — ROI is calculated as Net P&amp;L ÷ starting capital. Empty = no ROI for that
            account.
          </p>
          {form.accounts.length === 0 && <p className="muted">No accounts yet — add an account above first.</p>}
          {form.accounts.map((a, idx) => (
            <div key={idx} className="cap-row">
              <span className="cap-name">{a || `Account ${idx + 1}`}</span>
              <span className="cap-input-wrap">
                <span className="cap-dollar">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 10000"
                  aria-label={`Starting capital for ${a || `Account ${idx + 1}`}`}
                  value={form.account_capitals?.[a] ?? ''}
                  onChange={(e) => setCapital(a, e.target.value)}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="field">
          <label>Daily Loss Limit per Account ($)</label>
          <p className="muted" style={{ fontSize: '0.82rem', margin: '0 0 12px' }}>
            Per-account daily limit. Leave empty to use the global <b>Max Daily Loss Limit</b>.
          </p>
          {form.accounts.length === 0 && <p className="muted">No accounts yet — add an account above first.</p>}
          {form.accounts.map((a, idx) => (
            <div key={idx} className="cap-row">
              <span className="cap-name">{a || `Account ${idx + 1}`}</span>
              <span className="cap-input-wrap">
                <span className="cap-dollar">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="Default"
                  aria-label={`Daily loss limit for ${a || `Account ${idx + 1}`}`}
                  value={form.account_daily_loss_limits?.[a] ?? ''}
                  onChange={(e) => setDailyLimit(a, e.target.value)}
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
          {saved && <span className="form-ok" style={{ marginLeft: 10 }}>Saved</span>}
          {err && <span className="form-err" style={{ marginLeft: 10 }}>Save failed: {err}</span>}
        </div>
      </form>
    </div>
  )
}