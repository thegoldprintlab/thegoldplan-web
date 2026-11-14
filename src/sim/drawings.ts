/** Objek lukisan atas carta. Disimpan ikut (time, price) supaya kekal bila zoom. */

export type Tool = 'none' | 'hray' | 'vline' | 'trend' | 'rect' | 'text'

export interface Anchor {
  /** epoch saat */
  t: number
  p: number
}

export type Drawing =
  | { id: string; kind: 'hray'; a: Anchor; color: string; label?: string }
  | { id: string; kind: 'vline'; a: Anchor; color: string; label?: string }
  | { id: string; kind: 'trend'; a: Anchor; b: Anchor; color: string }
  | { id: string; kind: 'rect'; a: Anchor; b: Anchor; color: string }
  | { id: string; kind: 'text'; a: Anchor; text: string; color: string }

export const TOOL_LABEL: Record<Tool, string> = {
  none: 'Cursor',
  hray: 'Horizontal line',
  vline: 'Vertical line',
  trend: 'Trend line',
  rect: 'Rectangle',
  text: 'Text label',
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function drawingsFor(kind: Tool): Drawing['kind'] | null {
  if (kind === 'hray' || kind === 'vline' || kind === 'trend' || kind === 'rect' || kind === 'text') return kind
  return null
}
