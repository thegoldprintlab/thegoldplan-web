import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from '../lib/analytics'

/**
 * Fires a GA4 page_view on every react-router navigation and once on mount.
 *
 * Must live inside <BrowserRouter> (it reads useLocation). Renders nothing.
 */
export default function AnalyticsRouteTracker() {
  const location = useLocation()
  const ready = useRef(false)

  useEffect(() => {
    if (!ready.current) {
      ready.current = initAnalytics()
    }
    if (!ready.current) return
    // pathname only — query/hash excluded so ?demo=1 doesn't split reports.
    trackPageView(location.pathname)
  }, [location.pathname])

  return null
}
