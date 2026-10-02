import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from '../lib/analytics'
import { initWebAnalytics, trackWebPageView } from '../lib/webAnalytics'

/**
 * Fires a page_view on every react-router navigation and once on mount —
 * for BOTH trackers:
 *   - GA4 (cookies, consent-gated)   → funnel/event reporting
 *   - Vercel Web Analytics (cookieless) → jumlah pelawat sebenar
 *
 * Must live inside <BrowserRouter> (it reads useLocation). Renders nothing.
 */
export default function AnalyticsRouteTracker() {
  const location = useLocation()
  const ready = useRef(false)

  useEffect(() => {
    if (!ready.current) {
      ready.current = initAnalytics()
      initWebAnalytics()
    }
    // pathname only — query/hash excluded so ?demo=1 doesn't split reports.
    if (ready.current) trackPageView(location.pathname)
    trackWebPageView(location.pathname)
  }, [location.pathname])

  return null
}
