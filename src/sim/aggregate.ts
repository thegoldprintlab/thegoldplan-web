import type { Bar, TF } from './types'

/** Agregasi M1 -> timeframe lebih tinggi. Bar output guna waktu buka bar pertama. */
export function aggregate(m1: Bar[], tf: TF): Bar[] {
  if (tf === 1) return m1
  const secs = tf * 60
  const out: Bar[] = []
  let cur: Bar | null = null
  let bucket = -1
  for (const b of m1) {
    const k = Math.floor(b.t / secs) * secs
    if (k !== bucket) {
      if (cur) out.push(cur)
      bucket = k
      cur = { t: k, o: b.o, h: b.h, l: b.l, c: b.c }
    } else if (cur) {
      if (b.h > cur.h) cur.h = b.h
      if (b.l < cur.l) cur.l = b.l
      cur.c = b.c
    }
  }
  if (cur) out.push(cur)
  return out
}

/** Indeks bar terakhir yang buka-time <= t (binary search). */
export function indexAtOrBefore(bars: Bar[], t: number): number {
  let lo = 0
  let hi = bars.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (bars[mid].t <= t) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

export function fmtPrice(v: number): string {
  return v.toFixed(2)
}

export function fmtTime(sec: number): string {
  const d = new Date(sec * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(
    d.getUTCMinutes()
  )}`
}

export const TF_LABEL: Record<TF, string> = {
  1: 'M1',
  5: 'M5',
  15: 'M15',
  60: 'H1',
  240: 'H4',
  1440: 'D1',
}
