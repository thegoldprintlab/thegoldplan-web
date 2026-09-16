/**
 * Privacy Policy.
 *
 * Written to satisfy the concrete obligations that apply to this app:
 * - GDPR Art. 13 (information to be provided) — what we collect, why, lawful basis
 * - GDPR Art. 15/17/20 (access, erasure, portability) — how to exercise them
 * - ePrivacy / cookie consent — the GA4 + Consent Mode story
 *
 * Not legal advice. The controller's contact + jurisdiction still need review.
 */
export default function Privacy() {
  const updated = '16 September 2026'

  return (
    <div className="howto">
      <div className="page-head">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: {updated}</p>
      </div>

      <div className="howto-grid">
        <section className="panel">
          <h3>1. Who we are</h3>
          <p>
            The Gold Plan ("we", "us") is a XAUUSD trading journal operated from Malaysia. For any
            privacy question, or to exercise any right below, contact{' '}
            <a href="mailto:thegoldprintlab@gmail.com">thegoldprintlab@gmail.com</a>. We are the data
            controller for the information described here.
          </p>
        </section>

        <section className="panel">
          <h3>2. What we collect</h3>
          <p>
            <b>Account data</b> — your email address, and a hashed password. Passwords are never
            stored in plain text.
          </p>
          <p>
            <b>Trading data you enter</b> — trades, accounts, P&amp;L, notes and tags you log or
            import. This is yours; we store it only so the app can show it back to you.
          </p>
          <p>
            <b>Billing data</b> — handled by Stripe. We never see or store your card number. We
            receive a customer ID and subscription status so we know whether your plan is active.
          </p>
          <p>
            <b>Technical &amp; analytics data</b> — only if you accept cookies: pages visited, rough
            location (country/city level), device and browser type, and referral source.
          </p>
          <p>
            <b>Error reports</b> — if the app crashes, we send the error message and technical
            context to Sentry. We deliberately strip email addresses and IP addresses, and we do not
            record your screen or the contents of your trade table.
          </p>
        </section>

        <section className="panel">
          <h3>3. Why we use it (lawful basis)</h3>
          <p>
            <b>To provide the service</b> (contract) — your account and trading data exist to run
            the journal you signed up for.
          </p>
          <p>
            <b>To take payment</b> (contract) — billing details via Stripe.
          </p>
          <p>
            <b>To fix bugs and understand usage</b> (consent) — analytics and error reporting run
            only with your agreement.
          </p>
          <p>
            We do not use your data for advertising, we do not build advertising profiles, and we do
            not sell your data to anyone.
          </p>
        </section>

        <section className="panel">
          <h3>4. Cookies</h3>
          <p>
            Analytics cookies are set <b>only after you click Accept</b>. Until then the analytics
            tag runs in cookieless mode, so no identifier is stored on your device. You can change
            your mind at any time using <b>Cookie settings</b> in the footer. Declining does not
            restrict any feature of the app.
          </p>
          <p>
            Strictly necessary cookies (keeping you logged in) are always set, because the app
            cannot function without them.
          </p>
        </section>

        <section className="panel">
          <h3>5. Who we share it with</h3>
          <p>Only the processors needed to run the service:</p>
          <p>
            <b>Supabase</b> — database and authentication.{' '}
            <b>Vercel</b> — hosting. <b>Stripe</b> — payments. <b>Google Analytics</b> — usage
            statistics. <b>Sentry</b> — error reports.
          </p>
          <p>
            Some of these operate outside Malaysia, including in the United States and the EU, so
            your data may be transferred internationally.
          </p>
        </section>

        <section className="panel">
          <h3>6. How long we keep it</h3>
          <p>
            Your trading data stays as long as your account exists. Delete your account and we
            delete your trades with it. Billing records are kept as long as tax law requires.
            Analytics data expires on Google's normal retention schedule.
          </p>
        </section>

        <section className="panel">
          <h3>7. Your rights</h3>
          <p>
            You can ask to <b>access</b> your data, <b>correct</b> it, <b>delete</b> it, receive a
            portable <b>export</b>, or <b>object</b> to processing based on consent. Withdrawing
            consent for analytics is available instantly in Cookie settings.
          </p>
          <p>
            Email <a href="mailto:thegoldprintlab@gmail.com">thegoldprintlab@gmail.com</a> and we will
            respond within 30 days. If you are in the EU/UK you also have the right to complain to
            your local data protection authority.
          </p>
        </section>

        <section className="panel">
          <h3>8. Security</h3>
          <p>
            Each account is isolated at the database level, so one user cannot read another's
            trades. Traffic is encrypted in transit. No system is perfectly secure, so please use a
            unique password.
          </p>
        </section>

        <section className="panel">
          <h3>9. Not financial advice</h3>
          <p>
            The Gold Plan is a record-keeping and analysis tool. It does not provide trading advice,
            signals, or recommendations, and we are not responsible for trading losses.
          </p>
        </section>
      </div>
    </div>
  )
}
