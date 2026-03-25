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
  if (code >= 200 && code < 300) return '⛈️'
  if (code >= 300 && code < 400) return '🌦️'
  if (code >= 500 && code < 600) return '🌧️'
  if (code >= 600 && code < 700) return '❄️'
  if (code >= 700 && code < 800) return '🌫️'
  if (code === 800) return '☀️'
  if (code === 801) return '🌤️'
  if (code === 802) return '⛅'
  if (code >= 803) return '☁️'
  return '🌡️'
}
