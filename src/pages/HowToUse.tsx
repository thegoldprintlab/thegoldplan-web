/** How to use — accessible in-app as a help page. */
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
    </div>
  )
}
