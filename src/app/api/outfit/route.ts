import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerateWithRotation } from '@/lib/gemini'
import { requirePlayIntegrity } from '@/lib/playIntegrity'

export async function POST(req: NextRequest) {
  const unauthorized = await requirePlayIntegrity(req)
  if (unauthorized) return unauthorized

  try {
    const { temp, feelsLike, conditionCode, windSpeed, humidity, pop } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const prompt = `You are Atmos. Recommend an outfit for someone going outside right now.

Weather:
- Temperature: ${temp}°C (feels like ${feelsLike}°C)
- Wind: ${windSpeed} km/h
- Humidity: ${humidity}%
- Chance of rain: ${pop ?? 0}%
- Condition code (WMO): ${conditionCode}

Return ONLY a JSON object, no markdown:
{
  "tldr": "5-7 word summary line",
  "items": ["item 1", "item 2", "item 3", "item 4"],
  "tip": "one-sentence comfort tip (max 18 words)"
}

Rules:
- 4 items, concrete clothing pieces (not 'warm clothes' — say 'wool sweater').
- No weather jargon. Talk like a friend.
- If raining, suggest waterproof items. If windy, layers. If sunny + hot, breathable + sunglasses + sunscreen.`

    const raw = await geminiGenerateWithRotation(prompt, apiKey)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      tldr: parsed.tldr,
      items: Array.isArray(parsed.items) ? parsed.items.slice(0, 4) : [],
      tip: parsed.tip,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
