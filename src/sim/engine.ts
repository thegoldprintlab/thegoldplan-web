import type { Bar, ClosedTrade, Position, Side } from './types'

/** XAUUSD: 1 lot = 100 oz → pergerakan $1 = $100 per lot. */
export const CONTRACT = 100
export const LEVERAGE = 500

export function pnlOf(side: Side, entry: number, exit: number, lots: number): number {
  const diff = side === 'BUY' ? exit - entry : entry - exit
  return diff * CONTRACT * lots
}

export function marginOf(price: number, lots: number): number {
  return (price * CONTRACT * lots) / LEVERAGE
}

export function floating(positions: Position[], price: number): number {
  return positions.reduce((a, p) => a + pnlOf(p.side, p.entry, price, p.lots), 0)
}

export function usedMargin(positions: Position[], price: number): number {
  return positions.reduce((a, p) => a + marginOf(p.entry || price, p.lots), 0)
}

export interface Fill {
  position: Position
  trade?: ClosedTrade
  reason?: ClosedTrade['reason']
}

/**
 * Periksa SL/TP untuk satu bar baru.
 * Kaedah konservatif: kalau SL dan TP dua-dua kena dalam bar yang sama,
 * anggap SL yang kena dahulu.
 */
export function evaluateBar(pos: Position, bar: Bar): { exit: number; reason: ClosedTrade['reason'] } | null {
  if (pos.side === 'BUY') {
    if (pos.sl != null && bar.l <= pos.sl) return { exit: pos.sl, reason: 'SL' }
    if (pos.tp != null && bar.h >= pos.tp) return { exit: pos.tp, reason: 'TP' }
  } else {
    if (pos.sl != null && bar.h >= pos.sl) return { exit: pos.sl, reason: 'SL' }
    if (pos.tp != null && bar.l <= pos.tp) return { exit: pos.tp, reason: 'TP' }
  }
  return null
}

export function closeTrade(pos: Position, exit: number, exitTime: number, reason: ClosedTrade['reason']): ClosedTrade {
  return { ...pos, exit, exitTime, pnl: pnlOf(pos.side, pos.entry, exit, pos.lots), reason }
}

/** Set semula harga SL/TP ikut jarak "dalam harga" (bukan pip). */
export function withStops(side: Side, entry: number, slDist: number, tpDist: number): { sl: number | null; tp: number | null } {
  const sign = side === 'BUY' ? 1 : -1
  return {
    sl: slDist > 0 ? round2(entry - sign * slDist) : null,
    tp: tpDist > 0 ? round2(entry + sign * tpDist) : null,
  }
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100
}

export function fmtMoney(v: number): string {
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${v < 0 ? '-' : ''}$${s}`
}
