import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerUser } from '@/lib/supabase/auth'

/**
 * Accepts in-app feedback. Authenticated users write through their
 * own session (RLS-checked); anonymous users write via the service-
 * role key with user_id=null. Both paths share one schema row.
 *
 * Body: { category: 'bug'|'feature'|'ai'|'other', message, context? }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    category: string
    message: string
    context?: unknown
    source?: 'web' | 'android' | 'ios'
  }
  if (!body.message || typeof body.message !== 'string' || body.message.length > 4000) {
    return NextResponse.json({ error: 'message required (≤4000 chars)' }, { status: 400 })
  }
  const validCategories = ['bug', 'feature', 'ai', 'other'] as const
  const category = (validCategories as readonly string[]).includes(body.category)
    ? body.category
    : 'other'

  const user = await getServerUser()
  const source = body.source ?? 'web'
  const userAgent = req.headers.get('user-agent') ?? null
  const row = {
    user_id: user?.id ?? null,
    source,
    category,
    message: body.message,
    context: body.context ?? null,
    user_agent: userAgent,
  }

  // Pick the client: user-scoped for signed-in (RLS), service-role
  // otherwise so anonymous feedback still lands.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  const key = user ? anon : (service ?? anon)
  const client = createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  const { error } = await client.from('feedback').insert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
