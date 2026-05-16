import { NextRequest, NextResponse } from 'next/server'
import { requirePlayIntegrity } from '@/lib/playIntegrity'

/**
 * Returns yesterday's daily summary at the given lat/lon, used by the
 * "yesterday vs today" comparison row. Free Open-Meteo archive endpoint.
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

  const today = new Date()
  const yesterday = new Date(today.getTime() - 86_400_000)
  const isoYesterday = yesterday.toISOString().slice(0, 10)

  try {
    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_date=${isoYesterday}&end_date=${isoYesterday}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
      `&timezone=auto`

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return NextResponse.json({ error: `Archive API ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    const d = data.daily
    if (!d?.time?.length) {
      return NextResponse.json({ error: 'no data' }, { status: 404 })
    }

    return NextResponse.json({
      date: d.time[0],
      tempMax: d.temperature_2m_max[0],
      tempMin: d.temperature_2m_min[0],
      precipitation: d.precipitation_sum[0],
      conditionCode: d.weather_code[0],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
