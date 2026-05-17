'use client'

import { useEffect, useState } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import type { HourlyData } from '@/types/weather'

interface Window {
  activity: string
  start: string
  end: string
  why: string
}

export function ActivityCard({ hourly }: { hourly: HourlyData[] | null }) {
  const [windows, setWindows] = useState<Window[] | null>(null)
  const [fallback, setFallback] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const key = hourly?.slice(0, 18).map((h) => h.conditionCode).join('-') ?? ''

  useEffect(() => {
    if (!hourly || hourly.length === 0) return
    let cancelled = false
    setLoading(true)
    const compact = hourly.slice(0, 18).map((h) => ({
      hour: new Date(h.dt * 1000).getHours(),
      temp: Math.round(h.temp),
      conditionCode: h.conditionCode,
      pop: h.pop,
      windSpeed: 0,
      uvIndex: h.uvIndex,
    }))
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hourly: compact }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setWindows(d.windows ?? [])
        setFallback(d.fallback ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!hourly) return null

  return (
    <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Best times to go out
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Finding good windows…</span>
        </div>
      )}

      {!loading && windows && windows.length > 0 && (
        <div className="space-y-3">
          {windows.map((w, i) => (
            <div
              key={i}
              className="px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--surface-mid)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {w.activity}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--primary)' }}>
                  {w.start}–{w.end}
                </span>
              </div>
              <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                {w.why}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && (!windows || windows.length === 0) && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {fallback || 'No standout windows — check back tomorrow.'}
        </p>
      )}
    </div>
  )
}
