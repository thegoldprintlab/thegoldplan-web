import { getSupabase, isSupabaseConfigured } from './supabase'
import type { Trade, Settings, Direction } from './types'

export interface NewTrade {
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
}

const DEFAULT_SETTINGS: Settings = {
  user_id: '',
  setups: ['SNR Breakout', 'SND Rejection', 'SNR + SND', 'Others'],
  sessions: ['Australia (Aus)', 'Tokyo (Tok)', 'London (Lon)', 'New York (NY)'],
  emotions: ['Calm & Focused', 'FOMO / Chasing Price', 'Revenge Trading', 'Hesitant'],
  accounts: ['Personal Account', 'Prop Firm 1', 'Prop Firm 2', 'Compounding Account'],
  max_daily_loss: 100,
  account_capitals: {},
}

export function computePips(direction: Direction, entry: number, exit: number): number {
  const raw = direction === 'BUY' ? exit - entry : entry - exit
  // XAUUSD 1 pip = 0.1; mirror the sheet's convention of 1 point = 1 pip.
  return Math.round(raw * 10) / 10
}

export function computePnl(pips: number): number {
  return Math.round(pips * 10) / 10
}

// Tag "High Volatility" when submitted during London–NY overlap (12:00–16:00 UTC)
export function currentVolatility(): string {
  const h = new Date().getUTCHours()
  return h >= 12 && h < 16 ? 'High Volatility' : 'Normal'
}

export async function fetchTrades(): Promise<Trade[]> {
  const sb = getSupabase()
  // Supabase/PostgREST caps at 1000 rows per request — paginate to get all.
  const PAGE = 1000
  const out: Trade[] = []
  let from = 0
  for (;;) {
    const { data, error } = await sb
      .from('trades')
      .select('*')
      .order('trade_date', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    out.push(...(data as Trade[]))
    if (data.length < PAGE) break
    from += PAGE
  }
  return out
}

export async function insertTrade(t: NewTrade): Promise<Trade> {
  const sb = getSupabase()
  const { data: user } = await sb.auth.getUser()
  const userId = user.user?.id
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await sb
    .from('trades')
    .insert({
      user_id: userId,
      trade_date: t.trade_date,
      account: t.account,
      session: t.session,
      setup: t.setup,
      direction: t.direction,
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      pips: t.pips,
      profit_loss: t.profit_loss,
      emotion: t.emotion,
      notes: t.notes || '',
      volatility: currentVolatility(),
    })
    .select()
    .single()
  if (error) throw error
  return data as Trade
}

export async function deleteTrade(id: string): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.from('trades').delete().eq('id', id)
  if (error) throw error
}

export async function fetchSettings(): Promise<Settings> {
  const sb = getSupabase()
  const { data: user } = await sb.auth.getUser()
  const userId = user.user?.id
  const { data, error } = await sb.from('settings').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (data) {
    return {
      user_id: data.user_id,
      setups: data.setups ?? DEFAULT_SETTINGS.setups,
      sessions: data.sessions ?? DEFAULT_SETTINGS.sessions,
      emotions: data.emotions ?? DEFAULT_SETTINGS.emotions,
      accounts: data.accounts ?? DEFAULT_SETTINGS.accounts,
      max_daily_loss: data.max_daily_loss ?? DEFAULT_SETTINGS.max_daily_loss,
      api_token: data.api_token ?? null,
      account_capitals: normalizeCapitals(data.account_capitals),
      account_daily_loss_limits: normalizeCapitals(data.account_daily_loss_limits),
    }
  }
  return { ...DEFAULT_SETTINGS, user_id: userId ?? '' }
}

/** Normalize jsonb from DB into Record<string, number> (values may be strings/numbers/null). */
function normalizeCapitals(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) out[k] = n
  }
  return out
}

export async function saveSettings(s: Settings): Promise<void> {
  const sb = getSupabase()
  const { data: user } = await sb.auth.getUser()
  const userId = user.user?.id
  if (!userId) throw new Error('Not authenticated')
  const payload = {
    user_id: userId,
    setups: s.setups,
    sessions: s.sessions,
    emotions: s.emotions,
    accounts: s.accounts,
    max_daily_loss: s.max_daily_loss,
    account_capitals: s.account_capitals ?? {},
    account_daily_loss_limits: s.account_daily_loss_limits ?? {},
  }
  const { data: existing } = await sb.from('settings').select('id').eq('user_id', userId).maybeSingle()
  if (existing) {
    const { error } = await sb.from('settings').update(payload).eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await sb.from('settings').insert(payload)
    if (error) throw error
  }
}

export function useConfigured(): boolean {
  return isSupabaseConfigured()
}
