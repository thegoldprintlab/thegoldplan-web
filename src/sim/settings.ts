/** Tetapan carta + indikator + objek lukisan (simulator). */

export type ChartKind = 'candles' | 'bars' | 'line' | 'area'

export interface ChartSettings {
  kind: ChartKind
  /** true = warna ikut tema; false = guna upColor/downColor */
  followTheme: boolean
  upColor: string
  downColor: string
  showGrid: boolean
  showCrosshair: boolean
  showLastPrice: boolean
  /** garis harga semasa (dotted) */
  showPriceLine: boolean
  showLegend: boolean
}

export interface IndicatorSettings {
  sma: boolean
  smaPeriod: number
  ema: boolean
  emaPeriod: number
  bb: boolean
  bbPeriod: number
  bbMult: number
  rsi: boolean
  rsiPeriod: number
  pdh: boolean
}

export const DEFAULT_CHART: ChartSettings = {
  kind: 'candles',
  followTheme: true,
  upColor: '#2fbf71',
  downColor: '#e5484d',
  showGrid: true,
  showCrosshair: true,
  showLastPrice: true,
  showPriceLine: true,
  showLegend: true,
}

export const DEFAULT_INDICATORS: IndicatorSettings = {
  sma: false,
  smaPeriod: 20,
  ema: false,
  emaPeriod: 50,
  bb: false,
  bbPeriod: 20,
  bbMult: 2,
  rsi: false,
  rsiPeriod: 14,
  pdh: false,
}

const KEY_CHART = 'gp-sim-chart-settings'
const KEY_IND = 'gp-sim-indicators'
const KEY_ACCOUNT = 'gp-sim-account'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) }
  } catch {
    return fallback
  }
}

export function loadChartSettings(): ChartSettings {
  return load(KEY_CHART, DEFAULT_CHART)
}

export function loadIndicators(): IndicatorSettings {
  return load(KEY_IND, DEFAULT_INDICATORS)
}

export function saveChartSettings(s: ChartSettings) {
  try {
    localStorage.setItem(KEY_CHART, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function saveIndicators(s: IndicatorSettings) {
  try {
    localStorage.setItem(KEY_IND, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export interface AccountSettings {
  startBalance: number
  leverage: number
}

export const DEFAULT_ACCOUNT: AccountSettings = { startBalance: 10_000, leverage: 500 }

const LEVERAGE_CHOICES = [50, 100, 200, 500, 1000]

export function loadAccount(): AccountSettings {
  const a = load(KEY_ACCOUNT, DEFAULT_ACCOUNT)
  const leverage = LEVERAGE_CHOICES.includes(a.leverage) ? a.leverage : DEFAULT_ACCOUNT.leverage
  const startBalance = Number.isFinite(a.startBalance) && a.startBalance > 0 ? a.startBalance : DEFAULT_ACCOUNT.startBalance
  return { startBalance, leverage }
}

export function saveAccount(s: AccountSettings) {
  try {
    localStorage.setItem(KEY_ACCOUNT, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
