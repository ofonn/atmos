'use client'

import { motion } from 'framer-motion'
import { formatHourFromISO } from '@/lib/utils'
import { uviColor } from '@/lib/weatherUtils'
import { useSettings } from '@/contexts/SettingsContext'
import { MeteoIcon } from './MeteoIcon'
import type { HourlyData } from '@/types/weather'

interface HourlyForecastProps {
  data: HourlyData[]
}

export function HourlyForecast({ data }: HourlyForecastProps) {
  const { timeFormat } = useSettings()

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 overscroll-x-contain" style={{ touchAction: 'pan-x' }}>
      {data.map((hour, i) => {
        const isNow = i === 0
        const hasRain = hour.pop > 20
        const hasUV = hour.uvIndex > 0

        return (
          <motion.div
            key={hour.dt}
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className={`flex flex-col items-center gap-1 min-w-[64px] flex-1 py-3 px-1.5 rounded-2xl ${
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

            <MeteoIcon
              conditionCode={hour.conditionCode}
              isDay={hour.isDay}
              size={36}
            />

            <span
              className="font-semibold text-sm font-headline"
              style={{ color: isNow ? 'white' : 'var(--text)' }}
            >
              {hour.temp}°
            </span>

            {/* Precipitation probability */}
            <span
              className="text-[10px] font-label leading-none"
              style={{
                color: isNow
                  ? (hasRain ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)')
                  : (hasRain ? 'var(--secondary)' : 'var(--text-muted)'),
                opacity: hasRain ? 1 : 0.45,
              }}
            >
              {hour.pop}%
            </span>

            {/* UV index — shown when daytime and UV > 0 */}
            {hasUV && (
              <span
                className="text-[10px] font-label leading-none font-bold"
                style={{
                  color: isNow ? 'rgba(255,255,255,0.75)' : uviColor(hour.uvIndex),
                }}
              >
                UV {hour.uvIndex.toFixed(0)}
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
