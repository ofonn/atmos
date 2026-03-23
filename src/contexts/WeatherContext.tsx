'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import type { CurrentWeatherData, HourlyData, DailyData, MetricsData, SunData, Location } from '@/types/weather'

interface WeatherContextValue {
  location: Location | null
  locLoading: boolean
  searchCity: (city: string) => Promise<void>
  syncLocation: () => void
  current: CurrentWeatherData | null
  hourly: HourlyData[] | null
  daily: DailyData[] | null
  metrics: MetricsData | null
  sun: SunData | null
  refresh: () => void
  loading: boolean
  error: string | null
}

const WeatherContext = createContext<WeatherContextValue | null>(null)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { location, loading: locLoading, searchCity, syncLocation } = useLocation()
  const { current, hourly, daily, metrics, sun, refresh, loading, error } = useWeather(
    location?.lat ?? null,
    location?.lon ?? null
  )

  return (
    <WeatherContext.Provider value={{
      location, locLoading, searchCity, syncLocation,
      current, hourly, daily, metrics, sun, refresh, loading, error,
    }}>
      {children}
    </WeatherContext.Provider>
  )
}

export function useWeatherContext() {
  const ctx = useContext(WeatherContext)
  if (!ctx) throw new Error('useWeatherContext must be used inside WeatherProvider')
  return ctx
}
