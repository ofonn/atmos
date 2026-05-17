import { NextResponse } from 'next/server'

/**
 * Build / deploy metadata. Useful to confirm "yes that fix is live"
 * without digging through Vercel.
 */
export async function GET() {
  return NextResponse.json({
    name: 'atmos',
    version: process.env.npm_package_version ?? '0.1.0',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
    fullCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    region: process.env.VERCEL_REGION ?? 'local',
    builtAt: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME
      ? null  // Vercel doesn't expose build time directly
      : new Date().toISOString(),
  })
}
