import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Cross-device sync diagnostic. Returns the row counts visible to the
 * caller across the synced tables — useful when wiring two devices to
 * the same account to verify they really do see the same data.
 *
 *   GET /api/health/sync   (no auth)         → { ok, supabase: bool }
 *   GET /api/health/sync   (signed-in user)  → { ok, user, counts: {…} }
 */
export async function GET() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({
      ok: true,
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      signedIn: false,
    })
  }

  const supabase = createSupabaseServerClient()
  const tables = [
    'profiles',
    'subscriptions',
    'saved_locations',
    'chat_messages',
    'user_preferences',
    'api_usage',
    'streaks',
    'notification_preferences',
  ]
  const counts: Record<string, number | string> = {}
  await Promise.all(
    tables.map(async (t) => {
      const { count, error } = await supabase
        .from(t)
        .select('*', { count: 'exact', head: true })
      counts[t] = error ? `error: ${error.message}` : count ?? 0
    }),
  )

  return NextResponse.json({
    ok: true,
    signedIn: true,
    user: { id: user.id, email: user.email },
    counts,
  })
}
