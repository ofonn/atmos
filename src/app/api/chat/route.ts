import { NextRequest, NextResponse } from 'next/server'
import { createGeminiClient, buildSystemPrompt, type PersonalityOptions } from '@/lib/gemini'
import { requirePlayIntegrity } from '@/lib/playIntegrity'
import { getServerUser, getUserTier } from '@/lib/supabase/auth'
import { enforceUsage } from '@/lib/supabase/usage'

const MODEL_ROTATION = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
]

function isRateLimit(error: any): boolean {
  const msg = (error?.message || '') + (error?.status || '')
  return msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('not found')
}

export async function POST(request: NextRequest) {
  const unauthorized = await requirePlayIntegrity(request)
  if (unauthorized) return unauthorized

  // Per-user rate limit when authenticated. Anonymous traffic falls
  // through the existing Play Integrity gate above.
  const user = await getServerUser()
  if (user) {
    const tier = await getUserTier(user.id)
    const limited = await enforceUsage('chat', tier)
    if (limited) return limited
  }

  const { message, history, weather, localHour, localMinute, personality } =
    (await request.json()) as {
      message: string
      history?: { role: string; content: string }[]
      weather?: any
      localHour?: number
      localMinute?: number
      personality?: PersonalityOptions
    }

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const genAI = createGeminiClient()
  const systemPrompt = buildSystemPrompt(weather || {}, localHour, localMinute, personality)
  const chatHistory = (history || []).map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  for (const modelId of MODEL_ROTATION) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId })
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: 'System instructions: ' + systemPrompt }] },
          { role: 'model', parts: [{ text: "Understood! I'm Atmos, your AI weather assistant. I have the current weather data and I'm ready to help you with clothing advice, weather-based planning, and any weather questions. How can I help?" }] },
          ...chatHistory,
        ],
      })

      const result = await chat.sendMessage(message)
      return NextResponse.json({ response: result.response.text() })
    } catch (error: any) {
      if (isRateLimit(error)) {
        console.warn(`Rate limit on ${modelId}, trying next model`)
        continue
      }
      console.error(`Chat API error (${modelId}):`, error)
      return NextResponse.json({ error: error.message || 'Failed to get AI response' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unable to process your request right now. Please try again shortly.' }, { status: 503 })
}
