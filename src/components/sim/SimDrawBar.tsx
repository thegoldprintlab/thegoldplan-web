import type { Tool } from '../../sim/drawings'

interface Props {
  tool: Tool
  color: string
  count: number
  onTool: (t: Tool) => void
  onColor: (c: string) => void
  onUndo: () => void
  onClear: () => void
}

const TOOLS: { id: Tool; glyph: string; tip: string }[] = [
  { id: 'none', glyph: '↖', tip: 'Cursor — click an object to select, drag to move' },
  { id: 'hray', glyph: '―', tip: 'Horizontal line — one click' },
  { id: 'vline', glyph: '|', tip: 'Vertical line — one click' },
  { id: 'trend', glyph: '╱', tip: 'Trend line — two clicks' },
  { id: 'rect', glyph: '▭', tip: 'Rectangle — two clicks' },
  { id: 'text', glyph: 'T', tip: 'Text label — one click' },
]

export default function SimDrawBar({ tool, color, count, onTool, onColor, onUndo, onClear }: Props) {
  return (
    <div className="sim-drawbar">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`sim-tool${tool === t.id ? ' active' : ''}`}
          title={t.tip}
          onClick={() => onTool(t.id)}
        >
          {t.glyph}
        </button>
      ))}
      <label className="sim-tool-color" title="Drawing color">
        <input type="color" value={color} onChange={(e) => onColor(e.target.value)} aria-label="Drawing color" />
      </label>
      <button className="btn btn-ghost btn-sm" type="button" onClick={onUndo} disabled={count === 0}>
        Undo
      </button>
      <button className="btn btn-ghost btn-sm" type="button" onClick={onClear} disabled={count === 0}>
        Clear
      </button>
    </div>
  )
}
