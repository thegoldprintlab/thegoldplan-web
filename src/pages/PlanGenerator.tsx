import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import UpgradeGate from '../components/UpgradeGate'
import { computeStats, simulatePlan, type PlanStats, type PlanResult } from '../lib/tradingPlan'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { fmtMoney } from '../lib/stats'

const VERDICT_COPY: Record<PlanResult['verdict'], { head: string; body: string; cls: string }> = {
  realistic: {
    head: 'This plan holds up.',
    body: 'Your journal numbers support this target at this risk level. Expect the drawdowns listed below on the way.',
    cls: 'plan-verdict-ok',
  },
  stretch: {
    head: 'This plan is possible, but tight.',
    body: 'The edge is there, but the margin is thin. A wider horizon or a smaller target makes it sturdier.',
    cls: 'plan-verdict-mid',
  },
  unrealistic: {
    head: 'This plan fights your numbers.',
    body: 'At your win rate and R profile, most paths miss the target or hit the drawdown cap first. Lower the target, widen the horizon, or reduce risk per trade.',
    cls: 'plan-verdict-bad',
  },
}

export default function PlanGenerator() {
  const { trades } = useData()
  const { session, isDemo } = useAuth()

  const [balance, setBalance] = useState('1000')
  const [targetPct, setTargetPct] = useState('20')
  const [riskPct, setRiskPct] = useState('1')
  const [maxDdPct, setMaxDdPct] = useState('10')
  const [horizonDays, setHorizonDays] = useState('30')
  const [result, setResult] = useState<PlanResult | null>(null)
  const [stats, setStats] = useState<PlanStats | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const balanceN = parseFloat(balance)
  const targetN = parseFloat(targetPct)
  const riskN = parseFloat(riskPct)
  const maxDdN = parseFloat(maxDdPct)
  const horizonN = parseInt(horizonDays, 10)
  const inputsValid =
    Number.isFinite(balanceN) && balanceN > 0 &&
    Number.isFinite(targetN) && targetN > 0 &&
    Number.isFinite(riskN) && riskN > 0 && riskN <= 10 &&
    Number.isFinite(maxDdN) && maxDdN > 0 &&
    Number.isFinite(horizonN) && horizonN > 0 && horizonN <= 365

  const statsPreview = useMemo(() => computeStats(trades), [trades])

  function generate() {
    setError('')
    setSavedMsg('')
    if (!statsPreview) {
      setError('Add a few closed trades to your journal first. The generator needs real results to work from.')
      return
    }
    if (!inputsValid) {
      setError('Check the inputs: balance, target, risk and drawdown must be positive numbers (risk up to 10%).')
      return
    }
    const maxTrades = Math.max(20, Math.min(400, Math.round(statsPreview.tradesPerDay * horizonN)))
    const r = simulatePlan(
      statsPreview,
      { balance: balanceN, targetPct: targetN, riskPct: riskN, maxDdPct: maxDdN, maxTrades, horizonDays: horizonN, paths: 400 },
    )
    setStats(statsPreview)
    setResult(r)
  }

  async function savePlan() {
    if (!result || !stats || isDemo) return
    if (!isSupabaseConfigured() || !session?.user) return
    setSaving(true)
    setSavedMsg('')
    try {
      const sb = getSupabase()
      const { error: e } = await sb.from('trading_plans').insert({
        user_id: session.user.id,
        balance: balanceN,
        target_pct: targetN,
        risk_pct: riskN,
        max_dd_pct: maxDdN,
        horizon_days: horizonN,
        result: { ...result, stats: { n: stats.n, winRate: stats.winRate, expectancy: stats.expectancy, riskUnit: stats.riskUnit } },
      })
      if (e) throw e
      setSavedMsg('Plan saved to your account.')
    } catch (err) {
      setSavedMsg('')
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const v = result ? VERDICT_COPY[result.verdict] : null

  return (
    <UpgradeGate feature="Trading Plan">
      <div className="page-head">
        <h1>Trading Plan</h1>
        <p className="page-sub">
          Your target, checked against your own journal. No generic win rates, no hype.
        </p>
      </div>

      <div className="panel">
        <p className="muted" style={{ marginBottom: 18, fontSize: '0.88rem' }}>
          The generator reads your closed trades, measures your real win rate and average result, then runs
          400 simulated paths at your risk level. It answers one question: can this plan survive your own
          trading behaviour?
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="plan-balance">Starting balance ($)</label>
            <input id="plan-balance" type="number" min="1" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="plan-target">Profit target (% of balance)</label>
            <input id="plan-target" type="number" min="0.1" step="0.5" value={targetPct} onChange={(e) => setTargetPct(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="plan-risk">Risk per trade (% of balance)</label>
            <input id="plan-risk" type="number" min="0.1" step="0.1" max="10" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="plan-dd">Max drawdown before you stop (%)</label>
            <input id="plan-dd" type="number" min="0.5" step="0.5" value={maxDdPct} onChange={(e) => setMaxDdPct(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="plan-horizon">Horizon (days)</label>
            <input id="plan-horizon" type="number" min="1" max="365" value={horizonDays} onChange={(e) => setHorizonDays(e.target.value)} />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button className="btn btn-primary" onClick={generate}>Generate plan</button>
          </div>
        </div>
        {error && <p className="plan-error" role="alert">{error}</p>}
      </div>

      {stats && (
        <div className="panel">
          <h2 className="plan-h2">Your journal, measured</h2>
          <div className="plan-stats-grid">
            <div><span className="plan-stat-label">Closed trades</span><span className="plan-stat-val">{stats.n}</span></div>
            <div><span className="plan-stat-label">Win rate</span><span className="plan-stat-val">{stats.winRate.toFixed(0)}%</span></div>
            <div><span className="plan-stat-label">Avg win</span><span className="plan-stat-val">{fmtMoney(stats.avgWin)}</span></div>
            <div><span className="plan-stat-label">Avg loss</span><span className="plan-stat-val">{fmtMoney(-stats.avgLoss)}</span></div>
            <div><span className="plan-stat-label">Expectancy / trade</span><span className="plan-stat-val">{fmtMoney(stats.expectancy)}</span></div>
            <div><span className="plan-stat-label">Worst losing streak</span><span className="plan-stat-val">{stats.maxConsecLosses}</span></div>
          </div>
          {stats.rsEstimated && (
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: 10 }}>
              No losing trades in the journal yet, so the risk unit is estimated from average wins. Results will sharpen once you log a few losses.
            </p>
          )}
        </div>
      )}

      {result && v && (
        <div className={`panel plan-result ${v.cls}`}>
          <h2 className="plan-h2">{v.head}</h2>
          <p>{v.body}</p>
          <div className="plan-stats-grid">
            <div><span className="plan-stat-label">Reach the target</span><span className="plan-stat-val">{result.probTarget.toFixed(0)}%</span></div>
            <div><span className="plan-stat-label">Hit the drawdown cap first</span><span className="plan-stat-val">{result.probRuin.toFixed(0)}%</span></div>
            <div><span className="plan-stat-label">Trades needed (median)</span><span className="plan-stat-val">{result.medianTradesToTarget ?? 'Not reached'}</span></div>
            <div><span className="plan-stat-label">Trades per day needed</span><span className="plan-stat-val">{result.tradesPerDayNeeded !== null ? result.tradesPerDayNeeded.toFixed(1) : 'n/a'}</span></div>
            <div><span className="plan-stat-label">Typical worst drawdown</span><span className="plan-stat-val">{result.medianMaxDd.toFixed(1)}%</span></div>
            <div><span className="plan-stat-label">Typical losing streak</span><span className="plan-stat-val">{result.medianLossStreak.toFixed(0)} trades</span></div>
          </div>
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: 14 }}>
            Method: your past trade results are resampled (bootstrap) into 400 simulated paths with compounding
            at your risk level, before costs such as spread and commission. Percentages are estimates, not guarantees.
          </p>
          <div className="plan-sheet">
            <h3 className="plan-h3">Your plan, on one line</h3>
            <p className="plan-sheet-line">
              Trade {fmtMoney(balanceN)} toward +{targetN}% at {riskN}% risk per trade, stop for good at
              {' '}{maxDdN}% drawdown. Expect about {result.medianTradesToTarget ?? 'more trades than the horizon allows'} entries and a
              {' '}{result.medianLossStreak.toFixed(0)}-trade losing streak along the way.
            </p>
          </div>
          {!isDemo && (
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={savePlan} disabled={saving}>{saving ? 'Saving...' : 'Save this plan'}</button>
              {savedMsg && <span className="muted" style={{ marginLeft: 12, fontSize: '0.85rem' }}>{savedMsg}</span>}
            </div>
          )}
        </div>
      )}
    </UpgradeGate>
  )
}
