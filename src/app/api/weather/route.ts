import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWeather } from '@/lib/weather'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    return NextResponse.json({ error: 'OpenWeather API key not configured' }, { status: 500 })
  }

  try {
    const data = await getCurrentWeather(Number(lat), Number(lon), apiKey)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch weather data' }, { status: 500 })
  }
}
