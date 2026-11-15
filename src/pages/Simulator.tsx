import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SimChart from '../components/sim/SimChart'
import SimDatePicker from '../components/sim/SimDatePicker'
import SimDrawBar from '../components/sim/SimDrawBar'
import SimPositions from '../components/sim/SimPositions'
import SimSettingsPanel from '../components/sim/SimSettingsPanel'
import SimTicket from '../components/sim/SimTicket'
import { aggregate, fmtTime, indexAtOrBefore, TF_LABEL } from '../sim/aggregate'
import { getManifest, loadMonthWrapped } from '../sim/data'
import { closeTrade, evaluateBar, floating, fmtMoney, usedMargin, withStops } from '../sim/engine'
import type { Bar, ClosedTrade, Manifest, Position, Side, TF } from '../sim/types'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { drawdownOf, readSessions, writeSession, type SavedSession } from '../sim/sessions'
import { useChartColors } from '../sim/useChartColors'
import type { Drawing, Tool } from '../sim/drawings'
import {
  loadAccount,
  loadChartSettings,
  loadIndicators,
  saveAccount,
  saveChartSettings,
  saveIndicators,
  type AccountSettings,
  type ChartSettings,
  type IndicatorSettings,
} from '../sim/settings'
import { loadNews, newsDaysInRange, newsInRange, type NewsEvent } from '../sim/news'
import { isDemoPreview } from '../lib/demo'
import { trackEvent } from '../lib/analytics'

const SPEEDS = [0.5, 1, 2, 4, 8, 16] as const
const TFS: TF[] = [1, 5, 15, 60, 240]

