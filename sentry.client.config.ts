// Sentry — browser config. Disabled unless NEXT_PUBLIC_SENTRY_DSN is
// set, so it's a no-op in dev / on forks. The DSN is a public token
// (write-only ingest) and safe to expose.

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    // 100% errors. 10% performance sampling in prod, off in dev.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    // Replays disabled — adds weight and storage cost. Enable later if
    // you want session-replay debugging.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Trim noise: drop user-cancelled fetches & RSC navigation aborts.
    ignoreErrors: [
      'AbortError',
      'TypeError: Failed to fetch',
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
    ],
  })
}
