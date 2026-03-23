'use client'

import { WeatherIcon } from './WeatherIcon'
import { formatTime } from '@/lib/utils'
import type { HourlyData } from '@/types/weather'

interface HourlyForecastProps {
  data: HourlyData[]
}

export function HourlyForecast({ data }: HourlyForecastProps) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {data.map((hour, i) => {
        const isNow = i === 0
        return (
          <div
            key={hour.dt}
            className={`flex flex-col items-center gap-1.5 min-w-[68px] py-3 px-2 rounded-2xl transition ${
              isNow
                ? 'bg-hero-gradient text-white shadow-glass'
                : 'bg-surface-container-high text-on-surface'
            }`}
          >
            <span className={`text-[10px] font-label ${isNow ? 'text-white/80' : 'text-on-surface-variant/60'}`}>
              {isNow ? 'Now' : formatTime(hour.dt)}
            </span>
            <WeatherIcon
              conditionCode={hour.conditionCode}
              iconCode={hour.icon}
              size={24}
            />
            <span className={`font-semibold text-sm font-headline ${isNow ? '' : ''}`}>
              {hour.temp}°
            </span>
          </div>
        )
      })}
    </div>
  )
}
