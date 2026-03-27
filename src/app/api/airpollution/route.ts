import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })

  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
      `&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
      `&timezone=auto&forecast_days=2`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown error')
      console.error('Air Quality API error:', res.status, errText)
      return NextResponse.json({ error: `Air Quality API error: ${res.status}` }, { status: res.status })
    }

    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    // Transform to a shape compatible with what the technical page expects
    const current = data.current
    if (!current) {
      return NextResponse.json({ error: 'No current air quality data returned' }, { status: 422 })
    }

    const aqi = current.european_aqi ?? current.us_aqi ?? 0

    // Map Open-Meteo European AQI (0-500+) to 1-5 scale
    let aqiLevel = 1
    if (aqi > 80) aqiLevel = 5
    else if (aqi > 60) aqiLevel = 4
    else if (aqi > 40) aqiLevel = 3
    else if (aqi > 20) aqiLevel = 2
    else aqiLevel = 1

    // Find current pollen values from hourly data (first available slot)
    const pollenHourly = data.hourly
    let pollen: Record<string, number | null> = {
      alder: null, birch: null, grass: null, mugwort: null, olive: null, ragweed: null,
    }
    if (pollenHourly?.time?.length) {
      const now = Date.now()
      let idx = 0
      for (let i = 0; i < pollenHourly.time.length; i++) {
        if (new Date(pollenHourly.time[i]).getTime() >= now - 3600000) { idx = i; break }
      }
      pollen = {
        alder: pollenHourly.alder_pollen?.[idx] ?? null,
        birch: pollenHourly.birch_pollen?.[idx] ?? null,
        grass: pollenHourly.grass_pollen?.[idx] ?? null,
        mugwort: pollenHourly.mugwort_pollen?.[idx] ?? null,
        olive: pollenHourly.olive_pollen?.[idx] ?? null,
        ragweed: pollenHourly.ragweed_pollen?.[idx] ?? null,
      }
    }

    return NextResponse.json({
      list: [{
        main: { aqi: aqiLevel },
        components: {
          co: current.carbon_monoxide ?? null,
          no2: current.nitrogen_dioxide ?? null,
          o3: current.ozone ?? null,
          so2: current.sulphur_dioxide ?? null,
          pm2_5: current.pm2_5 ?? null,
          pm10: current.pm10 ?? null,
        },
        pollen,
      }],
    })
  } catch (e: any) {
    console.error('Air quality fetch failed:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
