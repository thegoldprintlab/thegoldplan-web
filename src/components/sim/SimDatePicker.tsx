import { useEffect, useRef, useState } from 'react'
import { usBankHoliday } from '../../sim/holidays'

interface Props {
  /** Bulan yang dipilih, format YYYY-MM. */
  value: string
  months: string[]
  /** Hari (YYYY-MM-DD) yang ada berita USD. */
  newsDays: Set<string>
  showNews: boolean
  onPick: (month: string) => void
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return '—'
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function SimDatePicker({ value, months, newsDays, showNews, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setView(value), [value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const [y, m] = view.split('-').map(Number)
  // `value` boleh kosong semasa manifest/data belum siap — jangan kira grid
  // daripada NaN, Array(NaN) membaling RangeError dan menjatuhkan seluruh app.
  const valid = Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12
  const firstWeekday = valid ? (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7 : 0
  const daysInMonth = valid ? new Date(Date.UTC(y, m, 0)).getUTCDate() : 0
  const cells: Array<number | null> = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const shift = (dir: number) => {
    const d = new Date(Date.UTC(y, m - 1 + dir, 1))
    setView(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }

  const available = new Set(months)

  return (
    <div className="sim-date" ref={ref}>
      <button
        className="sim-month"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Pick a date"
      >
        {monthLabel(value)} <span className="sim-date-caret">▾</span>
      </button>

      {open && (
        <div className="sim-cal" role="dialog">
          <div className="sim-cal-head">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
            <b>{monthLabel(view)}</b>
            <button type="button" onClick={() => shift(1)} aria-label="Next month">›</button>
          </div>
          <div className="sim-cal-grid sim-cal-dow">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="sim-cal-grid">
            {cells.map((day, i) => {
              if (day == null) return <span key={`e${i}`} />
              const ds = `${view}-${String(day).padStart(2, '0')}`
              const holiday = usBankHoliday(ds)
              const hasNews = showNews && newsDays.has(ds)
              const cls = ['sim-cal-day', holiday ? 'holiday' : '', hasNews ? 'news' : '']
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={ds}
                  type="button"
                  className={cls}
                  disabled={!available.has(view)}
                  title={holiday ?? (hasNews ? 'USD high-impact news' : undefined)}
                  onClick={() => {
                    onPick(view)
                    setOpen(false)
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <div className="sim-cal-legend">
            {showNews && (
              <span><i className="dot news" /> USD news</span>
            )}
            <span><i className="dot holiday" /> US bank holiday</span>
            {!available.has(view) && <span className="muted">no price data</span>}
          </div>
        </div>
      )}
    </div>
  )
}
