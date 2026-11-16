import { DEFAULT_RULES, type ChallengeRules } from '../../sim/challenge'

interface Props {
  open: boolean
  rules: ChallengeRules
  onRules: (r: ChallengeRules) => void
  onClose: () => void
}

const PRESETS: { name: string; note: string; rules: Omit<ChallengeRules, 'enabled'> }[] = [
  {
    name: 'Prop evaluation',
    note: '8% target · 10% max loss · 5% daily · 3 trades/day',
    rules: { targetPct: 8, maxLossPct: 10, dailyLossPct: 5, maxTradesPerDay: 3, minDays: 0 },
  },
  {
    name: 'Strict discipline',
    note: '5% target · 6% max loss · 2% daily · 2 trades/day',
    rules: { targetPct: 5, maxLossPct: 6, dailyLossPct: 2, maxTradesPerDay: 2, minDays: 0 },
  },
  {
    name: 'One good trade',
    note: '3% target · 3% max loss · 1 trade/day',
    rules: { targetPct: 3, maxLossPct: 3, dailyLossPct: 3, maxTradesPerDay: 1, minDays: 0 },
  },
]

export default function SimChallengePanel({ open, rules, onRules, onClose }: Props) {
  if (!open) return null

  function set<K extends keyof ChallengeRules>(key: K, value: ChallengeRules[K]) {
    onRules({ ...rules, [key]: value })
  }

  return (
    <div className="sim-settings-backdrop" onClick={onClose}>
      <div
        className="panel sim-settings sim-chal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Challenge rules"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sim-settings-head">
          <h2>Challenge rules</h2>
          <button className="btn btn-sm btn-ghost" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="sim-chal-intro">
          A replay with no ending teaches nothing. Set a target and a hard limit, then find out whether your
          process survives contact with a rule.
        </p>

        <div className="sim-chal-presets">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="sim-chal-preset"
              onClick={() => onRules({ ...p.rules, enabled: true })}
            >
              <b>{p.name}</b>
              <span>{p.note}</span>
            </button>
          ))}
        </div>

        <div className="sim-chal-fields">
          <label className="field">
            <span>Profit target (%)</span>
            <input
              className="input"
              type="number"
              min="0.5"
              step="0.5"
              value={rules.targetPct}
              onChange={(e) => set('targetPct', Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="field">
            <span>Max loss (%)</span>
            <input
              className="input"
              type="number"
              min="0.5"
              step="0.5"
              value={rules.maxLossPct}
              onChange={(e) => set('maxLossPct', Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="field">
            <span>Daily loss limit (%)</span>
            <input
              className="input"
              type="number"
              min="0"
              step="0.5"
              value={rules.dailyLossPct}
              onChange={(e) => set('dailyLossPct', Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <label className="field">
            <span>Trades per day (0 = no cap)</span>
            <input
              className="input"
              type="number"
              min="0"
              step="1"
              value={rules.maxTradesPerDay}
              onChange={(e) => set('maxTradesPerDay', Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            />
          </label>
          <label className="field">
            <span>Minimum trading days (0 = none)</span>
            <input
              className="input"
              type="number"
              min="0"
              step="1"
              value={rules.minDays}
              onChange={(e) => set('minDays', Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            />
          </label>
        </div>

        <div className="sim-chal-foot">
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => onRules({ ...DEFAULT_RULES, enabled: true })}
          >
            Reset to defaults
          </button>
          <button className="btn btn-sm btn-primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
