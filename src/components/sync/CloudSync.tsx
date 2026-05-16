'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { pullOnSignIn, pushAll } from '@/lib/supabase/sync'

/**
 * Background cloud-sync manager. Mounted once at app root.
 * - On sign-in: pull saved locations / chat / settings from Supabase
 *   and write into localStorage so the existing hooks pick them up.
 * - While signed in: every 30s push current local state to Supabase.
 * - On sign-out: no-op (local data stays for guest use).
 */
export function CloudSync() {
  const { supabase, user } = useAuth()
  const lastUserIdRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!supabase) return

    if (user && user.id !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id
      pullOnSignIn(supabase, user.id).catch((e) =>
        console.warn('[sync] pull failed', e),
      )
    }

    if (user) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => {
        pushAll(supabase, user.id).catch((e) =>
          console.warn('[sync] push failed', e),
        )
      }, 30_000)
    } else {
      lastUserIdRef.current = null
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [supabase, user])

  // Also push on tab hide so the latest state lands even if the user closes.
  useEffect(() => {
    if (!supabase || !user) return
    const onHide = () => {
      pushAll(supabase, user.id).catch(() => {})
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [supabase, user])

  return null
}
