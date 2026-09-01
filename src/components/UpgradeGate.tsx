import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useBilling } from '../context/BillingContext'

/**
 * B3 — Premium gating. When billing is enabled and the user has no active
 * subscription, feature content is hidden behind an upgrade prompt.
 * With billing disabled (default) this renders children untouched.
 */
export default function UpgradeGate({
  children,
  feature,
  className = '',
}: {
  children: ReactNode
  feature: string
  className?: string
}) {
  const { enabled, loading, active } = useBilling()
  if (!enabled || loading || active) return <>{children}</>

  return (
    <div className={`upgrade-gate ${className}`}>
      <div className="upgrade-gate-head">
        <h3>{feature} is a Pro feature</h3>
        <p className="muted">Upgrade to unlock {feature.toLowerCase()} and keep your edge.</p>
      </div>
      <Link className="btn btn-primary" to="/pricing">
        Upgrade now
      </Link>
    </div>
  )
}
