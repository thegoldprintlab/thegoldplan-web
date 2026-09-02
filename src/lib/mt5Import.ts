// MT5 Excel report parser — parses the XLSX trade history report into Trade-like rows.
// We keep this dependency-light: no npm libs, parse the raw XLSX zip ourselves.

import type { Direction, Trade } from './types'

export interface ParsedMt5Row {
  trade_date: string // YYYY-MM-DD
  open_time: string // HH:MM
  direction: Direction
  volume: number
  entry_price: number
  exit_price: number
  profit: number
  commission: number
  swap: number
}

/** Find the worksheet XML inside an XLSX (zip) file. */
function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

/** Parse a worksheet XML into a 2D string grid (with shared strings resolved). */
function parseSheet(
  xml: string,
  sharedStrings: string[] | null
): string[][] {
  const grid: string[][] = []
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g
  let m: RegExpExecArray | null
  while ((m = rowRe.exec(xml))) {
    const rowXml = m[1]
    const row: string[] = []
    const cellRe = /<c[^>]*>([\s\S]*?)<\/c>/g
    let cm: RegExpExecArray | null
    while ((cm = cellRe.exec(rowXml))) {
      const cellXml = cm[1]
      const tMatch = /<c[^>]*\bt="(\w+)"/.exec(cm[0])
      const t = tMatch ? tMatch[1] : 'n'
      const vMatch = /<v>([\s\S]*?)<\/v>/.exec(cellXml)
      const v = vMatch ? vMatch[1] : ''
      if (t === 's' && sharedStrings) {
        row.push(sharedStrings[Number(v)] ?? '')
      } else if (t === 'inlineStr') {
        const isMatch = /<t[^>]*>([\s\S]*?)<\/t>/.exec(cellXml)
        row.push(isMatch ? decodeXml(isMatch[1]) : '')
      } else {
        row.push(v)
      }
    }
    grid.push(row)
  }
  return grid
}

/** MT5 HTML/Excel report may use either a datetime column or "Open Time" / "Close Time". */
function parseMt5Date(v: string, fallbackYear = 2026): string | null {
  if (!v) return null
  // Excel serial number
  if (/^\d+(\.\d+)?$/.test(v)) {
    const n = Number(v)
    if (n > 20000 && n < 60000) {
      const d = new Date(Math.round((n - 25569) * 86400 * 1000))
      if (!Number.isNaN(d.getTime())) {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      }
    }
    return null
  }
  // "2026.08.31 02:55" or "2026-08-31 02:55" or "08.31 02:55"
  const m = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})[ T](\d{1,2}):(\d{2})/.exec(v)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }
  const m2 = /(\d{1,2})[.\-/](\d{1,2})[ T](\d{1,2}):(\d{2})/.exec(v)
  if (m2) {
    return `${fallbackYear}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`
  }
  return null
}

function parseTime(v: string): string {
  if (!v) return '00:00'
  const m = /(\d{1,2}):(\d{2})/.exec(v)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '00:00'
}

function toNum(v: string): number {
  if (!v) return 0
  const n = Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Detect MT5 report header row and map columns. */
function detectColumns(header: string[]): Record<string, number> | null {
  const map: Record<string, number> = {}
  header.forEach((h, i) => {
    const key = h.toLowerCase().trim()
    if (key.includes('open time') || key === 'time') map.openTime = i
    if (key.includes('close time')) map.closeTime = i
    if (key.includes('type') || key.includes('direction')) map.type = i
    if (key.includes('volume') || key.includes('size')) map.volume = i
    if (key.includes('symbol')) map.symbol = i
    if (key.includes('price open') || key === 'open price') map.openPrice = i
    if (key.includes('price close') || key === 'close price') map.closePrice = i
    if (key.includes('profit')) map.profit = i
    if (key.includes('commission')) map.commission = i
    if (key.includes('swap')) map.swap = i
  })
  const required = ['openTime', 'type', 'volume', 'openPrice', 'closePrice', 'profit']
  return required.every((k) => map[k] !== undefined) ? map : null
}

function sessionFor(hh: number): string {
  if (hh < 8) return 'Tokyo (Tok)'
  if (hh < 12) return 'London (Lon)'
  return 'New York (NY)'
}

function pips(dir: Direction, entry: number, exit: number): number {
  const raw = dir === 'BUY' ? exit - entry : entry - exit
  return Math.round(raw * 10) / 10
}

/** Main entry: parse an MT5 Excel report File into rows ready for insert. */
export async function parseMt5Excel(
  file: File,
  accountName: string,
  fallbackYear = 2026
): Promise<Omit<Trade, 'id' | 'created_at' | 'user_id'>[]> {
  const zip = await import('fflate')
  const buf = new Uint8Array(await file.arrayBuffer())
  const files = zip.unzipSync(buf)
  const utf8 = new TextDecoder('utf-8')

  // shared strings
  let sharedStrings: string[] | null = null
  const ssKey = Object.keys(files).find((k) => k === 'xl/sharedStrings.xml')
  if (ssKey) {
    const ssXml = utf8.decode(files[ssKey])
    sharedStrings = []
    const siRe = /<si>([\s\S]*?)<\/si>/g
    let sm: RegExpExecArray | null
    while ((sm = siRe.exec(ssXml))) {
      const tMatch = /<t[^>]*>([\s\S]*?)<\/t>/.exec(sm[1])
      sharedStrings.push(tMatch ? decodeXml(tMatch[1]) : '')
    }
  }

  const sheetKeys = Object.keys(files).filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
  let out: Omit<Trade, 'id' | 'created_at' | 'user_id'>[] = []

  for (const key of sheetKeys) {
    const xml = utf8.decode(files[key])
    const grid = parseSheet(xml, sharedStrings)
    // Find header index first
    let headerIdx = -1
    let colMap: Record<string, number> | null = null
    for (let i = 0; i < grid.length; i++) {
      const c = detectColumns(grid[i])
      if (c) {
        headerIdx = i
        colMap = c
        break
      }
    }
    if (headerIdx < 0 || !colMap) continue
    for (let i = headerIdx + 1; i < grid.length; i++) {
      const row = grid[i]
      const g = (k: keyof typeof colMap) => {
        const idx = colMap![k as string]
        return idx !== undefined ? (row[idx] ?? '') : ''
      }
      const typeRaw = g('type').toLowerCase()
      const direction: Direction = typeRaw.includes('buy') ? 'BUY' : 'SELL'
      const openTime = parseMt5Date(g('openTime'), fallbackYear)
      if (!openTime) continue
      const volume = toNum(g('volume'))
      if (volume === 0) continue
      out.push({
        trade_date: openTime,
        account: accountName,
        session: sessionFor(parseInt(parseTime(g('openTime')).split(':')[0], 10)),
        setup: 'Others',
        direction,
        entry_price: toNum(g('openPrice')),
        exit_price: toNum(g('closePrice')),
        volume,
        pips: pips(direction, toNum(g('openPrice')), toNum(g('closePrice'))),
        profit_loss: Math.round((toNum(g('profit')) + toNum(g('commission')) + toNum(g('swap'))) * 100) / 100,
        emotion: '',
        notes: '',
        volatility: 'Normal',
      })
    }
  }
  return out
}
