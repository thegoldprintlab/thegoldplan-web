/**
 * Trading Plan Generator — math core.
 *
 * Takes the user's real journal trades, derives per-trade R multiples
 * (pnl normalized by the account's typical losing trade), then runs a
 * Monte Carlo of fixed-fraction-risk paths to answer:
 *   "Is my target realistic, and what does the plan look like?"
 *
 * No hardcoded win rates. Everything comes from the journal.
 */

export interface PlanStats {
  n: number
  wins: number
  losses: number
  /** 0..100 */
  winRate: number
  avgWin: number
  avgLoss: number
  expectancy: number
  /** $ per trade the account typically risks (median absolute loss). */
  riskUnit: number
  /** Per-trade R multiples (pnl / riskUnit), in chronological order. */
  rs: number[]
  maxConsecLosses: number
  /** Historical trade frequency (trades per active day). */
  tradesPerDay: number
  /** True when riskUnit had to be estimated from wins (no losing trades yet). */
  rsEstimated: boolean
}

export interface PlanInput {
  balance: number
  /** Profit target as % of balance (e.g. 20 for +20%). */
  targetPct: number
  /** Risk per trade as % of current balance (e.g. 1). */
  riskPct: number
  /** Ruin threshold: max drawdown from start, % (e.g. 10). */
  maxDdPct: number
  /** Maximum trades in the plan horizon. */
  maxTrades: number
  /** Calendar days the trader gives themselves (e.g. 30). */
  horizonDays: number
  paths: number
}

export interface PlanResult {
  probTarget: number
  probRuin: number
  probNeither: number
  /** Median trades needed to reach target among successful paths. */
  medianTradesToTarget: number | null
  /** Median trades per day to finish in time. */
  tradesPerDayNeeded: number | null
  /** Median worst drawdown seen along the way, %. */
  medianMaxDd: number
  /** Median longest losing streak along the way. */
  medianLossStreak: number
  verdict: 'realistic' | 'stretch' | 'unrealistic'
}

export type MinimalTrade = {
  profit_loss: number
  trade_date: string
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Deterministic PRNG so results are reproducible for a given seed. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function computeStats(trades: MinimalTrade[]): PlanStats | null {
  const closed = trades.filter((t) => Number.isFinite(t.profit_loss) && t.profit_loss !== 0)
  if (closed.length === 0) return null

  const wins = closed.filter((t) => t.profit_loss > 0)
  const losses = closed.filter((t) => t.profit_loss < 0)

  const lossSizes = losses.map((t) => Math.abs(t.profit_loss))
  const avgWin = wins.length ? wins.reduce((a, t) => a + t.profit_loss, 0) / wins.length : 0
  const avgLoss = lossSizes.length ? lossSizes.reduce((a, b) => a + b, 0) / lossSizes.length : 0

  let riskUnit = median(lossSizes)
  let rsEstimated = false
  if (riskUnit <= 0) {
    // No losing trades yet: treat an average win as roughly 1R.
    riskUnit = avgWin > 0 ? avgWin : 1
    rsEstimated = true
  }

  const rs = closed.map((t) => t.profit_loss / riskUnit)

  let streak = 0
  let maxStreak = 0
  for (const t of closed) {
    if (t.profit_loss < 0) {
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 0
    }
  }

  const days = new Set(closed.map((t) => t.trade_date)).size || 1

  return {
    n: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: (wins.length / closed.length) * 100,
    avgWin,
    avgLoss,
    expectancy: closed.reduce((a, t) => a + t.profit_loss, 0) / closed.length,
    riskUnit,
    rs,
    maxConsecLosses: maxStreak,
    tradesPerDay: closed.length / days,
    rsEstimated,
  }
}

export function simulatePlan(stats: PlanStats, input: PlanInput, seed = 20261119): PlanResult {
  const { rs } = stats
  const paths = Math.max(1, Math.floor(input.paths))
  const maxTrades = Math.max(1, Math.floor(input.maxTrades))
  const target = input.balance * (1 + input.targetPct / 100)
  const floor = input.balance * (1 - input.maxDdPct / 100)
  const frac = input.riskPct / 100

  const rnd = mulberry32(seed)
  let hit = 0
  let ruined = 0
  const tradesToTarget: number[] = []
  const maxDds: number[] = []
  const lossStreaks: number[] = []

  for (let p = 0; p < paths; p++) {
    let equity = input.balance
    let peak = equity
    let maxDd = 0
    let streak = 0
    let maxStreak = 0
    let outcome: 'none' | 'target' | 'ruin' = 'none'

    for (let i = 0; i < maxTrades; i++) {
      const r = rs[Math.floor(rnd() * rs.length)]
      equity *= 1 + frac * r
      if (equity > peak) peak = equity
      const dd = ((peak - equity) / peak) * 100
      if (dd > maxDd) maxDd = dd
      if (r < 0) {
        streak += 1
        if (streak > maxStreak) maxStreak = streak
      } else {
        streak = 0
      }
      if (equity >= target) {
        outcome = 'target'
        tradesToTarget.push(i + 1)
        break
      }
      if (equity <= floor) {
        outcome = 'ruin'
        break
      }
    }

    if (outcome === 'target') hit += 1
    else if (outcome === 'ruin') ruined += 1
    maxDds.push(maxDd)
    lossStreaks.push(maxStreak)
  }

  const probTarget = (hit / paths) * 100
  const probRuin = (ruined / paths) * 100
  const medianTrades = tradesToTarget.length ? median(tradesToTarget) : null

  const verdict: PlanResult['verdict'] = probTarget >= 60 ? 'realistic' : probTarget >= 35 ? 'stretch' : 'unrealistic'

  return {
    probTarget,
    probRuin,
    probNeither: 100 - probTarget - probRuin,
    medianTradesToTarget: medianTrades,
    tradesPerDayNeeded: medianTrades !== null ? medianTrades / Math.max(1, input.horizonDays) : null,
    medianMaxDd: median(maxDds),
    medianLossStreak: median(lossStreaks),
    verdict,
  }
}
