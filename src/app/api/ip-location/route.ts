import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the client's IP from headers (Vercel/proxies set these)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || null

    // Use ip-api.com (free, no key needed, 45 req/min)
    const url = ip
      ? `http://ip-api.com/json/${ip}?fields=status,city,country,countryCode,lat,lon`
      : `http://ip-api.com/json/?fields=status,city,country,countryCode,lat,lon`

    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()

    if (data.status !== 'success') {
      return NextResponse.json({ error: 'Could not determine location from IP' }, { status: 502 })
    }

    return NextResponse.json({
      lat: data.lat,
      lon: data.lon,
      name: data.city || 'Unknown',
      country: data.countryCode || '',
    })
  } catch {
    return NextResponse.json({ error: 'IP location lookup failed' }, { status: 500 })
  }
}
