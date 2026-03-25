'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowLeft, Trash2, Plus } from 'lucide-react'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useSettings } from '@/contexts/SettingsContext'
import type { Location, CurrentWeatherData } from '@/types/weather'
import { BottomNav } from '@/components/layout/BottomNav'

function LocationWeatherCard({
  loc,
  onSelect,
  onRemove,
  isCurrent
}: {
  loc: Location
  onSelect: () => void
  onRemove: () => void
  isCurrent: boolean
}) {
  const { tempUnit } = useSettings()
  const [weather, setWeather] = useState<CurrentWeatherData | null>(null)
  
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`/api/weather?lat=${loc.lat}&lon=${loc.lon}`)
        const data = await res.json()
        if (data.current) setWeather(data.current)
      } catch (e) {
        console.error('Failed to fetch weather for card', e)
      }
    }
    fetchWeather()
  }, [loc])

  const displayTemp = (k: number) => {
    if (tempUnit === 'C') return `${Math.round(k - 273.15)}°`
    return `${Math.round((k - 273.15) * 9/5 + 32)}°`
  }

  return (
    <div
      className="relative rounded-3xl p-5 overflow-hidden flex flex-col gap-4 group cursor-pointer transition-transform active:scale-[0.98]"
      style={{
        background: 'var(--surface)',
        border: isCurrent ? '1.5px solid var(--primary)' : '0.5px solid var(--outline)',
        boxShadow: isCurrent ? '0 0 20px rgba(var(--glass-rgb), 0.1)' : 'none'
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {isCurrent && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--primary)] text-white text-[10px] font-bold tracking-widest uppercase rounded-bl-xl">
          Current
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-headline font-bold text-xl mb-1 text-[var(--text)]">{loc.name}</h3>
          <p className="text-sm font-label text-[var(--text-muted)] tracking-wide">{loc.country}</p>
        </div>
        {weather && (
          <div className="text-right">
            <span className="font-headline font-black text-4xl text-[var(--text)] tracking-tighter">
              {displayTemp(weather.temp)}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
          {weather && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                alt={weather.description}
                className="w-10 h-10"
              />
              <span className="text-sm font-medium capitalize text-[var(--text-muted)]">
                {weather.description}
              </span>
            </>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Remove location"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function LocationsPage() {
  const router = useRouter()
  const { location, savedLocations, removeLocation, setAsCurrentLocation } = useWeatherContext()

  const handleSelect = (loc: Location) => {
    setAsCurrentLocation(loc)
    router.push('/')
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--bg)]">
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 backdrop-blur-xl w-full max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text)]" />
        </button>
        <span className="font-headline font-extrabold tracking-tight text-xl text-[var(--text)]">
          Saved Places
        </span>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 pb-32">
        <div className="flex flex-col gap-4 mt-4">
          {savedLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-mid)] flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h2 className="font-headline font-bold text-xl mb-2 text-[var(--text)]">No Saved Places</h2>
              <p className="font-body text-[var(--text-muted)] text-sm mb-6">
                Keep track of weather in multiple cities. Add a place from the Settings tab.
              </p>
              <button
                onClick={() => router.push('/settings')}
                className="px-6 py-3 rounded-full font-bold text-sm text-white flex items-center gap-2 transition-transform active:scale-95"
                style={{ background: 'var(--primary)' }}
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            </div>
          ) : (
            <>
              {savedLocations.map((loc, idx) => (
                <LocationWeatherCard
                  key={`${loc.lat}-${loc.lon}-${idx}`}
                  loc={loc}
                  isCurrent={location?.lat === loc.lat && location?.lon === loc.lon}
                  onSelect={() => handleSelect(loc)}
                  onRemove={() => removeLocation(loc)}
                />
              ))}
              
              <button
                onClick={() => router.push('/settings')}
                className="w-full py-5 rounded-3xl border border-solid shadow-sm text-[var(--text-muted)] font-headline font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 shadow-sm"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'rgba(128, 110, 248, 0.1)'
                }}
              >
                <Plus className="w-5 h-5 text-[var(--primary)]" />
                Add Another Place
              </button>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
