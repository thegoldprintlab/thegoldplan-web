/**
 * Challenge mode for the replay simulator.
 *
 * A prop-firm style rule set layered on top of a replay session: profit target,
 * maximum loss, daily loss limit and a trade cap. It exists to make practice
 * *finite* — a replay with no stopping condition teaches nothing about
 * discipline, because discipline is only ever tested by a limit.
 *
 * Everything here is pure except the localStorage helpers at the bottom.
 */

import type { ClosedTrade } from './types'

export interface ChallengeRules {
  enabled: boolean
  /** Profit target as a percent of the starting balance. */
  targetPct: number
  /** Maximum total loss as a percent of the starting balance. */
  maxLossPct: number
  /** Maximum loss allowed inside one calendar day, as a percent of start balance. */
  dailyLossPct: number
  /** Maximum closed trades per calendar day. 0 = unlimited. */
  maxTradesPerDay: number
  /** Minimum trading days before the target counts. 0 = none. */
  minDays: number
}

export type ChallengeStatus = 'idle' | 'active' | 'passed' | 'failed'

export interface ChallengeState {
  status: ChallengeStatus
  /** Why it failed, when it did. */
  failReason: string | null
}

export interface ChallengeProgress {
  status: ChallengeStatus
  failReason: string | null
  startBalance: number
  equity: number
  netPnl: number
  /** Percent of the profit target reached (can exceed 100). */
  targetPct: number
  /** Profit still needed in dollars. 0 when reached. */
  toTarget: number
  /** Dollars of room left before the max-loss rule trips. */
  lossRoom: number
  /** Percent of the loss allowance already used. */
  lossUsedPct: number
  /** Today's realised P&L and the room left on the daily limit. */
  dayPnl: number
  dayLossRoom: number
  dayTrades: number
  dayTradesLeft: number
  daysTraded: number
  /** True when a rule is currently breached — the ticket must be locked. */
  breached: boolean
  /** True when today's trade cap is used up (a lock, not a failure). */
  capReached: boolean
  /** Human-readable rules that are close to being hit. */
  warnings: string[]
}

export const DEFAULT_RULES: ChallengeRules = {
  enabled: false,
  targetPct: 8,
  maxLossPct: 10,
  dailyLossPct: 5,
  maxTradesPerDay: 3,
  minDays: 0,
}

const KEY = 'gp-sim-challenge'

export function loadRules(): ChallengeRules {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_RULES
    const p = JSON.parse(raw) as Partial<ChallengeRules>
    return {
      enabled: Boolean(p.enabled),
      targetPct: num(p.targetPct, DEFAULT_RULES.targetPct),
      maxLossPct: num(p.maxLossPct, DEFAULT_RULES.maxLossPct),
      dailyLossPct: num(p.dailyLossPct, DEFAULT_RULES.dailyLossPct),
      maxTradesPerDay: Math.max(0, Math.floor(num(p.maxTradesPerDay, DEFAULT_RULES.maxTradesPerDay))),
      minDays: Math.max(0, Math.floor(num(p.minDays, DEFAULT_RULES.minDays))),
    }
  } catch {
    return DEFAULT_RULES
  }
}

export function saveRules(r: ChallengeRules) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* storage disabled — rules simply do not persist */
  }
}

function num(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/** UTC day key for a bar timestamp (seconds). */
export function dayKey(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10)
}

/**
 * Evaluate the challenge against closed trades.
 *
 * `equity` is the live equity (balance + floating) so an open loser can trip the
 * loss rule before it is closed — the same way a real account would.
 */
