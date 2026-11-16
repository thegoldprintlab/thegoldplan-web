/**
 * Lot sizing for XAUUSD — pure functions, no React, no network.
 *
 * Gold convention used here: 1 standard lot = 100 troy oz, so a $1.00 move in
 * price is worth $100 per lot. One "pip" on gold is 0.10 in price, so a pip is
 * worth $10 per lot. Brokers disagree on this; the maths below is expressed in
 * price distance and only *labels* the pip equivalent, so the numbers stay
 * correct no matter which convention a broker prints.
 */

/** Troy ounces per standard lot. */
export const CONTRACT_SIZE = 100

/** Price distance that one gold "pip" represents. */
export const PIP_SIZE = 0.1

/** Smallest volume most XAUUSD brokers accept. */
export const MIN_LOT = 0.01

export type RiskMode = 'percent' | 'fixed'
export type DistanceUnit = 'usd' | 'pips'

export interface LotInput {
  balance: number
  riskMode: RiskMode
  /** Percent of balance, or a fixed dollar amount, depending on riskMode. */
  riskValue: number
  /** Stop-loss distance, in `unit`. */
  stopDistance: number
  unit: DistanceUnit
  /** Reward-to-risk multiple for the take-profit. */
  rewardRatio: number
  leverage: number
  /** Current XAUUSD price — used for margin only, not for sizing. */
  referencePrice?: number
  contractSize?: number
}

export interface LotResult {
  /** Dollar amount the trader is willing to lose on this trade. */
  riskAmount: number
  /** Stop distance converted to price. */
  stopPrice: number
  /** Exact, unrounded lot size. */
  rawLots: number
  /** Volume that fits the risk budget, rounded DOWN to the broker step. */
  lots: number
  /** True when the risk budget is too small for even the minimum lot. */
  belowMinimum: boolean
  /** Real money at risk once the lot is rounded to the broker step. */
  actualRisk: number
  /** Dollars per pip at the rounded lot size. */
  pipValue: number
  /** Take-profit distance in price. */
  takeProfitPrice: number
  /** Take-profit distance in dollars of profit at the rounded lot. */
  rewardAmount: number
  /** Margin locked at the given leverage. */
  marginRequired: number
  /** Margin as a percentage of balance. */
  marginPct: number
  /** Consecutive full losses that would empty the account at this risk. */
  lossesToBlow: number
}

function safe(n: number, fallback = 0): number {
  return Number.isFinite(n) ? n : fallback
}

/** Round a lot DOWN to the broker step. Never round up — that breaches the risk budget. */
export function roundLotsDown(lots: number, step = MIN_LOT): number {
  if (!Number.isFinite(lots) || lots <= 0) return 0
  const steps = Math.floor(lots / step + 1e-9)
  return Math.round(steps * step * 100) / 100
}

export function toPriceDistance(value: number, unit: DistanceUnit): number {
  return unit === 'pips' ? safe(value) * PIP_SIZE : safe(value)
}

export function toPips(priceDistance: number): number {
  return safe(priceDistance) / PIP_SIZE
}

export function calculateLot(input: LotInput): LotResult {
  const contract = input.contractSize && input.contractSize > 0 ? input.contractSize : CONTRACT_SIZE
  const balance = Math.max(0, safe(input.balance))
  const leverage = input.leverage > 0 ? input.leverage : 100

  const riskAmount =
    input.riskMode === 'percent'
      ? (balance * Math.max(0, safe(input.riskValue))) / 100
      : Math.max(0, safe(input.riskValue))

  const stopPrice = toPriceDistance(input.stopDistance, input.unit)

  // lots = risk / (stop in price × contract size)
  const rawLots = stopPrice > 0 ? riskAmount / (stopPrice * contract) : 0
  const lots = roundLotsDown(rawLots)
  const belowMinimum = rawLots > 0 && lots < MIN_LOT

  const actualRisk = lots * stopPrice * contract
  const pipValue = lots * PIP_SIZE * contract
  const rewardRatio = Math.max(0, safe(input.rewardRatio))
  const takeProfitPrice = stopPrice * rewardRatio
  const rewardAmount = actualRisk * rewardRatio

  // Margin is quoted on notional at the reference price. Sizing above never
  // depends on price — only the margin figure does.
  const refPrice = safe(input.referencePrice ?? 0)
  const marginRequired = marginFor(lots, refPrice, leverage, contract)
  const marginPct = balance > 0 ? (marginRequired / balance) * 100 : 0

  const perLoss = balance > 0 ? actualRisk / balance : 0
  const lossesToBlow = perLoss > 0 ? Math.floor(1 / perLoss) : 0

  return {
    riskAmount,
    stopPrice,
    rawLots,
    lots,
    belowMinimum,
    actualRisk,
    pipValue,
    takeProfitPrice,
    rewardAmount,
    marginRequired,
    marginPct,
    lossesToBlow,
  }
}

/** Margin locked for a position at `price`. */
export function marginFor(lots: number, price: number, leverage: number, contractSize = CONTRACT_SIZE): number {
  if (lots <= 0 || price <= 0 || leverage <= 0) return 0
  return (price * contractSize * lots) / leverage
}

export function fmtUsd(v: number, digits = 2): string {
  const sign = v < 0 ? '-' : ''
  return `${sign}$${Math.abs(safe(v)).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function fmtLots(v: number): string {
  return safe(v).toFixed(2)
}
