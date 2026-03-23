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
}

export interface HourlyData {
  dt: number
  temp: number
  icon: string
  conditionCode: number
  pop: number // probability of precipitation
  description: string
}

export interface DailyData {
  dt: number
  tempMin: number
  tempMax: number
  icon: string
  conditionCode: number
  description: string
  pop: number
  windSpeed: number
  humidity: number
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

export interface WeatherContextData {
  current: CurrentWeatherData | null
  hourly: HourlyData[] | null
  daily: DailyData[] | null
}
