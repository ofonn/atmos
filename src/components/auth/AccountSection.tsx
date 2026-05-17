'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogIn, LogOut, UserRound, Loader2, Sparkles, CreditCard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TIER_LABEL, type Tier } from '@/lib/subscriptions'

export function AccountSection() {
  const { supabase, user, loading, signOut, disabled } = useAuth()
  const router = useRouter()
  const [tier, setTier] = useState<Tier>('free')
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (!supabase || !user) return
    supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        const expired =
          data.current_period_end && new Date(data.current_period_end) < new Date()
        const next: Tier =
          data.tier === 'pro' && data.status === 'active' && !expired ? 'pro' : 'free'
        setTier(next)

        // One-shot downgrade notice: pro → free flip shows once per day.
        try {
          const lastKey = `atmos_last_tier_${user.id}`
          const last = localStorage.getItem(lastKey)
          if (last === 'pro' && next === 'free') {
            const day = new Date().toISOString().slice(0, 10)
            const noticeKey = `atmos_downgrade_notice_${user.id}_${day}`
            if (!localStorage.getItem(noticeKey)) {
              localStorage.setItem(noticeKey, '1')
              alert(
                'Your Atmos Pro plan has ended. Free daily limits are now in effect — re-subscribe any time from this page.',
              )
            }
          }
          localStorage.setItem(lastKey, next)
        } catch {}
      })
  }, [supabase, user])

  if (disabled) return null

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not open portal')
      }
    } catch (e: any) {
      alert(e.message)
    }
    setPortalLoading(false)
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
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {loading ? 'Loading…' : user?.email ?? 'Not signed in'}
              </p>
              {user && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                  style={{
                    background: tier === 'pro' ? 'var(--primary)' : 'var(--surface-mid)',
                    color: tier === 'pro' ? 'var(--bg)' : 'var(--text-muted)',
                  }}
                >
                  {TIER_LABEL[tier]}
                </span>
              )}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {user
                ? tier === 'pro'
                  ? 'Pro plan active'
                  : 'Sign in to sync places across devices'
                : 'Sign in to sync places across devices'}
            </p>
          </div>
        </div>

        {!loading && (
          <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--outline)' }}>
            {user ? (
              <>
                {tier === 'free' ? (
                  <Link
                    href="/pricing"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors active:scale-95"
                    style={{ background: 'var(--primary)', color: 'var(--bg)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold">Upgrade to Pro</span>
                  </Link>
                ) : (
                  <button
                    onClick={openPortal}
                    disabled={portalLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
                    style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
                  >
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                    <span className="text-sm font-medium">Manage subscription</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors active:scale-95"
                  style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
                >
                  <LogOut className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-medium">Sign out</span>
                </button>
              </>
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
