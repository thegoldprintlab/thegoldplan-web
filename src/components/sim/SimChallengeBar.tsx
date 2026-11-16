import { DEFAULT_RULES, type ChallengeProgress, type ChallengeRules } from '../../sim/challenge'

interface Props {
  rules: ChallengeRules
  progress: ChallengeProgress
  onRules: (r: ChallengeRules) => void
  onOpen: () => void
}

/**
 * Compact challenge HUD that sits above the chart. Shows the two numbers that
 * matter while trading — distance to target and distance to ruin — and nothing
 * else, so it never competes with the chart for attention.
 */
export default function SimChallengeBar({ rules, progress, onRules, onOpen }: Props) {
  if (!rules.enabled) {
    return (
      <div className="sim-chal sim-chal--off">
        <span className="sim-chal-title">Challenge mode</span>
        <span className="muted sim-chal-sub">
          Practise against a target and a hard loss limit instead of replaying forever.
        </span>
        <button
          className="btn btn-sm"
          type="button"
          onClick={() => onRules({ ...DEFAULT_RULES, enabled: true })}
        >
          Enable
        </button>
        <button className="btn btn-sm btn-ghost" type="button" onClick={onOpen}>
          Rules
        </button>
      </div>
    )
  }

  const p = progress
  const targetPct = Math.min(100, p.targetPct)
  const lossPct = Math.min(100, p.lossUsedPct)
  const tone =
    p.status === 'passed' ? 'pass' : p.status === 'failed' ? 'fail' : p.capReached ? 'lock' : 'run'

  return (
    <div className={`sim-chal sim-chal--${tone}`}>
      <div className="sim-chal-head">
        <span className="sim-chal-title">
          {p.status === 'passed'
            ? '✓ Challenge passed'
            : p.status === 'failed'
              ? '✕ Challenge failed'
              : p.capReached
                ? '⏸ Daily cap reached'
                : 'Challenge running'}
        </span>
        <span className="sim-chal-meta">
          {p.daysTraded} day{p.daysTraded === 1 ? '' : 's'} traded
          {rules.maxTradesPerDay > 0 && p.dayTradesLeft !== Infinity
            ? ` · ${p.dayTradesLeft} trade${p.dayTradesLeft === 1 ? '' : 's'} left today`
            : ''}
        </span>
        <button className="btn btn-sm btn-ghost sim-chal-btn" type="button" onClick={onOpen}>
          Rules
        </button>
        <button
          className="btn btn-sm btn-ghost sim-chal-btn"
          type="button"
          onClick={() => onRules({ ...rules, enabled: false })}
        >
          Off
        </button>
      </div>

      <div className="sim-chal-bars">
        <div className="sim-chal-bar">
          <div className="sim-chal-bar-top">
            <span>Target {rules.targetPct}%</span>
            <b className={p.toTarget === 0 ? 'green' : ''}>
              {p.toTarget === 0 ? 'reached' : `${fmt(p.toTarget)} to go`}
            </b>
          </div>
          <div className="sim-chal-track">
            <div className="sim-chal-fill target" style={{ width: `${targetPct}%` }} />
          </div>
        </div>

        <div className="sim-chal-bar">
          <div className="sim-chal-bar-top">
            <span>Loss room {rules.maxLossPct}%</span>
            <b className={lossPct >= 80 ? 'red' : ''}>
              {p.lossRoom > 0 ? `${fmt(p.lossRoom)} left` : 'limit hit'}
            </b>
          </div>
          <div className="sim-chal-track">
            <div
              className={`sim-chal-fill loss ${lossPct >= 80 ? 'hot' : ''}`}
              style={{ width: `${lossPct}%` }}
            />
          </div>
        </div>
      </div>

      {(p.failReason || p.warnings.length > 0) && (
        <div className={`sim-chal-msg ${p.failReason ? 'fail' : p.capReached ? 'lock' : 'warn'}`}>
          {p.failReason ?? p.warnings[0]}
        </div>
      )}
    </div>
  )
}

function fmt(v: number): string {
  return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
