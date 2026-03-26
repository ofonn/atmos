'use client'

import useSWR from 'swr'
import {
  transformCurrent,
  transformHourly,
  transformDaily,
  transformMetrics,
  transformSun,
  transformMinutely15,
} from '@/lib/weatherService'
import type {
  CurrentWeatherData,
  HourlyData,
  DailyData,
  MetricsData,
  SunData,
  Minutely15Data,
  OpenMeteoResponse,
} from '@/types/weather'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useWeather(lat: number | null, lon: number | null) {
  const shouldFetch = lat !== null && lon !== null

  const { data: rawData, error: fetchError, mutate } = useSWR<OpenMeteoResponse>(
    shouldFetch ? `/api/openmeteo?lat=${lat}&lon=${lon}` : null,
    fetcher,
    {
      refreshInterval: 300000, // 5 min
      errorRetryCount: 5,
      errorRetryInterval: 3000,
    }
  )

  let current: CurrentWeatherData | null = null
  let hourly: HourlyData[] | null = null
  let daily: DailyData[] | null = null
  let metrics: MetricsData | null = null
  let sun: SunData | null = null
  let minutely15: Minutely15Data | null = null

  if (rawData && rawData.current && rawData.hourly && rawData.daily) {
    current = transformCurrent(rawData)
    hourly = transformHourly(rawData, 24)
    daily = transformDaily(rawData)
    metrics = transformMetrics(current, hourly, rawData)
    sun = transformSun(rawData)
    minutely15 = transformMinutely15(rawData)
  }

  const apiError = (rawData as any)?.error || null

  const refresh = () => { mutate() }

  return {
    current,
    hourly,
    daily,
    metrics,
    sun,
    minutely15,
    refresh,
    loading: shouldFetch && !rawData,
    error: apiError || fetchError?.message || null,
  }
}
