import type { Trade } from './types'

export interface GroupedStats {
  trades: number
  net: number
  wins: number
  losses: number
  grossProfit: number
  grossLoss: number
}

export function groupStats(trades: Trade[], key: (t: Trade) => string): Map<string, GroupedStats> {
  const map = new Map<string, GroupedStats>()
  for (const t of trades) {
    const k = key(t) || '(unset)'
    const cur = map.get(k) ?? { trades: 0, net: 0, wins: 0, losses: 0, grossProfit: 0, grossLoss: 0 }
    cur.trades += 1
    cur.net += t.profit_loss
    if (t.profit_loss > 0) {
      cur.wins += 1
      cur.grossProfit += t.profit_loss
    } else if (t.profit_loss < 0) {
      cur.losses += 1
      cur.grossLoss += t.profit_loss
    }
    map.set(k, cur)
  }
  return map
}

export function toScoreboard(map: Map<string, GroupedStats>): Array<{ label: string } & GroupedStats & { winRate: number }> {
  return Array.from(map.entries())
    .map(([label, s]) => ({
      label,
      ...s,
      winRate: s.trades ? (s.wins / s.trades) * 100 : 0,
    }))
    .sort((a, b) => b.net - a.net)
}

export function fmtMoney(v: number): string {
  const sign = v < 0 ? '-' : ''
  return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function fmtPnl(v: number): string {
  const sign = v > 0 ? '+' : v < 0 ? '-' : ''
  return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
