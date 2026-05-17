import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Standard security headers applied to every response.
 * - HSTS: force HTTPS for 2 years on this domain + subdomains
 * - X-Content-Type-Options: prevent MIME sniffing
 * - X-Frame-Options: block clickjacking
 * - Referrer-Policy: trim referrer cross-origin
 * - Permissions-Policy: restrict powerful APIs by default
 */
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Permissions-Policy',
    'geolocation=(self), microphone=(self), camera=(), payment=()',
  )
  res.headers.set('X-DNS-Prefetch-Control', 'on')

  // Content Security Policy — report-only for now so we can observe
  // violations without breaking Next's inline runtime scripts. Flip
  // the header name to `Content-Security-Policy` once the report log
  // is clean for a week. Adjust the allow-lists to match real
  // upstreams (Supabase, Stripe, Open-Meteo, RainViewer, etc.).
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://archive-api.open-meteo.com https://air-quality-api.open-meteo.com https://nominatim.openstreetmap.org https://api.stripe.com https://*.tile.openstreetmap.org https://tilecache.rainviewer.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/security/csp-report",
  ].join('; ')
  res.headers.set('Content-Security-Policy-Report-Only', csp)

  return res
}

export async function middleware(request: NextRequest) {
  const res = await updateSession(request)
  return applySecurityHeaders(res)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
