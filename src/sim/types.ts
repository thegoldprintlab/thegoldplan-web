/** Simulator domain types. */

export type TF = 1 | 5 | 15 | 60 | 240 | 1440

export interface Bar {
  /** epoch seconds (bar open time, UTC) */
  t: number
  o: number
  h: number
  l: number
  c: number
}

export interface MonthPayload {
  symbol: string
  tf: number
  start: number
  bars: string
}

export interface Manifest {
  symbol: string
  tf: number
  months: string[]
  from: string
  to: string
  bars: number
}

export type Side = 'BUY' | 'SELL'

export interface Position {
  id: number
  side: Side
  lots: number
  entry: number
  sl: number | null
  tp: number | null
  openTime: number
  openIndex: number
}

export interface ClosedTrade extends Position {
  exit: number
  exitTime: number
  pnl: number
  reason: 'SL' | 'TP' | 'MANUAL'
}
