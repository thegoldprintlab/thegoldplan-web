import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  calculateLot,
  fmtLots,
  fmtUsd,
  MIN_LOT,
  PIP_SIZE,
  toPips,
  type DistanceUnit,
  type RiskMode,
} from '../lib/lotSize'

const RISK_PRESETS = [0.5, 1, 2, 3]

/** A calm starting point: $1,000 account, 1% risk, 30-pip stop, 1:2. */
const DEFAULTS = {
  balance: 1000,
  riskValue: 1,
  stopDistance: 30,
  rewardRatio: 2,
  leverage: 100,
}

export default function LotCalculator() {
  const [balance, setBalance] = useState(DEFAULTS.balance)
  const [riskMode, setRiskMode] = useState<RiskMode>('percent')
  const [riskValue, setRiskValue] = useState(DEFAULTS.riskValue)
  const [unit, setUnit] = useState<DistanceUnit>('pips')
  const [stopDistance, setStopDistance] = useState(DEFAULTS.stopDistance)
  const [rewardRatio, setRewardRatio] = useState(DEFAULTS.rewardRatio)
  const [leverage, setLeverage] = useState(DEFAULTS.leverage)
  const [price, setPrice] = useState(2650)

  // A public tool page needs its own title/description or Google indexes it as
  // the homepage. Restore the originals on unmount so other routes are unaffected.
  useEffect(() => {
    const title = 'XAUUSD Lot Size Calculator — Free Risk-Based Sizing Tool'
    const desc =
      'Free XAUUSD lot size calculator. Enter your balance, risk percentage and stop distance to get the exact lot size for gold — rounded down so risk stays inside the plan.'
    const prevTitle = document.title
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content') ?? null
    document.title = title
    meta?.setAttribute('content', desc)

    // FAQ structured data — the questions below are the ones people actually
    // search ("is a pip on gold 0.01 or 0.10"), so mark them up for rich results.
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is a pip on gold 0.01 or 0.10?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Brokers disagree and both labels are in use. This calculator treats 1 pip as a $0.10 price move, the common convention. If your broker calls a $0.01 move a pip, enter the stop distance as a price move instead — the lot size is identical because sizing only uses the price distance.',
          },
        },
        {
          '@type': 'Question',
          name: 'What lot size should I use on a $500 account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'At 1% risk on a $500 account the budget is $5. With a 30-pip stop that is 0.01 lots, the broker minimum. Any stop wider than about 50 pips cannot be traded at 1% risk on a standard account — that calls for a larger account or a tighter setup, not more risk.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does leverage change the lot size?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Leverage changes the margin the broker locks, not the money lost when the stop is hit. It only determines whether the position fits inside free margin.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why is the lot size rounded down?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Rounding up quietly turns a 1% risk into a larger one. Rounding down to the broker step keeps the position inside the risk budget at the cost of a few cents of potential profit.',
          },
        },
      ],
    })
    document.head.appendChild(ld)

    return () => {
      document.title = prevTitle
      if (meta && prevDesc !== null) meta.setAttribute('content', prevDesc)
      ld.remove()
    }
  }, [])

  const result = useMemo(
    () =>
      calculateLot({
        balance,
        riskMode,
        riskValue,
        stopDistance,
        unit,
        rewardRatio,
        leverage,
        referencePrice: price,
      }),
    [balance, riskMode, riskValue, stopDistance, unit, rewardRatio, leverage, price]
  )

  const stopPips = toPips(result.stopPrice)
  const tpPips = toPips(result.takeProfitPrice)

  /** Switching units converts the entered distance instead of reinterpreting it. */
  function changeUnit(next: DistanceUnit) {
    if (next === unit) return
    setStopDistance((d) =>
      next === 'usd' ? Math.round(d * PIP_SIZE * 100) / 100 : Math.round((d / PIP_SIZE) * 10) / 10
    )
    setUnit(next)
  }

  /** What the same stop would cost at a fixed 0.10 lot — the "I just guess" case. */
  const atPointOne = 0.1 * result.stopPrice * 100

  return (
    <div className="calc-page">
      <div className="calc-head">
        <nav className="landing-nav calc-nav">
          <Link className="nav-brand" to="/">
            <span className="nav-logo" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="var(--primary)" />
                <path d="M12 7 16.5 12 12 17 7.5 12 12 7Z" fill="var(--surface)" />
              </svg>
            </span>
            The Gold Plan
          </Link>
          <div className="landing-cta">
            <Link className="btn btn-ghost" to="/pricing">
              Pricing
            </Link>
            <Link className="btn btn-primary" to="/app?demo=1">
              Try demo
            </Link>
          </div>
        </nav>

        <div className="calc-hero">
          <div className="kicker">Free tool · no sign-up</div>
          <h1>XAUUSD lot size calculator</h1>
          <p className="landing-sub">
            Decide your stop and your risk first. The lot size is the answer, not the starting point.
            Everything below runs in your browser — nothing is sent anywhere.
          </p>
        </div>
      </div>

      <div className="calc-grid">
        {/* ── Inputs ─────────────────────────────────────── */}
        <section className="panel calc-inputs" aria-label="Calculator inputs">
          <div className="field">
            <label htmlFor="calc-balance">Account balance (USD)</label>
            <input
              id="calc-balance"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="100"
              value={balance}
              onChange={(e) => setBalance(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="field">
            <label>Risk per trade</label>
            <div className="seg calc-seg">
              <button
                type="button"
                className={`seg-btn ${riskMode === 'percent' ? 'active' : ''}`}
                onClick={() => setRiskMode('percent')}
              >
                % of balance
              </button>
              <button
                type="button"
                className={`seg-btn ${riskMode === 'fixed' ? 'active' : ''}`}
                onClick={() => setRiskMode('fixed')}
              >
                Fixed $
              </button>
            </div>
            <div className="calc-inline">
              <input
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                step={riskMode === 'percent' ? '0.25' : '5'}
                value={riskValue}
                onChange={(e) => setRiskValue(Math.max(0, Number(e.target.value) || 0))}
                aria-label={riskMode === 'percent' ? 'Risk percent' : 'Risk in dollars'}
              />
              <span className="calc-unit">{riskMode === 'percent' ? '%' : 'USD'}</span>
            </div>
            {riskMode === 'percent' && (
              <div className="calc-presets">
                {RISK_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`calc-chip ${riskValue === r ? 'active' : ''}`}
                    onClick={() => setRiskValue(r)}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label>Stop-loss distance</label>
            <div className="seg calc-seg">
              <button
                type="button"
                className={`seg-btn ${unit === 'pips' ? 'active' : ''}`}
                onClick={() => changeUnit('pips')}
              >
                Pips
              </button>
              <button
                type="button"
                className={`seg-btn ${unit === 'usd' ? 'active' : ''}`}
                onClick={() => changeUnit('usd')}
              >
                Price ($)
              </button>
            </div>
            <div className="calc-inline">
              <input
                className="input"
                type="number"
                inputMode="decimal"
                min="0"
                step={unit === 'pips' ? '1' : '0.5'}
                value={stopDistance}
                onChange={(e) => setStopDistance(Math.max(0, Number(e.target.value) || 0))}
                aria-label="Stop-loss distance"
              />
              <span className="calc-unit">{unit === 'pips' ? 'pips' : 'USD move'}</span>
            </div>
            <p className="calc-hint">
              1 pip on gold = {PIP_SIZE.toFixed(2)} in price. Enter the distance from entry to stop, not the
              stop price itself.
            </p>
          </div>

          <div className="field">
            <label htmlFor="calc-rr">Reward : risk</label>
            <input
              id="calc-rr"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={rewardRatio}
              onChange={(e) => setRewardRatio(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <details className="calc-advanced">
            <summary>Advanced (margin &amp; leverage)</summary>
            <div className="calc-adv-grid">
              <div className="field">
                <label htmlFor="calc-price">Current XAUUSD price</label>
                <input
                  id="calc-price"
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="field">
                <label htmlFor="calc-lev">Leverage</label>
                <select
                  id="calc-lev"
                  className="select"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                >
                  {[50, 100, 200, 500, 1000].map((l) => (
                    <option key={l} value={l}>
                      1:{l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </details>
        </section>

        {/* ── Output ─────────────────────────────────────── */}
        <section className="panel calc-output" aria-live="polite">
          <div className="calc-result-main">
            <div className="calc-result-label">Suggested lot size</div>
            <div className="calc-result-value">
              {fmtLots(result.lots)}
              <span className="calc-result-unit">lots</span>
            </div>
            {result.belowMinimum && (
              <div className="calc-warn">
                Your risk budget is too small for the {MIN_LOT} minimum lot on this stop. Either widen the
                account, tighten the stop, or accept {fmtUsd(atPointOne)} risk at {MIN_LOT} lots.
              </div>
            )}
          </div>

          <div className="calc-rows">
            <div className="calc-row">
              <span>Risk budget</span>
              <b>{fmtUsd(result.riskAmount)}</b>
            </div>
            <div className="calc-row">
              <span>Risk at stop</span>
              <b className={result.actualRisk > result.riskAmount + 0.01 ? 'red' : ''}>
                {fmtUsd(result.actualRisk)}
              </b>
            </div>
            <div className="calc-row">
              <span>Value per pip</span>
              <b>{fmtUsd(result.pipValue)}</b>
            </div>
            <div className="calc-row">
              <span>Stop distance</span>
              <b>
                {stopPips.toFixed(1)} pips · {fmtUsd(result.stopPrice)} in price
              </b>
            </div>
            <div className="calc-row">
              <span>Take profit at 1:{rewardRatio || 0}</span>
              <b className="green">
                {tpPips.toFixed(1)} pips · {fmtUsd(result.rewardAmount)}
              </b>
            </div>
            <div className="calc-row">
              <span>Margin required</span>
              <b>
                {fmtUsd(result.marginRequired)}
                <span className="muted"> ({result.marginPct.toFixed(1)}% of balance)</span>
              </b>
            </div>
            <div className="calc-row">
              <span>Full losses to zero</span>
              <b>{result.lossesToBlow > 0 ? `${result.lossesToBlow} in a row` : '—'}</b>
            </div>
          </div>

          <div className="calc-note">
            Rounded <b>down</b> to {MIN_LOT} so the position never exceeds your risk budget. Excludes spread,
            commission and slippage — confirm the final figure in your broker's terminal.
          </div>

          <div className="calc-cta">
            <h3>Now log it properly</h3>
            <p>
              A lot size is one decision. The Gold Plan records the trade, the setup and the emotion behind
              it — then shows you which of the three is costing you money.
            </p>
            <div className="calc-cta-actions">
              <Link className="btn btn-primary" to="/app?demo=1">
                Open the demo
              </Link>
              <Link className="btn btn-ghost" to="/pricing">
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Explanation — this is the SEO body ──────────── */}
      <section className="calc-explain">
        <h2>How the lot size is calculated</h2>
        <p>
          On XAUUSD one standard lot is 100 troy ounces, so a $1.00 move in the gold price is worth $100 per
          lot. That single fact drives the whole calculation:
        </p>
        <div className="calc-formula">
          lots = risk in dollars ÷ (stop distance in price × 100)
        </div>
        <p>
          A $1,000 account risking 1% has a $10 budget. With a 30-pip stop (a $3.00 price distance), the
          calculation is 10 ÷ (3 × 100) = 0.033 lots. Rounded down to the broker step, that is{' '}
          <b>0.03 lots</b> — and the real risk is $9, not $10.
        </p>

        <h2>Why the lot is rounded down, never up</h2>
        <p>
          Rounding 0.033 up to 0.04 quietly turns a 1% risk into a 1.2% risk. Do that on every trade and the
          account bleeds a fifth more than the plan says. Rounding down costs a few cents of potential profit
          and keeps the plan honest.
        </p>

        <h2>Why risk first, lot second</h2>
        <p>
          Most traders pick a lot size out of habit — 0.10, or whatever they used last time — then place the
          stop wherever the chart allows. That reverses the only part of the trade they actually control. On a
          $1,000 account, a 0.10 lot with a 30-pip stop risks $30: three times the intended budget, and three
          full losses in a row is 9% of the account gone.
        </p>
        <p>
          Sizing from risk means the stop is decided by the chart and the lot is decided by arithmetic. The
          chart stays honest and the account stays predictable.
        </p>

        <h2>What this calculator deliberately leaves out</h2>
        <ul>
          <li>
            <b>Spread and commission.</b> They widen the effective stop. On a 2-pip spread your real risk is
            slightly higher than shown.
          </li>
          <li>
            <b>Slippage.</b> Gold gaps through stops during news. Assume the fill is worse than the plan.
          </li>
          <li>
            <b>Correlated positions.</b> Two gold trades in the same direction are one risk, not two.
          </li>
        </ul>

        <h2>Common questions</h2>
        <h3>Is a pip on gold 0.01 or 0.10?</h3>
        <p>
          Brokers disagree, and both labels are in use. This calculator treats 1 pip as a $0.10 price move,
          which is the common convention. If your broker calls a $0.01 move a pip, set the unit to{' '}
          <b>Price ($)</b> and enter the distance directly — the result is identical because sizing only ever
          uses the price distance.
        </p>
        <h3>What lot size should I use on a $500 account?</h3>
        <p>
          At 1% risk that is a $5 budget. With a 30-pip stop the answer is 0.01 lots — the minimum. On a $500
          account, any stop wider than about 50 pips cannot be traded at 1% risk with a standard account. That
          is a signal to widen the account or tighten the setup, not to raise the risk.
        </p>
        <h3>Does leverage change the lot size?</h3>
        <p>
          No. Leverage changes the margin your broker locks, not the money you lose when the stop is hit. It
          only matters for whether the position fits in free margin — which is why it sits under Advanced.
        </p>

        <div className="calc-cta calc-cta-bottom">
          <h3>The calculator sizes one trade. The journal fixes the pattern.</h3>
          <p>
            Log the trade, the setup and your state of mind. The Gold Plan shows you which sessions and
            emotions are quietly costing you — before the account pays for it.
          </p>
          <div className="calc-cta-actions">
            <Link className="btn btn-primary" to="/app?demo=1">
              Explore the demo
            </Link>
            <Link className="btn btn-ghost" to="/help">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="nav-brand">The Gold Plan</span>
        <span className="landing-footer-note">thegoldplan.my — built for deliberate XAUUSD trading.</span>
        <span className="landing-footer-note">
          <Link to="/">Home</Link> · <Link to="/privacy">Privacy</Link>
        </span>
      </footer>
    </div>
  )
}
