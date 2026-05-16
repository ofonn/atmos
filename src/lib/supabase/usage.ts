import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from './server'
import { limitFor, type ApiEndpoint, type Tier } from '@/lib/subscriptions'

/**
 * Atomically check + increment the user's daily usage for `endpoint`.
 * Pass the resolved tier (use getUserTier()).
 *
 * Returns null if the call is allowed (proceed). Returns a 429 NextResponse
 * if the user is at their daily cap — the caller should return it as-is.
 *
 * Fails open on infra errors: if the RPC errors we let the request through
 * and log it, so the app isn't bricked by a Supabase outage.
 */
export async function enforceUsage(
  endpoint: ApiEndpoint,
  tier: Tier,
): Promise<NextResponse | null> {
  const limit = limitFor(endpoint, tier)
  if (!Number.isFinite(limit)) return null

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.rpc('increment_api_usage', {
      p_endpoint: endpoint,
      p_limit: limit,
    })
    if (error) {
      console.error('[usage] rpc error', error)
      return null
    }
    if (data === -1) {
      return NextResponse.json(
        {
          error: 'Daily limit reached',
          endpoint,
          tier,
          limit,
        },
        { status: 429 },
      )
    }
    return null
  } catch (e) {
    console.error('[usage] exception', e)
    return null
  }
}
