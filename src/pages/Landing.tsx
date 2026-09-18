import { Link } from 'react-router-dom'
import { CookieSettingsLink } from '../components/CookieBanner'
import { ProofSection, StepsSection, FaqSection } from '../components/Proof'

export default function Landing() {
  return (
    <div className="landing">
      {/* ── Hero ─────────────────────────────────────────── */}
      <header className="landing-hero">
        <nav className="landing-nav">
          <span className="nav-brand">
            <span className="nav-logo" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="var(--primary)" />
                <path d="M12 7 16.5 12 12 17 7.5 12 12 7Z" fill="var(--surface)" />
              </svg>
            </span>
            The Gold Plan
          </span>
          <div className="landing-cta">
            <Link className="btn btn-ghost" to="/pricing">
              Pricing
            </Link>
            <Link className="btn btn-ghost" to="/app">
              Log in
            </Link>
            <Link className="btn btn-primary" to="/app?demo=1">
              Try demo
            </Link>
          </div>
        </nav>

        <div className="landing-hero-inner">
          <div className="kicker">XAUUSD Trading Journal</div>
          <h1 className="landing-title">
            Stop turning one red gold trade
            <br />
            <span className="landing-title-accent">into a failed daily drawdown.</span>
          </h1>
          <p className="landing-sub">
            The Gold Plan is a trading journal built for XAUUSD. Set one daily loss limit per
            account, log every trade, and see exactly which sessions, setups and emotions are
            costing you — before the account pays for it.
          </p>
          <div className="landing-hero-actions">
            <Link className="btn btn-primary btn-lg" to="/app?demo=1">
              Explore the demo
            </Link>
            <Link className="btn btn-ghost btn-lg" to="/pricing">
              See pricing
            </Link>
          </div>
        </div>
      </header>

      {/* ── Stats strip (product facts, not social proof) ── */}
      <section className="landing-strip">
        <div className="landing-strip-item">
          <div className="landing-strip-num">1,517</div>
          <div className="landing-strip-label">trades in the demo dataset</div>
        </div>
        <div className="landing-strip-item">
          <div className="landing-strip-num">3</div>
          <div className="landing-strip-label">accounts in the demo</div>
        </div>
        <div className="landing-strip-item">
          <div className="landing-strip-num">6</div>
          <div className="landing-strip-label">core analytics</div>
        </div>
        <div className="landing-strip-item">
          <div className="landing-strip-num">100%</div>
          <div className="landing-strip-label">your data, private</div>
        </div>
      </section>

      {/* ── Problem / founder note / what this is not ────── */}
      <ProofSection />

      {/* ── Features ─────────────────────────────────────── */}
      <section className="landing-section">
        <div className="page-head">
          <div>
            <div className="kicker">Features</div>
            <h2>Everything you need to trade deliberately</h2>
          </div>
        </div>

        <div className="landing-grid">
          <div className="panel landing-card">
            <div className="landing-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m7 14 4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Dashboard analytics</h3>
            <p>Net P&amp;L, win rate, profit factor, daily equity curve and emotion-vs-P&amp;L breakdowns at a glance.</p>
          </div>

          <div className="panel landing-card">
            <div className="landing-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Fast trade logging</h3>
            <p>Record direction, entry/exit, volume and P&amp;L in seconds with live calculations and session tracking.</p>
          </div>

          <div className="panel landing-card">
            <div className="landing-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Kill switch</h3>
            <p>Set a daily loss limit per account. When you hit it, the plan tells you to stop — protecting your capital.</p>
          </div>

          <div className="panel landing-card">
            <div className="landing-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Session &amp; emotion insight</h3>
            <p>See which sessions and emotional states drive your best and worst results — so you can repeat what works.</p>
          </div>

          <div className="panel landing-card">
            <div className="landing-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Share card</h3>
            <p>Generate a clean shareable card of your day's performance to post or send — built in, no design skills needed.</p>
          </div>

          <div className="panel landing-card">
            <div className="landing-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Your data, private</h3>
            <p>Every account is isolated with row-level security. Only you see your trades and analytics.</p>
          </div>
        </div>
      </section>

      {/* ── How it works + FAQ ───────────────────────────── */}
      <StepsSection />

      <section className="landing-section">
        <div className="panel landing-notice landing-honest" role="note">
          <h3>No testimonials here yet — on purpose</h3>
          <p>
            This app is new and I would rather show you nothing than show you a quote I made up.
            What you can check today: open the demo with real sample data, read the{' '}
            <Link to="/help">full guide</Link>, or email me and ask me anything before you pay.
            That is the honest version of proof.
          </p>
        </div>
      </section>

      <FaqSection />

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="landing-section landing-cta-band">
        <div className="panel landing-cta-card">
          <div className="kicker">Get started</div>
          <h2>Start trading with a plan today</h2>
          <p className="landing-sub">
            Try the live demo with sample data, or create your own account and log your first trade in under a minute.
          </p>
          <div className="landing-hero-actions">
            <Link className="btn btn-primary btn-lg" to="/app?demo=1">
              Explore the demo
            </Link>
            <Link className="btn btn-ghost btn-lg" to="/pricing">
              See pricing
            </Link>
            <Link className="btn btn-ghost btn-lg" to="/help">
              How to use
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="nav-brand">
          <span className="nav-logo" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="var(--primary)" />
              <path d="M12 7 16.5 12 12 17 7.5 12 12 7Z" fill="var(--surface)" />
            </svg>
          </span>
          The Gold Plan
        </span>
        <span className="landing-footer-note">
          thegoldplan-web.vercel.app — built for deliberate XAUUSD trading.
        </span>
        <span className="landing-footer-note">
          <Link to="/privacy">Privacy</Link> · <CookieSettingsLink />
        </span>
      </footer>
    </div>
  )
}
