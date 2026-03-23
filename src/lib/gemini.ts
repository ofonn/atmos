import { GoogleGenerativeAI } from '@google/generative-ai'
import type { WeatherContextData } from '@/types/weather'

export function buildSystemPrompt(weather: WeatherContextData): string {
  let prompt = `You are Atmos, a friendly and knowledgeable AI weather assistant. You help users make practical decisions based on real weather data.

STYLE GUIDELINES:
- Be conversational, concise, and helpful
- Give specific, practical advice (not vague generalities)
- Reference actual temperatures, times, and conditions from the data
- For clothing: consider temperature, wind chill, rain chance, UV
- For safety: flag severe weather, high UV, extreme temps
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
