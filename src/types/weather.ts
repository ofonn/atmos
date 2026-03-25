export interface Location {
  lat: number
  lon: number
  name: string
  country: string
}

export interface CurrentWeatherData {
  temp: number
  feelsLike: number
  tempMin: number
  tempMax: number
  humidity: number
  description: string
  icon: string
  conditionCode: number
  windSpeed: number
  windDeg: number
  pressure: number
  visibility: number
  clouds: number
  dt: number
  isDay: boolean
  uvIndex: number
  windGusts: number
  precipitation: number
}

export interface HourlyData {
  dt: number
  time: string // ISO string for display
  temp: number
  icon: string
  conditionCode: number
  pop: number // probability of precipitation 0-100
  description: string
  isDay: boolean
}

export interface DailyData {
  dt: number
  date: string // ISO date string
  tempMin: number
  tempMax: number
  icon: string
  conditionCode: number
  description: string
  pop: number
  windSpeed: number
  humidity: number
  sunrise: string
  sunset: string
  uvIndexMax: number
  precipitationSum: number
}

export interface MetricsData {
  rainChance: number
  precipitation: number
  windSpeed: number
  uvIndex: number
  humidity: number
  visibility: number
}

export interface SunData {
  sunrise: number
  sunset: number
}

export interface Minutely15Data {
  time: string[]
  precipitation: number[]
}

export interface WeatherContextData {
  current: CurrentWeatherData | null
  hourly: HourlyData[] | null
  daily: DailyData[] | null
}

/** Raw Open-Meteo API response shape */
export interface OpenMeteoResponse {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    is_day: number
    precipitation: number
    rain: number
    showers: number
    snowfall: number
    weather_code: number
    cloud_cover: number
    pressure_msl: number
    surface_pressure: number
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    apparent_temperature: number[]
    precipitation_probability: number[]
    precipitation: number[]
    weather_code: number[]
    visibility: number[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    wind_gusts_10m: number[]
    uv_index: number[]
    is_day: number[]
    [key: string]: any
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    apparent_temperature_max: number[]
    apparent_temperature_min: number[]
    sunrise: string[]
    sunset: string[]
    daylight_duration: number[]
    sunshine_duration: number[]
    uv_index_max: number[]
    precipitation_sum: number[]
    precipitation_probability_max: number[]
    rain_sum: number[]
    snowfall_sum: number[]
    precipitation_hours: number[]
    wind_speed_10m_max: number[]
    wind_gusts_10m_max: number[]
    wind_direction_10m_dominant: number[]
    [key: string]: any
  }
  minutely_15?: {
    time: string[]
    precipitation: number[]
  }
  timezone: string
  utc_offset_seconds: number
}
