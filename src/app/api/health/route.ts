import { NextResponse } from 'next/server'

/**
 * Liveness probe. No auth, no DB hit — used by uptime monitors and
 * Vercel's deployment health checks.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'atmos',
    time: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
  })
}
