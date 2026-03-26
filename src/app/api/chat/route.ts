import { NextRequest, NextResponse } from 'next/server'
import { createGeminiClient, buildSystemPrompt } from '@/lib/gemini'

const MODEL_ROTATION = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

function isRateLimit(error: any): boolean {
  const msg = (error?.message || '') + (error?.status || '')
  return msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
}

export async function POST(request: NextRequest) {
  const { message, history, weather } = await request.json()

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const genAI = createGeminiClient()
  const systemPrompt = buildSystemPrompt(weather || {})
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
