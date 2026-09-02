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
      setMsg({ ok: false, text: 'Pilih fail Excel dan akaun.' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const rows = await parseMt5Excel(file, account)
      if (rows.length === 0) {
        setMsg({ ok: false, text: 'Tiada baris trade dijumpai. Pastikan ini fail report MT5 (Excel) yang betul.' })
        setBusy(false)
        return
      }

      if (isDemoPreview()) {
        setMsg({ ok: true, text: `Demo mode — ${rows.length} trade dibaca, tapi tak disimpan.` })
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
      setMsg({ ok: true, text: `Berjaya import ${rows.length} trade (net ${nets.toFixed(2)}) ke akaun "${account}".` })
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
          Muat naik fail Excel report MT5 (<code>History → Report → Excel/XLSX</code>) dan pilih akaun.
          Trade akan di-parse &amp; dimasukkan automatik.
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
          <label>Fail Excel MT5 (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="field span2">
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? 'Memproses…' : 'Import sekarang'}
          </button>
        </div>
        {msg && (
          <div className={`form-${msg.ok ? 'ok' : 'err'} span2`} style={{ display: 'block' }}>
            {msg.text}
          </div>
        )}
      </form>

      <div className="panel" style={{ marginTop: 16, maxWidth: 560 }}>
        <h3>Macam mana nak dapatkan report?</h3>
        <ol style={{ paddingLeft: 20 }}>
          <li>Buka MT5 (desktop) → tab <b>History</b></li>
          <li>Right-click dalam senarai → <b>Report</b> → pilih <b>Excel (XLSX)</b></li>
          <li>Simpan fail, pastu muat naik kat sini.</li>
        </ol>
        <p className="muted">
          Nota: import akan <b>tambah</b> trade baru. Kalau nak ganti data lama, hapus dulu dalam Trading Log.
        </p>
      </div>
    </div>
  )
}