export function evaluateChallenge(
  rules: ChallengeRules,
  startBalance: number,
  equity: number,
  closed: ClosedTrade[],
  currentTs: number | null
): ChallengeProgress {
  const target = (startBalance * rules.targetPct) / 100
  const maxLoss = (startBalance * rules.maxLossPct) / 100
  const dailyLoss = (startBalance * rules.dailyLossPct) / 100

  const netPnl = equity - startBalance
  const toTarget = Math.max(0, target - netPnl)
  const lossRoom = Math.max(0, maxLoss + Math.min(0, netPnl))
  const lossUsedPct = maxLoss > 0 ? Math.min(100, (Math.max(0, -netPnl) / maxLoss) * 100) : 0

  // Group realised P&L by UTC day.
  const byDay = new Map<string, { pnl: number; trades: number }>()
  for (const t of closed) {
    const k = dayKey(t.exitTime)
    const row = byDay.get(k) ?? { pnl: 0, trades: 0 }
    row.pnl += t.pnl
    row.trades += 1
    byDay.set(k, row)
  }

  const today = currentTs != null ? dayKey(currentTs) : null
  const todayRow = today ? byDay.get(today) : undefined
  const dayPnl = todayRow?.pnl ?? 0
  const dayTrades = todayRow?.trades ?? 0
  const dayLossRoom = Math.max(0, dailyLoss + Math.min(0, dayPnl))
  const dayTradesLeft =
    rules.maxTradesPerDay > 0 ? Math.max(0, rules.maxTradesPerDay - dayTrades) : Infinity

  const daysTraded = byDay.size

  let status: ChallengeStatus = 'idle'
  let failReason: string | null = null

  // Hitting the daily trade cap is a lock for the rest of that day, not a
  // failure — a real evaluation stops you for the day and lets you return.
  const capReached = rules.maxTradesPerDay > 0 && dayTrades >= rules.maxTradesPerDay

  if (rules.enabled) {
    if (netPnl <= -maxLoss) {
      status = 'failed'
      failReason = `Max loss hit — ${fmtPct(rules.maxLossPct)} of the starting balance.`
    } else if (dayPnl <= -dailyLoss) {
      status = 'failed'
      failReason = `Daily loss limit hit — ${fmtPct(rules.dailyLossPct)} in one day.`
    } else if (netPnl >= target) {
      if (daysTraded >= rules.minDays) {
        status = 'passed'
      } else {
        status = 'active'
      }
    } else {
      status = 'active'
    }
  }

  const warnings: string[] = []
  if (capReached && status === 'active') {
    warnings.push(
      `Daily trade cap reached — ${rules.maxTradesPerDay} trade${rules.maxTradesPerDay === 1 ? '' : 's'}. Resume on the next trading day.`
    )
  }
  if (status === 'active') {
    if (lossUsedPct >= 60) warnings.push(`Loss allowance ${Math.round(lossUsedPct)}% used.`)
    if (dailyLoss > 0 && dayPnl < 0 && Math.abs(dayPnl) / dailyLoss >= 0.6) {
      warnings.push(`Today's loss is ${Math.round((Math.abs(dayPnl) / dailyLoss) * 100)}% of the daily limit.`)
    }
    if (rules.maxTradesPerDay > 0 && dayTradesLeft === 1 && !capReached) {
      warnings.push('One trade left on today\'s cap.')
    }
    if (toTarget === 0 && daysTraded < rules.minDays) {
      warnings.push(`Target reached — ${rules.minDays - daysTraded} more trading day(s) required.`)
    }
  }

  return {
    status,
    failReason,
    startBalance,
    equity,
    netPnl,
    targetPct: target > 0 ? (Math.max(0, netPnl) / target) * 100 : 0,
    toTarget,
    lossRoom,
    lossUsedPct,
    dayPnl,
    dayLossRoom,
    dayTrades,
    dayTradesLeft,
    daysTraded,
    capReached,
    breached: status === 'failed' || capReached,
    warnings,
  }
}

function fmtPct(v: number): string {
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`
}

/** A short one-line verdict for the header chip. */
export function statusLabel(p: ChallengeProgress): string {
  switch (p.status) {
    case 'passed':
      return 'Challenge passed'
    case 'failed':
      return 'Challenge failed'
    case 'active':
      return 'Challenge running'
    default:
      return 'No challenge'
  }
}
