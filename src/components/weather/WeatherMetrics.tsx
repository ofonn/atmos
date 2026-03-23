'use client'

import { Droplets, Wind, CloudRain } from 'lucide-react'
import type { MetricsData } from '@/types/weather'

interface WeatherMetricsProps {
  data: MetricsData
}

export function WeatherMetrics({ data }: WeatherMetricsProps) {
  const metrics = [
    {
      icon: <CloudRain className="w-5 h-5 text-primary" />,
      label: 'Chance',
      value: `${data.rainChance}%`,
    },
    {
      icon: <Wind className="w-5 h-5 text-secondary" />,
      label: 'Wind',
      value: `${data.windSpeed}km/h`,
    },
    {
      icon: <Droplets className="w-5 h-5 text-primary" />,
      label: 'Humidity',
      value: `${data.humidity}%`,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="weather-metric-card">
          {m.icon}
          <span className="text-[10px] text-on-surface-variant/60 font-label uppercase tracking-wider">
            {m.label}
          </span>
          <span className="font-semibold text-sm font-headline text-on-surface">{m.value}</span>
        </div>
      ))}
    </div>
  )
}
