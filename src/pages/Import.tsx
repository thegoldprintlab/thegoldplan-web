import { useState } from 'react'
import { useData } from '../context/DataContext'
import { parseMt5Excel } from '../lib/mt5Import'
import { getSupabase } from '../lib/supabase'
import { isDemoPreview } from '../lib/demo'

/** Import MT5 Excel report → parse → bulk insert trades. */
export default function ImportPage() {
  const { settings, reload } = useData()
  const [account, setAccount] = useState(settings.accounts[0] ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function doImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !account) {
      setMsg({ ok: false, text: 'Please select an Excel file and an account.' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const rows = await parseMt5Excel(file, account)
      if (rows.length === 0) {
        setMsg({ ok: false, text: 'No trades found. Make sure this is a valid MT5 report (Excel).' })
        setBusy(false)
        return
      }

      if (isDemoPreview()) {
        setMsg({ ok: true, text: `Demo mode — ${rows.length} trades read, but not saved.` })
        setBusy(false)
        return
      }

      const sb = getSupabase()
      const { data: user } = await sb.auth.getUser()
      const userId = user.user?.id
      if (!userId) throw new Error('Not authenticated')

      // Insert in chunks of 500 to avoid huge payloads
      const CHUNK = 500
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map((r) => ({ ...r, user_id: userId }))
        const { error } = await sb.from('trades').insert(chunk)
        if (error) throw error
      }

      const nets = rows.reduce((a, r) => a + r.profit_loss, 0)
      setMsg({ ok: true, text: `Successfully imported ${rows.length} trades (net ${nets.toFixed(2)}) into "${account}".` })
      setFile(null)
      await reload()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Import MT5</h1>
        <p className="muted">
          Upload your MT5 Excel report (<code>History → Report → Excel/XLSX</code>) and pick an account.
          Trades are parsed &amp; inserted automatically.
        </p>
      </div>

      <form onSubmit={doImport} className="panel form-grid" style={{ maxWidth: 560 }}>
        <div className="field">
          <label>Account</label>
          <select required value={account} onChange={(e) => setAccount(e.target.value)}>
            {settings.accounts.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>MT5 Excel file (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="field span2">
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Processing…' : 'Import now'}
          </button>
        </div>
        {msg && (
          <div className={`form-${msg.ok ? 'ok' : 'err'} span2`} style={{ display: 'block' }}>
            {msg.text}
          </div>
        )}
      </form>

      <div className="panel" style={{ marginTop: 16, maxWidth: 560 }}>
        <h3>How to get the report?</h3>
        <ol style={{ paddingLeft: 20 }}>
          <li>Open MT5 (desktop) → <b>History</b> tab</li>
          <li>Right-click in the list → <b>Report</b> → choose <b>Excel (XLSX)</b></li>
          <li>Save the file, then upload it here.</li>
        </ol>
        <p className="muted">
          Note: import <b>adds</b> new trades. To replace old data, delete them first in Trading Log.
        </p>
      </div>
    </div>
  )
}
