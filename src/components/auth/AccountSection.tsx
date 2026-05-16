'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, UserRound, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function AccountSection() {
  const { user, loading, signOut, disabled } = useAuth()
  const router = useRouter()

  if (disabled) return null

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  return (
    <div>
      <p
        className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Account
      </p>

      <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--surface-mid)' }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
            ) : (
              <UserRound className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              {loading ? 'Loading…' : user?.email ?? 'Not signed in'}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {user
                ? 'Signed in — your data syncs to this account'
                : 'Sign in to sync places across devices'}
            </p>
          </div>
        </div>

        {!loading && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--outline)' }}>
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors active:scale-95"
                style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
              >
                <LogOut className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            ) : (
              <Link
                href="/sign-in"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors active:scale-95"
                style={{ background: 'var(--primary)', color: 'var(--bg)' }}
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm font-bold">Sign in or sign up</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
