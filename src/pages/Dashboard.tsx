import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { toScoreboard, groupStats, fmtMoney, fmtPnl, capitalOf, roiPct } from '../lib/stats'
import type { DashboardStats, DailyPnl } from '../lib/types'
import KillSwitch from '../components/KillSwitch'
import ShareCard from '../components/ShareCard'
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
  Legend,
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
  const { trades, settings, loading } = useData()

  const stats = useMemo<DashboardStats | null>(() => {
    if (!trades.length) return null
    const wins = trades.filter((t) => t.profit_loss > 0)
    const losses = trades.filter((t) => t.profit_loss < 0)
    const grossProfit = wins.reduce((a, t) => a + t.profit_loss, 0)
    const grossLoss = losses.reduce((a, t) => a + t.profit_loss, 0)
    return {
      totalTrades: trades.length,
      totalNet: trades.reduce((a, t) => a + t.profit_loss, 0),
      winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
      profitFactor: grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? 999 : 0,
      avgWin: wins.length ? grossProfit / wins.length : 0,
      avgLoss: losses.length ? grossLoss / losses.length : 0,
      wins: wins.length,
      losses: losses.length,
      bestTrade: Math.max(...trades.map((t) => t.profit_loss)),
      worstTrade: Math.min(...trades.map((t) => t.profit_loss)),
    }
  }, [trades])

  const bySetup = useMemo(() => toScoreboard(groupStats(trades, (t) => t.setup)), [trades])
  const bySession = useMemo(() => toScoreboard(groupStats(trades, (t) => t.session)), [trades])
  const byEmotion = useMemo(() => toScoreboard(groupStats(trades, (t) => t.emotion)), [trades])

  const byAccount = useMemo(() => {
    return toScoreboard(groupStats(trades, (t) => t.account)).map((r) => {
      const capital = capitalOf(settings, r.label)
      const roi = roiPct(r.net, capital)
      return { ...r, capital, roi }
    })
  }, [trades, settings])

  const equity = useMemo<DailyPnl[]>(() => {
    const byDate = new Map<string, number>()
    for (const t of trades) {
      byDate.set(t.trade_date, (byDate.get(t.trade_date) ?? 0) + t.profit_loss)
    }
    const sorted = Array.from(byDate.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
    let cum = 0
    return sorted.map(([date, pnl]) => {
      cum += pnl
      return { date, pnl, cumulative: cum }
    })
  }, [trades])

  const emotionBars = useMemo(() => {
    return byEmotion.map((e) => ({
      name: e.label,
      net: Math.round(e.net),
      trades: e.trades,
    }))
  }, [byEmotion])

  if (loading) return <div className="page-loading">Loading dashboard…</div>
  if (!stats) return <div className="empty-state">No trades yet. Add your first trade from the Input Form.</div>

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p className="muted">Your command center for growth.</p>
      </div>

      <KillSwitch />

      <ShareCard />

      <div className="stat-grid">
        <StatCard label="Total Net P&L" value={fmtMoney(stats.totalNet)} tone={stats.totalNet >= 0 ? 'pos' : 'neg'} />
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
        <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} />
        <StatCard label="Trades" value={`${stats.totalTrades} (${stats.wins}W / ${stats.losses}L)`} />
        <StatCard label="Avg Win" value={fmtMoney(stats.avgWin)} tone="pos" />
        <StatCard label="Avg Loss" value={fmtMoney(stats.avgLoss)} tone="neg" />
        <StatCard label="Best Trade" value={fmtMoney(stats.bestTrade)} tone="pos" />
        <StatCard label="Worst Trade" value={fmtMoney(stats.worstTrade)} tone="neg" />
      </div>

      <div className="panel">
        <h2>Daily Equity Growth</h2>
        <div className="chart" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23252a" />
              <XAxis dataKey="date" stroke="#8a8f98" fontSize={11} />
              <YAxis stroke="#8a8f98" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#0f1011', border: '1px solid #23252a', borderRadius: 8 }}
                labelStyle={{ color: '#d0d6e0' }}
                formatter={(v: number, name: string) => [fmtMoney(v), name === 'cumulative' ? 'Cumulative P&L' : 'Daily P&L']}
              />
              <Legend />
              <Line type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke="#5e6ad2" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pnl" name="Daily P&L" stroke="#828fff" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <h2>Emotion vs Net P&L</h2>
        <div className="chart" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={emotionBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23252a" />
              <XAxis dataKey="name" stroke="#8a8f98" fontSize={10} interval={0} />
              <YAxis stroke="#8a8f98" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#0f1011', border: '1px solid #23252a', borderRadius: 8 }}
                labelStyle={{ color: '#d0d6e0' }}
                formatter={(v: number, name: string) => [name === 'net' ? fmtMoney(v) : v, name === 'net' ? 'Net P&L' : 'Trades']}
              />
              <Bar dataKey="net" name="Net P&L" radius={[4, 4, 0, 0]}>
                {emotionBars.map((e) => (
                  <Cell key={e.name} fill={e.net >= 0 ? '#27a644' : '#d64545'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Scoreboard title="Setup Scoreboard" rows={bySetup} />
      <Scoreboard title="Session Scoreboard" rows={bySession} />
      <Scoreboard title="Account Performance" rows={byAccount} accounts />
      <Scoreboard title="Emotion Scoreboard" rows={byEmotion} />
    </div>
  )
}

function Scoreboard({ title, rows, accounts = false }: { title: string; rows: Array<{ label: string; trades: number; net: number; winRate: number } & Partial<{ capital: number; roi: number | null }>>; accounts?: boolean }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <table className="tbl">
        <thead>
          <tr>
            <th>{title.split(' ')[0]}</th>
            <th className="num">Trades</th>
            <th className="num">Win Rate</th>
            <th className="num">Net P&L</th>
            {accounts && (
              <>
                <th className="num">Starting Capital</th>
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
  )
}
