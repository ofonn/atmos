'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import type { CurrentWeatherData, HourlyData, DailyData, MetricsData, SunData, Minutely15Data, Location } from '@/types/weather'

interface WeatherContextValue {
  location: Location | null
  savedLocations: Location[]
  locLoading: boolean
  searchCity: (city: string) => Promise<void>
  syncLocation: () => void
  saveLocation: (loc: Location) => void
  removeLocation: (loc: Location) => void
  setAsCurrentLocation: (loc: Location) => void
  current: CurrentWeatherData | null
  hourly: HourlyData[] | null
  daily: DailyData[] | null
  metrics: MetricsData | null
  sun: SunData | null
  minutely15: Minutely15Data | null
  refresh: () => void
  loading: boolean
  error: string | null
}

const WeatherContext = createContext<WeatherContextValue | null>(null)

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { location, savedLocations, loading: locLoading, searchCity, syncLocation, saveLocation, removeLocation, setAsCurrentLocation } = useLocation()
  const { current, hourly, daily, metrics, sun, minutely15, refresh, loading, error } = useWeather(
    location?.lat ?? null,
    location?.lon ?? null
  )

  return (
    <WeatherContext.Provider value={{
      location, savedLocations, locLoading, searchCity, syncLocation, saveLocation, removeLocation, setAsCurrentLocation,
      current, hourly, daily, metrics, sun, minutely15, refresh, loading, error,
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
