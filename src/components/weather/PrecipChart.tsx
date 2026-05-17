'use client'

import { CloudRain } from 'lucide-react'

interface Props {
  /** minutely_15: [{ dt: unix seconds, precipitation: mm }] (next ~24 slots) */
  minutely: { dt: number; precipitation: number }[] | null
}

export function PrecipChart({ minutely }: Props) {
  if (!minutely || minutely.length === 0) return null
  const slots = minutely.slice(0, 24) // 6 hours
  const max = Math.max(...slots.map((s) => s.precipitation), 0.5)
  const hasAny = slots.some((s) => s.precipitation > 0)

  return (
    <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-3">
        <CloudRain className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Next 6 hours of rain
        </span>
      </div>

      {!hasAny ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No precipitation expected.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-0.5 h-16">
            {slots.map((s, i) => {
              const h = s.precipitation === 0 ? 2 : Math.max(4, (s.precipitation / max) * 64)
              const color = s.precipitation === 0 ? 'var(--surface-mid)' : 'var(--primary)'
              return (
                <div
                  key={i}
                  title={`${s.precipitation.toFixed(2)} mm`}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}px`, background: color, opacity: s.precipitation === 0 ? 0.4 : 1 }}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              now
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              +3h
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              +6h
            </span>
          </div>
        </>
      )}
    </div>
  )
}
