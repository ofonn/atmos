'use client'

import { Sun, Sunrise, Sunset } from 'lucide-react'

interface Props {
  sunrise?: string | null
  sunset?: string | null
  uvMax?: number | null
  uvNow?: number | null
  timeFormat?: '12h' | '24h'
}

function uvLabel(uv: number): { label: string; color: string; tip: string } {
  if (uv >= 11) return { label: 'Extreme', color: '#a855f7', tip: 'Avoid the sun 10am–4pm. SPF 50+.' }
  if (uv >= 8) return { label: 'Very High', color: '#ef4444', tip: 'Cover up. SPF 30+. Sunglasses essential.' }
  if (uv >= 6) return { label: 'High', color: '#f97316', tip: 'Use SPF 30+ and a hat midday.' }
  if (uv >= 3) return { label: 'Moderate', color: '#eab308', tip: 'SPF 15+ if outside more than an hour.' }
  return { label: 'Low', color: '#22c55e', tip: 'Minimal sun protection needed.' }
}

function fmtTime(iso: string | null | undefined, timeFormat: '12h' | '24h' = '24h'): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (timeFormat === '12h') {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function SunUVCard({ sunrise, sunset, uvMax, uvNow, timeFormat = '24h' }: Props) {
  const uv = uvNow ?? uvMax ?? 0
  const info = uvLabel(uv)

  return (
    <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Sun &amp; UV
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: info.color, color: '#000' }}
        >
          {info.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sunrise className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[10px] font-label uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Rise
            </p>
          </div>
          <p className="text-base font-bold font-headline" style={{ color: 'var(--text)' }}>
            {fmtTime(sunrise, timeFormat)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sunset className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[10px] font-label uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Set
            </p>
          </div>
          <p className="text-base font-bold font-headline" style={{ color: 'var(--text)' }}>
            {fmtTime(sunset, timeFormat)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-label uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            UV Index
          </p>
          <p className="text-base font-bold font-headline" style={{ color: 'var(--text)' }}>
            {uv.toFixed(1)}
          </p>
        </div>
      </div>

      <p className="text-[11px] mt-3 pt-3 border-t leading-relaxed" style={{ color: 'var(--text-muted)', borderColor: 'var(--outline)' }}>
        {info.tip}
      </p>
    </div>
  )
}
