import { NextRequest, NextResponse } from 'next/server'
import { geocodeCity } from '@/lib/weather'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q) {
    return NextResponse.json({ error: 'query required' }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    return NextResponse.json({ error: 'OpenWeather API key not configured' }, { status: 500 })
  }

  try {
    const data = await geocodeCity(q, apiKey)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to geocode' }, { status: 500 })
  }
}
