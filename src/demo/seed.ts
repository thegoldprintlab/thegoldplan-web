import type { Trade, Settings } from '../lib/types'

export const DEMO_SETTINGS: Settings = {
  user_id: 'demo',
  setups: ['SNR Breakout', 'SND Rejection', 'SNR + SND', 'Liquidity Sweep', 'Others'],
  sessions: ['London (Lon)', 'New York (NY)', 'Tokyo (Tok)', 'Australia (Aus)'],
  emotions: ['Calm & Focused', 'FOMO / Chasing Price', 'Revenge Trading', 'Hesitant'],
  accounts: ['Personal Account', 'Prop Firm 1', 'Prop Firm 2', 'Compounding Account'],
  max_daily_loss: 100,
  account_capitals: {
    'Personal Account': 10000,
    'Prop Firm 1': 50000,
    'Prop Firm 2': 100000,
    'Compounding Account': 25000,
  },
  account_daily_loss_limits: {
    'Personal Account': 100,
    'Prop Firm 1': 250,
    'Prop Firm 2': 500,
    'Compounding Account': 150,
  },
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(20260901)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}

function randInt(min: number, max: number): number {
  return min + Math.floor(rnd() * (max - min + 1))
}

function iso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const NOTES = [
  'Clean setup, followed the plan to the letter.',
  'Waited for confirmation at the key level.',
  'News spike — cut the trade early on purpose.',
  'Let the winner run, trailed the stop.',
  'Revenge entry after a loss. Broke the rules.',
  'Over-leveraged, lucky to escape flat.',
  'Perfect A+ setup with confluence on H4.',
  '',
]

function trade(
  id: string,
  trade_date: string,
  direction: 'BUY' | 'SELL',
  entry: number,
  exit: number,
  pips: number,
  profit: number,
  account: string,
  session: string,
  setup: string,
  emotion: string,
  notes: string,
): Trade {
  return {
    id,
    created_at: `${trade_date}T08:00:00.000Z`,
    user_id: 'demo',
    trade_date,
    account,
    session,
    setup,
    direction,
    entry_price: entry,
    exit_price: exit,
    pips,
    profit_loss: profit,
    emotion,
    notes,
    volatility: pick(['Normal', 'High Volatility']),
    volume: randInt(1, 5) / 10,
  }
}

function generate(): Trade[] {
  const trades: Trade[] = []
  const today = new Date()

  // Today — a clean, profitable day (keeps the risk "coach" card calm).
  trades.push(
    trade('demo-today-1', iso(today), 'BUY', 2321.5, 2327.7, 12.4, 180, 'Personal Account', 'London (Lon)', 'SNR Breakout', 'Calm & Focused', 'Clean setup, followed the plan to the letter.'),
    trade('demo-today-2', iso(today), 'SELL', 2336.2, 2331.8, 8.8, 320, 'Prop Firm 1', 'New York (NY)', 'SND Rejection', 'Calm & Focused', 'Perfect A+ setup with confluence on H4.'),
    trade('demo-today-3', iso(today), 'BUY', 2318.9, 2326.5, 15.2, 410, 'Prop Firm 2', 'London (Lon)', 'Liquidity Sweep', 'Calm & Focused', 'Let the winner run, trailed the stop.'),
    trade('demo-today-4', iso(today), 'BUY', 2309.4, 2312.6, 6.4, 95, 'Compounding Account', 'Tokyo (Tok)', 'SNR + SND', 'Calm & Focused', 'Waited for confirmation at the key level.'),
  )

  for (let daysAgo = 90; daysAgo >= 1; daysAgo--) {
    const d = new Date(today.getTime() - daysAgo * 86400000)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue // trading week only

    const count = rnd() < 0.35 ? 2 : rnd() < 0.65 ? 1 : 3
    for (let i = 0; i < count; i++) {
      const account = pick(DEMO_SETTINGS.accounts)
      const win = rnd() < 0.54
      const pips = win ? randInt(4, 42) : -randInt(3, 32)
      const profit = Math.round(pips * randInt(2, 8) * 2)
      const direction: 'BUY' | 'SELL' = rnd() < 0.5 ? 'BUY' : 'SELL'
      const entry = Math.round((2300 + rnd() * 90) * 10) / 10
      const exit = Math.round((entry + (direction === 'BUY' ? pips : -pips) * 0.1) * 10) / 10
      trades.push(
        trade(
          `demo-${daysAgo}-${i}`,
          iso(d),
          direction,
          entry,
          exit,
          pips,
          profit,
          account,
          pick(DEMO_SETTINGS.sessions),
          pick(DEMO_SETTINGS.setups),
          pick(DEMO_SETTINGS.emotions),
          pick(NOTES),
        ),
      )
    }
  }
  return trades
}

export const DEMO_TRADES: Trade[] = generate()
