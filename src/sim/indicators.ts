import type { Bar } from './types'

/** Titik indikator yang sejajar dengan bar (time = epoch saat). */
export interface Point {
  time: number
  value: number
}

export function sma(bars: Bar[], period: number): Point[] {
  if (period < 1 || bars.length < period) return []
  const out: Point[] = []
  let sum = 0
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].c
    if (i >= period) sum -= bars[i - period].c
    if (i >= period - 1) out.push({ time: bars[i].t, value: sum / period })
  }
  return out
}

export function ema(bars: Bar[], period: number): Point[] {
  if (period < 1 || bars.length < period) return []
  const k = 2 / (period + 1)
  const out: Point[] = []
  let prev = 0
  for (let i = 0; i < period; i++) prev += bars[i].c
  prev /= period
  out.push({ time: bars[period - 1].t, value: prev })
  for (let i = period; i < bars.length; i++) {
    prev = bars[i].c * k + prev * (1 - k)
    out.push({ time: bars[i].t, value: prev })
  }
  return out
}

export interface Bands {
  mid: Point[]
  upper: Point[]
  lower: Point[]
}

export function bollinger(bars: Bar[], period = 20, mult = 2): Bands {
  const mid: Point[] = []
  const upper: Point[] = []
  const lower: Point[] = []
  if (bars.length < period) return { mid, upper, lower }
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += bars[j].c
    const m = sum / period
    let variance = 0
    for (let j = i - period + 1; j <= i; j++) variance += (bars[j].c - m) ** 2
    const sd = Math.sqrt(variance / period)
    mid.push({ time: bars[i].t, value: m })
    upper.push({ time: bars[i].t, value: m + mult * sd })
    lower.push({ time: bars[i].t, value: m - mult * sd })
  }
  return { mid, upper, lower }
}

/** RSI Wilder. */
export function rsi(bars: Bar[], period = 14): Point[] {
  if (bars.length <= period) return []
  const out: Point[] = []
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const d = bars[i].c - bars[i - 1].c
    if (d >= 0) gain += d
    else loss -= d
  }
  gain /= period
  loss /= period
  const push = (i: number) => {
    const rs = loss === 0 ? 100 : gain / loss
    out.push({ time: bars[i].t, value: loss === 0 ? 100 : 100 - 100 / (1 + rs) })
  }
  push(period)
  for (let i = period + 1; i < bars.length; i++) {
    const d = bars[i].c - bars[i - 1].c
    const g = d > 0 ? d : 0
    const l = d < 0 ? -d : 0
    gain = (gain * (period - 1) + g) / period
    loss = (loss * (period - 1) + l) / period
    push(i)
  }
  return out
}

/** High/low hari penuh terakhir sebelum bar terakhir (PDH/PDL). */
export function prevDayLevels(bars: Bar[]): { high: number; low: number; day: string } | null {
  if (bars.length < 2) return null
  const dayOf = (t: number) => new Date(t * 1000).toISOString().slice(0, 10)
  const lastDay = dayOf(bars[bars.length - 1].t)
  let hi = -Infinity
  let lo = Infinity
  let day = ''
  for (let i = bars.length - 1; i >= 0; i--) {
    const d = dayOf(bars[i].t)
    if (d === lastDay) continue
    if (day && d !== day) break
    day = d
    if (bars[i].h > hi) hi = bars[i].h
    if (bars[i].l < lo) lo = bars[i].l
  }
  if (!day) return null
  return { high: hi, low: lo, day }
}
