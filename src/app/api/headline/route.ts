import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerateWithRotation } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { temp, feelsLike, description, conditionCode, windSpeed, humidity } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const prompt = `You are Atmos, an AI weather assistant. Generate a home screen headline about the weather right now.

Weather data:
- Temperature: ${temp}°C (feels like ${feelsLike}°C)
- Condition: ${description} (code: ${conditionCode})
- Wind: ${windSpeed} km/h
- Humidity: ${humidity}%

CRITICAL RULES:
1. Return ONLY a JSON object, no markdown, no explanation
2. Write like a FRIEND telling someone the weather. Use everyday words people actually say.
3. NEVER use weather jargon. These words are BANNED: overcast, precipitation, atmospheric, humidity, visibility, barometric, celsius, fahrenheit, conditions, forecast, thunderstorm, drizzle, partly cloudy, clear skies
4. Instead use simple words: "cloudy", "rainy", "hot", "cold", "windy", "sunny", "nice", "stormy", "foggy", "grey"
5. "headline" = 5-7 words. Like what a friend would text you. Examples: "It's going to rain all day", "No rain today just clouds", "Really hot out there today", "You won't need an umbrella today", "Pretty nice day to go out"
6. "advice" = 10-15 words. Practical tip in casual language. Examples: "Grab an umbrella before you leave, it's going to pour later today.", "You'll be fine in a t-shirt, it's warm enough to go without a jacket.", "Drink lots of water today, it's going to be really hot outside."
7. NEVER start advice with weather terms. Start with what to DO: "Grab...", "Wear...", "You'll want...", "Don't forget...", "You'll be fine..."

Return exactly: {"headline": "...", "advice": "..."}`

    const raw = await geminiGenerateWithRotation(prompt, apiKey)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ headline: parsed.headline, advice: parsed.advice })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
