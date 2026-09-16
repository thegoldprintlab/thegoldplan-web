import { useEffect, useState } from 'react'
import { applyConsent, hasChosen, resetConsent } from '../lib/consent'

/**
 * Cookie consent banner (GDPR / ePrivacy).
 *
 * Behaviour:
 * - Hidden if the visitor already chose. No flash: we read localStorage in a
 *   lazy useState initialiser, so it never renders then disappears.
 * - "Accept" grants analytics_storage; "Decline" keeps everything denied.
 *   Both are equally reachable — no dark patterns.
 * - Renders as a fixed bottom bar, not a modal: it must never block the page,
 *   since blocking content until consent is itself a compliance risk.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !hasChosen())

  // Re-show the banner when consent is cleared from the footer link.
  useEffect(() => {
    function onChange() {
      setVisible(!hasChosen())
    }
    window.addEventListener('gp-consent-change', onChange)
    return () => window.removeEventListener('gp-consent-change', onChange)
  }, [])

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-inner">
        <p className="cookie-text">
          We use cookies for analytics to understand how the app is used. No ads, and we never sell
          your data. You can decline and still use everything. See our{' '}
          <a href="/privacy">Privacy Policy</a>.
        </p>
        <div className="cookie-actions">
          <button className="btn" onClick={() => applyConsent(false)}>
            Decline
          </button>
          <button className="btn btn-primary" onClick={() => applyConsent(true)}>
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Small "Cookie settings" control for the footer. Renders a button that clears
 * the stored choice, which re-opens the banner (via the consent-change event).
 */
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="cookie-settings-link"
      onClick={() => {
        resetConsent()
      }}
    >
      Cookie settings
    </button>
  )
}
