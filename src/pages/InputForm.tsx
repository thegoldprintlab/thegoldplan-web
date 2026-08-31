import { useState } from 'react'
import { useData } from '../context/DataContext'
import { insertTrade, computePips, currentVolatility } from '../lib/api'
import { todayISO } from '../lib/stats'
import type { Direction } from '../lib/types'

export default function InputForm() {
  const { settings, reload } = useData()
  const [tradeDate, setTradeDate] = useState(todayISO())
  const [account, setAccount] = useState(settings.accounts[0] ?? '')
  const [session, setSession] = useState(settings.sessions[0] ?? '')
  const [setup, setSetup] = useState(settings.setups[0] ?? '')
  const [direction, setDirection] = useState<Direction>('BUY')
  const [entry, setEntry] = useState('')
  const [exit, setExit] = useState('')
  const [volume, setVolume] = useState('')
  const [profit, setProfit] = useState('')
  const [emotion, setEmotion] = useState(settings.emotions[0] ?? '')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const entryNum = parseFloat(entry)
  const exitNum = parseFloat(exit)
  const volumeNum = parseFloat(volume)
  const profitNum = parseFloat(profit)
  const valid =
    Number.isFinite(entryNum) && entryNum > 0 &&
    Number.isFinite(exitNum) && exitNum > 0 &&
    Number.isFinite(volumeNum) && volumeNum > 0 &&
    Number.isFinite(profitNum) &&
    Boolean(tradeDate) && Boolean(account)
  const pips = valid ? computePips(direction, entryNum, exitNum) : 0
  const vol = currentVolatility()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    setMsg(null)
    try {
      await insertTrade({
        trade_date: tradeDate,
        account,
        session,
        setup,
        direction,
        entry_price: entryNum,
        exit_price: exitNum,
        volume: volumeNum,
        pips,
        profit_loss: profitNum,
        emotion,
        notes,
      })
      setEntry('')
      setExit('')
      setVolume('')
      setProfit('')
      setNotes('')
      setMsg({ ok: true, text: 'Trade submitted successfully ✅' })
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
        <h1>Input Form</h1>
        <p className="muted">Log a new trade — entry, exit, volume &amp; profit are manual.</p>
      </div>

      <form onSubmit={submit} className="panel form-grid">
        <div className="field">
          <label>Date</label>
          <input type="date" required value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Account</label>
          <select required value={account} onChange={(e) => setAccount(e.target.value)}>
            {settings.accounts.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Session</label>
          <select required value={session} onChange={(e) => setSession(e.target.value)}>
            {settings.sessions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Trading Setup</label>
          <select required value={setup} onChange={(e) => setSetup(e.target.value)}>
            {settings.setups.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Direction</label>
          <div className="seg">
            <button type="button" className={direction === 'BUY' ? 'seg-btn active buy' : 'seg-btn'} onClick={() => setDirection('BUY')}>BUY</button>
            <button type="button" className={direction === 'SELL' ? 'seg-btn active sell' : 'seg-btn'} onClick={() => setDirection('SELL')}>SELL</button>
          </div>
        </div>
        <div className="field">
          <label>Entry Price</label>
          <input type="number" required step="0.01" min="0" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="e.g. 2325.50" />
        </div>
        <div className="field">
          <label>Exit Price</label>
          <input type="number" required step="0.01" min="0" value={exit} onChange={(e) => setExit(e.target.value)} placeholder="e.g. 2330.50" />
        </div>
        <div className="field">
          <label>Volume (lots)</label>
          <input type="number" required step="0.01" min="0" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="e.g. 0.30" />
        </div>
        <div className="field">
          <label>Profit / Loss ($)</label>
          <input type="number" required step="0.01" value={profit} onChange={(e) => setProfit(e.target.value)} placeholder="e.g. 200.00 (negatif untuk loss)" />
        </div>
        <div className="field">
          <label>Emotion</label>
          <select required value={emotion} onChange={(e) => setEmotion(e.target.value)}>
            {settings.emotions.map((em) => (
              <option key={em} value={em}>{em}</option>
            ))}
          </select>
        </div>
        <div className="field span2">
          <label>Notes / Comment</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Trade thesis, TradingView link, what went right/wrong…" />
        </div>

        <div className="field span2 live-calc">
          {valid ? (
            <>
              <span>Pips: <b className={pips >= 0 ? 'green' : 'red'}>{pips}</b></span>
              <span>Volume: <b>{volumeNum}</b></span>
              <span>P&L: <b className={profitNum >= 0 ? 'green' : 'red'}>{profitNum >= 0 ? '+' : '-'}${Math.abs(profitNum).toFixed(2)}</b></span>
              <span className={vol === 'High Volatility' ? 'badge-volatile' : 'badge-normal'}>
                {vol === 'High Volatility' ? '⚡ High Volatility (London-NY overlap)' : 'Normal Volatility'}
              </span>
              <span className="ready">✅ READY</span>
            </>
          ) : (
            <span>⚠️ DATA INCOMPLETE — fill entry, exit, volume and profit.</span>
          )}
        </div>

        <div className="field span2">
          <button className="btn btn-primary btn-lg" disabled={!valid || busy} type="submit">
            {busy ? 'Submitting…' : 'Submit Trade'}
          </button>
        </div>
        {msg && <div className={`field span2 ${msg.ok ? 'form-ok' : 'form-err'}`}>{msg.text}</div>}
      </form>
    </div>
  )
}
