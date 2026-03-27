export function kelvinToCelsius(k: number): number {
  return Math.round(k - 273.15)
}

export function kelvinToFahrenheit(k: number): number {
  return Math.round((k - 273.15) * 9 / 5 + 32)
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32)
}

export function mpsToKmh(mps: number): number {
  return Math.round(mps * 3.6)
}

export function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371)
}

/** Display temperature with unit label */
export function displayTemp(celsius: number, unit: 'C' | 'F'): string {
  if (unit === 'F') return `${celsiusToFahrenheit(celsius)}°F`
  return `${celsius}°C`
}

/** Display just the number + degree symbol with unit letter */
export function displayTempShort(celsius: number, unit: 'C' | 'F'): string {
  if (unit === 'F') return `${celsiusToFahrenheit(celsius)}°`
  return `${celsius}°`
}

/** Get just the converted number */
export function convertTemp(celsius: number, unit: 'C' | 'F'): number {
  return unit === 'F' ? celsiusToFahrenheit(celsius) : celsius
}

/** Get the unit suffix */
export function tempSuffix(unit: 'C' | 'F'): string {
  return unit === 'F' ? '°F' : '°C'
}

/** Display wind speed with unit label */
export function displayWind(kmh: number, unit: 'kmh' | 'mph'): string {
  if (unit === 'mph') return `${kmhToMph(kmh)} mph`
  return `${kmh} km/h`
}

/** Format a unix timestamp as time string (legacy — prefer formatTimeDisplay) */
export function formatTime(timestamp: number, timezone?: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Format a time value respecting 12h/24h user preference.
 * Accepts unix timestamp (seconds), Date object, or ISO string.
 */
export function formatTimeDisplay(
  input: number | Date | string,
  format: '12h' | '24h' = '24h'
): string {
  let date: Date
  if (typeof input === 'number') {
    date = new Date(input * 1000)
  } else if (typeof input === 'string') {
    date = new Date(input)
  } else {
    date = input
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  })
}

/**
 * Format an ISO time string (e.g. "2024-01-01T15:00") as just the time.
 * Respects 12h/24h preference.
 */
export function formatHourFromISO(iso: string, format: '12h' | '24h' = '24h'): string {
  const date = new Date(iso)
  if (format === '12h') {
    const h = date.getHours()
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12} ${suffix}`
  }
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

/** Returns "X min ago" or "just now" relative to a unix timestamp (seconds) */
export function timeAgo(dt: number): string {
  const mins = Math.floor((Date.now() / 1000 - dt) / 60)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 min ago'
  if (mins < 60) return `${mins} min ago`
  return `${Math.floor(mins / 60)}h ago`
}

export function formatDay(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateFromISO(iso: string): string {
  const date = new Date(iso + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}

export function getConditionEmoji(code: number): string {
  // WMO codes (0-99)
  if (code === 0 || code === 1) return '☀️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️'
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}
