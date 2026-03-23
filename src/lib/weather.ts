const BASE_URL = 'https://api.openweathermap.org/data/2.5'
const GEO_URL = 'https://api.openweathermap.org/geo/1.0'

async function handleResponse(res: Response) {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || `API error: ${res.status}`)
  }
  return data
}

export async function getCurrentWeather(lat: number, lon: number, apiKey: string) {
  const res = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
  )
  return handleResponse(res)
}

export async function getForecast(lat: number, lon: number, apiKey: string) {
  const res = await fetch(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`
  )
  return handleResponse(res)
}

export async function geocodeCity(city: string, apiKey: string) {
  const res = await fetch(
    `${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=5&appid=${apiKey}`
  )
  return handleResponse(res)
}
