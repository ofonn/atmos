import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })

  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air_quality?latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
      `&timezone=auto`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: 'Air Quality API error' }, { status: res.status })

    // Transform to a shape compatible with what the technical page expects
    const current = data.current
    const aqi = current?.european_aqi ?? current?.us_aqi ?? 0

    // Map to 1-5 scale matching the existing aqiLabel/aqiColor utilities
    let aqiLevel = 1
    if (aqi > 100) aqiLevel = 5
    else if (aqi > 75) aqiLevel = 4
    else if (aqi > 50) aqiLevel = 3
    else if (aqi > 25) aqiLevel = 2
    else aqiLevel = 1

    return NextResponse.json({
      list: [{
        main: { aqi: aqiLevel },
        components: {
          co: current?.carbon_monoxide ?? 0,
          no2: current?.nitrogen_dioxide ?? 0,
          o3: current?.ozone ?? 0,
          so2: current?.sulphur_dioxide ?? 0,
          pm2_5: current?.pm2_5 ?? 0,
          pm10: current?.pm10 ?? 0,
        },
      }],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
