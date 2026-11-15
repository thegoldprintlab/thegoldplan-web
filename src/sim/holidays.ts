/**
 * Cuti bank US (Federal Reserve) — hari pasaran tutup.
 * Formula rasmi (5 U.S.C. 6103):
 *   New Year, Juneteenth, Independence, Veterans, Christmas = tarikh tetap,
 *   dianjak ke Jumaat jika jatuh Sabtu, ke Isnin jika jatuh Ahad.
 *   MLK = Isnin ke-3 Jan · Washington = Isnin ke-3 Feb · Memorial = Isnin
 *   terakhir Mei · Labor = Isnin pertama Sep · Columbus = Isnin ke-2 Okt ·
 *   Thanksgiving = Khamis ke-4 Nov.
 * Disahkan lawan jadual OPM 2022–2026.
 */

export interface BankHoliday {
  /** YYYY-MM-DD (UTC) */
  date: string
  name: string
}

const NTH_MONDAY: Array<[number, number, string]> = [
  [1, 3, 'Martin Luther King Jr. Day'],
  [2, 3, "Washington's Birthday"],
  [9, 1, 'Labor Day'],
  [10, 2, 'Columbus Day'],
]

const FIXED: Array<[number, number, string]> = [
  [1, 1, "New Year's Day"],
  [6, 19, 'Juneteenth'],
  [7, 4, 'Independence Day'],
  [11, 11, 'Veterans Day'],
  [12, 25, 'Christmas Day'],
]

function ymd(y: number, m: number, d: number): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${y}-${p(m)}-${p(d)}`
}

/** Isnin ke-n dalam bulan (n bermula 1). */
function nthWeekday(y: number, month: number, weekday: number, n: number): number {
  const first = new Date(Date.UTC(y, month - 1, 1)).getUTCDay()
  const offset = (weekday - first + 7) % 7
  return 1 + offset + (n - 1) * 7
}

/** Tarikh tetap, anjak jika hujung minggu. Pulangkan null kalau anjakan
 *  melimpah ke tahun lain (cth Christmas 2022 → 26 Dis masih tahun sama). */
function observed(y: number, month: number, day: number): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, month - 1, day))
  const w = dt.getUTCDay()
  if (w === 6) dt.setUTCDate(dt.getUTCDate() - 1)
  else if (w === 0) dt.setUTCDate(dt.getUTCDate() + 1)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

export function bankHolidaysForYear(y: number): BankHoliday[] {
  const out: BankHoliday[] = []
  // Tahun semasa, tambah tahun berikutnya: cuti 1 Jan yang jatuh Sabtu
  // diperhatikan Jumaat 31 Dis tahun sebelumnya (contoh 2022 → 31 Dis 2021).
  for (const year of [y, y + 1]) {
    for (const [month, day, name] of FIXED) {
      const o = observed(year, month, day)
      if (o.y === y) out.push({ date: ymd(o.y, o.m, o.d), name })
    }
  }
  for (const [month, n, name] of NTH_MONDAY) {
    out.push({ date: ymd(y, month, nthWeekday(y, month, 1, n)), name })
  }
  // Memorial Day = Isnin terakhir Mei.
  const lastMonday = new Date(Date.UTC(y, 5, 1))
  lastMonday.setUTCDate(0) // hari terakhir Mei
  lastMonday.setUTCDate(lastMonday.getUTCDate() - ((lastMonday.getUTCDay() + 6) % 7))
  out.push({ date: ymd(y, 5, lastMonday.getUTCDate()), name: 'Memorial Day' })
  // Thanksgiving = Khamis ke-4 Nov.
  out.push({ date: ymd(y, 11, nthWeekday(y, 11, 4, 4)), name: 'Thanksgiving' })
  return out
}

const cache = new Map<number, Map<string, string>>()

function yearMap(y: number): Map<string, string> {
  let m = cache.get(y)
  if (!m) {
    m = new Map(bankHolidaysForYear(y).map((h) => [h.date, h.name]))
    cache.set(y, m)
  }
  return m
}

/** Nama cuti kalau `YYYY-MM-DD` hari bank US tutup, kalau tidak null. */
export function usBankHoliday(date: string): string | null {
  const y = Number(date.slice(0, 4))
  if (!Number.isFinite(y)) return null
  return yearMap(y).get(date) ?? null
}
