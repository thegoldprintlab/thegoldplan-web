import { gunzipSync } from 'fflate'
import type { Bar, Manifest, MonthPayload } from './types'

/**
 * Simulator data layer.
 *
 * Data hidup sebagai fail per-bulan di /sim-data/XAUUSD/YYYY-MM.json.gz.
 * Setiap fail ~300–400 KB gzip; kita muat ikut keperluan supaya halaman
 * tak tarik berpuluh MB sekaligus.
 *
 * Payload:
 *   { symbol, tf, start, bars: "deltaMin,o,h,l,c\n..." }
 * di mana `t = start + deltaMin * 60`.
 */

const BASE = '/sim-data/XAUUSD'
const cache = new Map<string, Bar[]>()
let manifestPromise: Promise<Manifest> | null = null

export function getManifest(): Promise<Manifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${BASE}/manifest.json`, { cache: 'force-cache' }).then((r) => {
      if (!r.ok) throw new Error(`manifest ${r.status}`)
      return r.json() as Promise<Manifest>
    })
    // Jangan cache kegagalan selamanya — benarkan retry.
    manifestPromise.catch(() => {
      manifestPromise = null
    })
  }
  return manifestPromise
}

function decode(buf: ArrayBuffer): Bar[] {
  let text: string
  try {
    text = new TextDecoder().decode(gunzipSync(new Uint8Array(buf)))
  } catch {
    // fallback: server mungkin dah hantar plain JSON (dev tanpa gzip)
    text = new TextDecoder().decode(new Uint8Array(buf))
  }
  const payload = JSON.parse(text) as MonthPayload
  const out: Bar[] = []
  const start = payload.start
  let i = 0
  const s = payload.bars
  while (i < s.length) {
    let nl = s.indexOf('\n', i)
    if (nl === -1) nl = s.length
    const line = s.slice(i, nl)
    i = nl + 1
    if (!line) continue
    const p = line.split(',')
    if (p.length < 5) continue
    const t = start + Number(p[0]) * 60
    out.push({ t, o: +p[1], h: +p[2], l: +p[3], c: +p[4] })
  }
  return out
}

async function fetchMonth(month: string, signal?: AbortSignal): Promise<Bar[]> {
  const hit = cache.get(month)
  if (hit) return hit
  const res = await fetch(`${BASE}/${month}.json.gz`, { cache: 'force-cache', signal })
  if (!res.ok) throw new Error(`data ${month}: ${res.status}`)
  const buf = await res.arrayBuffer()
  const bars = decode(buf)
  cache.set(month, bars)
  return bars
}

/** Muat julat bulan (inklusif) dan gabung, dedup + sort. */
export async function loadRange(fromMonth: string, toMonth: string, signal?: AbortSignal): Promise<Bar[]> {
  const man = await getManifest()
  const want = man.months.filter((m) => m >= fromMonth && m <= toMonth)
  if (want.length === 0) throw new Error(`Tiada data untuk ${fromMonth} .. ${toMonth}`)
  const chunks = await Promise.all(want.map((m) => fetchMonth(m, signal)))
  const merged: Bar[] = []
  const seen = new Set<number>()
  for (const bars of chunks) {
    for (const b of bars) {
      if (seen.has(b.t)) continue
      seen.add(b.t)
      merged.push(b)
    }
  }
  merged.sort((a, b) => a.t - b.t)
  return merged
}

/** Muat satu bulan + bulan berikutnya (untuk main melepasi hujung bulan). */
export async function loadMonthWrapped(month: string, signal?: AbortSignal): Promise<Bar[]> {
  const man = await getManifest()
  const idx = man.months.indexOf(month)
  if (idx === -1) throw new Error(`Bulan ${month} tiada dalam data`)
  const next = man.months[idx + 1]
  return next ? loadRange(month, next, signal) : loadRange(month, month, signal)
}

export function monthKey(epochSec: number): string {
  const d = new Date(epochSec * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function clearCache() {
  cache.clear()
}
