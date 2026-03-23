// Shared WMO weather code utilities and display helpers.
// Extracted to avoid duplication across technical and overview pages.

export const WMO: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail',
}

export function wmoDesc(code: number): string {
  return WMO[code] ?? `Code ${code}`
}

export function wmoEmoji(code: number, isDay = 1): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code === 1) return isDay ? '🌤️' : '🌙'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 55) return '🌦️'
  if (code >= 56 && code <= 57) return '🌨️'
  if (code >= 61 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return isDay ? '🌤️' : '🌙'
}

/** Convert Kelvin to Celsius with 1 decimal place */
export function kelvinToC(k: number): number { return k - 273.15 }

/** Format a Kelvin value respecting the user's unit preference */
export function displayKelvin(k: number, unit: 'C' | 'F', decimals = 1): string {
  const c = k - 273.15
  if (unit === 'F') {
    const f = c * 9 / 5 + 32
    return `${f.toFixed(decimals)}°F`
  }
  return `${c.toFixed(decimals)}°C`
}

/** Format a Celsius value (e.g. from Open-Meteo) respecting unit preference */
export function displayCelsius(c: number, unit: 'C' | 'F', decimals = 1): string {
  if (unit === 'F') {
    const f = c * 9 / 5 + 32
    return `${f.toFixed(decimals)}°F`
  }
  return `${c.toFixed(decimals)}°C`
}

/** Difference between two Kelvin values, formatted with sign */
export function displayKelvinDiff(kA: number, kB: number, unit: 'C' | 'F'): string {
  const diff = kA - kB
  const converted = unit === 'F' ? diff * 9 / 5 : diff
  const sign = converted >= 0 ? '+' : ''
  return `${sign}${converted.toFixed(1)}°`
}

export function getWindDir16(deg: number): string {
  const pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return pts[Math.round(deg / 22.5) % 16]
}

export function secsToHm(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h ${m}m`
}

export function fmtUnix(dt: number, offsetSecs: number, mode: 'time' | 'date' = 'time'): string {
  const d = new Date((dt + offsetSecs) * 1000)
  if (mode === 'date') {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
}

export function fmtISOTime(iso: string): string { return iso.slice(11, 16) }

export function fmtISODate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

export function uviColor(uvi: number): string {
  if (uvi <= 2) return '#22c55e'
  if (uvi <= 5) return '#eab308'
  if (uvi <= 7) return '#f97316'
  if (uvi <= 10) return '#ef4444'
  return '#a855f7'
}

export function uviLabel(uvi: number): string {
  if (uvi <= 2) return 'Low'
  if (uvi <= 5) return 'Moderate'
  if (uvi <= 7) return 'High'
  if (uvi <= 10) return 'Very High'
  return 'Extreme'
}

export function aqiColor(aqi: number): string {
  return ['#22c55e', '#a3e635', '#eab308', '#f97316', '#ef4444'][aqi - 1] ?? '#94a3b8'
}

export function aqiLabel(aqi: number): string {
  return ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi - 1] ?? 'Unknown'
}
