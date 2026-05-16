import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { requireUser } from '@/lib/supabase/auth'

/**
 * POST /api/account/delete — permanently delete the authenticated user
 * and all their data. Requires the service-role key to call the auth
 * admin API. Row-level CASCADE deletes wipe related rows automatically.
 *
 * This is mandatory for Play Store policy compliance.
 */
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const userOrResp = await requireUser()
  if (userOrResp instanceof NextResponse) return userOrResp
  const user = userOrResp

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    return NextResponse.json(
      { error: 'Server misconfigured (no service role key)' },
      { status: 500 },
    )
  }

  const admin = createServerClient(url, serviceRole, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  // Hard-delete the auth user. The `on delete cascade` on every FK
  // sweeps profiles / subscriptions / saved_locations / chat_messages
  // / api_usage / user_preferences / streaks.
  const { error } = await (admin as any).auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
