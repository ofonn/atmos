import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerateWithRotation } from '@/lib/gemini'

const TONE_INSTRUCTIONS: Record<string, string> = {
  casual:      'Talk like a smart friend texting someone about the weather — warm, direct, zero jargon.',
  punchy:      'Be short, vivid and impactful. Every word earns its place. Hit hard in 5-7 words.',
  sarcastic:   'Dry, sardonic wit. The weather is mildly absurd and you\'re mildly unbothered. Clever, never mean.',
  funny:       'Genuinely funny — a light pun or joke about the conditions. Keep it accessible, not cringe.',
  dramatic:    'Cinematic and atmospheric. Write like a movie voiceover describing an ominous or beautiful scene.',
  informative: 'Lead with the single most important thing to know. Clear, factual, reassuring.',
  smart:       'A clever observation that reframes the weather in an interesting or unexpected way.',
  local:       'Speak like a local who knows this place well. Reference the city and its weather personality naturally.',
}

export async function POST(req: NextRequest) {
  try {
    const {
      current, hourly, daily,
      localHour, localMinute,
      headlineTone = 'casual',
      headlineTwoLine = false,
      headlineLocationFlavor = false,
      headlineTimeAware = false,
      locationName, locationCountry,
    } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const next4hStr = hourly?.slice(0, 4).map((h: any) =>
      `${new Date(h.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}: ${h.description}, ${Math.round(h.temp)}°C, ${h.pop}% rain`
    ).join('\n') ?? 'Not available'

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

    // Time-aware tone override
    let effectiveTone = headlineTone
    if (headlineTimeAware) {
      if (hour >= 5 && hour < 9)   effectiveTone = 'informative'  // morning briefing
      else if (hour >= 12 && hour < 15) effectiveTone = effectiveTone  // peak day — keep chosen
      else if (hour >= 17 && hour < 21) effectiveTone = 'casual'   // wind-down
      else if (isNight)                 effectiveTone = 'dramatic'  // night = atmospheric
    }

    const toneInstruction = TONE_INSTRUCTIONS[effectiveTone] ?? TONE_INSTRUCTIONS.casual

    // Location context block
    const locationBlock = (headlineLocationFlavor && locationName)
      ? `\nLOCATION: ${locationName}${locationCountry ? `, ${locationCountry}` : ''}. Reference this naturally in the headline if it adds flavour. Know the local climate — not Western seasons.`
      : ''

    // Headline format instruction
    const headlineFormat = headlineTwoLine
      ? `"hook": "3-5 word SETUP — intriguing or provocative opener", "headline": "4-7 word PAYOFF — completes or contrasts the hook"`
      : `"headline": "5-8 words capturing now + near-future vibe"`

    const prompt = `You are Atmos, an AI weather assistant. Generate home screen content from the weather data below.

HEADLINE TONE: ${toneInstruction}
${locationBlock}

CURRENT LOCAL TIME: ${timeStr} (${timeOfDay})${isNight ? ' — it is NIGHT, do NOT suggest outdoor activities' : ''}

CURRENT CONDITIONS:
- Temperature: ${current?.temp}°C (feels like ${current?.feelsLike}°C)
- Sky: ${current?.description}
- Wind: ${current?.windSpeed} km/h
- Humidity: ${current?.humidity}%

NEXT 4 HOURS:
${next4hStr}

NEXT 6 HOURS:
${next6hStr}

7-DAY FORECAST:
${dailyStr}

LANGUAGE RULES (always apply regardless of tone):
- NEVER use: overcast, precipitation, atmospheric, barometric, celsius, fahrenheit, forecast, thunderstorm, drizzle, partly cloudy, clear skies, humidity, visibility, conditions
- USE: cloudy, grey, rainy, hot, sticky, warm, cold, windy, sunny, gloomy, muggy, breezy
- Reference specific temps and times, not vague statements

Return ONLY valid JSON (no markdown):
{
  ${headlineFormat},
  "advice": "One practical 15-20 word sentence starting with: Grab/Wear/You'll need/Don't forget/Stay/Bring",
  "proactiveInsight": "4-5 sentences: what it feels like now, what changes in the next 6 hours, any UV/rain/heat/wind watch-outs, and a practical tip. Specific times and temps. Smart friend tone, not a robot.",
  "weekSummary": "3-4 sentences: best days outside, when to expect rain, anything to plan around.",
  "outfit": "1-2 sentences on what to wear today, referencing actual temps and conditions.",
  "activity": "${isNight ? 'Suggest something for tomorrow morning given the forecast.' : 'Best time to go outside or do something active today — specific time, specific reason.'}"
}`

    const raw = await geminiGenerateWithRotation(prompt, apiKey)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      headline: parsed.headline,
      hook: parsed.hook ?? null,
      advice: parsed.advice,
      proactiveInsight: parsed.proactiveInsight,
      weekSummary: parsed.weekSummary,
      outfit: parsed.outfit || 'Dress for the conditions.',
      activity: parsed.activity || 'Take it easy today.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
