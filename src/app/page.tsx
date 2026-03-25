'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { BottomNav } from '@/components/layout/BottomNav'
import { HourlyForecast } from '@/components/weather/HourlyForecast'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useAiContent } from '@/hooks/useAiContent'
import { useSettings } from '@/contexts/SettingsContext'
import { displayTemp, displayTempShort, displayWind } from '@/lib/utils'
import { MapPin, Search, Sparkles, X, RefreshCw, ChevronDown, ArrowRight } from 'lucide-react'

function get3DIconStyle(code: number, isDark: boolean = true) {
  if (code >= 200 && code < 300) return { from: '#8B5CF6', via: '#6D28D9', to: isDark ? '#4C1D95' : '#8B5CF6', glow: 'rgba(139,92,246,0.5)' }
  if (code >= 500 && code < 600) return { from: '#60A5FA', via: '#3B82F6', to: isDark ? '#1D4ED8' : '#60A5FA', glow: 'rgba(96,165,250,0.5)' }
  if (code >= 600 && code < 700) return { from: '#E0E7FF', via: '#C7D2FE', to: isDark ? '#A5B4FC' : '#E0E7FF', glow: 'rgba(165,180,252,0.5)' }
  if (code === 800) return { from: '#FFD359', via: '#FFB800', to: isDark ? '#FF8C00' : '#FFB800', glow: 'rgba(255,184,0,0.5)' }
  if (code <= 804 && code > 800) return { from: '#94A3B8', via: '#64748B', to: isDark ? '#475569' : '#94A3B8', glow: 'rgba(148,163,184,0.3)' }
  return { from: '#94A3B8', via: '#64748B', to: isDark ? '#475569' : '#94A3B8', glow: 'rgba(148,163,184,0.3)' }
}

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
  const { tempUnit, windUnit } = useSettings()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { location, locLoading, searchCity, current, hourly, daily, refresh: refreshWeather, loading: weatherLoading } = useWeatherContext()
  const { content: aiContent, loading: aiLoading, refresh: refreshAi } = useAiContent(current, hourly, daily)

  const loading = locLoading || weatherLoading
  const isDark = theme !== 'light'

  const handleRefresh = () => {
    refreshWeather()
    refreshAi()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) { searchCity(query.trim()); setQuery(''); setSearchOpen(false) }
  }

  const icon = current ? get3DIconStyle(current.conditionCode, isDark) : null
  const displayed = aiContent ?? (current ? getFallbackHeadline(current.temp, current.conditionCode) : null)

  const splitHeadline = (text: string) => {
    const clean = text.replace(/[.!?,;]+$/, '')
    const words = clean.split(' ').filter(Boolean)
    const last = words.pop() ?? ''
    return { plain: words.join(' '), gradient: last + '.' }
  }

  /*
   * Container-relative font sizing: uses cqw/cqh so the headline
   * scales to fit its own bounding box, not the viewport.
   * The headline container has `container-type: size`.
   * Adjusted for #008 to be a subtitle scale rather than massive.
   */
  const getHeadlineFontSize = (text: string) => {
    const words = text.split(' ').filter(Boolean).length
    if (words <= 3) return 'clamp(1.5rem, min(8cqw, 12cqh), 2.5rem)'
    if (words <= 5) return 'clamp(1.3rem, min(7cqw, 10cqh), 2.2rem)'
    return 'clamp(1.2rem, min(6cqw, 8cqh), 2rem)'
  }

  const buildHeadlineLines = (plain: string, gradient: string): string[] => {
    const words = plain.split(' ').filter(Boolean)
    const total = words.length + 1
    if (total <= 4) return [...words, gradient]
    const lines: string[] = []
    for (let i = 0; i < words.length; i += 2) {
      lines.push(words.slice(i, i + 2).join(' '))
    }
    const lastLine = lines[lines.length - 1]
    if (lastLine && !lastLine.includes(' ')) {
      lines[lines.length - 1] = lastLine + ' ' + gradient
    } else {
      lines.push(gradient)
    }
    return lines
  }

  return (
    <div className="relative flex flex-col h-[100dvh] overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Decorative glow — not a layout element */}
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      {/* ═══════════════════════════════════════════════════════════
          CONTAINER 1 — HEADER
          Fixed-height bounding box: location + search toggle
          ═══════════════════════════════════════════════════════════ */}
      <header className="relative flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-1 w-full max-w-xl mx-auto">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label={searchOpen ? 'Close city search' : 'Open city search'}
          aria-expanded={searchOpen}
          className="flex items-center gap-2 active:opacity-70 transition-opacity"
        >
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <span className="font-headline text-sm font-medium tracking-tight truncate max-w-[200px]" style={{ color: 'var(--primary)' }}>
            {locLoading ? 'Locating…' : location
              ? `${location.name}${location.country ? `, ${location.country}` : ''}`
              : 'Set location'}
          </span>
          <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-70" style={{ color: 'var(--primary)' }} aria-hidden="true" />
        </button>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label={searchOpen ? 'Close search' : 'Search city'}
          aria-expanded={searchOpen}
          className="transition-colors p-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {searchOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
        </button>
      </header>

      {/* Search overlay — borrows space from headline container when open */}
      {searchOpen && (
        <div className="relative flex-shrink-0 px-5 pt-2 pb-1 w-full max-w-xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5 glass-input">
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city…"
                aria-label="City name"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA — flex-1, distributes space to children
          ═══════════════════════════════════════════════════════════ */}
      <main className="relative flex-1 flex flex-col min-h-0 overflow-hidden w-full max-w-xl mx-auto">
        {loading ? (
          /* Loading skeleton — same container proportions */
          <div className="flex-1 flex flex-col px-5">
            <div className="flex-shrink-0 flex items-center gap-4 py-2">
              <div className="w-14 h-14 rounded-full animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.6 }} />
              <div className="flex flex-col gap-2">
                <div className="h-9 w-24 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.6 }} />
                <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2 py-2">
              <div className="h-[16%] w-full rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
              <div className="h-[16%] w-5/6 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.3 }} />
              <div className="h-[16%] w-4/6 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.2 }} />
            </div>
          </div>
        ) : current && displayed && icon ? (
          <>
            {/* ═══ CONTAINER 2 — WEATHER DISPLAY ═══
                Fixed-height: icon orb + temperature + feels like */}
            <section className="relative flex-shrink-0 flex items-center gap-3 px-5 py-1">
              <div
                className="relative flex-shrink-0"
                style={{ filter: `drop-shadow(0 0 18px ${icon.glow})` }}
              >
                <div
                  className="absolute inset-0 rounded-full opacity-60 blur-xl"
                  style={{ background: `linear-gradient(135deg, ${icon.from}, ${icon.to})` }}
                />
                <div
                  className="relative w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${icon.from}, ${icon.via}, ${icon.to})`,
                    boxShadow: `inset -4px -4px 14px rgba(0,0,0,0.25), 0 4px 18px ${icon.glow}`,
                  }}
                >
                  <div className="absolute top-1.5 left-2.5 w-4 h-2 bg-white/40 blur-sm rounded-full -rotate-[30deg]" />
                  <WeatherIcon
                    conditionCode={current.conditionCode}
                    iconCode={current.icon}
                    size={26}
                    className="relative z-10 opacity-90 drop-shadow-sm"
                  />
                </div>
              </div>
              <div>
                <p
                  className="font-headline font-bold leading-none tracking-tighter"
                  style={{ fontSize: 'clamp(3.5rem, 15vw, 6rem)', color: 'var(--text)' }}
                >
                  {displayTemp(current.temp, tempUnit)}
                </p>
                <p className="font-label text-[11px] mt-1 mb-2" style={{ color: 'var(--text-muted)' }}>
                  Feels like {displayTemp(current.feelsLike, tempUnit)}
                </p>
                
                {/* Stats Row (#012) */}
                <div className="flex items-center gap-3 text-[11px] font-label tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    H:{displayTempShort(daily?.[0]?.tempMax ?? current.tempMax, tempUnit)}
                    &nbsp;&nbsp;
                    L:{displayTempShort(daily?.[0]?.tempMin ?? current.tempMin, tempUnit)}
                  </span>
                  <span>{hourly?.[0]?.pop ?? 0}% Rain</span>
                  <span>{displayWind(current.windSpeed, windUnit)}</span>
                </div>
              </div>
            </section>

            {/* ═══ CONTAINER 3 — HEADLINE ONLY (flex-1, container-query sized) ═══
                Elastic container. Absorbs remaining vertical space.
                Only the headline lives here — advice/refresh are separate. */}
            <section
              className="relative flex-1 flex flex-col justify-center min-h-0 px-5"
              style={{ containerType: 'size', marginTop: '20px' }}
            >
              {aiLoading && !displayed ? (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="h-[15%] w-full rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
                  <div className="h-[15%] w-5/6 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.3 }} />
                  <div className="h-[15%] w-2/3 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.2 }} />
                </div>
              ) : (
                <h1
                  className="font-headline font-extrabold leading-[1.05] tracking-tighter"
                  style={{
                    fontSize: getHeadlineFontSize(displayed.headline),
                    color: 'var(--text)',
                    paddingBottom: '0.15em',
                  }}
                >
                  {(() => {
                    const { plain, gradient } = splitHeadline(displayed.headline)
                    const lines = buildHeadlineLines(plain, gradient)
                    const gradientStyle = {
                      background: isDark
                        ? 'linear-gradient(135deg, #c7bfff 0%, #acc7ff 100%)'
                        : 'linear-gradient(135deg, var(--gradient-text-from) 0%, var(--gradient-text-to) 100%)',
                      WebkitBackgroundClip: 'text' as const,
                      WebkitTextFillColor: 'transparent' as const,
                      backgroundClip: 'text' as const,
                    }
                    const isLastLine = (i: number) => i === lines.length - 1
                    return lines.map((line, i) => (
                      <span key={i} className="block" style={isLastLine(i) ? { ...gradientStyle, paddingBottom: '0.25em' } : {}}>
                        {line}
                      </span>
                    ))
                  })()}
                </h1>
              )}
            </section>

            {/* ═══ CONTAINER 3.5 — ADVICE + AI REFRESH ═══
                Fixed-height, always sits directly above the hourly cards.
                Detached from headline so it never gets swallowed. */}
            {displayed && !aiLoading && (
              <section className="relative flex-shrink-0 px-5 pb-1">
                <p
                  className="font-body text-[15px] font-medium max-w-[90%] leading-relaxed mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {displayed.advice}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push('/insight')}
                    className="flex justify-between items-center px-4 py-2 rounded-full border border-dashed transition-colors active:scale-95"
                    style={{ background: 'var(--surface-mid)', borderColor: 'var(--outline)', color: 'var(--text)' }}
                  >
                    <span className="text-[11px] font-label font-bold tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                      Daily Briefing <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={aiLoading}
                    aria-label="Refresh AI summary"
                    className="flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest transition-opacity active:scale-95 disabled:opacity-30 p-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </button>
                </div>
              </section>
            )}

            {/* ═══ CONTAINER 4 — HOURLY FORECAST ═══
                Fixed-height: horizontal scrollable card strip */}
            <section className="relative flex-shrink-0 px-5 py-1.5">
              {hourly && hourly.length > 0 && (
                <HourlyForecast data={hourly} />
              )}
            </section>

            {/* ═══ CONTAINER 5 — ASK BAR ═══
                Fixed-height: search-style CTA pill */}
            <section className="relative flex-shrink-0 px-5 py-1.5">
              <div className="rounded-full flex items-center gap-3 pl-5 pr-2 py-1.5 glass-input">
                <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <button
                  onClick={() => router.push('/chat')}
                  className="flex-1 text-left text-sm font-body py-2"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Ask Atmos a question"
                >
                  Ask Atmos…
                </button>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-5 py-2 rounded-full font-bold text-xs tracking-wide text-white flex-shrink-0"
                  aria-label="Open AI chat"
                  style={{
                    background: 'linear-gradient(135deg, var(--gradient-text-from) 0%, var(--gradient-text-to) 100%)',
                    animation: 'askGlow 2.5s ease-in-out infinite',
                  }}
                >
                  ASK
                </button>
              </div>
            </section>
          </>
        ) : (
          /* Welcome — no location set */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-5">
            <div className="relative w-20 h-20 mb-6">
              <div
                className="absolute inset-0 rounded-full opacity-30 blur-xl"
                style={{ background: 'linear-gradient(135deg, #FFF7CC, #FFA500)' }}
              />
              <div
                className="relative w-full h-full rounded-full opacity-60"
                style={{ background: 'linear-gradient(135deg, #FFF7CC, #FFA500)' }}
              />
            </div>
            <h2 className="text-xl font-semibold font-headline mb-2" style={{ color: 'var(--text)' }}>
              Welcome to Atmos
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Allow location access or tap to search a city.
            </p>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════
          CONTAINER 6 — BOTTOM NAV
          Fixed-height, IN the page flow (not fixed/absolute).
          ═══════════════════════════════════════════════════════════ */}
      <BottomNav inline />
    </div>
  )
}
