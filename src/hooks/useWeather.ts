'use client'

import useSWR from 'swr'
import { kelvinToCelsius, mpsToKmh } from '@/lib/utils'
import type {
  CurrentWeatherData,
  HourlyData,
  DailyData,
  MetricsData,
  SunData,
} from '@/types/weather'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useWeather(lat: number | null, lon: number | null) {
  const shouldFetch = lat !== null && lon !== null

  const { data: weatherData, error: weatherError } = useSWR(
    shouldFetch ? `/api/weather?lat=${lat}&lon=${lon}` : null,
    fetcher,
    { refreshInterval: 300000 } // 5 min
  )

  const { data: forecastData, error: forecastError } = useSWR(
    shouldFetch ? `/api/forecast?lat=${lat}&lon=${lon}` : null,
    fetcher,
    { refreshInterval: 300000 }
  )

  const current: CurrentWeatherData | null = weatherData?.main
    ? {
        temp: kelvinToCelsius(weatherData.main.temp),
        feelsLike: kelvinToCelsius(weatherData.main.feels_like),
        tempMin: kelvinToCelsius(weatherData.main.temp_min),
        tempMax: kelvinToCelsius(weatherData.main.temp_max),
        humidity: weatherData.main.humidity,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        conditionCode: weatherData.weather[0].id,
        windSpeed: mpsToKmh(weatherData.wind.speed),
        windDeg: weatherData.wind.deg,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility,
        clouds: weatherData.clouds.all,
        dt: weatherData.dt,
      }
    : null

  const hourly: HourlyData[] | null = forecastData?.list
    ? forecastData.list.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temp: kelvinToCelsius(item.main.temp),
        icon: item.weather[0].icon,
        conditionCode: item.weather[0].id,
        pop: Math.round((item.pop || 0) * 100),
        description: item.weather[0].description,
      }))
    : null

  // Group forecast by day for daily data
  const daily: DailyData[] | null = forecastData?.list
    ? (() => {
        const days: Record<string, any[]> = {}
        forecastData.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000).toLocaleDateString()
          if (!days[date]) days[date] = []
          days[date].push(item)
        })

        return Object.entries(days)
          .slice(0, 7)
          .map(([, items]) => {
            const temps = items.map((i: any) => i.main.temp)
            const midday = items[Math.floor(items.length / 2)]
            return {
              dt: items[0].dt,
              tempMin: kelvinToCelsius(Math.min(...temps)),
              tempMax: kelvinToCelsius(Math.max(...temps)),
              icon: midday.weather[0].icon,
              conditionCode: midday.weather[0].id,
              description: midday.weather[0].description,
              pop: Math.round(
                Math.max(...items.map((i: any) => i.pop || 0)) * 100
              ),
              windSpeed: mpsToKmh(
                items.reduce((a: number, i: any) => a + i.wind.speed, 0) /
                  items.length
              ),
              humidity: Math.round(
                items.reduce((a: number, i: any) => a + i.main.humidity, 0) /
                  items.length
              ),
            }
          })
      })()
    : null

  const metrics: MetricsData | null =
    current && hourly
      ? {
          rainChance: Math.max(...hourly.map(h => h.pop)),
          precipitation: forecastData?.list?.[0]?.rain?.['3h'] || 0,
          windSpeed: current.windSpeed,
          uvIndex: 0, // Free API doesn't include UV
          humidity: current.humidity,
          visibility: Math.round((weatherData?.visibility || 0) / 1000),
        }
      : null

  const sun: SunData | null = weatherData?.sys?.sunrise
    ? {
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
      }
    : null

  const apiError = weatherData?.error || forecastData?.error || null

  return {
    current,
    hourly,
    daily,
    metrics,
    sun,
    loading: shouldFetch && (!weatherData && !weatherError),
    error: apiError || weatherError?.message || forecastError?.message || null,
  }
}
