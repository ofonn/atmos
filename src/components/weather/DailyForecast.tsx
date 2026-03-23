'use client'

import { WeatherIcon } from './WeatherIcon'
import { formatDay } from '@/lib/utils'
import type { DailyData } from '@/types/weather'

interface DailyForecastProps {
  data: DailyData[]
}

export function DailyForecast({ data }: DailyForecastProps) {
  return (
    <div className="rounded-2xl overflow-hidden">
      {data.map((day, i) => (
        <div
          key={day.dt}
          className={`flex items-center justify-between px-4 py-3 ${
            i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container'
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium font-headline text-on-surface w-10">
              {i === 0 ? 'Today' : formatDay(day.dt)}
            </span>
            <WeatherIcon
              conditionCode={day.conditionCode}
              iconCode={day.icon}
              size={22}
            />
          </div>

          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold font-headline text-on-surface">{day.tempMax}°</span>
            <span className="text-on-surface-variant/50">/ {day.tempMin}°</span>
          </div>

          <span className="text-[10px] font-label text-primary ml-3 capitalize w-16 text-right tracking-wide">
            {day.description}
          </span>
        </div>
      ))}
    </div>
  )
}
