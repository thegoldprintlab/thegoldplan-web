import { useAuth } from '../context/AuthContext'
import { useBilling } from '../context/BillingContext'
import { planById } from '../lib/plans'
import { checkoutUrl } from '../lib/billing'

/** Account / subscription management (B1 + B3 support). */
export default function AccountPage() {
  const { session } = useAuth()
  const { enabled, loading, subscription, active, refresh } = useBilling()

  if (!session) return <div className="empty-state">Not signed in.</div>

  const plan = subscription ? planById(subscription.plan) : null

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Account</div>
          <h1>Account &amp; Billing</h1>
          <p className="page-sub">Your profile, plan, and subscription.</p>
        </div>
      </div>

      <div className="panel">
        <h2>Profile</h2>
        <p className="muted">
          Signed in as <b>{session.user.email}</b>
        </p>
      </div>

      <div className="panel">
        <h2>Subscription</h2>
        {!enabled ? (
          <>
            <p className="muted">Billing is not enabled for this deployment yet.</p>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              When enabled, your plan and renewal date will appear here.
            </p>
          </>
        ) : loading ? (
          <p className="muted">Loading your plan…</p>
        ) : !subscription ? (
          <>
            <p className="muted">You don't have an active plan.</p>
            <a className="btn btn-primary" href="/pricing">
              Choose a plan
            </a>
          </>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 12 }}>
              Current plan:{' '}
              <b>
                {plan?.name} (${plan?.price} {plan?.interval})
              </b>
            </p>
            <p className={`${active ? 'green' : 'red'}`} style={{ marginBottom: 12 }}>
              Status: <b>{subscription.status}</b>
              {subscription.current_period_end
                ? ` · renews ${new Date(subscription.current_period_end).toLocaleDateString('en-US')}`
                : ''}
            </p>
            {subscription.stripe_customer_id && (
              <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 12 }}>
                Stripe customer: {subscription.stripe_customer_id}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={refresh}>
                Refresh
              </button>
              {plan?.paymentLink && (
                <a
                  className="btn btn-primary"
                  href={checkoutUrl(plan.paymentLink, session.user.email ?? null, session.user.id)}
                >
                  Manage / renew
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
