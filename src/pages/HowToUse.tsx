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
            <h4>Adakah data saya private?</h4>
            <p>
              Ya. Setiap akaun diasingkan dengan row-level security — hanya anda nampak trade &amp;
              analitik anda sendiri.
            </p>
          </div>
          <div className="faq-item">
            <h4>Macam mana cara import data lama?</h4>
            <p>
              Guna <b>Import MT5</b> — export report Excel dari MT5 (History → Report → Excel) dan
              muat naik. Semua trade di-parse automatik.
            </p>
          </div>
          <div className="faq-item">
            <h4>Boleh guna di phone?</h4>
            <p>
              Ya — app responsif penuh. Buka URL sama di browser phone. Untuk log cepat, guna{' '}
              <b>Quick Log API</b> (iOS Shortcuts).
            </p>
          </div>
          <div className="faq-item">
            <h4>Macam mana nak cancel langganan?</h4>
            <p>
              Pergi ke <b>Account &amp; Billing</b>. Langganan bulanan boleh diurus dari situ —
              cancel bila-bila masa.
            </p>
          </div>
          <div className="faq-item">
            <h4>Adakah percubaan percuma?</h4>
            <p>
              Ya — buka <a href="/app?demo=1">demo</a> untuk cuba semua fitur dengan data sample,
              tanpa perlu daftar. Kalau ada kod promo, redeem di Account &amp; Billing.
            </p>
          </div>
          <div className="faq-item">
            <h4>Kenapa profit kena taip manual?</h4>
            <p>
              Supaya angka tepat 100% — termasuk commission &amp; swap. Volume + profit manual
              elak auto-kira yang boleh silap.
            </p>
          </div>
        </div>
      </div>

      <div className="panel support-panel" style={{ marginTop: 16 }}>
        <h3>Perlukan bantuan?</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Ada soalan, masalah teknikal, atau nak bagi feedback — hubungi terus:
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
