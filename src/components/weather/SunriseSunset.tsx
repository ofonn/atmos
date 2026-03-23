'use client'

import { Sunrise, Sunset } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { SunData } from '@/types/weather'

interface SunriseSunsetProps {
  data: SunData
}

export function SunriseSunset({ data }: SunriseSunsetProps) {
  const now = Date.now() / 1000
  const dayLength = data.sunset - data.sunrise
  const elapsed = Math.max(0, Math.min(now - data.sunrise, dayLength))
  const progress = dayLength > 0 ? (elapsed / dayLength) * 100 : 0

  return (
    <div className="bg-surface-container-low rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sunrise className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-[10px] text-on-surface-variant/50 font-label uppercase tracking-wider">Sunrise</p>
            <p className="font-semibold text-sm font-headline text-on-surface">{formatTime(data.sunrise)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant/50 font-label uppercase tracking-wider">Sunset</p>
            <p className="font-semibold text-sm font-headline text-on-surface">{formatTime(data.sunset)}</p>
          </div>
          <Sunset className="w-4 h-4 text-indigo-400" />
        </div>
      </div>

      {/* Sun arc */}
      <div className="relative h-10">
        <div className="absolute inset-x-0 bottom-0 h-7 border-t-2 border-dashed border-primary/20 rounded-t-full" />
        <div
          className="absolute bottom-5 w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.6)] transition-all duration-1000"
          style={{ left: `calc(${Math.min(progress, 100)}% - 6px)` }}
        />
      </div>
    </div>
  )
}
