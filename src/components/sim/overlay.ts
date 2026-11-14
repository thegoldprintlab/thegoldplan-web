import type { Point } from '../../sim/indicators'

/**
 * Lukis titik indikator sebagai polylines pada canvas overlay.
 * Kita tak guna series tambahan sebab lightweight-charts v4 hadkan bilangan
 * pane; overlay beri kawalan penuh warna dan tak ganggu skala harga.
 */

export interface Projector {
  /** harga -> y (px, relatif pada kotak carta) */
  priceToY: (p: number) => number | null
  /** epoch saat -> x (px) */
  timeToX: (t: number) => number | null
  width: number
  height: number
}

export function project(o: Projector, pts: Point[]): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (const pt of pts) {
    const x = o.timeToX(pt.time)
    const y = o.priceToY(pt.value)
    if (x == null || y == null) continue
    out.push([x, y])
  }
  return out
}

export function strokePath(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.stroke()
}

/** Isi jalur antara dua siri (untuk Bollinger). */
export function fillBand(ctx: CanvasRenderingContext2D, upper: Array<[number, number]>, lower: Array<[number, number]>, color: string) {
  if (upper.length < 2 || lower.length < 2) return
  ctx.beginPath()
  ctx.moveTo(upper[0][0], upper[0][1])
  for (let i = 1; i < upper.length; i++) ctx.lineTo(upper[i][0], upper[i][1])
  for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1])
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}
