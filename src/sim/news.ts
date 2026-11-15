/**
 * Kalendar berita USD (high-impact) untuk chart simulator.
 * Data dijana oleh scripts/build-news.py (2007-01 → 2025-04, dataset awam) dan
 * ditambah oleh scripts/fetch-news-ff.py (scrape Forex Factory bulanan).
 * Liputan penuh: 2007-01-03 → 2026-11-25.
 */

export interface NewsEvent {
  /** epoch saat (UTC) */
  t: number
  /** YYYY-MM-DD (UTC) */
  day: string
  /** HH:MM UTC, atau null kalau sepanjang hari */
  clock: string | null
  title: string
}

interface Payload {
  from: string | null
  to: string | null
  events: Array<[number, string, string | null, string]>
}

let loaded: Promise<NewsEvent[]> | null = null

export function loadNews(): Promise<NewsEvent[]> {
  if (!loaded) {
    loaded = fetch('/sim-data/news-usd.json')
      .then((r) => (r.ok ? (r.json() as Promise<Payload>) : Promise.reject(new Error(String(r.status)))))
      .then((p) => p.events.map(([t, day, clock, title]) => ({ t, day, clock, title })))
      .catch(() => [] as NewsEvent[])
  }
  return loaded
}

/** Event dalam satu hari (YYYY-MM-DD), ikut masa. */
export function newsOnDay(all: NewsEvent[], day: string): NewsEvent[] {
  return all.filter((e) => e.day === day)
}

/** Hari (YYYY-MM-DD) dalam julat yang ada berita — untuk tanda pada kalendar. */
export function newsDaysInRange(all: NewsEvent[], fromDay: string, toDay: string): Set<string> {
  const s = new Set<string>()
  for (const e of all) {
    if (e.day >= fromDay && e.day <= toDay) s.add(e.day)
  }
  return s
}

/** Event yang jatuh dalam julat masa carta (epoch saat). */
export function newsInRange(all: NewsEvent[], fromT: number, toT: number): NewsEvent[] {
  return all.filter((e) => e.t >= fromT && e.t <= toT)
}
