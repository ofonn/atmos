import { NextRequest, NextResponse } from 'next/server'
import { geminiGenerateWithRotation } from '@/lib/gemini'
import { requirePlayIntegrity } from '@/lib/playIntegrity'

interface DailySummary {
  date: string
  tempMin: number
  tempMax: number
  conditionCode: number
  description: string
  pop: number
}

export async function POST(req: NextRequest) {
  const unauthorized = await requirePlayIntegrity(req)
  if (unauthorized) return unauthorized

  try {
    const { destination, startDate, endDate, daily } = await req.json()
    if (!destination || !startDate || !endDate || !Array.isArray(daily)) {
      return NextResponse.json({ error: 'destination, startDate, endDate, daily required' }, { status: 400 })
    }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const compact = (daily as DailySummary[])
      .slice(0, 16)
      .map((d) => `${d.date}: ${d.tempMin}-${d.tempMax}°C, ${d.description}, ${d.pop ?? 0}% rain`)
      .join('\n')

    const prompt = `You are Atmos planning a trip to ${destination} from ${startDate} to ${endDate}.

Daily forecast for the destination:
${compact}

Return ONLY JSON, no markdown:
{
  "summary": "1-2 sentence overview of the trip weather",
  "packing": ["item 1", "item 2", ... up to 10 items],
  "watchouts": ["short concern 1", "short concern 2"]
}

Rules:
- packing = concrete clothing + gear (waterproof jacket, hiking boots, swimsuit, etc.). Up to 10 items, prioritized.
- watchouts = up to 3 short flags (heavy rain on day X, very cold mornings, etc.). Empty array if nothing.
- summary = friendly, no jargon.`

    const raw = await geminiGenerateWithRotation(prompt, apiKey)
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      summary: parsed.summary,
      packing: Array.isArray(parsed.packing) ? parsed.packing.slice(0, 10) : [],
      watchouts: Array.isArray(parsed.watchouts) ? parsed.watchouts.slice(0, 3) : [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
