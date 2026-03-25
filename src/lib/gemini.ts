import { GoogleGenerativeAI } from '@google/generative-ai'
import type { WeatherContextData } from '@/types/weather'

export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro',
]

function isRateLimitError(data: any, status: number): boolean {
  if (status === 429) return true
  const msg = data?.error?.message || data?.error?.status || ''
  return msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429')
}

/**
 * Calls Gemini REST API with automatic model rotation on rate limit.
 * Throws only for non-rate-limit errors or when all models are exhausted.
 */
export async function geminiGenerateWithRotation(
  prompt: string,
  apiKey: string
): Promise<string> {
  for (const modelId of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    const data = await res.json()

    if (!res.ok) {
      if (isRateLimitError(data, res.status)) {
        console.warn(`Rate limit on ${modelId}, trying next model`)
        continue
      }
      throw new Error(data.error?.message || 'Gemini error')
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
  throw new Error('Service temporarily unavailable. Please try again shortly.')
}

export function buildSystemPrompt(weather: WeatherContextData): string {
  let prompt = `You are Atmos, a friendly and knowledgeable AI weather assistant. You help users make practical decisions based on real weather data.

STYLE GUIDELINES:
- Be conversational, concise, and helpful
- Give specific, practical advice (not vague generalities)
- Reference actual temperatures, times, and conditions from the data
- For clothing: consider temperature, wind chill, rain chance, UV
- For safety: flag severe weather, high UV, extreme temps
- If the user asks off-topic, non-weather questions: Gracefully redirect them with personality (e.g. "I'm obsessed with the atmosphere, so I only track weather! Let's get back to the forecast..."). Do NOT answer out-of-scope non-weather requests.
- Use a warm, friendly tone
- Keep responses under 150 words unless detail is needed`

  if (weather.current) {
    prompt += `

CURRENT CONDITIONS:
- Temperature: ${weather.current.temp}°C (feels like ${weather.current.feelsLike}°C)
- Condition: ${weather.current.description}
- Humidity: ${weather.current.humidity}%
- Wind: ${weather.current.windSpeed} km/h
- High: ${weather.current.tempMax}°C / Low: ${weather.current.tempMin}°C`
  }

  if (weather.hourly && weather.hourly.length > 0) {
    prompt += `

HOURLY FORECAST (next ${weather.hourly.length * 3} hours):`
    weather.hourly.forEach(h => {
      const time = new Date(h.dt * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      prompt += `\n- ${time}: ${h.temp}°C, ${h.description}, ${h.pop}% rain chance`
    })
  }

  if (weather.daily && weather.daily.length > 0) {
    prompt += `

DAILY FORECAST:`
    weather.daily.forEach(d => {
      const day = new Date(d.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
      })
      prompt += `\n- ${day}: ${d.tempMax}°C / ${d.tempMin}°C, ${d.description}, ${d.pop}% rain`
    })
  }

  return prompt
}

export function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured')
  }
  return new GoogleGenerativeAI(apiKey)
}
