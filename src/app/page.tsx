'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { BottomNav } from '@/components/layout/BottomNav'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useSettings } from '@/contexts/SettingsContext'
import { displayTemp } from '@/lib/utils'
import { MapPin, Search, Sparkles, X, RefreshCw } from 'lucide-react'

function get3DIconStyle(code: number) {
  if (code >= 200 && code < 300) return { from: '#8B5CF6', via: '#6D28D9', to: '#4C1D95', glow: 'rgba(139,92,246,0.5)' }
  if (code >= 500 && code < 600) return { from: '#60A5FA', via: '#3B82F6', to: '#1D4ED8', glow: 'rgba(96,165,250,0.5)' }
  if (code >= 600 && code < 700) return { from: '#E0E7FF', via: '#C7D2FE', to: '#A5B4FC', glow: 'rgba(165,180,252,0.5)' }
  if (code === 800) return { from: '#FFF7CC', via: '#FFB800', to: '#FF8C00', glow: 'rgba(255,184,0,0.7)' }
  if (code <= 804 && code > 800) return { from: '#94A3B8', via: '#64748B', to: '#475569', glow: 'rgba(148,163,184,0.3)' }
  return { from: '#94A3B8', via: '#64748B', to: '#475569', glow: 'rgba(148,163,184,0.3)' }
}

// Conversational fallback headlines — like a friend telling you the weather
function getFallbackHeadline(temp: number, code: number): { headline: string; advice: string } {
  if (code >= 200 && code < 300) return { headline: "A big storm is coming today.", advice: "You really don't want to be outside right now. Stay in if you can." }
  if (code >= 300 && code < 400) return { headline: "It'll drizzle on and off today.", advice: "Not heavy rain, but you'll want a jacket just in case you get caught." }
  if (code >= 500 && code < 600) return { headline: "It's going to rain all day.", advice: "Grab an umbrella before you leave. Your shoes will thank you later." }
  if (code >= 600 && code < 700) return { headline: "It's going to snow today.", advice: "Dress warm and be careful on the roads. They might get slippery." }
  if (code >= 700 && code < 800) return { headline: "You can barely see outside today.", advice: "It's really foggy out there. Take it slow if you're driving anywhere." }
  if (code === 800 && temp >= 35) return { headline: "It's crazy hot out today.", advice: "Drink lots of water and try to stay in the shade during the afternoon." }
  if (code === 800 && temp >= 25) return { headline: "It's a really nice day today.", advice: "Great weather to go out. Maybe put on some sunscreen if you'll be outside." }
  if (code === 800 && temp >= 15) return { headline: "It's sunny but not too warm.", advice: "Nice during the day but it might get chilly later. Bring a light jacket." }
  if (code === 800) return { headline: "It's cold but the sky is clear.", advice: "You'll want a warm jacket today. The sun is out but it won't warm you." }
  if (code === 801 || code === 802) return { headline: "A few clouds but mostly nice.", advice: "The sun will come and go today. Good enough for anything you've planned." }
  if (code >= 803) return { headline: "It's cloudy but won't rain.", advice: "The sky is grey today but it probably won't rain. No umbrella needed." }
  if (temp >= 35) return { headline: "It's dangerously hot out there.", advice: "Stay hydrated and avoid being outside too long. The heat is no joke today." }
  if (temp <= 5) return { headline: "It's freezing cold outside today.", advice: "Bundle up with heavy layers. You really don't want to be out too long." }
  return { headline: "Nothing unusual going on today.", advice: "Pretty normal weather. Check back later if you want to plan something outside." }
}

