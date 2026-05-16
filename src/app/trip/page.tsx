'use client'

import { useState } from 'react'
import { Plane, MapPin, Calendar, Loader2, Luggage, AlertTriangle } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'

interface DailyForecast {
  date: string
  tempMin: number
  tempMax: number
  conditionCode: number
  description: string
  pop: number
}

interface TripResult {
  summary: string
  packing: string[]
  watchouts: string[]
  destinationLabel: string
}

const conditionFor = (code: number): string => {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snowy'
  if (code <= 82) return 'Showers'
  if (code <= 99) return 'Thunderstorms'
  return 'Mixed'
}

export default function TripPage() {
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TripResult | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!destination || !startDate || !endDate) {
      setError('All fields required.')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.')
      return
    }
    setLoading(true)
    try {
      // 1. Geocode destination
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(destination)}`)
      const geoData = await geoRes.json()
      if (!geoData?.length) throw new Error('City not found')
      const { lat, lon, name, country } = geoData[0]

      // 2. Forecast for the trip dates
      const wxRes = await fetch(`/api/openmeteo?lat=${lat}&lon=${lon}`)
      const wx = await wxRes.json()
      const dailyRaw = wx?.daily ?? wx?.dailyForecast ?? wx
      const days: DailyForecast[] = (dailyRaw?.time ?? []).map((t: string, i: number) => ({
        date: t,
        tempMin: dailyRaw.temperature_2m_min?.[i],
        tempMax: dailyRaw.temperature_2m_max?.[i],
        conditionCode: dailyRaw.weather_code?.[i] ?? 0,
        description: conditionFor(dailyRaw.weather_code?.[i] ?? 0),
        pop: dailyRaw.precipitation_probability_max?.[i] ?? 0,
      })).filter((d: DailyForecast) =>
        d.date >= startDate.slice(0, 10) && d.date <= endDate.slice(0, 10),
      )

      if (days.length === 0) {
        throw new Error('No forecast data for those dates (max 16 days out).')
      }

      // 3. AI packing list
      const tripRes = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: `${name}${country ? ', ' + country : ''}`,
          startDate,
          endDate,
          daily: days,
        }),
      })
      const trip = await tripRes.json()
      if (trip.error) throw new Error(trip.error)

      setResult({
        summary: trip.summary,
        packing: trip.packing,
        watchouts: trip.watchouts,
        destinationLabel: `${name}${country ? ', ' + country : ''}`,
      })
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header
        className="sticky top-0 z-50 px-6 py-3.5 backdrop-blur-2xl saturate-150"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <h1 className="text-xl font-bold font-headline tracking-tight" style={{ color: 'var(--primary)' }}>
          Trip Planner
        </h1>
      </header>

      <main className="relative z-10 flex-1 px-6 pt-6 pb-32 w-full max-w-2xl mx-auto space-y-4">
        <form onSubmit={submit} className="space-y-3">
          <Field icon={MapPin} placeholder="Where are you going?" value={destination} onChange={setDestination} type="text" />
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Calendar} placeholder="Start" value={startDate} onChange={setStartDate} type="date" />
            <Field icon={Calendar} placeholder="End" value={endDate} onChange={setEndDate} type="date" />
          </div>
          {error && (
            <p className="text-xs px-1" style={{ color: '#ff7a85' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--bg)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
            {loading ? 'Planning…' : 'Plan trip'}
          </button>
        </form>

        {result && (
          <div className="space-y-3 pt-4">
            <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
              <p className="text-[11px] font-label uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                {result.destinationLabel}
              </p>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text)' }}>
                {result.summary}
              </p>
            </div>

            {result.watchouts.length > 0 && (
              <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)', border: '0.5px solid #f59e0b' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    Watch out for
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {result.watchouts.map((w, i) => (
                    <li key={i} className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                      • {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Luggage className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  Packing list
                </span>
              </div>
              <ul className="space-y-2">
                {result.packing.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                      style={{ background: 'var(--surface-mid)', color: 'var(--primary)' }}
                    >
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function Field({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type,
}: {
  icon: React.ElementType
  placeholder: string
  value: string
  onChange: (v: string) => void
  type: string
}) {
  return (
    <label
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[15px] font-body"
        style={{ color: 'var(--text)' }}
      />
    </label>
  )
}
