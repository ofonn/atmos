import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Register a push endpoint for the signed-in user.
 *
 * Body:
 *   { platform: 'web', endpoint, keys: { p256dh, auth } }   // web push
 *   { platform: 'android' | 'ios', fcmToken }               // FCM
 */
export async function POST(req: NextRequest) {
  const userOrResp = await requireUser()
  if (userOrResp instanceof NextResponse) return userOrResp
  const user = userOrResp

  const body = (await req.json()) as {
    platform: 'web' | 'android' | 'ios'
    endpoint?: string
    keys?: { p256dh?: string; auth?: string }
    fcmToken?: string
  }

  const supabase = createSupabaseServerClient()

  if (body.platform === 'web') {
    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ error: 'web push needs endpoint + keys' }, { status: 400 })
    }
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        platform: 'web',
        web_endpoint: body.endpoint,
        web_p256dh: body.keys.p256dh,
        web_auth: body.keys.auth,
        user_agent: req.headers.get('user-agent') ?? null,
        enabled: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'web_endpoint' },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.platform === 'android' || body.platform === 'ios') {
    if (!body.fcmToken) {
      return NextResponse.json({ error: 'fcmToken required' }, { status: 400 })
    }
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        platform: body.platform,
        fcm_token: body.fcmToken,
        user_agent: req.headers.get('user-agent') ?? null,
        enabled: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'fcm_token' },
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'invalid platform' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const userOrResp = await requireUser()
  if (userOrResp instanceof NextResponse) return userOrResp
  const user = userOrResp

  const { endpoint, fcmToken } = (await req.json()) as {
    endpoint?: string
    fcmToken?: string
  }

  const supabase = createSupabaseServerClient()
  if (endpoint) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('web_endpoint', endpoint)
  } else if (fcmToken) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('fcm_token', fcmToken)
  }
  return NextResponse.json({ ok: true })
}
