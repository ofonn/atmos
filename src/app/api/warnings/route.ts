import { NextRequest, NextResponse } from 'next/server'
import { requirePlayIntegrity } from '@/lib/playIntegrity'

/**
 * Returns active severe-weather warnings for a coordinate.
 * Open-Meteo doesn't have a dedicated warnings endpoint, so we derive
 * one heuristically from the next 48 hours of forecast + WMO codes.
 *
 *   - Thunderstorm (95-99) in next 12h          → "Thunderstorms expected"
 *   - Heavy rain (65, 67, 82) in next 12h       → "Heavy rain expected"
 *   - Heavy snow (75, 77, 86)                   → "Heavy snow expected"
 *   - Gusts > 70 km/h in next 24h               → "High winds"
 *   - Temp > 35°C tomorrow                       → "Extreme heat"
 *   - Temp < -10°C tomorrow                      → "Extreme cold"
 */
export async function GET(req: NextRequest) {
  const unauthorized = await requirePlayIntegrity(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=weather_code,wind_gusts_10m,temperature_2m,precipitation` +
      `&forecast_hours=48&timezone=auto`
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    const h = data.hourly
    if (!h?.time?.length) {
      return NextResponse.json({ warnings: [] })
    }

    type Warn = { id: string; title: string; description: string; severity: 'info' | 'warn' | 'severe' }
    const warnings: Warn[] = []

    const slice = (n: number) => Array.from({ length: Math.min(n, h.time.length) }, (_, i) => i)

    const next12 = slice(12)
    const next24 = slice(24)
    const next48 = slice(48)

    if (next12.some((i) => h.weather_code[i] >= 95 && h.weather_code[i] <= 99)) {
      warnings.push({
        id: 'thunder',
        title: 'Thunderstorms expected',
        description: 'Lightning + heavy showers within 12 hours. Plan indoor activities.',
        severity: 'severe',
      })
    }
    if (next12.some((i) => [65, 67, 82].includes(h.weather_code[i]))) {
      warnings.push({
        id: 'heavy-rain',
        title: 'Heavy rain expected',
        description: 'Intense rainfall in the next 12 hours. Watch for flooding on low ground.',
        severity: 'warn',
      })
    }
    if (next12.some((i) => [75, 77, 86].includes(h.weather_code[i]))) {
      warnings.push({
        id: 'heavy-snow',
        title: 'Heavy snow expected',
        description: 'Significant accumulation possible. Allow extra travel time.',
        severity: 'warn',
      })
    }
    if (next24.some((i) => h.wind_gusts_10m?.[i] >= 70)) {
      warnings.push({
        id: 'high-wind',
        title: 'High winds',
        description: 'Gusts over 70 km/h forecast. Secure loose outdoor items.',
        severity: 'warn',
      })
    }
    if (next48.some((i) => h.temperature_2m?.[i] >= 35)) {
      warnings.push({
        id: 'extreme-heat',
        title: 'Extreme heat',
        description: 'Temperatures above 35°C expected. Hydrate, avoid midday sun.',
        severity: 'severe',
      })
    }
    if (next48.some((i) => h.temperature_2m?.[i] <= -10)) {
      warnings.push({
        id: 'extreme-cold',
        title: 'Extreme cold',
        description: 'Temperatures below -10°C expected. Limit outdoor exposure.',
        severity: 'severe',
      })
    }

    return NextResponse.json({ warnings })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
