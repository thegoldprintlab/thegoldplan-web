import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { fmtPnl } from '../lib/stats'

export default function KillSwitch() {
  const { trades, settings } = useData()

  const status = useMemo(() => {
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayISO = `${today.getFullYear()}-${mm}-${dd}`
    const todayTrades = trades.filter((t) => t.trade_date === todayISO)
    const todayPnl = todayTrades.reduce((a, t) => a + t.profit_loss, 0)
    const limit = Number(settings.max_daily_loss) || 100
    const remaining = limit + todayPnl // todayPnl negative when losing
    const pct = (todayPnl / limit) * 100

    if (todayPnl >= 0) {
      return { level: 'safe', remaining, pct, text: '✅ Trading in profit — stay disciplined.' }
    }
    if (Math.abs(todayPnl) >= limit) {
      return { level: 'blown', remaining: 0, pct: 100, text: '⛔ LIMIT HIT. Stop trading. Walk away from the screen now.' }
    }
    const usedPct = Math.abs(pct)
    if (usedPct >= 80) {
      return {
        level: 'danger',
        remaining,
        pct: usedPct,
        text: `WALK AWAY. You are ${Math.max(1, Math.round((limit - Math.abs(todayPnl)) / limit * 100))}% away from blowing your account.`,
      }
    }
    if (usedPct >= 50) {
      return {
        level: 'warn',
        remaining,
        pct: usedPct,
        text: '⚠️ Separuh daily loss limit dah guna. Jangan revenge trade.',
      }
    }
    return { level: 'ok', remaining, pct: usedPct, text: `Daily loss used: ${usedPct.toFixed(0)}%. Still within plan.` }
  }, [trades, settings.max_daily_loss])

  if (status.level === 'safe') {
    return (
      <div className="kill-switch safe">
        <div>
          <div className="ks-title">🛡️ Jurulatih Akaun</div>
          <div className="ks-text">{status.text}</div>
        </div>
        <div className="ks-num">{fmtPnl(0)} remaining</div>
      </div>
    )
  }

  if (status.level === 'ok') {
    return (
      <div className="kill-switch ok">
        <div>
          <div className="ks-title">🛡️ Jurulatih Akaun</div>
          <div className="ks-text">{status.text}</div>
        </div>
        <div className="ks-num">-{Math.abs(status.pct).toFixed(0)}%</div>
      </div>
    )
  }

  if (status.level === 'warn') {
    return (
      <div className="kill-switch warn">
        <div>
          <div className="ks-title">⚠️ AMARAN</div>
          <div className="ks-text">{status.text}</div>
        </div>
        <div className="ks-num">-{Math.abs(status.pct).toFixed(0)}%</div>
      </div>
    )
  }

  if (status.level === 'danger') {
    return (
      <div className="kill-switch danger">
        <div>
          <div className="ks-title">🔴 WALK AWAY</div>
          <div className="ks-text">{status.text}</div>
        </div>
        <div className="ks-num">-{Math.abs(status.pct).toFixed(0)}%</div>
      </div>
    )
  }

  return (
    <div className="kill-switch blown">
      <div>
        <div className="ks-title">⛔ ACCOUNT PROTECTED</div>
        <div className="ks-text">{status.text}</div>
      </div>
      <div className="ks-num">-100%</div>
    </div>
  )
}
