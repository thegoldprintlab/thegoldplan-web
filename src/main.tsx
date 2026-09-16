// Sentry must initialise before any other app import so it can patch globals
// and register handlers ahead of React and the router.
import { initSentry, Sentry } from './lib/sentry'
import { initAnalytics } from './lib/analytics'
initSentry()
initAnalytics()

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Catches render errors anywhere below and reports them to Sentry.
        Users see a recoverable screen instead of a blank white page. */}
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, marginBottom: '1.25rem' }}>
            The page hit an unexpected error. Your trades are safe.
          </p>
          <button
            onClick={resetError}
            style={{ padding: '0.6rem 1.4rem', borderRadius: 8, border: '1px solid currentColor', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