export default function Home() {
  const router = useRouter()
  const { theme } = useTheme()
  const { tempUnit } = useSettings()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [aiHeadline, setAiHeadline] = useState<{ headline: string; advice: string } | null>(null)
  const [headlineLoading, setHeadlineLoading] = useState(false)

  const { location, searchCity, loading: locLoading } = useLocation()
  const { current, loading: weatherLoading } = useWeather(
    location?.lat ?? null,
    location?.lon ?? null
  )

  const loading = locLoading || weatherLoading
  const isDark = theme !== 'light'

  const fetchAiHeadline = useCallback(async () => {
    if (!current) return
    setHeadlineLoading(true)
    try {
      const res = await fetch('/api/headline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp: current.temp,
          feelsLike: current.feelsLike,
          description: current.description,
          conditionCode: current.conditionCode,
          windSpeed: current.windSpeed,
          humidity: current.humidity,
        }),
      })
      const data = await res.json()
      if (data.headline) setAiHeadline({ headline: data.headline, advice: data.advice })
    } catch {}
    setHeadlineLoading(false)
  }, [current])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) { searchCity(query.trim()); setQuery(''); setSearchOpen(false) }
  }

  const icon = current ? get3DIconStyle(current.conditionCode) : null
  const displayed = aiHeadline ?? (current ? getFallbackHeadline(current.temp, current.conditionCode) : null)

  // Split headline at last word for gradient effect
  const splitHeadline = (text: string) => {
    const clean = text.replace(/\.$/, '')
    const words = clean.split(' ')
    const last = words.pop() ?? ''
    return { plain: words.join(' '), gradient: last + '.' }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>
      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% -5%, #4329b8 0%, var(--bg) 60%)'
            : 'radial-gradient(circle at 50% -5%, #a78bfa 0%, var(--bg) 60%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
        <button onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-2 active:opacity-70 transition-opacity">
          <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span className="font-headline text-sm font-medium tracking-tight" style={{ color: 'var(--primary)' }}>
            {locLoading ? 'Locating…' : location
              ? `${location.name}${location.country ? `, ${location.country}` : ''}`
              : 'Set location'}
          </span>
        </button>

        <button onClick={() => setSearchOpen(!searchOpen)}
          className="transition-colors" style={{ color: 'var(--text-muted)' }}>
          {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>
      </header>

      {/* Search bar */}
      {searchOpen && (
        <div className="relative z-20 px-6 pt-3 flex-shrink-0">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
              style={{
                background: isDark ? 'rgba(39,42,51,0.7)' : 'rgba(200,200,220,0.5)',
                backdropFilter: 'blur(24px)',
                border: isDark ? '0.5px solid rgba(146,142,160,0.25)' : '0.5px solid rgba(100,100,130,0.25)',
              }}>
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input autoFocus type="text" value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city…"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--text)' }} />
            </div>
          </form>
        </div>
      )}

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col px-6 pt-4 pb-28 min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--surface-mid)', opacity: 0.6 }} />
              <div className="flex flex-col gap-2">
                <div className="h-12 w-32 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.6 }} />
                <div className="h-4 w-20 rounded animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-[20%] w-full rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
              <div className="h-[20%] w-5/6 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.3 }} />
              <div className="h-[20%] w-4/6 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.2 }} />
            </div>
          </div>
        ) : current && displayed && icon ? (
          <>
            {/* Icon + Temp */}
            <div className="flex items-center gap-4 flex-shrink-0 mb-1">
              <div className="relative flex-shrink-0" style={{ filter: `drop-shadow(0 0 28px ${icon.glow})` }}>
                <div className="absolute inset-0 rounded-full opacity-60 blur-2xl"
                  style={{ background: `linear-gradient(135deg, ${icon.from}, ${icon.to})` }} />
                <div className="relative w-24 h-24 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${icon.from}, ${icon.via}, ${icon.to})`,
                    boxShadow: `inset -6px -6px 20px rgba(0,0,0,0.25), 0 6px 28px ${icon.glow}`,
                  }}>
                  <div className="absolute top-3 left-4 w-8 h-3.5 bg-white/40 blur-md rounded-full -rotate-[30deg]" />
                </div>
              </div>
              <div>
                <p className="font-headline font-bold leading-none tracking-tighter"
                  style={{ fontSize: '4.2rem', color: 'var(--text)' }}>
                  {displayTemp(current.temp, tempUnit)}
                </p>
                <p className="font-label text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  But it feels more like {displayTemp(current.feelsLike, tempUnit)}
                </p>
              </div>
            </div>

            {/* Headline — fills vertical space, margin-top 30px from temp */}
            <div className="flex-1 flex flex-col justify-start min-h-0" style={{ marginTop: '30px' }}>
              {headlineLoading ? (
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  <div className="h-16 w-full rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
                  <div className="h-16 w-5/6 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.3 }} />
                  <div className="h-16 w-2/3 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.2 }} />
                </div>
              ) : (
                <>
                  <h1
                    className="font-headline font-extrabold leading-[0.88] tracking-tighter"
                    style={{ fontSize: 'clamp(2.8rem, 13vw, 4.2rem)', color: 'var(--text)' }}
                  >
                    {(() => {
                      const { plain, gradient } = splitHeadline(displayed.headline)
                      return plain.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      )).concat(
                        <span key="gradient" className="block" style={{
                          background: isDark
                            ? 'linear-gradient(135deg, #c7bfff 0%, #acc7ff 100%)'
                            : 'linear-gradient(135deg, #5b47d1 0%, #2563EB 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>{gradient}</span>
                      )
                    })()}
                  </h1>

                  <p className="font-body text-sm mt-8 max-w-[280px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {displayed.advice}
                  </p>

                  {/* AI Refresh button */}
                  <button
                    onClick={fetchAiHeadline}
                    disabled={headlineLoading}
                    className="mt-3 self-start flex items-center gap-1.5 text-[10px] font-label uppercase tracking-widest transition-colors active:scale-95 disabled:opacity-30"
                    style={{ color: isDark ? 'rgba(199,191,255,0.5)' : 'rgba(91,71,209,0.5)' }}
                  >
                    <RefreshCw className={`w-3 h-3 ${headlineLoading ? 'animate-spin' : ''}`} />
                    AI refresh
                  </button>
                </>
              )}
            </div>

            {/* Ask Bar */}
            <div className="flex-shrink-0 mt-4">
              <div className="rounded-full flex items-center gap-3 pl-5 pr-2 py-2"
                style={{
                  background: isDark ? 'rgba(39,42,51,0.45)' : 'rgba(220,222,235,0.7)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: isDark ? '0.5px solid rgba(146,142,160,0.2)' : '0.5px solid rgba(100,100,130,0.2)',
                }}>
                <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                <button onClick={() => router.push('/chat')}
                  className="flex-1 text-left text-sm font-body py-3"
                  style={{ color: 'var(--text-muted)' }}>
                  Ask Atmos…
                </button>
                <button onClick={() => router.push('/chat')}
                  className="px-5 py-2.5 rounded-full font-bold text-xs tracking-wide text-white active:scale-95 transition-transform flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #806EF8 0%, #5896FD 100%)' }}>
                  ASK
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full opacity-30 blur-xl"
                style={{ background: 'linear-gradient(135deg, #FFF7CC, #FFA500)' }} />
              <div className="relative w-full h-full rounded-full opacity-60"
                style={{ background: 'linear-gradient(135deg, #FFF7CC, #FFA500)' }} />
            </div>
            <h2 className="text-xl font-semibold font-headline mb-2" style={{ color: 'var(--text)' }}>Welcome to Atmos</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Allow location access or tap to search a city.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
