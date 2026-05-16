'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TIER_LIMITS } from '@/lib/subscriptions'

type Plan = 'monthly' | 'yearly'

const FEATURES: { label: string; free: string; pro: string }[] = [
  {
    label: 'AI chat messages',
    free: `${TIER_LIMITS.free.chatMessagesPerDay} / day`,
    pro: `${TIER_LIMITS.pro.chatMessagesPerDay} / day`,
  },
  {
    label: 'AI headlines',
    free: `${TIER_LIMITS.free.headlinesPerDay} / day`,
    pro: `${TIER_LIMITS.pro.headlinesPerDay} / day`,
  },
  {
    label: 'AI outfit & activity suggestions',
    free: `${TIER_LIMITS.free.outfitsPerDay + TIER_LIMITS.free.activitiesPerDay} / day combined`,
    pro: `${TIER_LIMITS.pro.outfitsPerDay + TIER_LIMITS.pro.activitiesPerDay} / day combined`,
  },
  {
    label: 'Trip planner',
    free: `${TIER_LIMITS.free.tripsPerDay} / day`,
    pro: `${TIER_LIMITS.pro.tripsPerDay} / day`,
  },
  {
    label: 'Saved places',
    free: `${TIER_LIMITS.free.savedLocations}`,
    pro: 'Unlimited',
  },
  {
    label: 'Cloud sync across devices',
    free: '✓',
    pro: '✓',
  },
  {
    label: 'Weather video backgrounds',
    free: '✓',
    pro: '✓',
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [plan, setPlan] = useState<Plan>('yearly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent('/pricing')}`)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to start checkout')
      }
      window.location.href = data.url
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header
        className="sticky top-0 z-50 px-6 py-3.5 backdrop-blur-2xl saturate-150 flex items-center gap-3"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <button onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-xl font-bold font-headline tracking-tight" style={{ color: 'var(--primary)' }}>
          Upgrade
        </h1>
      </header>

      <main className="relative z-10 flex-1 px-6 pt-8 pb-32 w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-4">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--primary)' }}
          >
            <Sparkles className="w-7 h-7" style={{ color: 'var(--bg)' }} />
          </div>
          <h2
            className="text-3xl font-bold font-headline tracking-tight mb-2"
            style={{ color: 'var(--text)' }}
          >
            Atmos Pro
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            More AI, more saved places, no ads. Cancel anytime.
          </p>
        </div>

        {/* Plan toggle */}
        <div
          className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl"
          style={{ background: 'var(--surface)' }}
        >
          <PlanButton
            active={plan === 'monthly'}
            label="Monthly"
            sub="$4.99/mo"
            onClick={() => setPlan('monthly')}
          />
          <PlanButton
            active={plan === 'yearly'}
            label="Yearly"
            sub="$39.99/yr · save 33%"
            onClick={() => setPlan('yearly')}
          />
        </div>

        {/* Feature comparison */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
        >
          <div
            className="grid grid-cols-3 px-4 py-3 text-[11px] font-label uppercase tracking-widest"
            style={{ background: 'var(--surface-mid)', color: 'var(--text-muted)' }}
          >
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center" style={{ color: 'var(--primary)' }}>Pro</span>
          </div>
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className="grid grid-cols-3 px-4 py-3 text-sm"
              style={{
                borderTop: i === 0 ? 'none' : '0.5px solid var(--outline)',
                color: 'var(--text)',
              }}
            >
              <span>{f.label}</span>
              <span className="text-center" style={{ color: 'var(--text-muted)' }}>
                {f.free}
              </span>
              <span className="text-center font-bold" style={{ color: 'var(--primary)' }}>
                {f.pro}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-center px-2" style={{ color: '#ff7a85' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--bg)' }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {user ? 'Continue to checkout' : 'Sign in to upgrade'}
        </button>

        <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
          Powered by Stripe. We don&apos;t store your card details.
        </p>
      </main>
    </div>
  )
}

function PlanButton({
  active,
  label,
  sub,
  onClick,
}: {
  active: boolean
  label: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl transition-all active:scale-95"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'var(--bg)' : 'var(--text)',
      }}
    >
      <span className="text-sm font-bold">{label}</span>
      <span className="text-[11px]" style={{ opacity: active ? 0.85 : 0.6 }}>
        {sub}
      </span>
    </button>
  )
}
