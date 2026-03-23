import { NextRequest, NextResponse } from 'next/server'
import { createGeminiClient, buildSystemPrompt } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { message, history, weather } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const genAI = createGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemPrompt = buildSystemPrompt(weather || {})

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'System instructions: ' + systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood! I\'m Atmos, your AI weather assistant. I have the current weather data and I\'m ready to help you with clothing advice, weather-based planning, and any weather questions. How can I help?' }] },
        ...chatHistory,
      ],
    })

    const result = await chat.sendMessage(message)
    const response = result.response.text()

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat API error:', error)
    const msg = error.message || 'Failed to get AI response'
    const isRateLimit = msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
    return NextResponse.json(
      { error: isRateLimit ? 'AI rate limit reached — please wait a moment and try again.' : msg },
      { status: isRateLimit ? 429 : 500 }
    )
  }
}
