import type { ChartKind, ChartSettings, IndicatorSettings, AccountSettings } from '../../sim/settings'

interface Props {
  open: boolean
  onClose: () => void
  settings: ChartSettings
  onSettings: (s: ChartSettings) => void
  indicators: IndicatorSettings
  onIndicators: (i: IndicatorSettings) => void
  account: AccountSettings
  onAccount: (a: AccountSettings) => void
  showSeparators: boolean
  onSeparators: (v: boolean) => void
  tradeNews: boolean
  onTradeNews: (v: boolean) => void
  /** Liputan data berita, untuk nota dalam panel. */
  newsCoverage: string
}

const KINDS: Array<{ id: ChartKind; label: string }> = [
  { id: 'candles', label: 'Candles' },
  { id: 'bars', label: 'Bars' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
]

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="sim-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <em className="muted"> {hint}</em>}
      </span>
    </label>
  )
}

export default function SimSettingsPanel({
  open,
  onClose,
  settings,
  onSettings,
  indicators,
  onIndicators,
  account,
  onAccount,
  showSeparators,
  onSeparators,
  tradeNews,
  onTradeNews,
  newsCoverage,
}: Props) {
  if (!open) return null
  const set = (patch: Partial<ChartSettings>) => onSettings({ ...settings, ...patch })
  const ind = (patch: Partial<IndicatorSettings>) => onIndicators({ ...indicators, ...patch })

  return (
    <div className="sim-settings" role="dialog" aria-label="Chart settings">
      <div className="sim-settings-head">
        <b>Chart settings</b>
        <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Close settings">
          ✕
        </button>
      </div>

      <div className="sim-settings-body">
        <section>
          <h4>Chart type</h4>
          <div className="seg seg-wrap">
            {KINDS.map((k) => (
              <button
                key={k.id}
                className={`seg-btn ${settings.kind === k.id ? 'active' : ''}`}
                onClick={() => set({ kind: k.id })}
              >
                {k.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4>Elements</h4>
          <Toggle checked={settings.showGrid} onChange={(v) => set({ showGrid: v })} label="Grid lines" />
          <Toggle checked={settings.showCrosshair} onChange={(v) => set({ showCrosshair: v })} label="Crosshair" />
          <Toggle checked={settings.showLastPrice} onChange={(v) => set({ showLastPrice: v })} label="Last price tag" />
          <Toggle checked={settings.showPriceLine} onChange={(v) => set({ showPriceLine: v })} label="Price line" />
          <Toggle checked={settings.showLegend} onChange={(v) => set({ showLegend: v })} label="OHLC legend" />
        </section>

        <section>
          <h4>Colors</h4>
          <Toggle
            checked={settings.followTheme}
            onChange={(v) => set({ followTheme: v })}
            label="Follow site theme"
            hint="(Linear / Gold / Mono)"
          />
          {!settings.followTheme && (
            <div className="sim-colors">
              <label>
                <span>Bull</span>
                <input type="color" value={settings.upColor} onChange={(e) => set({ upColor: e.target.value })} />
              </label>
              <label>
                <span>Bear</span>
                <input type="color" value={settings.downColor} onChange={(e) => set({ downColor: e.target.value })} />
              </label>
            </div>
          )}
        </section>

        <section>
          <h4>Indicators</h4>
          <div className="sim-ind">
            <Toggle checked={indicators.sma} onChange={(v) => ind({ sma: v })} label="SMA" />
            {indicators.sma && (
              <input
                className="sim-num"
                type="number"
                min={2}
                max={200}
                value={indicators.smaPeriod}
                onChange={(e) => ind({ smaPeriod: Math.max(2, Number(e.target.value) || 20) })}
                aria-label="SMA period"
              />
            )}
          </div>
          <div className="sim-ind">
            <Toggle checked={indicators.ema} onChange={(v) => ind({ ema: v })} label="EMA" />
            {indicators.ema && (
              <input
                className="sim-num"
                type="number"
                min={2}
                max={200}
                value={indicators.emaPeriod}
                onChange={(e) => ind({ emaPeriod: Math.max(2, Number(e.target.value) || 50) })}
                aria-label="EMA period"
              />
            )}
          </div>
          <div className="sim-ind">
            <Toggle checked={indicators.bb} onChange={(v) => ind({ bb: v })} label="Bollinger Bands" />
            {indicators.bb && (
              <>
                <input
                  className="sim-num"
                  type="number"
                  min={5}
                  max={100}
                  value={indicators.bbPeriod}
                  onChange={(e) => ind({ bbPeriod: Math.max(5, Number(e.target.value) || 20) })}
                  aria-label="Bollinger period"
                />
                <input
                  className="sim-num"
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={indicators.bbMult}
                  onChange={(e) => ind({ bbMult: Math.max(1, Number(e.target.value) || 2) })}
                  aria-label="Bollinger deviation"
                />
              </>
            )}
          </div>
          <div className="sim-ind">
            <Toggle checked={indicators.rsi} onChange={(v) => ind({ rsi: v })} label="RSI" />
            {indicators.rsi && (
              <input
                className="sim-num"
                type="number"
                min={2}
                max={50}
                value={indicators.rsiPeriod}
                onChange={(e) => ind({ rsiPeriod: Math.max(2, Number(e.target.value) || 14) })}
                aria-label="RSI period"
              />
            )}
          </div>
          <Toggle
            checked={indicators.pdh}
            onChange={(v) => ind({ pdh: v })}
            label="Prev day high / low"
            hint="(PDH/PDL)"
          />
        </section>

        <section>
          <h4>Account</h4>
          <p className="muted sim-note">Applies on the next reset.</p>
          <div className="field">
            <label htmlFor="sim-balance">Starting balance ($)</label>
            <input
              id="sim-balance"
              className="sim-num"
              type="number"
              min={100}
              step={1000}
              value={account.startBalance}
              onChange={(e) =>
                onAccount({ ...account, startBalance: Math.max(100, Number(e.target.value) || 100) })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="sim-lev">Leverage</label>
            <select
              id="sim-lev"
              value={account.leverage}
              onChange={(e) => onAccount({ ...account, leverage: Number(e.target.value) })}
            >
              {[50, 100, 200, 500, 1000].map((n) => (
                <option key={n} value={n}>
                  1:{n}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h4>Chart extras</h4>
          <Toggle
            checked={showSeparators}
            onChange={onSeparators}
            label="Period separators"
            hint="vertical line at each new day"
          />
          <Toggle
            checked={tradeNews}
            onChange={onTradeNews}
            label="Trade news"
            hint="highlight USD high-impact events"
          />
          <p className="muted sim-note">News data: {newsCoverage}. US bank holidays always show on the calendar.</p>
        </section>
      </div>
    </div>
  )
}
