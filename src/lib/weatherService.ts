// Single source of truth for transforming Open-Meteo API data into the app's internal model.
// All UI components consume these types — never raw API shapes.

import { wmoDesc } from './weatherUtils'
import type {
  CurrentWeatherData,
  HourlyData,
  DailyData,
  MetricsData,
  SunData,
  Minutely15Data,
  OpenMeteoResponse,
} from '@/types/weather'

/** Find the index in hourly arrays closest to the current time */
function findCurrentHourIndex(times: string[]): number {
  const now = Date.now()
  let closest = 0
  let minDiff = Infinity
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now)
    if (diff < minDiff) {
      minDiff = diff
      closest = i
    }
  }
  return closest
}

/** Get the next N hourly slots starting from the current hour */
function getUpcomingHourlyIndices(times: string[], count: number): number[] {
  const now = Date.now()
  const indices: number[] = []
  for (let i = 0; i < times.length && indices.length < count; i++) {
    if (new Date(times[i]).getTime() >= now - 30 * 60 * 1000) {
      indices.push(i)
    }
  }
  return indices
}

export function transformCurrent(data: OpenMeteoResponse): CurrentWeatherData {
  const c = data.current
  // Get today's min/max from daily data
  const todayMax = data.daily.temperature_2m_max[0] ?? c.temperature_2m
  const todayMin = data.daily.temperature_2m_min[0] ?? c.temperature_2m

  // Get visibility from closest hourly slot
  const hIdx = findCurrentHourIndex(data.hourly.time)
  const visibility = data.hourly.visibility?.[hIdx] ?? 10000
  const uvIndex = data.hourly.uv_index?.[hIdx] ?? 0

  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    tempMin: Math.round(todayMin),
    tempMax: Math.round(todayMax),
    humidity: c.relative_humidity_2m,
    description: wmoDesc(c.weather_code),
    icon: String(c.weather_code),
    conditionCode: c.weather_code,
    windSpeed: Math.round(c.wind_speed_10m),
    windDeg: c.wind_direction_10m,
    pressure: Math.round(c.pressure_msl),
    visibility: Math.round(visibility),
    clouds: c.cloud_cover,
    dt: Math.floor(new Date(c.time).getTime() / 1000),
    isDay: c.is_day === 1,
    uvIndex: Math.round(uvIndex * 10) / 10,
    windGusts: Math.round(c.wind_gusts_10m),
    precipitation: c.precipitation,
  }
}

export function transformHourly(data: OpenMeteoResponse, count = 8): HourlyData[] {
  const h = data.hourly
  const indices = getUpcomingHourlyIndices(h.time, count)

  return indices.map(i => ({
    dt: Math.floor(new Date(h.time[i]).getTime() / 1000),
    time: h.time[i],
    temp: Math.round(h.temperature_2m[i]),
    icon: String(h.weather_code[i]),
    conditionCode: h.weather_code[i],
    pop: h.precipitation_probability[i] ?? 0,
    description: wmoDesc(h.weather_code[i]),
    isDay: (h.is_day?.[i] ?? 1) === 1,
    uvIndex: Math.round((h.uv_index?.[i] ?? 0) * 10) / 10,
  }))
}

export function transformDaily(data: OpenMeteoResponse): DailyData[] {
  const d = data.daily
  return d.time.map((date, i) => ({
    dt: Math.floor(new Date(date + 'T12:00:00').getTime() / 1000),
    date,
    tempMin: Math.round(d.temperature_2m_min[i]),
    tempMax: Math.round(d.temperature_2m_max[i]),
    icon: String(d.weather_code[i]),
    conditionCode: d.weather_code[i],
    description: wmoDesc(d.weather_code[i]),
    pop: d.precipitation_probability_max[i] ?? 0,
    windSpeed: Math.round(d.wind_speed_10m_max[i]),
    humidity: 0, // Open-Meteo daily doesn't include humidity directly
    sunrise: d.sunrise[i],
    sunset: d.sunset[i],
    uvIndexMax: d.uv_index_max[i] ?? 0,
    precipitationSum: d.precipitation_sum[i] ?? 0,
  }))
}

export function transformMetrics(
  current: CurrentWeatherData,
  hourly: HourlyData[],
  data: OpenMeteoResponse
): MetricsData {
  const hIdx = findCurrentHourIndex(data.hourly.time)
  return {
    rainChance: Math.max(...hourly.map(h => h.pop)),
    precipitation: current.precipitation,
    windSpeed: current.windSpeed,
    uvIndex: current.uvIndex,
    humidity: current.humidity,
    visibility: Math.round(current.visibility / 1000),
  }
}

export function transformSun(data: OpenMeteoResponse): SunData {
  return {
    sunrise: Math.floor(new Date(data.daily.sunrise[0]).getTime() / 1000),
    sunset: Math.floor(new Date(data.daily.sunset[0]).getTime() / 1000),
  }
}

export function transformMinutely15(data: OpenMeteoResponse): Minutely15Data | null {
  if (!data.minutely_15) return null
  // Return the next 4 slots (now, +15m, +30m, +45m)
  const now = Date.now()
  const times = data.minutely_15.time
  const precip = data.minutely_15.precipitation

  let startIdx = 0
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() >= now - 15 * 60 * 1000) {
      startIdx = i
      break
    }
  }

  return {
    time: times.slice(startIdx, startIdx + 4),
    precipitation: precip.slice(startIdx, startIdx + 4),
  }
}
