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

    // Per-account: use the account-specific limit if set, else the global default.
    const accountNames = settings.accounts.length ? settings.accounts : []
    const defaultLimit = Number(settings.max_daily_loss) || 100
    const rows = accountNames
      .map((account) => {
        const accountTrades = todayTrades.filter((t) => t.account === account)
        const pnl = accountTrades.reduce((a, t) => a + t.profit_loss, 0)
        const rawLimit = settings.account_daily_loss_limits?.[account]
        const limit = Number(rawLimit) > 0 ? Number(rawLimit) : defaultLimit
        const remaining = limit + pnl
        const usedPct = pnl < 0 ? Math.min(100, (Math.abs(pnl) / limit) * 100) : 0
        return { account, pnl, limit, remaining, usedPct }
      })
      .filter((r) => r.pnl < 0) // only show accounts that are losing today

    return { rows }
  }, [trades, settings.max_daily_loss, settings.accounts, settings.account_daily_loss_limits])

  const rows = status.rows

  function levelFor(pnl: number, usedPct: number, limit: number) {
    if (Math.abs(pnl) >= limit) return 'blown'
    if (usedPct >= 80) return 'danger'
    if (usedPct >= 50) return 'warn'
    return 'ok'
  }

  function levelClass(level: string) {
    return `kill-switch ${level}`
  }

  function levelTitle(level: string) {
    switch (level) {
      case 'blown': return '⛔ ACCOUNT PROTECTED'
      case 'danger': return '🔴 WALK AWAY'
      case 'warn': return '⚠️ AMARAN'
      default: return '🛡️ Jurulatih Akaun'
    }
  }

  function levelText(level: string, pnl: number, limit: number, usedPct: number) {
    switch (level) {
      case 'blown':
        return '⛔ LIMIT HIT. Stop trading this account. Walk away from the screen now.'
      case 'danger':
        return `WALK AWAY. You are ${Math.max(1, Math.round((limit - Math.abs(pnl)) / limit * 100))}% away from blowing this account.`
      case 'warn':
        return '⚠️ Separuh daily loss limit dah guna. Jangan revenge trade.'
      default:
        return `Daily loss used: ${usedPct.toFixed(0)}%. Still within plan.`
    }
  }

  // No account is losing today → all clear
  if (!rows.length) {
    return (
      <div className="kill-switch safe">
        <div>
          <div className="ks-title">🛡️ Jurulatih Akaun</div>
          <div className="ks-text">✅ Trading in profit — stay disciplined.</div>
        </div>
        <div className="ks-num">$0 used</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r) => {
        const level = levelFor(r.pnl, r.usedPct, r.limit)
        const sign = r.pnl >= 0 ? '' : '-'
        return (
          <div key={r.account} className={levelClass(level)}>
            <div>
              <div className="ks-title">{levelTitle(level)} · {r.account}</div>
              <div className="ks-text">{levelText(level, r.pnl, r.limit, r.usedPct)}</div>
            </div>
            <div className="ks-num">
              {level === 'blown' ? '-100%' : `${sign}${Math.abs(r.usedPct).toFixed(0)}% · ${fmtPnl(r.remaining)} left`}
            </div>
          </div>
        )
      })}
    </div>
  )
}
