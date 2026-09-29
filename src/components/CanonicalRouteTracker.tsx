import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Keeps <link rel="canonical"> in sync with the current route.
 *
 * The static canonical in index.html only covers "/". Without this, every SPA
 * route would report itself as the homepage — which suppresses indexing of
 * /pricing, /help and /privacy in Google. Renders nothing.
 *
 * Query strings are intentionally dropped: `?demo=1`, `?design=` and `?theme=`
 * are presentation-only and must not create duplicate canonical URLs.
 */
const SITE = 'https://thegoldplan.my'

export default function CanonicalRouteTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '')
    const href = `${SITE}${path}`
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', href)

    // Keep og:url aligned so shared links resolve to the canonical page.
    const og = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
    if (og) og.setAttribute('content', href)
  }, [location.pathname])

  return null
}
