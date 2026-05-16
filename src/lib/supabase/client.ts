import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns a Supabase browser client, or `null` if env vars are missing.
 * Callers should treat `null` as "auth disabled" and degrade gracefully —
 * this lets static prerender work without the env vars present.
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    if (typeof window !== 'undefined') {
      console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY not set — auth disabled')
    }
    return null
  }
  return createBrowserClient(url, anon)
}
