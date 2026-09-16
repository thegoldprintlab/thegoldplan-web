/**
 * Google Consent Mode v2 — default state + updates.
 *
 * WHY THIS EXISTS
 * ---------------
 * GA4 writes cookies. For visitors in the EU/UK/EEA that requires prior
 * consent under GDPR/ePrivacy. Consent Mode v2 lets us load the Google tag
 * while telling it NOT to store cookies until the visitor agrees, and to send
 * cookieless pings in the meantime (so GA can still do behavioral modelling).
 *
 * ORDER MATTERS: setDefaultConsent() must run BEFORE gtag('config', ...) so GA
 * knows the state before it fires. main.tsx does this in the right order.
 *
 * Region strategy: default to DENIED everywhere, then grant via the banner.
 * Simpler and safer than per-region defaults, and the traffic is small enough
 * that losing a little non-EU measurement precision doesn't matter.
 */

const STORAGE_KEY = 'gp-consent-v1'

export type ConsentChoice = 'granted' | 'denied'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Consent Mode v2 signal set. GA4 needs all four. */
export interface ConsentState {
  analytics_storage: ConsentChoice
  ad_storage: ConsentChoice
  ad_user_data: ConsentChoice
  ad_personalization: ConsentChoice
}

const DENIED: ConsentState = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
}

const GRANTED: ConsentState = {
  analytics_storage: 'granted',
  // We don't run ads today, but Google's own guidance is to keep all four
  // signals coherent. Kept 'denied' deliberately: no ad features are in use,
  // so there is no reason to claim ad consent.
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
}

/** gtag queue stub — must exist before the Google tag script loads. */
function ensureGtag() {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
  }
}

/**
 * Push the DEFAULT (denied) consent state. Call this before the GA tag is
 * configured, on every page load, regardless of any stored choice.
 *
 * `wait_for_update` gives the banner a moment to apply a stored choice before
 * tags start sending, which avoids a cookieless ping being sent for a visitor
 * who already agreed on a previous visit.
 */
export function setDefaultConsent() {
  ensureGtag()
  window.gtag!('consent', 'default', {
    ...DENIED,
    wait_for_update: 500,
  })
}

/** Read the visitor's stored choice, or null if they haven't chosen yet. */
export function getStoredConsent(): ConsentState | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    // Guard against a stale/corrupt shape from an older version.
    if (parsed && typeof parsed.analytics_storage === 'string') return parsed
    return null
  } catch {
    return null
  }
}

/** True when the visitor has already made a choice (banner can stay hidden). */
export function hasChosen(): boolean {
  return getStoredConsent() !== null
}

/**
 * Persist and apply a consent decision.
 * `granted: true`  -> allow analytics cookies
 * `granted: false` -> keep everything denied
 */
export function applyConsent(granted: boolean) {
  const state = granted ? GRANTED : DENIED
  ensureGtag()
  window.gtag!('consent', 'update', state)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode / storage disabled — consent still applied for this page
    // view, the banner will simply reappear next visit. Acceptable.
  }
  // Let any mounted component (e.g. the banner, the footer link) react.
  window.dispatchEvent(new CustomEvent('gp-consent-change', { detail: state }))
}

/**
 * Apply a previously stored choice on page load, if one exists.
 * Returns true when a stored choice was found and applied.
 */
export function restoreConsent(): boolean {
  const stored = getStoredConsent()
  if (!stored) return false
  ensureGtag()
  window.gtag!('consent', 'update', stored)
  return true
}

/** True when analytics cookies are currently permitted. */
export function analyticsAllowed(): boolean {
  return getStoredConsent()?.analytics_storage === 'granted'
}

/** Clear the stored choice — used by the "Cookie settings" footer link. */
export function resetConsent() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('gp-consent-change', { detail: null }))
}
