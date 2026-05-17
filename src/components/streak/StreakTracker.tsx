'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Headless component: bumps the user's daily-open streak via the
 * bump_streak() RPC, once per browser session per signed-in user.
 * Same-day bumps are a no-op server-side.
 */
export function StreakTracker() {
  const { supabase, user } = useAuth()

  useEffect(() => {
    if (!supabase || !user) return
    const key = `atmos_streak_bumped_${user.id}_${new Date().toDateString()}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return

    ;(async () => {
      try {
        await supabase.rpc('bump_streak')
        try { sessionStorage.setItem(key, '1') } catch {}
      } catch {}
    })()
  }, [supabase, user])

  return null
}
