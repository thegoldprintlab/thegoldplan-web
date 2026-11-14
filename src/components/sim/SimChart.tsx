import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
  type LogicalRange,
  ColorType,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts'
import type { Bar } from '../../sim/types'
import type { ChartColors } from '../../sim/useChartColors'
import type { ChartSettings, IndicatorSettings } from '../../sim/settings'
import {
  bollinger,
  ema as emaCalc,
  prevDayLevels,
  rsi as rsiCalc,
  sma as smaCalc,
} from '../../sim/indicators'
import type { Drawing, Tool, Anchor } from '../../sim/drawings'
import { newId } from '../../sim/drawings'
import { strokePath } from './overlay'
import { fmtTime } from '../../sim/aggregate'

interface Props {
  bars: Bar[]
  cursor: number
  sl: number | null
  tp: number | null
  entry: number | null
  side: 'BUY' | 'SELL' | null
  colors: ChartColors
  settings: ChartSettings
  indicators: IndicatorSettings
  tool: Tool
  drawColor: string
  drawings: Drawing[]
  onAddDrawing: (d: Drawing) => void
  onRemoveDrawing: (id: string) => void
}

type AnySeries = ISeriesApi<'Candlestick'> | ISeriesApi<'Bar'> | ISeriesApi<'Line'> | ISeriesApi<'Area'>

const IND_COLORS = {
  sma: '#f59e0b',
  ema: '#38bdf8',
  bb: '#a78bfa',
  rsi: '#e879f9',
  pdh: '#94a3b8',
}

