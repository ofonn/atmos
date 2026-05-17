import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/account/export — download all rows belonging to the signed-in
 * user as a single JSON file. Useful for GDPR / Play Store compliance
 * ("user can export their data").
 */
export async function GET() {
  const userOrResp = await requireUser()
  if (userOrResp instanceof NextResponse) return userOrResp
  const user = userOrResp

  const supabase = createSupabaseServerClient()
  const [
    profile,
    sub,
    locs,
    chat,
    prefs,
    usage,
    streak,
    notifPrefs,
  ] = await Promise.all([
    supabase.from('profiles').select().eq('id', user.id).maybeSingle(),
    supabase.from('subscriptions').select().eq('user_id', user.id).maybeSingle(),
    supabase.from('saved_locations').select().eq('user_id', user.id),
    supabase.from('chat_messages').select().eq('user_id', user.id),
    supabase.from('user_preferences').select().eq('user_id', user.id).maybeSingle(),
    supabase.from('api_usage').select().eq('user_id', user.id),
    supabase.from('streaks').select().eq('user_id', user.id).maybeSingle(),
    supabase.from('notification_preferences').select().eq('user_id', user.id).maybeSingle(),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    profile: profile.data,
    subscription: sub.data,
    saved_locations: locs.data,
    chat_messages: chat.data,
    user_preferences: prefs.data,
    api_usage: usage.data,
    streak: streak.data,
    notification_preferences: notifPrefs.data,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-disposition': `attachment; filename="atmos-export-${user.id}.json"`,
    },
  })
}
