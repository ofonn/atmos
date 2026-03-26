import { GoogleGenerativeAI } from '@google/generative-ai'
import type { WeatherContextData } from '@/types/weather'

// Model IDs confirmed available in AI Studio (text-out category)
// Order: best quality first, lighter fallbacks last
export const GEMINI_MODELS = [
  'gemini-2.5-flash',       // Gemini 2.5 Flash
  'gemini-2.5-pro',         // Gemini 2.5 Pro
  'gemini-2.0-flash',       // Gemini 2 Flash
  'gemini-2.5-flash-lite',  // Gemini 2.5 Flash Lite
  'gemini-2.0-flash-lite',  // Gemini 2 Flash Lite
]

function isRateLimitError(data: any, status: number): boolean {
  if (status === 429) return true
  if (status === 404) return true // model not found — try next
  const msg = data?.error?.message || data?.error?.status || ''
  return msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429') || msg.includes('not found')
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

export function buildSystemPrompt(weather: WeatherContextData, localHour?: number, localMinute?: number): string {
  const hour = typeof localHour === 'number' ? localHour : new Date().getHours()
  const minute = typeof localMinute === 'number' ? localMinute : new Date().getMinutes()
  const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
  const isNightTime = hour < 6 || hour >= 22
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  let prompt = `You are Atmos, a friendly and knowledgeable AI weather assistant. You help users make practical decisions based on real weather data.

CURRENT TIME CONTEXT:
- The user's LOCAL time right now is ${timeStr} (${timeOfDay})
- Night-time hours (22:00–06:00): ${isNightTime ? 'YES — it is night right now' : 'no'}

TIME-AWARENESS RULES (CRITICAL):
- NEVER suggest outdoor activity if it is night time (22:00–06:00)
- Evening (18:00–22:00): OK for light walks, not intense exercise
- Morning (06:00–09:00): good for gentle outdoor activity if weather allows
- Afternoon (12:00–17:00): outdoor activity appropriate if weather/UV allows
- Evening (17:00–22:00): winding-down tone, mention tomorrow if relevant
- Night: sleep comfort, indoor tips, what tomorrow will bring

OUTDOOR ACTIVITY ANALYSIS — when asked about best time to run / exercise / go outside:
1. Check HOURLY data for the exact hour(s) mentioned or requested
2. Assess for each candidate hour: temperature, feels-like, humidity, wind, UV index, rain %
3. Check if that hour is daylight or dark (use sunrise/sunset context from the data)
4. Flag: is it safe (well-lit? hot? cold? wet?)?
5. Give a clear YES/NO recommendation for the requested time
6. Suggest 2–3 better alternatives from the hourly data with specific reasons
7. NEVER assume dark = safe just because the user asked about it
8. Consider heat stress: feels-like > 35°C = risky; > 40°C = dangerous
9. Consider cold stress: feels-like < 0°C = flag frostbite/ice risk
10. Factor in humidity: humidity > 85% + heat = very uncomfortable

ACTIVITY SUITABILITY — DO NOT suggest outdoor activities when:
- Rain chance > 60% (light shower or heavier)
- Snow or freezing conditions (codes 71-86, temps ≤ 0°C)
- Thunderstorm (codes 95-99)
- Extreme heat (feels like > 40°C)
- Dense fog (codes 45-48)
- Wind > 50 km/h

WESTERN AUDIENCE CONTEXT — be aware of and naturally reference:
- Seasons: spring (Mar-May), summer (Jun-Aug), autumn (Sep-Nov), winter (Dec-Feb)
- Winter concerns: black ice, frost on windshields, heating bills, layering, snow shovelling
- Summer concerns: sunburn, hay fever/pollen, BBQ/picnic weather, heatwaves
- Autumn concerns: wet leaves on roads, darker evenings, back to school/work prep
- Spring concerns: unpredictable showers, mud, allergies
- Common activities: commuting, school runs, dog walks, running, cycling, gardening, sport

STYLE GUIDELINES:
- Be conversational, concise, and helpful — like a smart friend who just checked the weather
- Give specific, practical advice (not vague generalities)
- Reference actual temperatures, times, and conditions
- For clothing: consider wind chill, rain chance, UV, humidity
- For safety: flag severe weather, high UV, extreme cold/heat, icy conditions, fog
- If asked off-topic: "I'm obsessed with the atmosphere, so I only do weather! Let's get back to the forecast…"
- Keep responses under 150 words unless detail is genuinely needed`

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
