import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerateWithRotation } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { current, hourly, daily, localHour, localMinute } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    // Next 4 hours for headline context
    const next4hStr = hourly?.slice(0, 4).map((h: any) =>
      `${new Date(h.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}: ${h.description}, ${Math.round(h.temp)}°C, ${h.pop}% rain`
    ).join('\n') ?? 'Not available'

    // Next 6 hours for proactive insight
    const next6hStr = hourly?.slice(0, 6).map((h: any) =>
      `${new Date(h.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}: ${h.description}, ${Math.round(h.temp)}°C, ${h.pop}% rain`
    ).join('\n') ?? 'Not available'

    const dailyStr = daily?.slice(0, 7).map((d: any) =>
      `${new Date(d.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.description}, high ${Math.round(d.tempMax)}°C, low ${Math.round(d.tempMin)}°C, ${d.pop}% rain`
    ).join('\n') ?? 'Not available'

    const hour = typeof localHour === 'number' ? localHour : new Date().getHours()
    const minute = typeof localMinute === 'number' ? localMinute : new Date().getMinutes()
    const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
    const isNight = hour < 6 || hour >= 22
    const timeStr = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`

    const prompt = `You are Atmos, an AI weather assistant that talks like a smart, caring friend — never like a boring weather app. Generate ALL UI content using the weather data below.

CURRENT LOCAL TIME: ${timeStr} (${timeOfDay})${isNight ? ' — it is NIGHT, absolutely do NOT suggest going outside or any outdoor activities' : ''}

WESTERN AUDIENCE — factor in seasons, commuting, school runs, dog walks, pollen, frost, BBQs, gardening, cycling, running. Mention specific concerns for this time of year when relevant.

CURRENT CONDITIONS:
- Temperature: ${current?.temp}°C (feels like ${current?.feelsLike}°C)
- Sky: ${current?.description}
- Wind: ${current?.windSpeed} km/h
- Humidity: ${current?.humidity}%
- Visibility: ${current?.visibility ? (current.visibility / 1000).toFixed(1) : 'N/A'} km

NEXT 4 HOURS (use this for headline + advice):
${next4hStr}

NEXT 6 HOURS (use this for proactiveInsight):
${next6hStr}

7-DAY FORECAST (use this for weekSummary):
${dailyStr}

CRITICAL LANGUAGE RULES:
- Sound like a real person texting a friend, NOT a weather app
- NEVER use: overcast, precipitation, atmospheric, barometric, celsius, fahrenheit, forecast, thunderstorm, drizzle, partly cloudy, clear skies, humidity, visibility, conditions
- USE instead: cloudy, grey, rainy, hot, sticky, warm, cold, windy, sunny, nice, gloomy, muggy, breezy
- Reference specific temps and times, not vague statements
- For the headline: combine NOW + what's happening in the next 4 hours to capture the full picture
- For proactiveInsight: be genuinely helpful and specific — mention UV, rain windows, heat, etc.

Return ONLY valid JSON (no markdown, no extra text):
{
  "headline": "5-8 casual words capturing the current moment + near-future vibe, like a friend texting you. E.g. 'Grey and sticky but clearing up later' or 'Hot now, rain coming this afternoon'",
  "advice": "One practical sentence (15-20 words) starting with an action verb like Grab/Wear/You'll need/Don't forget/Stay — make it specific to the actual conditions",
  "proactiveInsight": "4-5 sentences covering: what it feels like right now, what changes in the next 6 hours, any specific things to watch out for (UV, rain window, heat peak, wind), and a practical recommendation. Be specific with times and temperatures. Sound like a smart friend, not a robot.",
  "weekSummary": "3-4 sentences covering the week: best days for being outside, when to expect rain, anything to plan around. Be specific about which days.",
  "outfit": "1-2 sentences on what to wear today, referencing actual temps and conditions.",
  "activity": "One sentence on the best time to go outside or do something active today — but ONLY if it's daytime and conditions are suitable. If it's night, suggest something for tomorrow morning instead. If conditions are bad (heavy rain, snow, extreme cold/heat), suggest staying in."
}`

    const raw = await geminiGenerateWithRotation(prompt, apiKey)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      headline: parsed.headline,
      advice: parsed.advice,
      proactiveInsight: parsed.proactiveInsight,
      weekSummary: parsed.weekSummary,
      outfit: parsed.outfit || 'Dress comfortably for the current conditions.',
      activity: parsed.activity || 'Take it easy today.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
