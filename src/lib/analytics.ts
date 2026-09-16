/**
 * GA4 analytics — thin wrapper around gtag.
 *
 * Design:
 * - Loaded only in production builds with VITE_GA_ID set. Never in dev (keeps
 *   GA's Realtime report clean and avoids polluting data with localhost).
 * - SPA-aware: react-router navigations don't reload the page, so we send
 *   page_view manually on every route change. `send_page_view: false` on the
 *   initial config stops GA double-counting the first load.
 * - All calls are no-ops when GA is absent, so callers never guard.
 */

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined

/** True when the Google tag is actually on the page. */
export const gaEnabled = Boolean(GA_ID) && import.meta.env.PROD

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Inject the gtag.js snippet. Safe to call when GA_ID is unset — it no-ops and
 * returns false so the caller can skip attaching route listeners.
 */
export function initAnalytics(): boolean {
  if (!gaEnabled) return false
  if (typeof window === 'undefined' || window.gtag) return true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  // gtag must push the `arguments` object itself, not a spread array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  // send_page_view:false — we fire page_view ourselves on route change below.
  window.gtag('config', GA_ID, { send_page_view: false })
  return true
}

/**
 * Manual page_view for SPA route changes. GA has no idea the URL changed when
 * react-router swaps the view, so this is what makes /pricing, /help etc. show
 * up as separate pages in reports.
 */
export function trackPageView(path: string, title?: string) {
  if (!gaEnabled || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  })
}

/**
 * Custom event. Use for funnel steps GA can't infer from a pageview — e.g.
 * clicking a plan's checkout button, importing MT5 history, redeeming a promo.
 * Params must be simple (string | number | boolean); GA4 drops nested objects.
 */
export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  if (!gaEnabled || !window.gtag) return
  window.gtag('event', name, params)
}
