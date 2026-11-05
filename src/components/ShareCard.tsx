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
    const bySession = toScoreboard(groupStats(todayTrades, (t) => t.session))

    return {
      trades: todayTrades.length,
      wins: wins.length,
      losses: losses.length,
      net,
      pips,
      winRate: todayTrades.length ? (wins.length / todayTrades.length) * 100 : 0,
      bestSetup: bySetup[0]?.label ?? '—',
      bestSetupNet: bySetup[0]?.net ?? 0,
      bestSession: bySession[0]?.label ?? '—',
      dominantEmotion: byEmotion[0]?.label ?? '—',
    }
  }, [trades, today])

  function value(v: number): string {
    if (mode === 'money') return fmtMoney(v)
    const pct = (v / 1000) * 100 // normalized: $1000 baseline = 100%
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  // Draw the card straight onto a canvas. Previous version tried to rasterise
  // el.innerHTML as an SVG image — that string has no <svg> root, so the Image
  // never fired onload and "Download PNG" silently did nothing.
  async function download() {
    const W = 1080
    const H = 1350
    const M = 88 // margin

    const cs = getComputedStyle(document.documentElement)
    const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
    const canvas_bg = v('--canvas', '#f6f2e9')
    const surface = v('--surface', '#fffdf8')
    const hairline = v('--hairline', '#e6ddc9')
    const ink = v('--ink', '#211a10')
    const subtle = v('--ink-subtle', '#8b7a5d')
    const primary = v('--primary', '#9a6b1d')
    const green = v('--green', '#1f7d47')
    const display = v('--font-display', 'Georgia, serif')
    const body = v('--font-body', 'Inter, system-ui, sans-serif')

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready
      } catch {
        /* fonts optional */
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    ctx.fillStyle = canvas_bg
    ctx.fillRect(0, 0, W, H)

    // Card surface
    roundRect(M * 0.55, M * 0.55, W - M * 1.1, H - M * 1.1, 34)
    ctx.save()
    ctx.clip()
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, surface)
    grad.addColorStop(1, canvas_bg)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
    roundRect(M * 0.55, M * 0.55, W - M * 1.1, H - M * 1.1, 34)
    ctx.strokeStyle = hairline
    ctx.lineWidth = 2
    ctx.stroke()

    // Brand
    ctx.fillStyle = primary
    roundRect(M, M + 4, 44, 44, 12)
    ctx.fill()
    ctx.fillStyle = surface
    ctx.beginPath()
    ctx.moveTo(M + 22, M + 15)
    ctx.lineTo(M + 32, M + 26)
    ctx.lineTo(M + 22, M + 37)
    ctx.lineTo(M + 12, M + 26)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = primary
    ctx.font = `600 40px ${display}`
    ctx.textBaseline = 'middle'
    ctx.fillText('The Gold Plan', M + 62, M + 27)

    // Date
    const dateLabel = new Date(`${today}T00:00:00`)
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase()
    ctx.fillStyle = subtle
    ctx.font = `500 22px ${body}`
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(dateLabel, M, M + 104)

    // Net value — body font on purpose: Playfair's "$" renders with crossing
    // strokes at large sizes on canvas, which looked like a glitch on the card.
    ctx.fillStyle = ink
    ctx.font = `700 104px ${body}`
    ctx.fillText(value(card.net), M, M + 238)

    ctx.fillStyle = subtle
    ctx.font = `400 28px ${body}`
    ctx.fillText(mode === 'money' ? 'Net P&L Today' : 'Daily Return (normalized)', M, M + 292)

    // Stat tiles
    const tileY = M + 372
    const tileH = 168
    const gap = 20
    const tileW = (W - M * 2 - gap * 2) / 3
    const tiles: [string, string][] = [
      [`${card.trades}`, 'TRADES'],
      [`${card.wins}W / ${card.losses}L`, 'RECORD'],
      [`${card.winRate.toFixed(0)}%`, 'WIN RATE'],
    ]
    tiles.forEach(([num, label], i) => {
      const x = M + i * (tileW + gap)
      roundRect(x, tileY, tileW, tileH, 16)
      ctx.fillStyle = surface
      ctx.fill()
      ctx.strokeStyle = hairline
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = ink
      ctx.font = `650 50px ${display}`
      ctx.textAlign = 'center'
      ctx.fillText(num, x + tileW / 2, tileY + 84)

      ctx.fillStyle = subtle
      ctx.font = `500 18px ${body}`
      ctx.fillText(label, x + tileW / 2, tileY + 126)
      ctx.textAlign = 'left'
    })

    // Rows
    let rowY = tileY + tileH + 78
    const rows: [string, string][] = [
      ['Best Setup', `${card.bestSetup} ${fmtPnl(card.bestSetupNet)}`],
      ['Best Session', card.bestSession],
      ['Dominant Emotion', card.dominantEmotion],
      ['Pips', `${card.pips >= 0 ? '+' : ''}${Number(card.pips.toFixed(1))}`],
    ]
    rows.forEach(([label, val], i) => {
      ctx.fillStyle = subtle
      ctx.font = `400 27px ${body}`
      ctx.fillText(label, M, rowY)

      ctx.fillStyle = i === 0 ? green : ink
      ctx.font = `600 27px ${body}`
      ctx.textAlign = 'right'
      ctx.fillText(val, W - M, rowY)
      ctx.textAlign = 'left'

      if (i < rows.length - 1) {
        ctx.strokeStyle = hairline
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(M, rowY + 30)
        ctx.lineTo(W - M, rowY + 30)
        ctx.stroke()
      }
      rowY += 88
    })

    // Footer
    ctx.fillStyle = subtle
    ctx.font = `italic 400 24px ${body}`
    ctx.textAlign = 'center'
    ctx.fillText('Discipline is the edge. Trade like a coach is watching.', W / 2, H - M - 44)
    ctx.font = `500 21px ${body}`
    ctx.fillText('thegoldplan.my', W / 2, H - M - 4)
    ctx.textAlign = 'left'

    const a = document.createElement('a')
    a.download = `gold-plan-${today}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="panel">
      <div className="share-head">
        <div>
          <h2>Share Daily Result</h2>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            A social-ready performance card for today.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShow(true)}>Open Card</button>
      </div>

      {show && (
        <div className="share-overlay">
          <div className="share-modal">
            <div className="share-toolbar">
              <div className="seg" style={{ maxWidth: 230 }}>
                <button className={mode === 'money' ? 'seg-btn active buy' : 'seg-btn'} onClick={() => setMode('money')}>$ Money</button>
                <button className={mode === 'percent' ? 'seg-btn active buy' : 'seg-btn'} onClick={() => setMode('percent')}>% Percent</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={download}>Download PNG</button>
                <button className="btn btn-ghost" onClick={() => setShow(false)}>Close</button>
              </div>
            </div>

            <div id="share-card" className="share-card">
              <div className="share-brand">
                <span className="nav-logo" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="var(--primary)" />
                    <path d="M12 7 16.5 12 12 17 7.5 12 12 7Z" fill="var(--surface)" />
                  </svg>
                </span>
                The Gold Plan
              </div>
              <div className="share-date">{today}</div>

              <div className="share-net">{value(card.net)}</div>
              <div className="share-net-label">{mode === 'money' ? 'Net P&L Today' : 'Daily Return (normalized)'}</div>

              <div className="share-stats">
                <div className="share-stat">
                  <div className="share-stat-num">{card.trades}</div>
                  <div className="share-stat-label">Trades</div>
                </div>
                <div className="share-stat">
                  <div className="share-stat-num">{card.wins}W / {card.losses}L</div>
                  <div className="share-stat-label">Record</div>
                </div>
                <div className="share-stat">
                  <div className="share-stat-num">{card.winRate.toFixed(0)}%</div>
                  <div className="share-stat-label">Win Rate</div>
                </div>
              </div>

              <div className="share-row">
                <span className="muted">Best Setup</span>
                <span className="share-row-val">{card.bestSetup} {fmtPnl(card.bestSetupNet)}</span>
              </div>
              <div className="share-row">
                <span className="muted">Best Session</span>
                <span className="share-row-val">{card.bestSession}</span>
              </div>
              <div className="share-row">
                <span className="muted">Dominant Emotion</span>
                <span className="share-row-val">{card.dominantEmotion}</span>
              </div>
              <div className="share-row">
                <span className="muted">Pips</span>
                <span className="share-row-val">{card.pips >= 0 ? '+' : ''}{Number(card.pips.toFixed(1))}</span>
              </div>

              <div className="share-footer">Discipline is the edge. Trade like a coach is watching.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
