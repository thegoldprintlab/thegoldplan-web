import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Base path is set at build time via VITE_BASE_PATH so the same build works
// on GitHub Pages, Vercel, and local dev.
const base = process.env.VITE_BASE_PATH || '/'

// Sentry source-map upload only runs when an auth token is present (CI/Vercel).
// Locally there's no token, so the plugin is skipped entirely and builds stay
// offline-friendly. Without source maps Sentry shows minified traces, which are
// useless for debugging a real customer error.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN
const release = process.env.VITE_APP_VERSION

export default defineConfig({
  plugins: [
    react(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: sentryAuthToken,
            release: release ? { name: release } : undefined,
            // Upload maps, then delete them so they are never deployed publicly
            // (public maps would expose your full original source code).
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
            telemetry: false,
            // A Sentry outage or bad token must never fail the deploy — the app
            // works fine without symbolicated stacks, it's just harder to debug.
            errorHandler: (err) => {
              console.warn('[sentry-vite-plugin] source-map upload skipped:', err.message)
            },
          }),
        ]
      : []),
  ],
  base,
  build: {
    outDir: 'dist',
    // 'hidden' emits .map files without a //# sourceMappingURL comment, so
    // browsers don't fetch them but Sentry can still resolve stack traces.
    sourcemap: sentryAuthToken ? 'hidden' : false,
  },
})
