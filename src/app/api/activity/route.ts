import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerateWithRotation } from '@/lib/gemini'
import { requirePlayIntegrity } from '@/lib/playIntegrity'
import { getServerUser, getUserTier } from '@/lib/supabase/auth'
import { enforceUsage } from '@/lib/supabase/usage'

export async function POST(req: NextRequest) {
  const unauthorized = await requirePlayIntegrity(req)
  if (unauthorized) return unauthorized

  const user = await getServerUser()
  if (user) {
    const tier = await getUserTier(user.id)
    const limited = await enforceUsage('activity', tier)
    if (limited) return limited
  }

  try {
    const { hourly } = await req.json()
    // Expect: hourly = [{ hour: 9, temp, conditionCode, pop, windSpeed, uvIndex }, ...]
    if (!Array.isArray(hourly) || hourly.length === 0) {
      return NextResponse.json({ error: 'hourly required' }, { status: 400 })
    }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const compact = hourly.slice(0, 18).map((h: any) =>
      `${h.hour}h: ${h.temp}°C, code ${h.conditionCode}, ${h.pop ?? 0}% rain, ${h.windSpeed}km/h, UV ${h.uvIndex ?? 0}`,
    ).join('\n')

    const prompt = `You are Atmos. From the next 18 hourly weather slots, pick the BEST 2-3 time windows for common outdoor activities. Each window should be 2-3 hours.

Hourly data:
${compact}

Return ONLY JSON, no markdown:
{
  "windows": [
    { "activity": "Running",   "start": "9h", "end": "11h", "why": "10-word reason" },
    { "activity": "Walk",      "start": "16h", "end": "18h", "why": "10-word reason" },
    { "activity": "Picnic",    "start": "12h", "end": "14h", "why": "10-word reason" }
  ]
}

Rules:
- 2-3 windows total. Pick distinct activities.
- Each "why" is max 12 words, friendly tone.
- If no good windows (heavy rain all day), return windows: [] and an extra "fallback": "stay indoors" line.`

    const raw = await geminiGenerateWithRotation(prompt, apiKey)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      windows: Array.isArray(parsed.windows) ? parsed.windows.slice(0, 3) : [],
      fallback: parsed.fallback,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
