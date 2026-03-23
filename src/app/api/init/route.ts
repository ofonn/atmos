import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { current, hourly, daily } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const hourlyStr = hourly?.slice(0, 8).map((h: any) =>
      `${new Date(h.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}: ${h.description}, ${Math.round(h.temp)}°C, ${h.pop}% rain chance`
    ).join('\n') ?? 'Not available'

    const dailyStr = daily?.slice(0, 7).map((d: any) =>
      `${new Date(d.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.description}, high ${Math.round(d.tempMax)}°C, low ${Math.round(d.tempMin)}°C, ${d.pop}% rain, humidity ${d.humidity}%`
    ).join('\n') ?? 'Not available'

    const prompt = `You are Atmos, an AI weather assistant. Generate ALL UI content for the app in one response using the weather data below.

CURRENT CONDITIONS:
- Temperature: ${current?.temp?.toFixed(1)}°C (feels like ${current?.feelsLike?.toFixed(1)}°C)
- Condition: ${current?.description} (code: ${current?.conditionCode})
- Wind: ${current?.windSpeed?.toFixed(1)} km/h
- Humidity: ${current?.humidity}%
- Pressure: ${current?.pressure} hPa
- Visibility: ${current?.visibility ? (current.visibility / 1000).toFixed(1) : 'N/A'} km

HOURLY FORECAST (next 8 hours):
${hourlyStr}

7-DAY FORECAST:
${dailyStr}

CRITICAL LANGUAGE RULES (apply to ALL fields):
- Write like a FRIEND, not a weather app
- BANNED words: overcast, precipitation, atmospheric, barometric, celsius, fahrenheit, conditions, forecast, thunderstorm, drizzle, partly cloudy, clear skies, humidity, visibility
- Use simple words: cloudy, rainy, hot, cold, windy, sunny, nice, stormy, foggy, grey

Return ONLY this JSON (no markdown, no extra text):
{
  "headline": "5-7 casual words about right now, like a friend texting you",
  "advice": "10-15 words practical tip starting with action word: Grab/Wear/You'll/Don't/Stay",
  "proactiveInsight": "2 sentences about current conditions and what to do about it, casual tone",
  "weekSummary": "3-4 sentences planning the week: which days are best for outdoor activities, when to expect rain, what to prepare for. Be specific about days."
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Gemini error')

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      headline: parsed.headline,
      advice: parsed.advice,
      proactiveInsight: parsed.proactiveInsight,
      weekSummary: parsed.weekSummary,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
