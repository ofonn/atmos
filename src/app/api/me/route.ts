import { NextResponse } from 'next/server'
import { getServerUser, getUserTier } from '@/lib/supabase/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TIER_LIMITS, type ApiEndpoint } from '@/lib/subscriptions'

/**
 * Returns the signed-in user's identity + tier + today's API usage so
 * the client can render daily-cap progress bars and tier badges.
 *
 *   { user: { id, email }, tier: 'free'|'pro', usageToday: {endpoint: count}, limits: {...} }
 *
 * Returns 401 if not signed in.
 */
export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tier = await getUserTier(user.id)
  const supabase = createSupabaseServerClient()

  const today = new Date().toISOString().slice(0, 10)
  const { data: usage } = await supabase
    .from('api_usage')
    .select('endpoint, count')
    .eq('user_id', user.id)
    .eq('day', today)

  const usageToday: Record<string, number> = {}
  if (usage) {
    for (const row of usage) {
      usageToday[row.endpoint as string] = row.count as number
    }
  }

  const endpoints: ApiEndpoint[] = ['chat', 'headline', 'insight', 'outfit', 'activity', 'trip']
  const limits: Record<string, number> = {}
  for (const e of endpoints) {
    const key = `${e === 'chat' ? 'chatMessagesPerDay' : e === 'headline' ? 'headlinesPerDay' : e === 'insight' ? 'insightsPerDay' : e === 'outfit' ? 'outfitsPerDay' : e === 'activity' ? 'activitiesPerDay' : 'tripsPerDay'}` as keyof typeof TIER_LIMITS.free
    limits[e] = TIER_LIMITS[tier][key]
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    tier,
    usageToday,
    limits,
  })
}
