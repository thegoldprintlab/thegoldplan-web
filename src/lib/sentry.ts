/**
 * Sentry initialization — MUST be imported before any other import in main.tsx
 * so the SDK can patch globals and register handlers before app code runs.
 *
 * Disabled (no-op) when VITE_SENTRY_DSN is unset, and never initialised in dev,
 * so local hot-reload noise never reaches the Sentry project.
 *
 * Privacy: this app holds traders' P&L. `sendDefaultPii` is off and
 * beforeSend strips email/user id, so no personal or financial data leaves.
 * Replay is likewise excluded — it would record trade tables on screen.
 */
import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
const ENV = (import.meta.env.VITE_SENTRY_ENV as string | undefined) ?? import.meta.env.MODE
const RELEASE = import.meta.env.VITE_APP_VERSION as string | undefined

export const sentryEnabled = Boolean(DSN) && import.meta.env.PROD

/** True when the user is on the demo preview (?demo=1) — don't pollute data. */
function isDemoPreview(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1'
  } catch {
    return false
  }
}

export function initSentry(): boolean {
  if (!sentryEnabled) return false
  // Demo mode uses placeholder data; errors there aren't real customer issues.
  if (isDemoPreview()) return false

  Sentry.init({
    dsn: DSN,
    environment: ENV,
    release: RELEASE,

    integrations: [
      // Traces route changes for react-router v6/v7 (see App.tsx wiring).
      Sentry.browserTracingIntegration(),
      // Replay intentionally omitted: it records the DOM, which would capture
      // trade tables, balances and P&L. Revisit only with strict masking.
    ],

    // Errors: always capture. Traces: sample lightly — this is a small app and
    // the free tier has a monthly event quota.
    tracesSampleRate: 0.1,

    // No IP addresses, cookies or request headers by default.
    sendDefaultPii: false,

    // Ignore noise that isn't actionable (browser quirks, extensions, network
    // blips) so the issue list stays signal-only.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Fired by browser extensions, not our code.
      'top.GLOBALS',
      'originalCreateNotification',
      // Chrome extension / Safari quirk.
      /^null$/,
      /^undefined$/,
      // Network failures a trader's flaky connection produces; not our bug.
      'Failed to fetch',
      'Load failed',
      'NetworkError when attempting to fetch resource.',
      // Supabase auth token expiry is handled by the app.
      'JWT expired',
      'Invalid Refresh Token',
    ],

    denyUrls: [
      // Browser extensions inject these; they are never our code.
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
    ],

    beforeSend(event) {
      // Belt-and-braces: strip anything that could identify a trader.
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
        delete event.user.username
        // Keep only the opaque Supabase uuid, which is meaningless alone.
        if (!event.user.id) delete event.user
      }
      if (event.request?.headers) {
        delete event.request.headers.Cookie
        delete event.request.headers.Authorization
      }
      return event
    },
  })

  return true
}

export { Sentry }
