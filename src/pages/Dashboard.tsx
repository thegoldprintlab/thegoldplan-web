import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { toScoreboard, groupStats, fmtMoney, fmtPnl, capitalOf, roiPct } from '../lib/stats'
import type { DashboardStats, DailyPnl } from '../lib/types'
import KillSwitch from '../components/KillSwitch'
import ShareCard from '../components/ShareCard'
import UpgradeGate from '../components/UpgradeGate'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  const cls = tone === 'pos' ? 'green' : tone === 'neg' ? 'red' : ''
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${cls}`}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const { trades, settings, loading, demoMode } = useData()
  const [account, setAccount] = useState('All Accounts')

  const accounts = useMemo(() => ['All Accounts', ...settings.accounts], [settings.accounts])

  const filtered = useMemo(() => {
    if (account === 'All Accounts') return trades
    return trades.filter((t) => t.account === account)
  }, [trades, account])

  const stats = useMemo<DashboardStats | null>(() => {
    if (!filtered.length) return null
    const wins = filtered.filter((t) => t.profit_loss > 0)
    const losses = filtered.filter((t) => t.profit_loss < 0)
    const grossProfit = wins.reduce((a, t) => a + t.profit_loss, 0)
    const grossLoss = losses.reduce((a, t) => a + t.profit_loss, 0)
    return {
      totalTrades: filtered.length,
      totalNet: filtered.reduce((a, t) => a + t.profit_loss, 0),
      winRate: filtered.length ? (wins.length / filtered.length) * 100 : 0,
      profitFactor: grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? 999 : 0,
      avgWin: wins.length ? grossProfit / wins.length : 0,
      avgLoss: losses.length ? grossLoss / losses.length : 0,
      wins: wins.length,
      losses: losses.length,
      bestTrade: Math.max(...filtered.map((t) => t.profit_loss)),
      worstTrade: Math.min(...filtered.map((t) => t.profit_loss)),
    }
  }, [filtered])

  const bySetup = useMemo(() => toScoreboard(groupStats(filtered, (t) => t.setup)), [filtered])
  const bySession = useMemo(() => toScoreboard(groupStats(filtered, (t) => t.session)), [filtered])
  const byEmotion = useMemo(() => toScoreboard(groupStats(filtered, (t) => t.emotion)), [filtered])

  const byAccount = useMemo(() => {
    return toScoreboard(groupStats(filtered, (t) => t.account)).map((r) => {
      const capital = capitalOf(settings, r.label)
      const roi = roiPct(r.net, capital)
      return { ...r, capital, roi }
    })
  }, [filtered, settings])

  const equity = useMemo<DailyPnl[]>(() => {
    const byDate = new Map<string, number>()
    for (const t of filtered) {
      byDate.set(t.trade_date, (byDate.get(t.trade_date) ?? 0) + t.profit_loss)
    }
    const sorted = Array.from(byDate.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
    let cum = 0
    return sorted.map(([date, pnl]) => {
      cum += pnl
      return { date, pnl, cumulative: cum }
    })
  }, [filtered])

  const emotionBars = useMemo(() => {
    return byEmotion.map((e) => ({
      name: e.label,
      net: Math.round(e.net),
      trades: e.trades,
    }))
  }, [byEmotion])

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  )

  if (loading) return <div className="page-loading">Loading dashboard…</div>

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Command Center</div>
          <h1>Dashboard</h1>
          <p className="page-sub">A calm, disciplined view of your XAUUSD journey.</p>
        </div>
        <div className="head-date">{todayLabel}</div>
      </div>

      {demoMode && (
        <div className="panel" style={{ padding: '14px 18px', marginBottom: 18 }}>
          <span style={{ fontWeight: 600 }}>Preview mode</span>{' '}
          <span className="muted" style={{ fontSize: '0.88rem' }}>
            — showing sample data so you can explore the design. Use the pill on the top-right to switch designs &amp; theme.
          </span>
        </div>
      )}

      <div className="toolbar">
        <label>Account</label>
        <select className="select" value={account} onChange={(e) => setAccount(e.target.value)}>
          {accounts.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <KillSwitch trades={filtered} />
      <UpgradeGate feature="Share Card">
        <ShareCard trades={filtered} />
      </UpgradeGate>

      {!stats ? (
        <div className="empty-state">No trades in this view.</div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Net P&L" value={fmtMoney(stats.totalNet)} tone={stats.totalNet >= 0 ? 'pos' : 'neg'} />
            <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
            <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} />
            <StatCard label="Trades" value={`${stats.totalTrades}`} />
            <StatCard label="Avg Win" value={fmtMoney(stats.avgWin)} tone="pos" />
            <StatCard label="Avg Loss" value={fmtMoney(stats.avgLoss)} tone="neg" />
            <StatCard label="Best Trade" value={fmtMoney(stats.bestTrade)} tone="pos" />
            <StatCard label="Worst Trade" value={fmtMoney(stats.worstTrade)} tone="neg" />
          </div>

          <div className="panel">
            <div className="share-head">
              <h2>Daily Equity Growth</h2>
              <div className="chart-legend" aria-hidden="true">
                <span>
                  <i className="chart-dot" style={{ background: 'var(--primary)' }} />
                  Cumulative P&amp;L
                </span>
                <span>
                  <i className="chart-dot" style={{ background: 'var(--primary-hover)', opacity: 0.7 }} />
                  Daily P&amp;L
                </span>
              </div>
            </div>
            <div className="chart" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
                  <XAxis dataKey="date" stroke="var(--ink-subtle)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--hairline)' }} />
                  <YAxis stroke="var(--ink-subtle)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--hairline-strong)',
                      borderRadius: 10,
                      color: 'var(--ink)',
                    }}
                    labelStyle={{ color: 'var(--ink-muted)' }}
                    formatter={(v: number, name: string) => [fmtMoney(v), name === 'cumulative' ? 'Cumulative P&L' : 'Daily P&L']}
                  />
                  <Line type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke="var(--primary)" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="pnl" name="Daily P&L" stroke="var(--primary-hover)" strokeWidth={1.4} strokeOpacity={0.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <h2>Emotion vs Net P&L</h2>
            <div className="chart" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionBars}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--ink-subtle)" fontSize={10} interval={0} tickLine={false} axisLine={{ stroke: 'var(--hairline)' }} />
                  <YAxis stroke="var(--ink-subtle)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--hairline-strong)',
                      borderRadius: 10,
                      color: 'var(--ink)',
                    }}
                    labelStyle={{ color: 'var(--ink-muted)' }}
                    formatter={(v: number, name: string) => [name === 'net' ? fmtMoney(v) : v, name === 'net' ? 'Net P&L' : 'Trades']}
                  />
                  <Bar dataKey="net" name="Net P&L" radius={[4, 4, 0, 0]}>
                    {emotionBars.map((e) => (
                      <Cell key={e.name} fill={e.net >= 0 ? 'var(--green)' : 'var(--red)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Scoreboard title="Setup Scoreboard" rows={bySetup} />
          <Scoreboard title="Session Scoreboard" rows={bySession} />
          {account === 'All Accounts' && <Scoreboard title="Account Performance" rows={byAccount} accounts />}
          <Scoreboard title="Emotion Scoreboard" rows={byEmotion} />
        </>
      )}
    </div>
  )
}

function Scoreboard({
  title,
  rows,
  accounts = false,
}: {
  title: string
  rows: Array<{ label: string; trades: number; net: number; winRate: number } & Partial<{ capital: number; roi: number | null }>>
  accounts?: boolean
}) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{title.split(' ')[0]}</th>
              <th className="num">Trades</th>
              <th className="num">Win Rate</th>
              <th className="num">Net P&L</th>
              {accounts && (
                <>
                  <th className="num">Capital</th>
                  <th className="num">ROI</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td className="num">{r.trades}</td>
                <td className="num">{r.winRate.toFixed(1)}%</td>
                <td className={`num ${r.net >= 0 ? 'green' : 'red'}`}>{fmtPnl(r.net)}</td>
                {accounts && (
                  <>
                    <td className="num">{r.capital ? fmtMoney(r.capital) : '—'}</td>
                    <td className={`num ${(r.roi ?? 0) >= 0 ? 'green' : 'red'}`}>
                      {r.roi == null ? '—' : `${r.roi >= 0 ? '+' : ''}${r.roi.toFixed(1)}%`}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
