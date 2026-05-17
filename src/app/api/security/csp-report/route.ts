import { NextRequest, NextResponse } from 'next/server'

/**
 * Receives CSP violation reports while we run in report-only mode.
 * Reports are just logged for now — wire to your alerting service of
 * choice once you've decided on one.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.warn('[csp.violation]', JSON.stringify(body))
  } catch {
    console.warn('[csp.violation] unparseable body')
  }
  // CSP report spec expects a 204 with no body.
  return new NextResponse(null, { status: 204 })
}
