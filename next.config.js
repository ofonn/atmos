/** @type {import('next').NextConfig} */
const nextConfig = {}

// Wrap with Sentry only when DSN is present so forks build clean.
// SENTRY_AUTH_TOKEN (build-time, server-only) enables source-map upload.
const hasSentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN
let exported = nextConfig
if (hasSentry) {
  try {
    const { withSentryConfig } = require('@sentry/nextjs')
    exported = withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT ?? 'atmos-web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Tunnel route used to bypass ad blockers (optional).
      tunnelRoute: '/monitoring',
      hideSourceMaps: true,
      disableLogger: true,
    })
  } catch (_) {
    // @sentry/nextjs not installed — skip wrapping.
  }
}

module.exports = exported
