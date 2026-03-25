import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  try {
    // Reverse geocoding: coords → city name (via Nominatim)
    if (lat && lon) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        {
          headers: { 'User-Agent': 'Atmos-Weather-App/1.0' },
          next: { revalidate: 3600 },
        }
      )
      const data = await res.json()
      const name =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        data.address?.county ||
        'Unknown'
      const country = data.address?.country_code?.toUpperCase() || ''
      return NextResponse.json([{ lat: Number(lat), lon: Number(lon), name, country }])
    }

    // Forward geocoding: city name → coords (via Open-Meteo)
    if (!q) {
      return NextResponse.json({ error: 'query or lat/lon required' }, { status: 400 })
    }

    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()

    if (!data.results || data.results.length === 0) {
      return NextResponse.json([])
    }

    const results = data.results.map((r: any) => ({
      lat: r.latitude,
      lon: r.longitude,
      name: r.name,
      country: r.country_code || '',
    }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: 'Failed to geocode' }, { status: 500 })
  }
}
