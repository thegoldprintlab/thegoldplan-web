import { useMemo, useState } from 'react'
import { fmtMoney, fmtPnl } from '../lib/stats'
import { toScoreboard, groupStats } from '../lib/stats'
import type { Trade } from '../lib/types'

export default function ShareCard({ trades }: { trades: Trade[] }) {
  const [mode, setMode] = useState<'money' | 'percent'>('money')
  const [show, setShow] = useState(false)

  const today = useMemo(() => {
    const d = new Date()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
  }, [])

  const card = useMemo(() => {
    const todayTrades = trades.filter((t) => t.trade_date === today)
    const wins = todayTrades.filter((t) => t.profit_loss > 0)
    const losses = todayTrades.filter((t) => t.profit_loss < 0)
    const net = todayTrades.reduce((a, t) => a + t.profit_loss, 0)
    const pips = todayTrades.reduce((a, t) => a + t.pips, 0)

    const bySetup = toScoreboard(groupStats(todayTrades, (t) => t.setup))
    const byEmotion = toScoreboard(groupStats(todayTrades, (t) => t.emotion))

    return {
      trades: todayTrades.length,
      wins: wins.length,
      losses: losses.length,
      net,
      pips,
      winRate: todayTrades.length ? (wins.length / todayTrades.length) * 100 : 0,
      bestSetup: bySetup[0]?.label ?? '—',
      bestSetupNet: bySetup[0]?.net ?? 0,
      dominantEmotion: byEmotion[0]?.label ?? '—',
    }
  }, [trades, today])

  function value(v: number): string {
    if (mode === 'money') return fmtMoney(v)
    const pct = (v / 1000) * 100 // normalized: $1000 baseline = 100%
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  function download() {
    const el = document.getElementById('share-card')
    if (!el) return
    const svg = el.innerHTML
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1350
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#010102'
    ctx.fillRect(0, 0, 1080, 1350)

    const img = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1080, 1350)
      // Watermark
      ctx.fillStyle = '#5e6ad2'
      ctx.font = '600 28px Inter, system-ui, sans-serif'
      ctx.fillText('◈ The Gold Plan', 48, 1280)
      ctx.fillStyle = '#8a8f98'
      ctx.font = '400 20px Inter, system-ui, sans-serif'
      ctx.fillText('thegoldplan.app', 48, 1312)
      const a = document.createElement('a')
      a.download = `gold-plan-${today}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div className="panel">
      <div className="share-head">
        <div>
          <h2>Share Daily Result</h2>
          <p className="muted">Spotify Wrapped style — jana kad prestasi untuk kongsi di media sosial.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShow(true)}>Buka Kad</button>
      </div>

      {show && (
        <div className="share-overlay">
          <div className="share-modal">
            <div className="share-toolbar">
              <div className="seg" style={{ maxWidth: 220 }}>
                <button className={mode === 'money' ? 'seg-btn active buy' : 'seg-btn'} onClick={() => setMode('money')}>$ Money</button>
                <button className={mode === 'percent' ? 'seg-btn active buy' : 'seg-btn'} onClick={() => setMode('percent')}>% Percent</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={download}>Download PNG</button>
                <button className="btn btn-ghost" onClick={() => setShow(false)}>Tutup</button>
              </div>
            </div>

            <div id="share-card" className="share-card">
              <div className="share-brand">◈ The Gold Plan</div>
              <div className="share-date">{today}</div>

              <div className="share-net">{value(card.net)}</div>
              <div className="share-net-label">{mode === 'money' ? 'Net P&L Hari Ini' : 'Pulangan Harian (normalized)'}</div>

              <div className="share-stats">
                <div className="share-stat">
                  <div className="share-stat-num">{card.trades}</div>
                  <div className="share-stat-label">Trades</div>
                </div>
                <div className="share-stat">
                  <div className="share-stat-num">{card.wins}W / {card.losses}L</div>
                  <div className="share-stat-label">Rekod</div>
                </div>
                <div className="share-stat">
                  <div className="share-stat-num">{card.winRate.toFixed(0)}%</div>
                  <div className="share-stat-label">Win Rate</div>
                </div>
              </div>

              <div className="share-row">
                <span className="muted">Setup Terbaik</span>
                <span className="share-row-val">{card.bestSetup} {fmtPnl(card.bestSetupNet)}</span>
              </div>
              <div className="share-row">
                <span className="muted">Emosi Dominan</span>
                <span className="share-row-val">{card.dominantEmotion}</span>
              </div>
              <div className="share-row">
                <span className="muted">Pips</span>
                <span className="share-row-val">{card.pips >= 0 ? '+' : ''}{card.pips}</span>
              </div>

              <div className="share-footer">Disiplin adalah edge. Trade seperti jurulatih memerhati. 🏆</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
