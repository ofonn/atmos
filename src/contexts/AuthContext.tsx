'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface AuthContextValue {
  supabase: SupabaseClient | null
  user: User | null
  session: Session | null
  loading: boolean
  /** True when Supabase env vars are missing — auth UI should be hidden. */
  disabled: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
  }

  const value: AuthContextValue = {
    supabase,
    user: session?.user ?? null,
    session,
    loading,
    disabled: !supabase,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
