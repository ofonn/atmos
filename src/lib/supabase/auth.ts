import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './server'
import type { Tier } from '@/lib/subscriptions'

/**
 * Read the authenticated user (or null) in a Server Component / route handler.
 * Returns null silently — never throws.
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

/**
 * For API routes: return the user or a 401 NextResponse you should return
 * immediately. Caller pattern:
 *
 *   const userOrResp = await requireUser()
 *   if (userOrResp instanceof NextResponse) return userOrResp
 *   const user = userOrResp
 */
export async function requireUser(): Promise<User | NextResponse> {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

/**
 * Resolve the user's current tier. Free is the default; Pro requires an
 * active subscription whose current_period_end hasn't passed.
 */
export async function getUserTier(userId: string): Promise<Tier> {
  try {
    const supabase = createSupabaseServerClient()
    const { data } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) return 'free'
    const expired =
      data.current_period_end && new Date(data.current_period_end as string) < new Date()
    if (data.tier === 'pro' && data.status === 'active' && !expired) return 'pro'
    return 'free'
  } catch {
    return 'free'
  }
}
