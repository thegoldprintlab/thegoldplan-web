import { useState } from 'react'
import { fmtMoney, marginOf } from '../../sim/engine'
import type { Side } from '../../sim/types'

interface Props {
  price: number
  balance: number
  equity: number
  margin: number
  freeMargin: number
  marginLevel: number | null
  leverage: number
  disabled: boolean
  /** Mod bar mendatar: volume + buy/sell + baki sahaja. */
  compact?: boolean
  onOrder: (side: Side, lots: number, slDist: number, tpDist: number) => void
}

export default function SimTicket({ price, balance, equity, margin, freeMargin, marginLevel, leverage, disabled, compact, onOrder }: Props) {
  const [lots, setLots] = useState(0.1)
  const [sl, setSl] = useState(0)
  const [tp, setTp] = useState(0)
  const [riskOpen, setRiskOpen] = useState(false)

  const marginNeeded = price ? marginOf(price, lots, leverage) : 0
  const slRisk = sl > 0 ? sl * 100 * lots : 0

  if (compact) {
    return (
      <div className="sim-orderbar">
        <span className="sim-orderbar-bal">
          <span className="muted">Bal</span> <b>{fmtMoney(balance)}</b>
        </span>
        <span className="sim-orderbar-bal">
          <span className="muted">Eq</span> <b>{fmtMoney(equity)}</b>
        </span>
        <label className="sim-orderbar-lots">
          <span className="muted">Lots</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="10"
            value={lots}
            onChange={(e) => setLots(Math.min(10, Math.max(0.01, Number(e.target.value) || 0.01)))}
            aria-label="Volume (lot)"
          />
        </label>
        <button className="sim-btn buy" onClick={() => onOrder('BUY', lots, sl, tp)} disabled={disabled}>
          BUY {price ? price.toFixed(2) : ''}
        </button>
        <button className="sim-btn sell" onClick={() => onOrder('SELL', lots, sl, tp)} disabled={disabled}>
          SELL {price ? price.toFixed(2) : ''}
        </button>
      </div>
    )
  }

  return (
    <div className="panel sim-ticket">
      <div className="sim-acct">
        <div className="sim-acct-row">
          <span className="muted">Balance</span>
          <b>{fmtMoney(balance)}</b>
        </div>
        <div className="sim-acct-row">
          <span className="muted">Equity</span>
          <b>{fmtMoney(equity)}</b>
        </div>
        <div className="sim-acct-row">
          <span className="muted">Margin</span>
          <span>{fmtMoney(margin)}</span>
        </div>
        <div className="sim-acct-row">
          <span className="muted">Free margin</span>
          <span>{fmtMoney(freeMargin)}</span>
        </div>
        <div className="sim-acct-row">
          <span className="muted">Margin level</span>
          <span className={marginLevel != null && marginLevel < 200 ? 'red' : ''}>
            {marginLevel != null ? `${marginLevel.toFixed(0)}%` : '—'}
          </span>
        </div>
      </div>

      <div className="sim-ticket-body">
        <div className="field">
          <label htmlFor="sim-lots">Volume (lot)</label>
          <input
            id="sim-lots"
            type="number"
            step="0.01"
            min="0.01"
            max="10"
            value={lots}
            onChange={(e) => setLots(Math.min(10, Math.max(0.01, Number(e.target.value) || 0.01)))}
          />
        </div>

        <button className="sim-more" onClick={() => setRiskOpen((v) => !v)} type="button">
          {riskOpen ? '− Hide SL / TP' : '+ Set SL / TP'}
        </button>

        {riskOpen && (
          <div className="sim-risk">
            <div className="field">
              <label htmlFor="sim-sl">Stop loss (price distance, $)</label>
              <input
                id="sim-sl"
                type="number"
                step="0.5"
                min="0"
                value={sl}
                onChange={(e) => setSl(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="field">
              <label htmlFor="sim-tp">Take profit (price distance, $)</label>
              <input
                id="sim-tp"
                type="number"
                step="0.5"
                min="0"
                value={tp}
                onChange={(e) => setTp(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <p className="muted sim-risk-note">
              0 = none. SL risk ≈ {fmtMoney(slRisk)} · margin ≈ {fmtMoney(marginNeeded)}
            </p>
          </div>
        )}

        <div className="sim-buttons">
          <button className="sim-btn buy" onClick={() => onOrder('BUY', lots, sl, tp)} disabled={disabled}>
            <span>BUY</span>
            <small>{price ? price.toFixed(2) : '—'}</small>
          </button>
          <button className="sim-btn sell" onClick={() => onOrder('SELL', lots, sl, tp)} disabled={disabled}>
            <span>SELL</span>
            <small>{price ? price.toFixed(2) : '—'}</small>
          </button>
        </div>

        <p className="muted sim-ticket-note">
          XAUUSD · 1 lot = 100 oz · leverage 1:{leverage}. PnL = price move × 100 × lots.
        </p>
      </div>
    </div>
  )
}
