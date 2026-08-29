import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { deleteTrade } from '../lib/api'
import { fmtPnl, fmtMoney, capitalOf, roiPct } from '../lib/stats'

export default function TradingLog() {
  const { trades, settings, reload } = useData()
  const [filter, setFilter] = useState('All Accounts')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const accounts = useMemo(() => ['All Accounts', ...settings.accounts], [settings.accounts])

  const filtered = useMemo(() => {
    if (filter === 'All Accounts') return trades
    return trades.filter((t) => t.account === filter)
  }, [trades, filter])

  const net = useMemo(() => filtered.reduce((a, t) => a + t.profit_loss, 0), [filtered])
  const wins = filtered.filter((t) => t.profit_loss > 0).length
  const losses = filtered.filter((t) => t.profit_loss < 0).length

  const capital = useMemo(() => (filter === 'All Accounts' ? 0 : capitalOf(settings, filter)), [settings, filter])
  const roi = useMemo(() => roiPct(net, capital), [net, capital])

  async function doDelete(id: string) {
    try {
      await deleteTrade(id)
      setConfirmDelete(null)
      await reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Trading Log</h1>
        <p className="muted">
          {filtered.length} trades · {wins}W / {losses}L · Net {fmtPnl(net)}
          {filter !== 'All Accounts' && (
            <> · Starting {capital ? fmtMoney(capital) : '—'} · ROI {roi == null ? '—' : `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`}</>
          )}
        </p>
      </div>

      <div className="panel">
        <div className="toolbar">
          <label>Account filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {accounts.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="tbl tbl--wide">
            <thead>
              <tr>
                <th>Date</th>
                <th>Account</th>
                <th>Session</th>
                <th>Setup</th>
                <th>Dir</th>
                <th className="num">Entry</th>
                <th className="num">Exit</th>
                <th className="num">Pips</th>
                <th className="num">P&L</th>
                <th>Emotion</th>
                <th>Volatility</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.trade_date}</td>
                  <td>{t.account}</td>
                  <td>{t.session}</td>
                  <td>{t.setup}</td>
                  <td className={t.direction === 'BUY' ? 'buy' : 'sell'}>{t.direction}</td>
                  <td className="num">{t.entry_price}</td>
                  <td className="num">{t.exit_price}</td>
                  <td className={`num ${t.pips >= 0 ? 'green' : 'red'}`}>{t.pips}</td>
                  <td className={`num ${t.profit_loss >= 0 ? 'green' : 'red'}`}>{fmtPnl(t.profit_loss)}</td>
                  <td>{t.emotion}</td>
                  <td>
                    <span className={t.volatility === 'High Volatility' ? 'badge-volatile' : 'badge-normal'}>
                      {t.volatility === 'High Volatility' ? '⚡ High Volatility' : 'Normal'}
                    </span>
                  </td>
                  <td className="notes-cell">{t.notes}</td>
                  <td>
                    {confirmDelete === t.id ? (
                      <span className="confirm-del">
                        <button className="btn btn-danger btn-sm" onClick={() => doDelete(t.id)}>Confirm</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>✕</button>
                      </span>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(t.id)}>🗑</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty-state">No trades in this view.</div>}
        </div>
      </div>
    </div>
  )
}
