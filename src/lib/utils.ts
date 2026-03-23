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

export function formatTime(timestamp: number, timezone?: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
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
