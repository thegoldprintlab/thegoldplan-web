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
