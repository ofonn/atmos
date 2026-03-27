/**
 * Maps WMO weather codes to Meteocons icon names.
 * Icons by Bas Milius — https://github.com/basmilius/weather-icons
 * Served via jsDelivr CDN (animated SVG, production/fill/svg/).
 */

const BASE = 'https://cdn.jsdelivr.net/gh/basmilius/weather-icons@dev/production/fill/svg'

export function wmoToMeteoconName(code: number, isDay: boolean): string {
  const d = isDay ? 'day' : 'night'

  if (code === 0 || code === 1) return `clear-${d}`
  if (code === 2) return `partly-cloudy-${d}`
  if (code === 3) return 'overcast'
  if (code === 45 || code === 48) return `fog-${d}`

  // Drizzle
  if (code === 51) return `partly-cloudy-${d}-drizzle`
  if (code === 53 || code === 55) return `overcast-${d}-drizzle`

  // Freezing drizzle / sleet
  if (code === 56 || code === 57) return `overcast-${d}-sleet`

  // Rain
  if (code === 61) return `partly-cloudy-${d}-rain`
  if (code === 63) return `overcast-${d}-rain`
  if (code === 65) return `extreme-${d}-rain`

  // Freezing rain
  if (code === 66) return `overcast-${d}-sleet`
  if (code === 67) return `extreme-${d}-sleet`

  // Snow
  if (code === 71) return `partly-cloudy-${d}-snow`
  if (code === 73) return `overcast-${d}-snow`
  if (code === 75 || code === 77) return `extreme-${d}-snow`

  // Showers
  if (code === 80) return `partly-cloudy-${d}-rain`
  if (code === 81) return `overcast-${d}-rain`
  if (code === 82) return `extreme-${d}-rain`

  // Snow showers
  if (code === 85 || code === 86) return `snow-showers-${d}`

  // Thunderstorms
  if (code === 95) return `thunderstorms-${d}`
  if (code === 96 || code === 99) return `thunderstorms-${d}-rain`

  return `partly-cloudy-${d}`
}

export function meteoconUrl(code: number, isDay: boolean): string {
  return `${BASE}/${wmoToMeteoconName(code, isDay)}.svg`
}
