import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

/**
 * Trust layer for the landing + pricing pages.
 *
 * Rules for this file (do not break them):
 *  - No invented testimonials, user counts, pass rates or P&L claims.
 *  - Numbers on the landing strip are the founder's OWN account figures,
 *    labelled as such ("my own accounts") — never dressed up as customer
 *    count or social proof. The demo dataset is separate (4 accounts / ~107
 *    seeded trades) and must never be quoted as real user activity.
 *  - Compliance wording: journaling software, not signals, not a broker.
 *    The Kill Switch warns; it never closes a trade.
 */

export function ProofSection() {
  return (
    <section className="landing-section">
      <div className="page-head">
        <div>
          <div className="kicker">Why it exists</div>
          <h2>Built for the trade that ends the day, not the week</h2>
        </div>
      </div>

      <div className="landing-grid landing-grid-2">
        <div className="panel landing-card">
          <h3>The problem is rarely the entry</h3>
          <p>
            Most blown accounts are not blown by a bad setup. They are blown by the second and third
            trade after a loss — when a small red day turns into a breached daily drawdown. The Gold
            Plan puts a number on that risk <b>before</b> it happens: one daily loss limit per
            account, tracked live against today's P&amp;L.
          </p>
        </div>

        <div className="panel landing-card">
          <h3>Founder note</h3>
          <p>
            Built by an XAUUSD trader, for XAUUSD traders. I run this journal on my own 3 accounts —
            1,517 trades logged so far — and I got tired of spreadsheets that told me my P&amp;L but
            never told me to <i>stop</i>. So the Kill Switch was built first and the dashboard
            second. Everything here exists because I needed it on my own account.
          </p>
        </div>
      </div>

      <div className="panel landing-notice" role="note">
        <h3>What this is not</h3>
        <ul className="landing-notice-list">
          <li>
            <b>Not signals.</b> No entries, no take-profits, no trade calls. You bring the strategy.
          </li>
          <li>
            <b>Not a broker or a prop firm.</b> The Gold Plan is independent journaling software and
            is not affiliated with, endorsed by, or connected to any prop firm.
          </li>
          <li>
            <b>The Kill Switch warns — it does not trade.</b> It cannot and will not close a
            position. It tells you your limit is hit; you make the decision.
          </li>
          <li>
            <b>No performance promises.</b> No pass-rate, profit or payout claims. Results depend on
            your own trading, not on this app.
          </li>
        </ul>
      </div>
    </section>
  )
}

export function StepsSection() {
  return (
    <section className="landing-section">
      <div className="page-head">
        <div>
          <div className="kicker">How it works</div>
          <h2>Three steps, under a minute to start</h2>
        </div>
      </div>

      <div className="landing-grid">
        <div className="panel landing-card">
          <div className="landing-step-num">1</div>
          <h3>Set your daily loss limit</h3>
          <p>
            One number per account in Settings. That is your rule for the day, written down before
            the market opens — not decided in the middle of a losing streak.
          </p>
        </div>
        <div className="panel landing-card">
          <div className="landing-step-num">2</div>
          <h3>Log every trade, same day</h3>
          <p>
            Direction, entry/exit, volume, real P&amp;L, session and emotion. Type it or import your
            MT5 Excel report — it parses every trade for you.
          </p>
        </div>
        <div className="panel landing-card">
          <div className="landing-step-num">3</div>
          <h3>Review what actually made money</h3>
          <p>
            Scoreboards by session, setup and emotion show what to repeat and what to cut. Weekly
            review, not daily guessing.
          </p>
        </div>
      </div>

      <div className="landing-hero-actions" style={{ justifyContent: 'center' }}>
        <Link className="btn btn-primary btn-lg" to="/app?demo=1">
          Open the live demo
        </Link>
        <Link className="btn btn-ghost btn-lg" to="/help">
          See the full guide
        </Link>
      </div>
    </section>
  )
}

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'Why pay when I can build this in Excel or Notion?',
    a: (
      <>
        A spreadsheet is free and flexible, and if it is already keeping you disciplined, keep it.
        What a spreadsheet does not do is watch today's P&amp;L against your limit and warn you at
        50%, 80% and 100% of it, or score your results by session, setup and emotion automatically.
        That is the part you are paying for.
      </>
    ),
  },
  {
    q: 'Does it place or close trades for me?',
    a: (
      <>
        No. The Gold Plan is journaling software. It never connects to your broker's execution and
        never closes a position. The Kill Switch is a <b>warning</b> — you are still the one who
        stops.
      </>
    ),
  },
  {
    q: 'Does it work with FundingPips, FTMO or E8?',
    a: (
      <>
        It is broker and firm agnostic — you set your own daily loss limit to match whatever rules
        your account has. Import works with any MT5 Excel report. We are not affiliated with any
        prop firm.
      </>
    ),
  },
  {
    q: 'Is my data private?',
    a: (
      <>
        Yes. Every account is isolated with row-level security, so only you can read your trades and
        analytics. No ads, and we do not sell data.
      </>
    ),
  },
  {
    q: 'I already use a signal bot. Do I need a journal?',
    a: (
      <>
        A signal gives you an entry. It does not tell you whether you followed the plan, sized it
        correctly, or kept it together after a loss. The journal measures the part signals cannot:
        your execution.
      </>
    ),
  },
  {
    q: 'Can I cancel?',
    a: (
      <>
        Monthly is cancel-anytime from <b>Account &amp; Billing</b>. Lifetime is a single payment
        with no recurring charge. Checkout is handled by Stripe in USD.
      </>
    ),
  },
]

export function FaqSection({ title = 'Straight answers' }: { title?: string }) {
  return (
    <section className="landing-section">
      <div className="page-head">
        <div>
          <div className="kicker">FAQ</div>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="faq-grid">
        {FAQ.map((item) => (
          <div key={item.q} className="panel faq-item">
            <h4>{item.q}</h4>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
