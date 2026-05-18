'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[atmos] global error', error)
    // Sentry init is a no-op when NEXT_PUBLIC_SENTRY_DSN is unset,
    // so this call is safe regardless of configuration.
    Sentry.captureException(error, { extra: { digest: error.digest } })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#10131c',
          color: '#e6e6f0',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Atmos hit a snag.</h1>
          <p style={{ opacity: 0.75, marginBottom: 24, lineHeight: 1.5 }}>
            Something unexpected happened. Reloading usually clears it up.
          </p>
          {error.digest && (
            <p style={{ opacity: 0.5, fontSize: 11, fontFamily: 'monospace', marginBottom: 16 }}>
              Ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: '#c7bfff',
              color: '#10131c',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 999,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
