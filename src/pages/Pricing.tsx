import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBilling } from '../context/BillingContext'
import { PLANS } from '../lib/plans'
import { checkoutUrl } from '../lib/billing'

/** Public pricing page (B1) — no login needed to browse. */
export default function Pricing() {
  const { session } = useAuth()
  const billing = useBilling()
  const [busy, setBusy] = useState<string | null>(null)

  function go(paymentLink: string, planId: string) {
    if (!paymentLink) {
      setBusy(planId)
      setTimeout(() => setBusy(null), 2500)
      return
    }
    const url = checkoutUrl(paymentLink, session?.user?.email ?? null, session?.user?.id ?? null)
    window.location.href = url
  }

  return (
    <div className="pricing">
      <header className="pricing-hero">
        <div className="kicker">Pricing</div>
        <h1 className="landing-title">
          One plan. <span className="landing-title-accent">One edge.</span>
        </h1>
        <p className="landing-sub">
          A disciplined XAUUSD journal that pays for itself in one avoided bad trade.
        </p>
      </header>

      <section className="pricing-grid">
        {PLANS.map((p) => (
          <div key={p.id} className={`pricing-card panel${p.featured ? ' featured' : ''}`}>
            {p.featured && <div className="pricing-badge">Most popular</div>}
            <h2>{p.name}</h2>
            <div className="pricing-price">
              <span className="pricing-num">${p.price}</span>
              <span className="pricing-int">{p.interval}</span>
            </div>
            <p className="muted pricing-tagline">{p.tagline}</p>
            <ul className="pricing-features">
              {p.features.map((f) => (
                <li key={f}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            {p.paymentLink ? (
              <button className={`btn ${p.featured ? 'btn-primary' : 'btn'} btn-lg`} onClick={() => go(p.paymentLink, p.id)}>
                {p.cta}
              </button>
            ) : (
              <button className={`btn ${p.featured ? 'btn-primary' : 'btn'} btn-lg`} onClick={() => go('', p.id)}>
                {busy === p.id ? 'Billing coming soon…' : p.cta}
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="pricing-foot">
        <p className="muted">
          {session ? (
            <>
              Logged in as <b>{session.user.email}</b>. Your subscription activates automatically after payment.
            </>
          ) : (
            <>
              Have an account? <Link to="/app">Log in</Link> before checkout so your plan activates instantly.
            </>
          )}
        </p>
        {billing.enabled && billing.active && (
          <p className="form-ok" style={{ textAlign: 'center' }}>
            You're on an active plan — thank you.
          </p>
        )}
        <p className="muted" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
          Secure checkout by Stripe. Cancel anytime from your account page.
        </p>
      </section>
    </div>
  )
}
