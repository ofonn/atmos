import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message || 'One Call API error' }, { status: res.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
