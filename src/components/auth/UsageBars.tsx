'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface MeResponse {
  tier: 'free' | 'pro'
  usageToday: Record<string, number>
  limits: Record<string, number>
}

const ENDPOINT_LABEL: Record<string, string> = {
  chat: 'Chat',
  headline: 'Headlines',
  insight: 'Insights',
  outfit: 'Outfit AI',
  activity: 'Activity AI',
  trip: 'Trip plans',
}

export function UsageBars() {
  const { user, disabled } = useAuth()
  const [data, setData] = useState<MeResponse | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user || disabled) return
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.tier) setData(d as MeResponse)
        else setError(true)
      })
      .catch(() => setError(true))
  }, [user, disabled])

  if (!user || disabled || error || !data) return null

  const entries = Object.entries(data.limits).filter(([, lim]) => Number.isFinite(lim))
  if (entries.length === 0) return null

  return (
    <div>
      <p
        className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Today&apos;s usage
      </p>
      <div className="px-5 py-4 rounded-2xl space-y-3" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Resets at midnight UTC
          </span>
        </div>
        {entries.map(([endpoint, limit]) => {
          const used = data.usageToday[endpoint] ?? 0
          const pct = Math.min(100, Math.round((used / limit) * 100))
          const overHalf = pct >= 50
          const overEighty = pct >= 80
          const color = overEighty
            ? '#ef4444'
            : overHalf
              ? '#f97316'
              : 'var(--primary)'
          return (
            <div key={endpoint}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  {ENDPOINT_LABEL[endpoint] ?? endpoint}
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {used} / {limit}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--surface-mid)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
