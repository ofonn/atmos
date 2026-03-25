'use client'

import { WeatherIcon } from './WeatherIcon'
import { formatHourFromISO } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import type { HourlyData } from '@/types/weather'

interface HourlyForecastProps {
  data: HourlyData[]
}

export function HourlyForecast({ data }: HourlyForecastProps) {
  const { timeFormat } = useSettings()

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {data.map((hour, i) => {
        const isNow = i === 0
        const hasRain = hour.pop > 20

        return (
          <div
            key={hour.dt}
            className={`flex flex-col items-center gap-1.5 min-w-[64px] flex-1 py-3 px-1.5 rounded-2xl ${
              isNow ? 'bg-hero-gradient text-white shadow-glass' : ''
            }`}
            style={
              isNow
                ? {}
                : { background: 'var(--surface)', border: '0.5px solid var(--outline)' }
            }
          >
            <span
              className="text-[11px] font-label"
              style={{ color: isNow ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}
            >
              {isNow ? 'Now' : formatHourFromISO(hour.time, timeFormat)}
            </span>

            <WeatherIcon conditionCode={hour.conditionCode} isDay={hour.isDay} size={26} />

            <span
              className="font-semibold text-sm font-headline"
              style={{ color: isNow ? 'white' : 'var(--text)' }}
            >
              {hour.temp}°
            </span>

            {/* Precipitation probability */}
            <span
              className="text-[11px] font-label leading-none"
              style={{
                color: isNow
                  ? (hasRain ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)')
                  : (hasRain ? 'var(--secondary)' : 'var(--text-muted)'),
                opacity: hasRain ? 1 : 0.5,
              }}
            >
              {hour.pop}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