export default function Simulator() {
  const colors = useChartColors()

  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [month, setMonth] = useState('')
  const [m1, setM1] = useState<Bar[]>([])
  const [tf, setTf] = useState<TF>(15)
  const [cursor, setCursor] = useState(0)
  const [speed, setSpeed] = useState<number>(1)
  const [playing, setPlaying] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [balance, setBalance] = useState(() => loadAccount().startBalance)
  const [positions, setPositions] = useState<Position[]>([])
  const [closed, setClosed] = useState<ClosedTrade[]>([])
  const [marginCall, setMarginCall] = useState(false)
  const [seq, setSeq] = useState(1)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [savedList, setSaved] = useState<SavedSession[]>(() => readSessions())

  // carta + objek
  const [chartSettings, setChartSettings] = useState<ChartSettings>(loadChartSettings)
  const [indicators, setIndicators] = useState<IndicatorSettings>(loadIndicators)
  const [account, setAccount] = useState<AccountSettings>(loadAccount)
  const [tool, setTool] = useState<Tool>('none')
  const [drawColor, setDrawColor] = useState('#5e6ad2')
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showSeparators, setShowSeparators] = useState(true)
  const [tradeNews, setTradeNews] = useState(false)
  const [news, setNews] = useState<NewsEvent[]>([])
  const [recenterToken, setRecenterToken] = useState(0)
  const [hoverTime, setHoverTime] = useState<string | null>(null)

  /** cursor terakhir yang dah diperiksa untuk SL/TP (elak semak berulang) */
  const lastChecked = useRef(0)

  const bars = useMemo(() => aggregate(m1, tf), [m1, tf])
  const price = cursor > 0 && bars[cursor - 1] ? bars[cursor - 1].c : 0

  useEffect(() => saveChartSettings(chartSettings), [chartSettings])
  useEffect(() => saveIndicators(indicators), [indicators])
  useEffect(() => saveAccount(account), [account])

  useEffect(() => {
    loadNews().then(setNews)
  }, [])

  const newsDays = useMemo(() => {
    if (!tradeNews || !manifest) return new Set<string>()
    return newsDaysInRange(news, manifest.from, manifest.to)
  }, [tradeNews, news, manifest])

  const visibleNews = useMemo(() => {
    if (!tradeNews || !bars.length) return []
    return newsInRange(news, bars[0].t, bars[bars.length - 1].t)
  }, [tradeNews, news, bars])

  const newsCoverage = useMemo(() => {
    if (!news.length) return 'loading…'
    const days = news.map((e) => e.day).sort()
    return `${days[0]} → ${days[days.length - 1]}`
  }, [news])

  // ── muat manifest ───────────────────────────────────────────────
  useEffect(() => {
    getManifest()
      .then((m) => {
        setManifest(m)
        // start on a random month — replay, not memorising
        const pick = m.months[Math.floor(Math.random() * m.months.length)]
        setMonth(pick)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
  }, [])

  // ── muat data bulan ─────────────────────────────────────────────
  useEffect(() => {
    if (!month) return
    let dead = false
    const ac = new AbortController()
    setLoading(true)
    setErr(null)
    loadMonthWrapped(month, ac.signal)
      .then((rows) => {
        if (dead) return
        setM1(rows)
        const agg = aggregate(rows, tf)
        setCursor(Math.max(30, Math.floor(agg.length * 0.4)))
        setLoading(false)
      })
      .catch((e) => {
        if (dead) return
        setErr(e instanceof Error ? e.message : String(e))
        setLoading(false)
      })
    return () => {
      dead = true
      ac.abort()
    }
    // tf deliberately excluded: changing timeframe should not refetch data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  const resetSession = useCallback((nextMonth?: string) => {
    setPositions([])
    setClosed([])
    setBalance(account.startBalance)
    setMarginCall(false)
    setPlaying(false)
    setSavedMsg(null)
    setDrawings([])
    lastChecked.current = -1
    if (nextMonth) setMonth(nextMonth)
  }, [account.startBalance])

  // ── playback ────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return
    const interval = 320 / speed
    const id = window.setInterval(() => {
      setCursor((c) => {
        if (c >= bars.length - 1) {
          setPlaying(false)
          return c
        }
        return c + 1
      })
    }, interval)
    return () => window.clearInterval(id)
  }, [playing, speed, bars.length])

  // ── tukar timeframe, kekalkan masa di skrin ─────────────────────
  function changeTf(next: TF) {
    if (next === tf) return
    const anchor = bars[cursor - 1]?.t
    const nextBars = aggregate(m1, next)
    let nextCursor = nextBars.length
    if (anchor != null) {
      const i = indexAtOrBefore(nextBars, anchor)
      nextCursor = i >= 0 ? i + 1 : Math.min(30, nextBars.length)
    }
    setTf(next)
    setCursor(Math.max(1, Math.min(nextCursor, nextBars.length)))
    lastChecked.current = -1
    setRecenterToken((n) => n + 1)
  }

  // ── semak SL/TP pada setiap bar baru ────────────────────────────
  useEffect(() => {
    if (cursor <= 0 || !bars[cursor - 1]) return
    if (cursor <= lastChecked.current) {
      lastChecked.current = cursor
      return
    }
    const bar = bars[cursor - 1]
    lastChecked.current = cursor
    if (!positions.length) return

    const still: Position[] = []
    const newlyClosed: ClosedTrade[] = []
    for (const p of positions) {
      const hit = evaluateBar(p, bar)
      if (hit) {
        newlyClosed.push(closeTrade(p, hit.exit, bar.t, hit.reason))
      } else {
        still.push(p)
      }
    }
    if (newlyClosed.length) {
      setPositions(still)
      setClosed((prev) => [...newlyClosed.reverse(), ...prev])
      setBalance((b) => b + newlyClosed.reduce((a, t) => a + t.pnl, 0))
    }
    // margin call
    const fl = floating(still, bar.c)
    const eq = balance + fl
    const mg = usedMargin(still, bar.c, account.leverage)
    if (mg > 0 && eq / mg < 0.5 && still.length) {
      const forced = still.map((p) => closeTrade(p, bar.c, bar.t, 'MANUAL'))
      setPositions([])
      setClosed((prev) => [...forced.reverse(), ...prev])
      setBalance((b) => b + forced.reduce((a, t) => a + t.pnl, 0))
      setMarginCall(true)
      setPlaying(false)
    }
  }, [cursor, bars, positions, balance])

  // ── order ───────────────────────────────────────────────────────
  function openPosition(side: Side, lots: number, slDist: number, tpDist: number) {
    if (!price) return
    const { sl, tp } = withStops(side, price, slDist, tpDist)
    const pos: Position = {
      id: seq,
      side,
      lots,
      entry: price,
      sl,
      tp,
      openTime: bars[cursor - 1].t,
      openIndex: cursor - 1,
    }
    setSeq((s) => s + 1)
    setPositions((prev) => [...prev, pos])
    setMarginCall(false)
  }

  function closePosition(id: number) {
    const pos = positions.find((p) => p.id === id)
    if (!pos) return
    const t = bars[cursor - 1].t
    const ct = closeTrade(pos, price, t, 'MANUAL')
    setPositions((prev) => prev.filter((p) => p.id !== id))
    setClosed((prev) => [ct, ...prev])
    setBalance((b) => b + ct.pnl)
  }

  function closeAll() {
    if (!positions.length) return
    const t = bars[cursor - 1].t
    const all = positions.map((p) => closeTrade(p, price, t, 'MANUAL'))
    setPositions([])
    setClosed((prev) => [...all.reverse(), ...prev])
    setBalance((b) => b + all.reduce((a, x) => a + x.pnl, 0))
  }

  function randomJump() {
    if (!manifest) return
    let pick = month
    while (pick === month && manifest.months.length > 1) {
      pick = manifest.months[Math.floor(Math.random() * manifest.months.length)]
    }
    resetSession(pick)
  }

  // ── simpan sesi ─────────────────────────────────────────────────
  async function saveSession() {
    setSavedMsg(null)
    if (!closed.length) {
      setSavedMsg('No closed trades to save yet.')
      return
    }
    const net = closed.reduce((a, t) => a + t.pnl, 0)
    const dd = drawdownOf(closed, account.startBalance)
    const session: SavedSession = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: Date.now(),
      symbol: 'XAUUSD',
      month,
      tf,
      startBalance: account.startBalance,
      endBalance: balance,
      trades: closed.length,
      netPnl: Number(net.toFixed(2)),
      maxDrawdown: Number(dd.toFixed(2)),
      marginCalls: marginCall ? 1 : 0,
      rows: closed.slice(0, 200).map((t) => ({
        side: t.side,
        lots: t.lots,
        entry: t.entry,
        exit: t.exit,
        pnl: Number(t.pnl.toFixed(2)),
        reason: t.reason,
        openTime: t.openTime,
        exitTime: t.exitTime,
      })),
    }
    // Layer 1 — always works, no account or DB needed.
    setSaved(writeSession(session))
    trackEvent('sim_session_saved', { trades: closed.length, net: Number(net.toFixed(2)) })

    // Layer 2 — Supabase, when the table exists and the user is signed in.
    if (isDemoPreview()) {
      setSavedMsg(`Saved on this device only (${closed.length} trades, demo mode).`)
      return
    }
    if (!isSupabaseConfigured()) {
      setSavedMsg(`Saved on this device (${closed.length} trades).`)
      return
    }
    try {
      const sb = getSupabase()
      const { data: u } = await sb.auth.getUser()
      const uid = u.user?.id
      if (!uid) {
        setSavedMsg(`Saved on this device (${closed.length} trades). Sign in to sync.`)
        return
      }
      const { data: sess, error } = await sb
        .from('sim_sessions')
        .insert({
          user_id: uid,
          symbol: 'XAUUSD',
          start_month: month,
          end_month: month,
          tf,
          start_balance: account.startBalance,
          end_balance: balance,
          trades: closed.length,
          net_pnl: Number(net.toFixed(2)),
          max_drawdown: Number(dd.toFixed(2)),
          margin_calls: marginCall ? 1 : 0,
        })
        .select('id')
        .single()
      if (error) throw error
      const rows = closed.map((t, i) => ({
        session_id: sess.id,
        user_id: uid,
        side: t.side,
        lots: t.lots,
        entry_price: t.entry,
        exit_price: t.exit,
        sl: t.sl,
        tp: t.tp,
        open_time: new Date(t.openTime * 1000).toISOString(),
        close_time: new Date(t.exitTime * 1000).toISOString(),
        pnl: Number(t.pnl.toFixed(2)),
        reason: t.reason,
        seq: closed.length - i,
      }))
      const { error: e2 } = await sb.from('sim_trades').insert(rows)
      if (e2) throw e2
      setSavedMsg(`Saved and synced to your account (${closed.length} trades).`)
    } catch (e) {
      // Table may not exist yet (supabase/simulator.sql). The session is still
      // safe on this device — never imply the data was lost.
      setSavedMsg(
        `Saved on this device. Cloud sync failed: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  }

  const equity = balance + floating(positions, price)
  const margin = usedMargin(positions, price, account.leverage)
  const freeMargin = equity - margin
  const marginLevel = margin > 0 ? (equity / margin) * 100 : null
  const atEnd = cursor >= bars.length - 1

  return (
    <div className="sim">
      <div className="page-head">
        <div>
          <div className="kicker">Replay lab</div>
          <h1>XAUUSD Chart Simulator</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Real M1 data ({(manifest?.bars ?? 0).toLocaleString()} bars, {manifest?.from} → {manifest?.to}).
            No real money, no broker connection.
          </p>
        </div>
        <div className="sim-head-actions">
          <button className="btn btn-sm" onClick={() => setSettingsOpen(true)}>
            ⚙ Chart settings
          </button>
          <button className="btn btn-sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '⤡ Collapse' : '⤢ Expand'}
          </button>
          <button className="btn btn-sm" onClick={() => resetSession()} disabled={!m1.length}>
            Reset
          </button>
          <button className="btn btn-sm" onClick={randomJump} disabled={!manifest}>
            🎲 Random month
          </button>
          <button className="btn btn-sm btn-primary" onClick={saveSession} disabled={!closed.length}>
            Save session
          </button>
        </div>
      </div>

      {err && <div className="sim-alert red">{err}</div>}
      {savedMsg && <div className="sim-alert">{savedMsg}</div>}
      {marginCall && <div className="sim-alert red">⚠ Margin call — positions were force closed.</div>}

      <div className="sim-toolbar">
        <div className="sim-toolbar-group">
          <button
            className="btn btn-sm"
            onClick={() => {
              setPlaying(false)
              setCursor(Math.max(1, cursor - 1))
            }}
            disabled={!bars.length || cursor <= 1}
            title="Step back one bar"
          >
            ⏮
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              if (atEnd) setCursor(30)
              setPlaying((p) => !p)
            }}
            disabled={!bars.length}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              setPlaying(false)
              setCursor((c) => Math.min(bars.length - 1, c + 1))
            }}
            disabled={!bars.length || atEnd}
            title="Step one bar"
          >
            ⏭
          </button>
          <div className="seg">
            {SPEEDS.map((s) => (
              <button key={s} className={`seg-btn ${speed === s ? 'active' : ''}`} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        <div className="sim-toolbar-group">
          <div className="seg">
            {TFS.map((t) => (
              <button key={t} className={`seg-btn ${tf === t ? 'active' : ''}`} onClick={() => changeTf(t)}>
                {TF_LABEL[t]}
              </button>
            ))}
          </div>
          <SimDatePicker
            value={month}
            months={manifest?.months ?? []}
            newsDays={newsDays}
            showNews={tradeNews}
            onPick={(m) => {
              if (m !== month) resetSession(m)
            }}
          />
          <SimDrawBar
            tool={tool}
            color={drawColor}
            count={drawings.length}
            onTool={setTool}
            onColor={setDrawColor}
            onUndo={() => setDrawings((prev) => prev.slice(0, -1))}
            onClear={() => setDrawings([])}
          />
        </div>

        <div className="sim-toolbar-group">
          <span className="sim-clock" title="Bar time (UTC)">{price ? fmtTime(bars[cursor - 1].t) : '—'}</span>
          {hoverTime && <span className="sim-clock sim-hover-clock" title="Time under cursor (UTC)">{hoverTime}</span>}
          <span className="sim-price">{price ? price.toFixed(2) : '—'}</span>
        </div>
      </div>

      {loading && <div className="sim-loading">Loading {month} data…</div>}

      <div className={`sim-grid ${expanded ? 'sim-expanded' : ''}`}>
        <div className="sim-chart-slot">
          <SimChart
            bars={bars}
            cursor={cursor}
            sl={positions[0]?.sl ?? null}
            tp={positions[0]?.tp ?? null}
            entry={positions[0]?.entry ?? null}
            side={positions[0]?.side ?? null}
            colors={colors}
            settings={chartSettings}
            indicators={indicators}
            tool={tool}
            drawColor={drawColor}
            drawings={drawings}
            onAddDrawing={(d) => setDrawings((prev) => [...prev, d])}
            onRemoveDrawing={(id) => setDrawings((prev) => prev.filter((x) => x.id !== id))}
            onUpdateDrawing={(d) => setDrawings((prev) => prev.map((x) => (x.id === d.id ? d : x)))}
            showSeparators={showSeparators}
            news={visibleNews}
            recenterToken={recenterToken}
            onHoverTime={setHoverTime}
          />
        </div>
        <aside className="sim-side">
          <SimTicket
            price={price}
            balance={balance}
            equity={equity}
            margin={margin}
            freeMargin={freeMargin}
            marginLevel={marginLevel}
            leverage={account.leverage}
            onOrder={openPosition}
            disabled={!price || marginCall}
          />
        </aside>
        {expanded && (
          <div className="sim-orderbar-slot">
            <SimTicket
              compact
              price={price}
              balance={balance}
              equity={equity}
              margin={margin}
              freeMargin={freeMargin}
              marginLevel={marginLevel}
              leverage={account.leverage}
              onOrder={openPosition}
              disabled={!price || marginCall}
            />
          </div>
        )}
        <div className="sim-pos-slot">
          <SimPositions
            positions={positions}
            closed={closed}
            price={price}
            onClose={closePosition}
            onCloseAll={closeAll}
          />
        </div>
      </div>

      <div className="sim-foot">
        <span className="muted">
          This session: {closed.length} closed trade{closed.length === 1 ? '' : 's'} · net{' '}
          {fmtMoney(closed.reduce((a, t) => a + t.pnl, 0))}
        </span>
        <Link className="btn btn-sm btn-ghost" to="/app">
          ← Back to journal
        </Link>
      </div>

      {savedList.length > 0 && (
        <details className="panel sim-saved">
          <summary>
            Saved sessions ({savedList.length})
            <span className="muted"> — on this device</span>
          </summary>
          <div className="table-wrap">
            <table className="tbl tbl--wide">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Month</th>
                  <th>TF</th>
                  <th>Trades</th>
                  <th>Net</th>
                  <th>Max DD</th>
                  <th>MC</th>
                </tr>
              </thead>
              <tbody>
                {savedList.map((s) => (
                  <tr key={s.id}>
                    <td className="mono muted">{fmtTime(Math.floor(s.savedAt / 1000))}</td>
                    <td className="mono">{s.month}</td>
                    <td className="mono">{TF_LABEL[s.tf as TF] ?? `M${s.tf}`}</td>
                    <td>{s.trades}</td>
                    <td className={s.netPnl >= 0 ? 'green' : 'red'}>{fmtMoney(s.netPnl)}</td>
                    <td className="mono">{fmtMoney(-s.maxDrawdown)}</td>
                    <td>{s.marginCalls > 0 ? <span className="sim-badge sl">YES</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <SimSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={chartSettings}
        onSettings={setChartSettings}
        indicators={indicators}
        onIndicators={setIndicators}
        account={account}
        onAccount={setAccount}
        showSeparators={showSeparators}
        onSeparators={setShowSeparators}
        tradeNews={tradeNews}
        onTradeNews={setTradeNews}
        newsCoverage={newsCoverage}
      />
    </div>
  )
}
