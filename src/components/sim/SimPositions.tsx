import { useState } from 'react'
import { fmtMoney, pnlOf } from '../../sim/engine'
import { fmtTime } from '../../sim/aggregate'
import type { ClosedTrade, Position } from '../../sim/types'

interface Props {
  positions: Position[]
  closed: ClosedTrade[]
  price: number
  onClose: (id: number) => void
  onCloseAll: () => void
}

export default function SimPositions({ positions, closed, price, onClose, onCloseAll }: Props) {
  const [tab, setTab] = useState<'open' | 'history'>('open')
  const openPnl = positions.reduce((a, p) => a + pnlOf(p.side, p.entry, price, p.lots), 0)

  return (
    <div className="panel sim-positions">
      <div className="sim-positions-head">
        <div className="seg">
          <button className={`seg-btn ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
            Open ({positions.length})
          </button>
          <button className={`seg-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            History ({closed.length})
          </button>
        </div>
        {tab === 'open' && positions.length > 0 && (
          <div className="sim-pos-actions">
            <span className={openPnl >= 0 ? 'green' : 'red'}>
              Floating {fmtMoney(openPnl)}
            </span>
            <button className="btn btn-sm btn-danger" onClick={onCloseAll}>
              Close all
            </button>
          </div>
        )}
      </div>

      {tab === 'open' ? (
        positions.length === 0 ? (
          <p className="muted sim-empty">Tiada posisi terbuka. Tekan BUY atau SELL pada ticket.</p>
        ) : (
          <div className="table-wrap">
            <table className="tbl tbl--wide">
              <thead>
                <tr>
                  <th>Side</th>
                  <th>Lots</th>
                  <th>Entry</th>
                  <th>SL</th>
                  <th>TP</th>
                  <th>Open time</th>
                  <th>P&amp;L</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const pnl = pnlOf(p.side, p.entry, price, p.lots)
                  return (
                    <tr key={p.id}>
                      <td className={p.side === 'BUY' ? 'green' : 'red'}>{p.side}</td>
                      <td>{p.lots.toFixed(2)}</td>
                      <td className="mono">{p.entry.toFixed(2)}</td>
                      <td className="mono">{p.sl != null ? p.sl.toFixed(2) : '—'}</td>
                      <td className="mono">{p.tp != null ? p.tp.toFixed(2) : '—'}</td>
                      <td className="mono muted">{fmtTime(p.openTime)}</td>
                      <td className={pnl >= 0 ? 'green' : 'red'}>{fmtMoney(pnl)}</td>
                      <td>
                        <button className="btn btn-sm btn-ghost" onClick={() => onClose(p.id)}>
                          Close
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : closed.length === 0 ? (
        <p className="muted sim-empty">Belum ada trade ditutup.</p>
      ) : (
        <div className="table-wrap">
          <table className="tbl tbl--wide">
            <thead>
              <tr>
                <th>Side</th>
                <th>Lots</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Reason</th>
                <th>Close time</th>
                <th>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {closed.slice(0, 100).map((t, i) => (
                <tr key={`${t.id}-${i}`}>
                  <td className={t.side === 'BUY' ? 'green' : 'red'}>{t.side}</td>
                  <td>{t.lots.toFixed(2)}</td>
                  <td className="mono">{t.entry.toFixed(2)}</td>
                  <td className="mono">{t.exit.toFixed(2)}</td>
                  <td>
                    <span className={`sim-badge ${t.reason.toLowerCase()}`}>{t.reason}</span>
                  </td>
                  <td className="mono muted">{fmtTime(t.exitTime)}</td>
                  <td className={t.pnl >= 0 ? 'green' : 'red'}>{fmtMoney(t.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
