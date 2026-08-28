export type Direction = 'BUY' | 'SELL'

export interface Trade {
  id: string
  created_at: string
  user_id: string
  trade_date: string
  account: string
  session: string
  setup: string
  direction: Direction
  entry_price: number
  exit_price: number
  pips: number
  profit_loss: number
  emotion: string
  notes: string
  volatility: string
}

export interface Settings {
  user_id: string
  setups: string[]
  sessions: string[]
  emotions: string[]
  accounts: string[]
  max_daily_loss: number
  api_token?: string | null
  /** account name -> starting capital ($). Missing entries treated as 0 (unset). */
  account_capitals?: Record<string, number> | null
}

export interface DashboardStats {
  totalNet: number
  winRate: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  wins: number
  losses: number
  bestTrade: number
  worstTrade: number
  totalTrades: number
}

export interface ScoreboardRow {
  label: string
  trades: number
  net: number
  winRate: number
}

export interface DailyPnl {
  date: string
  pnl: number
  cumulative: number
}
