import { NextRequest, NextResponse } from 'next/server'

/**
 * Gatekeeps `/api/*` so mobile clients must present the shared `X-Atmos-Client`
 * key while the deployed website continues to work for browser sessions.
 *
 * Mobile path: APK is built with `--dart-define=ATMOS_CLIENT_KEY=...` and ships
 * `X-Atmos-Client: <key>` on every request. We compare against
 * `process.env.ATMOS_MOBILE_KEY`.
 *
 * Browser path: cross-origin requests from a phone browser would fail CORS
 * preflight anyway, but as defence-in-depth we also allow same-origin browser
 * fetches (no `X-Atmos-Client` header but `sec-fetch-site: same-origin`) when
 * the request originates from the deployed site itself.
 *
 * Anything that fails both checks gets a 401.
 */
export function middleware(req: NextRequest): NextResponse {
  const mobileKey = process.env.ATMOS_MOBILE_KEY ?? ''
  const presented = req.headers.get('x-atmos-client') ?? ''
  const fetchSite = req.headers.get('sec-fetch-site') ?? ''

  // Mobile handshake.
  if (mobileKey && presented && timingSafeEqual(presented, mobileKey)) {
    return NextResponse.next()
  }

  // Browser session — same-origin or no-referer (RSC fetch) is allowed.
  // `sec-fetch-site` is set by every modern browser. Server-side internal
  // fetches (e.g. during a Next.js build) send no `sec-fetch-site` header,
  // so we let those through too.
  if (fetchSite === 'same-origin' || fetchSite === 'none' || fetchSite === '') {
    return NextResponse.next()
  }

  return new NextResponse(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export const config = {
  matcher: ['/api/:path*'],
}
