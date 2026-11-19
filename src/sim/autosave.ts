/**
 * Auto-persist the live replay session so a page refresh continues where the
 * user left off, instead of starting a new random month.
 *
 * Deliberately separate from the named SavedSession list (sessions.ts): this
 * is the single silent "resume" slot, written automatically on every session
 * state change. A reset (new month / random jump) overwrites it with the
 * fresh state, which is exactly what "start baru" means.
 */

import type { ClosedTrade, Position, TF } from './types'

const KEY = 'gp-sim-live'

export interface LiveSession {
  v: 1
  month: string
  tf: TF
  cursor: number
  balance: number
  positions: Position[]
  closed: ClosedTrade[]
  seq: number
  marginCall: boolean
  savedAt: number
}

const VALID_TF: TF[] = [1, 5, 15, 60, 240, 1440]

/** Read the resume slot. Returns null when absent, corrupt, or an old shape. */
export function loadLive(): LiveSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as LiveSession
    if (p?.v !== 1) return null
    if (typeof p.month !== 'string' || !/^\d{4}-\d{2}$/.test(p.month)) return null
    if (!VALID_TF.includes(p.tf)) return null
    if (!Number.isInteger(p.cursor) || p.cursor < 0) return null
    if (!Number.isFinite(p.balance) || p.balance <= 0) return null
    if (!Array.isArray(p.positions) || !Array.isArray(p.closed)) return null
    return p
  } catch {
    return null
  }
}

/** Write the resume slot. Storage disabled: the session simply does not persist. */
export function saveLive(s: Omit<LiveSession, 'v' | 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, v: 1, savedAt: Date.now() }))
  } catch {
    /* ignore */
  }
}
