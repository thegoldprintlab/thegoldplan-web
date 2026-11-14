import type { ClosedTrade } from './types'

/**
 * Simpanan sesi simulator.
 *
 * Lapisan 1 (selalu jalan): localStorage — sesi kekal walaupun table Supabase
 * belum dicipta (lihat supabase/simulator.sql). Ini yang buat butang "Save
 * session" berguna pada hari pertama.
 *
 * Lapisan 2 (bila ada): Supabase sim_sessions + sim_trades, untuk sync antara
 * peranti dan untuk analitik dalam journal.
 */

const KEY = 'gp-sim-sessions'
const MAX = 40

export interface SavedSession {
  id: string
  savedAt: number
  symbol: string
  month: string
  tf: number
  startBalance: number
  endBalance: number
  trades: number
  netPnl: number
  maxDrawdown: number
  marginCalls: number
  /** ringkasan trade (maks 200) untuk papar semula */
  rows: Pick<ClosedTrade, 'side' | 'lots' | 'entry' | 'exit' | 'pnl' | 'reason' | 'openTime' | 'exitTime'>[]
}

export function readSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as SavedSession[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function writeSession(s: SavedSession): SavedSession[] {
  const all = [s, ...readSessions()].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* kuota penuh — abaikan, Supabase masih ada */
  }
  return all
}

export function drawdownOf(closed: ClosedTrade[], startBalance: number): number {
  let peak = startBalance
  let run = startBalance
  let dd = 0
  for (const t of [...closed].reverse()) {
    run += t.pnl
    peak = Math.max(peak, run)
    dd = Math.max(dd, peak - run)
  }
  return dd
}
