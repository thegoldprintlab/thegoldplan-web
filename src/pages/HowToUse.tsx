/** How to use — accessible in-app as a help page, with FAQ + support. */
export default function HowToUse() {
  return (
    <div className="howto">
      <div className="page-head">
        <h1>How To Use The Gold Plan</h1>
        <p className="muted">Your quick guide to logging, analysing &amp; staying disciplined.</p>
      </div>

      <div className="howto-grid">
        <section className="panel">
          <h3>1. Log a trade</h3>
          <p>
            Go to <b>Input Form</b>. Pick account, session, setup, direction (BUY/SELL), entry/exit
            price, <b>volume (lots)</b> and your <b>actual Profit/Loss ($)</b>. Profit is manual —
            type what you really made. Submit and it's saved.
          </p>
        </section>

        <section className="panel">
          <h3>2. Dashboard</h3>
          <p>
            Filter by <b>account</b> at the top. Watch your Net P&amp;L, win rate, profit factor,
            equity curve, and emotion-vs-P&amp;L. Scoreboards show which setup, session and emotion
            make you money.
          </p>
        </section>

        <section className="panel">
          <h3>3. Kill Switch</h3>
          <p>
            Set a <b>daily loss limit per account</b> in Settings. The Kill Switch watches today's
            P&amp;L: 🟢 profit → 🟡 50% → 🔴 80% (walk away) → ⛔ limit hit. Obey it. It keeps you
            funded.
          </p>
        </section>

        <section className="panel">
          <h3>4. Trading Log</h3>
          <p>
            See every trade in a filterable table — date, session, setup, volume, pips, P&amp;L,
            emotion. Delete mistakes with the trash icon.
          </p>
        </section>

        <section className="panel">
          <h3>5. Import MT5</h3>
          <p>
            Don't want to type? Use <b>Import MT5</b> — upload your MT5 Excel report
            (History → Report → Excel) and it parses every trade automatically.
          </p>
        </section>

        <section className="panel">
          <h3>6. Share Card</h3>
          <p>
            On the Dashboard, generate a clean 4:5 card of your performance — toggle $ or %, download
            PNG, and post it. Accountability + free exposure.
          </p>
        </section>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Best practices</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>Log every trade the same day — never from memory</li>
          <li>Be honest with P&amp;L — a journal only works if it's true</li>
          <li>Set your daily loss limit and obey the Kill Switch</li>
          <li>Tag your emotion — psychology is half the game</li>
          <li>Review weekly: cut what loses, repeat what wins</li>
        </ul>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>FAQ</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Is my data private?</h4>
            <p>
              Yes. Every account is isolated with row-level security — only you can see your own
              trades and analytics.
            </p>
          </div>
          <div className="faq-item">
            <h4>How do I import old data?</h4>
            <p>
              Use <b>Import MT5</b> — export the Excel report from MT5 (History → Report → Excel) and
              upload it. All trades are parsed automatically.
            </p>
          </div>
          <div className="faq-item">
            <h4>Can I use it on my phone?</h4>
            <p>
              Yes — the app is fully responsive. Open the same URL in your phone browser. For quick
              logging, use the <b>Quick Log API</b> (iOS Shortcuts).
            </p>
          </div>
          <div className="faq-item">
            <h4>How do I cancel my subscription?</h4>
            <p>
              Go to <b>Account &amp; Billing</b>. Monthly plans can be managed from there — cancel
              anytime.
            </p>
          </div>
          <div className="faq-item">
            <h4>Is there a free trial?</h4>
            <p>
              Yes — open the <a href="/app?demo=1">demo</a> to try every feature with sample data, no
              signup needed. If you have a promo code, redeem it in Account &amp; Billing.
            </p>
          </div>
          <div className="faq-item">
            <h4>Why is profit entered manually?</h4>
            <p>
              So the number is 100% accurate — including commission &amp; swap. Manual volume + profit
              avoids auto-calculations that can be wrong.
            </p>
          </div>
        </div>
      </div>

      <div className="panel support-panel" style={{ marginTop: 16 }}>
        <h3>Need help?</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Questions, technical issues, or feedback — reach out directly:
        </p>
        <div className="support-links">
          <a className="btn btn-primary" href="mailto:thegoldprintlab@gmail.com">
            ✉️ thegoldprintlab@gmail.com
          </a>
          <a className="btn btn-ghost" href="https://t.me/arfasyrf" target="_blank" rel="noreferrer">
            Telegram @arfasyrf
          </a>
        </div>
      </div>
    </div>
  )
}
