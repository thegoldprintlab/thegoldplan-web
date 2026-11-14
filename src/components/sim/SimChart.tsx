import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts'
import type { Bar } from '../../sim/types'
import type { ChartColors } from '../../sim/useChartColors'
import { fmtTime } from '../../sim/aggregate'

interface Props {
  bars: Bar[]
  /** jumlah bar yang dah didedahkan (replay cursor) */
  cursor: number
  sl: number | null
  tp: number | null
  entry: number | null
  side: 'BUY' | 'SELL' | null
  /** warna dari tema site (CSS var) — bukan hardcode */
  colors: ChartColors
}

/** Carta candlestick + replay reveal. Warna ikut tema site. */
export default function SimChart({ bars, cursor, sl, tp, entry, side, colors }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const renderedRef = useRef(-1)
  const linesRef = useRef<IPriceLine[]>([])
  /** warna semasa untuk effect garis SL/TP tanpa rebuild carta */
  const colorsRef = useRef(colors)
  colorsRef.current = colors

  useEffect(() => {
    if (!boxRef.current) return
    const c = colorsRef.current
    const chart = createChart(boxRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: c.text,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      },
      grid: {
        vertLines: { color: c.grid },
        horzLines: { color: c.grid },
      },
      // Ruang kanan extra: label harga + label SL/TP tak terpotong pada skrin kecil.
      rightPriceScale: {
        borderColor: c.border,
        scaleMargins: { top: 0.12, bottom: 0.14 },
        entireTextOnly: true,
      },
      timeScale: { borderColor: c.border, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: true,
      handleScale: true,
    })
    const series = chart.addCandlestickSeries({
      upColor: c.up,
      downColor: c.down,
      borderUpColor: c.up,
      borderDownColor: c.down,
      wickUpColor: c.up,
      wickDownColor: c.down,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      priceLineVisible: true,
      lastValueVisible: true,
    })
    chartRef.current = chart
    seriesRef.current = series
    renderedRef.current = -1

    const ro = new ResizeObserver(() => {
      if (boxRef.current) chart.applyOptions({ width: boxRef.current.clientWidth, height: boxRef.current.clientHeight })
    })
    ro.observe(boxRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
    // Warna tema diurus di effect berasingan supaya carta tak dibina semula
    // bila user tekan Linear → Gold → Mono.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tema bertukar: kemas kini warna tanpa buang carta (jaga zoom & posisi).
  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series) return
    chart.applyOptions({
      layout: { textColor: colors.text },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border },
    })
    series.applyOptions({
      upColor: colors.up,
      downColor: colors.down,
      borderUpColor: colors.up,
      borderDownColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
    })
    // garis SL/TP dilukis semula oleh effect di bawah (colors dalam deps)
  }, [colors])

  // Reveal bar ikut cursor.
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return
    if (cursor <= 0) {
      series.setData([])
      renderedRef.current = 0
      return
    }
    const toData = (b: Bar) => ({
      time: b.t as UTCTimestamp,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    })
    if (renderedRef.current === cursor - 1 && cursor <= bars.length) {
      series.update(toData(bars[cursor - 1]))
      renderedRef.current = cursor
      return
    }
    const slice = bars.slice(0, cursor).map(toData)
    series.setData(slice)
    renderedRef.current = cursor
    chartRef.current?.timeScale().scrollToRealTime()
  }, [bars, cursor])

  // Garis entry / SL / TP
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return
    for (const l of linesRef.current) {
      try {
        series.removePriceLine(l)
      } catch {
        /* carta mungkin dah dibuang */
      }
    }
    linesRef.current = []
    if (!bars.length) return
    const c = colorsRef.current
    if (entry != null && side) {
      linesRef.current.push(
        series.createPriceLine({
          price: entry,
          color: c.entry,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `${side} entry`,
        })
      )
    }
    if (sl != null) {
      linesRef.current.push(
        series.createPriceLine({
          price: sl,
          color: c.down,
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: 'SL',
        })
      )
    }
    if (tp != null) {
      linesRef.current.push(
        series.createPriceLine({
          price: tp,
          color: c.up,
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: 'TP',
        })
      )
    }
  }, [bars.length, entry, sl, tp, side, colors])

  const last = cursor > 0 ? bars[cursor - 1] : null
  const chg = last && cursor > 1 ? last.c - bars[cursor - 2].c : 0

  return (
    <div className="sim-chart">
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
      </div>
      <div ref={boxRef} className="sim-chart-canvas" />
    </div>
  )
}
