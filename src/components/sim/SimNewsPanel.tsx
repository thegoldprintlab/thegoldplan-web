import type { NewsEvent } from '../../sim/news'

interface Props {
  /** Tarikh (YYYY-MM-DD) yang sedang dipilih / bar semasa. */
  day: string | null
  /** Semua event pada hari itu. */
  events: NewsEvent[]
  /** Berapa banyak event dalam bulan yang dimuat (untuk konteks). */
  monthCount: number
  /** Liputan dataset, dipapar bila tiada event. */
  coverage: string
  /** Lompat carta ke masa event ini. */
  onJump: (t: number) => void
  onClose: () => void
}

function clockLabel(e: NewsEvent): string {
  return e.clock ? `${e.clock} UTC` : 'all day'
}

export default function SimNewsPanel({ day, events, monthCount, coverage, onJump, onClose }: Props) {
  return (
    <div className="panel sim-news">
      <div className="sim-news-head">
        <b>USD news</b>
        {day && <span className="muted mono">{day}</span>}
        <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close news panel">
          ✕
        </button>
      </div>

      {!day ? (
        <p className="muted sim-news-empty">
          Click a date on the calendar to see that day's releases.
        </p>
      ) : events.length === 0 ? (
        <p className="muted sim-news-empty">
          No USD high-impact news on {day}.
          {monthCount > 0 && ` ${monthCount} event${monthCount > 1 ? 's' : ''} elsewhere this month.`}
          {monthCount === 0 && ` News data covers ${coverage}.`}
        </p>
      ) : (
        <ul className="sim-news-list">
          {events.map((e) => (
            <li key={`${e.t}-${e.title}`}>
              <button type="button" onClick={() => onJump(e.t)} title="Jump the chart to this release">
                <span className="sim-news-time mono">{clockLabel(e)}</span>
                <span className="sim-news-title">{e.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
