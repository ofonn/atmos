'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, ArrowLeft, Trash2, Plus, Search, X } from 'lucide-react'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useSettings } from '@/contexts/SettingsContext'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { wmoDesc } from '@/lib/weatherUtils'
import type { Location } from '@/types/weather'
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
  const { tempUnit, windUnit } = useSettings()
  const [weather, setWeather] = useState<{
    temp: number; code: number; isDay: boolean; description: string;
    feelsLike: number; humidity: number; windSpeed: number; windDir: number;
    high: number; low: number;
  } | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`/api/openmeteo?lat=${loc.lat}&lon=${loc.lon}`)
        const data = await res.json()
        if (data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            isDay: data.current.is_day === 1,
            description: wmoDesc(data.current.weather_code),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: Math.round(data.current.relative_humidity_2m),
            windSpeed: data.current.wind_speed_10m,
            windDir: data.current.wind_direction_10m,
            high: data.daily?.temperature_2m_max?.[0] ? Math.round(data.daily.temperature_2m_max[0]) : 0,
            low: data.daily?.temperature_2m_min?.[0] ? Math.round(data.daily.temperature_2m_min[0]) : 0,
          })
        }
      } catch (e) {
        console.error('Failed to fetch weather for card', e)
      }
    }
    fetchWeather()
  }, [loc])

  const fmtTemp = (c: number) => tempUnit === 'F' ? `${Math.round(c * 9/5 + 32)}°` : `${c}°`
  const fmtWind = (kmh: number) => windUnit === 'mph' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`

  return (
    <div
      className="relative rounded-3xl p-5 overflow-hidden flex flex-col gap-3 group cursor-pointer transition-transform active:scale-[0.98]"
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
      {/* Top row — name, condition, temp */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-headline font-bold text-xl mb-0.5 text-[var(--text)] truncate">{loc.name}</h3>
          <div className="flex items-center gap-2">
            {weather && <WeatherIcon conditionCode={weather.code} isDay={weather.isDay} size={22} />}
            <p className="text-sm font-label text-[var(--text-muted)] capitalize">
              {weather?.description ?? loc.country}
            </p>
          </div>
        </div>
        {weather && (
          <div className="text-right flex-shrink-0 ml-3">
            <span className="font-headline font-black text-4xl text-[var(--text)] tracking-tighter">
              {fmtTemp(weather.temp)}
            </span>
            <p className="text-[11px] font-label text-[var(--text-muted)]">
              H:{fmtTemp(weather.high)} L:{fmtTemp(weather.low)}
            </p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      {weather && (
        <div className="grid grid-cols-4 gap-2 mt-1">
          <div className="rounded-xl px-2.5 py-2" style={{ background: 'var(--surface-mid)' }}>
            <p className="text-[9px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Feels</p>
            <p className="text-sm font-bold font-headline" style={{ color: weather.feelsLike > weather.temp + 3 ? '#f97316' : weather.feelsLike < weather.temp - 3 ? '#60a5fa' : 'var(--text)' }}>
              {fmtTemp(weather.feelsLike)}
            </p>
          </div>
          <div className="rounded-xl px-2.5 py-2" style={{ background: 'var(--surface-mid)' }}>
            <p className="text-[9px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Humidity</p>
            <p className="text-sm font-bold font-headline" style={{ color: weather.humidity > 70 ? '#60a5fa' : 'var(--text)' }}>
              {weather.humidity}%
            </p>
          </div>
          <div className="rounded-xl px-2.5 py-2" style={{ background: 'var(--surface-mid)' }}>
            <p className="text-[9px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Wind</p>
            <p className="text-sm font-bold font-headline" style={{ color: 'var(--text)' }}>
              {fmtWind(weather.windSpeed)}
            </p>
          </div>
          <div className="rounded-xl px-2.5 py-2" style={{ background: 'var(--surface-mid)' }}>
            <p className="text-[9px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Country</p>
            <p className="text-sm font-bold font-headline truncate" style={{ color: 'var(--text)' }}>
              {loc.country || '—'}
            </p>
          </div>
        </div>
      )}

      {/* Delete button */}
      <div className="flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)] transition-colors"
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
  const { location, savedLocations, removeLocation, setAsCurrentLocation, saveLocation, searchCity } = useWeatherContext()
  const [showSearch, setShowSearch] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<Location[]>([])
  const [searching, setSearching] = useState(false)

  const handleSelect = (loc: Location) => {
    setAsCurrentLocation(loc)
    router.push('/')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchInput.trim())}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data.slice(0, 5).map((d: any) => ({
          lat: d.lat,
          lon: d.lon,
          name: d.name,
          country: d.country,
        })))
      } else {
        setSearchResults([])
      }
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }

  const handleAddFromSearch = (loc: Location) => {
    saveLocation(loc)
    setShowSearch(false)
    setSearchInput('')
    setSearchResults([])
  }

  const handleAddAndSwitch = (loc: Location) => {
    saveLocation(loc)
    setAsCurrentLocation(loc)
    setShowSearch(false)
    setSearchInput('')
    setSearchResults([])
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--bg)]">
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header
        className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3.5 backdrop-blur-xl w-full"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text)]" />
        </button>
        <span className="flex-1 font-headline font-extrabold tracking-tight text-xl text-[var(--text)]">
          Saved Places
        </span>
        <button
          onClick={() => setShowSearch(true)}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Add location"
        >
          <Plus className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        </button>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto px-4 pb-32">
        <div className="flex flex-col gap-4 mt-4">
          {savedLocations.length === 0 && !showSearch ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-mid)] flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h2 className="font-headline font-bold text-xl mb-2 text-[var(--text)]">No Saved Places</h2>
              <p className="font-body text-[var(--text-muted)] text-sm mb-6">
                Keep track of weather in multiple cities. Search and add locations below.
              </p>
              <button
                onClick={() => setShowSearch(true)}
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

              {!showSearch && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full py-5 rounded-3xl border border-solid text-[var(--text-muted)] font-headline font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'rgba(128, 110, 248, 0.1)'
                  }}
                >
                  <Plus className="w-5 h-5 text-[var(--primary)]" />
                  Add Another Place
                </button>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />

      {/* Search bottom sheet */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowSearch(false); setSearchResults([]) }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 pb-12"
              style={{ background: 'var(--surface)', borderTop: '0.5px solid var(--outline)', maxHeight: '70vh', overflowY: 'auto' }}
            >
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
              <h3 className="text-lg font-bold font-headline mb-4 tracking-tight" style={{ color: 'var(--text)' }}>Add Location</h3>
              <form onSubmit={handleSearch} className="mb-4">
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{ background: 'var(--bg)', border: '0.5px solid var(--outline)' }}
                >
                  <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  <input
                    autoFocus
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search city name..."
                    className="flex-1 bg-transparent border-none outline-none text-[15px] font-body"
                    style={{ color: 'var(--text)' }}
                  />
                  {searchInput && (
                    <button type="button" onClick={() => { setSearchInput(''); setSearchResults([]) }}>
                      <X className="w-5 h-5 p-1" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )}
                </div>
              </form>

              {searching && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Searching...</p>
              )}

              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  {searchResults.map((result, i) => {
                    const alreadySaved = savedLocations.some(s => s.lat === result.lat && s.lon === result.lon)
                    return (
                      <div
                        key={`${result.lat}-${result.lon}-${i}`}
                        className="flex items-center justify-between px-4 py-3.5 rounded-xl"
                        style={{ background: 'var(--surface-mid)' }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{result.name}</p>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{result.country}</p>
                          </div>
                        </div>
                        {alreadySaved ? (
                          <span className="text-[11px] font-label px-3 py-1.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>Saved</span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddFromSearch(result)}
                              className="text-[11px] font-label font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
                              style={{ background: 'var(--surface)', color: 'var(--primary)' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => handleAddAndSwitch(result)}
                              className="text-[11px] font-label font-semibold px-3 py-1.5 rounded-full text-white transition-all active:scale-95"
                              style={{ background: 'var(--primary)' }}
                            >
                              Switch
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {!searching && searchResults.length === 0 && searchInput.trim() !== '' && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No results found</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