export default function SimChart({
  bars,
  cursor,
  sl,
  tp,
  entry,
  side,
  colors,
  settings,
  indicators,
  tool,
  drawColor,
  drawings,
  onAddDrawing,
  onRemoveDrawing,
}: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<AnySeries | null>(null)
  const indRef = useRef<Map<string, AnySeries>>(new Map())
  const renderedRef = useRef(-1)
  const kindRef = useRef(settings.kind)
  const colorsRef = useRef(colors)
  colorsRef.current = colors
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const linesRef = useRef<IPriceLine[]>([])
  const [pending, setPending] = useState<Anchor | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const visible = useMemo(() => bars.slice(0, Math.max(0, cursor)), [bars, cursor])

  // ── bina carta ────────────────────────────────────────────────
  useEffect(() => {
    if (!boxRef.current) return
    const c = colorsRef.current
    const s = settingsRef.current
    const chart = createChart(boxRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: c.text,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      },
      grid: {
        vertLines: { visible: s.showGrid, color: c.grid },
        horzLines: { visible: s.showGrid, color: c.grid },
      },
      // Ruang kanan extra: label harga + label SL/TP tak terpotong pada skrin kecil.
      rightPriceScale: {
        borderColor: c.border,
        scaleMargins: { top: 0.12, bottom: 0.14 },
        entireTextOnly: true,
      },
      timeScale: { borderColor: c.border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: s.showCrosshair ? CrosshairMode.Normal : CrosshairMode.Magnet },
      handleScroll: true,
      handleScale: true,
    })
    chartRef.current = chart

    const ro = new ResizeObserver(() => {
      if (!boxRef.current) return
      const w = boxRef.current.clientWidth
      const h = boxRef.current.clientHeight
      chart.applyOptions({ width: w, height: h })
      setSize({ w, h })
    })
    ro.observe(boxRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      indRef.current.clear()
    }
  }, [])

  // ── bina/tukar jenis siri utama ───────────────────────────────
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    if (seriesRef.current && kindRef.current === settings.kind) return

    if (seriesRef.current) {
      try {
        chart.removeSeries(seriesRef.current)
      } catch {
        /* sudah dibuang */
      }
      seriesRef.current = null
    }
    const c = colorsRef.current
    const up = settings.followTheme ? c.up : settings.upColor
    const down = settings.followTheme ? c.down : settings.downColor
    const common = { priceLineVisible: settings.showPriceLine, lastValueVisible: settings.showLastPrice }
    const fmt = { priceFormat: { type: 'price' as const, precision: 2, minMove: 0.01 } }

    if (settings.kind === 'candles') {
      seriesRef.current = chart.addCandlestickSeries({
        upColor: up,
        downColor: down,
        borderUpColor: up,
        borderDownColor: down,
        wickUpColor: up,
        wickDownColor: down,
        ...fmt,
        ...common,
      })
    } else if (settings.kind === 'bars') {
      seriesRef.current = chart.addBarSeries({ upColor: up, downColor: down, ...fmt, ...common })
    } else if (settings.kind === 'line') {
      seriesRef.current = chart.addLineSeries({ color: c.entry, lineWidth: 2, ...fmt, ...common })
    } else {
      seriesRef.current = chart.addAreaSeries({
        lineColor: c.entry,
        topColor: `${c.entry}55`,
        bottomColor: `${c.entry}05`,
        lineWidth: 2,
        ...fmt,
        ...common,
      })
    }
    kindRef.current = settings.kind
    renderedRef.current = -1
  }, [settings.kind, settings.followTheme, settings.upColor, settings.downColor, settings.showPriceLine, settings.showLastPrice])

  // ── warna/tema/tetapan ────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series) return
    chart.applyOptions({
      layout: { textColor: colors.text },
      grid: {
        vertLines: { visible: settings.showGrid, color: colors.grid },
        horzLines: { visible: settings.showGrid, color: colors.grid },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border },
      crosshair: { mode: settings.showCrosshair ? CrosshairMode.Normal : CrosshairMode.Magnet },
    })
    const up = settings.followTheme ? colors.up : settings.upColor
    const down = settings.followTheme ? colors.down : settings.downColor
    if (settings.kind === 'candles' || settings.kind === 'bars') {
      series.applyOptions({
        upColor: up,
        downColor: down,
        borderUpColor: up,
        borderDownColor: down,
        wickUpColor: up,
        wickDownColor: down,
      } as never)
    } else if (settings.kind === 'line') {
      series.applyOptions({ color: colors.entry } as never)
    } else {
      series.applyOptions({
        lineColor: colors.entry,
        topColor: `${colors.entry}55`,
        bottomColor: `${colors.entry}05`,
      } as never)
    }
    series.applyOptions({ priceLineVisible: settings.showPriceLine, lastValueVisible: settings.showLastPrice } as never)
  }, [colors, settings])

  // ── data utama ────────────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return
    const toCandle = (b: Bar) => ({
      time: b.t as UTCTimestamp,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    })
    if (cursor <= 0) {
      series.setData([])
      renderedRef.current = 0
      return
    }
    if (settings.kind === 'line' || settings.kind === 'area') {
      series.setData(visible.map((b) => ({ time: b.t as UTCTimestamp, value: b.c })) as never)
      renderedRef.current = cursor
      return
    }
    if (renderedRef.current === cursor - 1 && cursor <= bars.length) {
      series.update(toCandle(bars[cursor - 1]))
      renderedRef.current = cursor
      return
    }
    series.setData(visible.map(toCandle))
    renderedRef.current = cursor
    chartRef.current?.timeScale().scrollToRealTime()
  }, [visible, cursor, bars, settings.kind])

  // ── indikator overlay + garis PDH/PDL + SL/TP ─────────────────
  useEffect(() => {
    const chart = chartRef.current
    const main = seriesRef.current
    if (!chart || !main) return

    for (const s of indRef.current.values()) {
      try {
        chart.removeSeries(s)
      } catch {
        /* sudah dibuang */
      }
    }
    indRef.current.clear()

    for (const line of linesRef.current) {
      try {
        main.removePriceLine(line)
      } catch {
        /* ignore */
      }
    }
    linesRef.current = []

    if (!visible.length) return

    const fmt = { priceFormat: { type: 'price' as const, precision: 2, minMove: 0.01 } }
    const addLine = (
      key: string,
      data: Array<{ time: number; value: number }>,
      color: string,
      width: 1 | 2 | 3 | 4 = 2,
      style: LineStyle = LineStyle.Solid
    ) => {
      if (data.length < 2) return
      const s = chart.addLineSeries({
        color,
        lineWidth: width,
        lineStyle: style,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        ...fmt,
      })
      s.setData(data.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })))
      indRef.current.set(key, s)
    }

    if (indicators.bb) {
      const b = bollinger(visible, indicators.bbPeriod, indicators.bbMult)
      addLine('bb-mid', b.mid, IND_COLORS.bb, 1, LineStyle.Dotted)
      addLine('bb-up', b.upper, IND_COLORS.bb, 1, LineStyle.Dashed)
      addLine('bb-lo', b.lower, IND_COLORS.bb, 1, LineStyle.Dashed)
    }
    if (indicators.sma) addLine('sma', smaCalc(visible, indicators.smaPeriod), IND_COLORS.sma)
    if (indicators.ema) addLine('ema', emaCalc(visible, indicators.emaPeriod), IND_COLORS.ema)

    if (indicators.pdh) {
      const lv = prevDayLevels(visible)
      if (lv) {
        linesRef.current.push(
          main.createPriceLine({
            price: lv.high,
            color: IND_COLORS.pdh,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'PDH',
          })
        )
        linesRef.current.push(
          main.createPriceLine({
            price: lv.low,
            color: IND_COLORS.pdh,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'PDL',
          })
        )
      }
    }

    const c = colorsRef.current
    if (entry != null && side) {
      linesRef.current.push(
        main.createPriceLine({
          price: entry,
          color: c.entry,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `${side} entry`,
        })
      )
    }
    if (sl != null) {
      linesRef.current.push(
        main.createPriceLine({
          price: sl,
          color: c.down,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'SL',
        })
      )
    }
    if (tp != null) {
      linesRef.current.push(
        main.createPriceLine({
          price: tp,
          color: c.up,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'TP',
        })
      )
    }
  }, [visible, indicators, entry, sl, tp, side, settings.kind, colors])

  // ── overlay canvas: objek lukisan + RSI ──────────────────────
  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current
    const chart = chartRef.current
    const main = seriesRef.current
    if (!canvas || !chart || !main) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === 0 || h === 0) return
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const ts = chart.timeScale()
    const xOf = (t: number) => {
      const x = ts.timeToCoordinate(t as UTCTimestamp)
      return x == null ? null : (x as number)
    }
    const yOf = (p: number) => {
      const y = main.priceToCoordinate(p)
      return y == null ? null : (y as number)
    }

    for (const d of drawings) {
      ctx.strokeStyle = d.color
      ctx.fillStyle = d.color
      ctx.lineWidth = 1.5
      if (d.kind === 'hray') {
        const y = yOf(d.a.p)
        if (y != null) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
          ctx.stroke()
          ctx.font = '10px ui-monospace, monospace'
          ctx.fillText(`${d.a.p.toFixed(2)}`, 4, y - 4)
        }
      } else if (d.kind === 'vline') {
        const x = xOf(d.a.t)
        if (x != null) {
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, h)
          ctx.stroke()
        }
      } else if (d.kind === 'trend' || d.kind === 'rect') {
        const x1 = xOf(d.a.t)
        const y1 = yOf(d.a.p)
        const x2 = xOf(d.b.t)
        const y2 = yOf(d.b.p)
        if (x1 != null && y1 != null && x2 != null && y2 != null) {
          if (d.kind === 'trend') {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          } else {
            ctx.globalAlpha = 0.14
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
            ctx.globalAlpha = 1
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
          }
        }
      } else if (d.kind === 'text') {
        const x = xOf(d.a.t)
        const y = yOf(d.a.p)
        if (x != null && y != null) {
          ctx.font = '12px ui-monospace, monospace'
          ctx.fillText(d.text, x, y)
        }
      }
      ctx.setLineDash([])
    }

    // RSI dalam jalur bawah
    if (indicators.rsi) {
      const pts = rsiCalc(visible, indicators.rsiPeriod)
      const bandH = Math.min(90, h * 0.22)
      const top = h - bandH
      ctx.strokeStyle = colorsRef.current.border
      ctx.setLineDash([3, 3])
      for (const lvl of [30, 70]) {
        const y = top + bandH - (lvl / 100) * bandH
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.strokeStyle = IND_COLORS.rsi
      ctx.lineWidth = 1.5
      const mapped: Array<[number, number]> = []
      for (const p of pts) {
        const x = xOf(p.time)
        if (x == null) continue
        mapped.push([x, top + bandH - (p.value / 100) * bandH])
      }
      strokePath(ctx, mapped)
      ctx.fillStyle = colorsRef.current.text
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText(`RSI ${indicators.rsiPeriod}`, 6, top + 12)
    }
  }, [drawings, indicators, visible])

  useEffect(() => {
    drawOverlay()
    const chart = chartRef.current
    if (!chart) return
    const handler = (_r: LogicalRange | null) => drawOverlay()
    chart.timeScale().subscribeVisibleLogicalRangeChange(handler)
    return () => chart.timeScale().unsubscribeVisibleLogicalRangeChange(handler)
  }, [drawOverlay, size])

  // ── interaksi lukisan ────────────────────────────────────────
  function anchorFrom(ev: React.MouseEvent<HTMLCanvasElement>): Anchor | null {
    const chart = chartRef.current
    const main = seriesRef.current
    const canvas = overlayRef.current
    if (!chart || !main || !canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top
    const t = chart.timeScale().coordinateToTime(x as never)
    const p = main.coordinateToPrice(y)
    if (t == null || p == null) return null
    return { t: t as unknown as number, p: p as number }
  }

  function handleClick(ev: React.MouseEvent<HTMLCanvasElement>) {
    if (tool === 'none') return
    const a = anchorFrom(ev)
    if (!a) return
    if (tool === 'hray' || tool === 'vline') {
      onAddDrawing({ id: newId(), kind: tool, a, color: drawColor })
      return
    }
    if (tool === 'text') {
      const text = window.prompt('Label text:')
      if (!text) return
      onAddDrawing({ id: newId(), kind: 'text', a, text, color: drawColor })
      return
    }
    if (!pending) {
      setPending(a)
      return
    }
    onAddDrawing({ id: newId(), kind: tool, a: pending, b: a, color: drawColor })
    setPending(null)
  }

  // Esc batal; Backspace buang objek terakhir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null)
      if ((e.key === 'Backspace' || e.key === 'Delete') && drawings.length) {
        const target = e.target as HTMLElement | null
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
        e.preventDefault()
        onRemoveDrawing(drawings[drawings.length - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawings, onRemoveDrawing])

  const last = cursor > 0 ? bars[cursor - 1] : null
  const chg = last && cursor > 1 ? last.c - bars[cursor - 2].c : 0
  const activeInd = [
    indicators.sma && `SMA ${indicators.smaPeriod}`,
    indicators.ema && `EMA ${indicators.emaPeriod}`,
    indicators.bb && `BB ${indicators.bbPeriod}`,
    indicators.rsi && `RSI ${indicators.rsiPeriod}`,
    indicators.pdh && 'PDH/PDL',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="sim-chart">
      {settings.showLegend && (
        <div className="sim-chart-legend">
          <b>XAUUSD</b>
          {last && (
            <>
              <span className="muted">{fmtTime(last.t)}</span>
              <span className={last.c >= last.o ? 'green' : 'red'}>{last.c.toFixed(2)}</span>
              <span className={chg >= 0 ? 'green' : 'red'}>
                {chg >= 0 ? '+' : ''}
                {chg.toFixed(2)}
              </span>
              <span className="muted">
                O {last.o.toFixed(2)} H {last.h.toFixed(2)} L {last.l.toFixed(2)}
              </span>
            </>
          )}
          {activeInd && <span className="sim-chart-active-ind">{activeInd}</span>}
        </div>
      )}
      <div className="sim-chart-stage">
        <div ref={boxRef} className="sim-chart-canvas" />
        <canvas
          ref={overlayRef}
          className={`sim-chart-overlay ${tool !== 'none' ? 'drawing' : ''}`}
          onClick={handleClick}
        />
        {pending && <div className="sim-chart-hint">Click a second point to finish (Esc to cancel)</div>}
      </div>
    </div>
  )
}
