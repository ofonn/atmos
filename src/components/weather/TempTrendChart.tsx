'use client'

import { TrendingUp } from 'lucide-react'
import type { DailyData } from '@/types/weather'

interface Props {
  daily: DailyData[] | null
}

export function TempTrendChart({ daily }: Props) {
  if (!daily || daily.length < 2) return null
  const days = daily.slice(0, 14)
  const allTemps = days.flatMap((d) => [d.tempMax, d.tempMin])
  const min = Math.min(...allTemps)
  const max = Math.max(...allTemps)
  const range = max - min || 1
  const w = 100
  const h = 60

  const point = (i: number, temp: number) => {
    const x = (i / (days.length - 1)) * w
    const y = h - ((temp - min) / range) * h
    return { x, y }
  }

  const maxPath = days.map((d, i) => {
    const p = point(i, d.tempMax)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`
  }).join(' ')

  const minPath = days.map((d, i) => {
    const p = point(i, d.tempMin)
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`
  }).join(' ')

  return (
    <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            14-day trend
          </span>
        </div>
        <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {Math.round(min)}° / {Math.round(max)}°
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
        <path d={maxPath} fill="none" stroke="#f97316" strokeWidth="1.5" />
        <path d={minPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      </svg>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f97316' }} /> High
        </span>
        <span className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} /> Low
        </span>
      </div>
    </div>
  )
}
