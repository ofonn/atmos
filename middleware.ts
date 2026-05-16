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
