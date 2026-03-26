'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useSwipeable } from 'react-swipeable'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { BottomNav } from '@/components/layout/BottomNav'
import { HourlyForecast } from '@/components/weather/HourlyForecast'
import { WeatherParticles, getEffect } from '@/components/weather/WeatherParticles'
import { SunArc } from '@/components/weather/SunArc'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useAiContent } from '@/hooks/useAiContent'
import { useSettings } from '@/contexts/SettingsContext'
import { useHaptic } from '@/hooks/useHaptic'
import { displayTemp, displayTempShort, displayWind, timeAgo } from '@/lib/utils'
import { wmoEmoji, aqiColor, aqiLabel } from '@/lib/weatherUtils'
import { MapPin, Search, Sparkles, X, RefreshCw, ChevronDown, ArrowRight, Share2 } from 'lucide-react'

// Page order for swipe navigation
const PAGE_ORDER = ['/', '/technical', '/overview', '/chat', '/settings']

function get3DIconStyle(code: number, isDark: boolean = true) {
  // WMO codes (0-99)
  if (code === 0 || code === 1) return { from: '#FFD359', via: '#FFB800', to: isDark ? '#FF8C00' : '#FFB800', glow: 'rgba(255,184,0,0.5)' }
  if (code === 2 || code === 3) return { from: '#94A3B8', via: '#64748B', to: isDark ? '#475569' : '#94A3B8', glow: 'rgba(148,163,184,0.3)' }
  if (code >= 45 && code <= 48) return { from: '#94A3B8', via: '#64748B', to: isDark ? '#475569' : '#94A3B8', glow: 'rgba(148,163,184,0.3)' }
  if (code >= 51 && code <= 67) return { from: '#60A5FA', via: '#3B82F6', to: isDark ? '#1D4ED8' : '#60A5FA', glow: 'rgba(96,165,250,0.5)' }
  if (code >= 71 && code <= 86) return { from: '#E0E7FF', via: '#C7D2FE', to: isDark ? '#A5B4FC' : '#E0E7FF', glow: 'rgba(165,180,252,0.5)' }
  if (code >= 80 && code <= 82) return { from: '#60A5FA', via: '#3B82F6', to: isDark ? '#1D4ED8' : '#60A5FA', glow: 'rgba(96,165,250,0.5)' }
  if (code >= 95) return { from: '#8B5CF6', via: '#6D28D9', to: isDark ? '#4C1D95' : '#8B5CF6', glow: 'rgba(139,92,246,0.5)' }
  return { from: '#94A3B8', via: '#64748B', to: isDark ? '#475569' : '#94A3B8', glow: 'rgba(148,163,184,0.3)' }
}

function getFallbackHeadline(temp: number, code: number): { headline: string; advice: string } {
  const hour = new Date().getHours()
  const isNight = hour < 6 || hour >= 22
  const isMorning = hour >= 6 && hour < 12
  const isEvening = hour >= 18 && hour < 22

  // Storm and severe first (time-independent)
  if (code >= 95) return { headline: "Thunderstorm moving through right now.", advice: "Stay inside. Dangerous lightning and heavy rain until it passes." }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return {
    headline: isNight ? "Snowing through the night." : "Snow falling right now.",
    advice: "Roads will be slippery. Give yourself extra time and drive slow."
  }
  if (code >= 45 && code <= 48) return { headline: "Thick fog cutting visibility down.", advice: "Drive with lights on and slow down — visibility is really low out there." }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return {
    headline: isNight ? "Raining through the night." : "It's raining right now.",
    advice: isNight ? "All tucked in? It'll likely clear by morning." : "Grab an umbrella. You'll need it — this rain isn't light."
  }
  if (code >= 51 && code <= 57) return { headline: "Light drizzle out there right now.", advice: "Not soaking rain, but enough to ruin your hair. A light jacket helps." }

  // Clear/sunny conditions with time-awareness
  if ((code === 0 || code === 1) && temp >= 35) return {
    headline: isNight ? "Still roasting even at night." : "Scorching heat and clear skies.",
    advice: isNight ? "Keep windows open. The heat isn't going anywhere fast tonight." : "Stay in the shade. Drink water constantly. This heat is dangerous."
  }
  if ((code === 0 || code === 1) && temp >= 28) return {
    headline: isMorning ? "Sunny start — it'll get very warm." : isNight ? "Warm and clear tonight." : "Hot, sunny, and bright outside.",
    advice: isMorning ? "Get outside early before the heat peaks this afternoon." : isNight ? "Nice evening for a window open." : "Sun is strong today. Sunscreen if you're going out."
  }
  if ((code === 0 || code === 1) && temp >= 18) return {
    headline: isMorning ? "Beautiful morning out there." : isEvening ? "Lovely evening — sun's still warm." : isNight ? "Clear and mild tonight." : "Perfect weather right now.",
    advice: isMorning ? "Great morning for a walk or run before it gets busy." : isNight ? "Comfortable sleeping tonight — windows open should work." : "Almost perfect conditions. Get out if you can."
  }
  if (code === 0 || code === 1) return {
    headline: isNight ? "Clear skies, cold night." : "Bright and cold outside.",
    advice: isNight ? "Cold overnight. An extra blanket wouldn't hurt." : "Sun is out but don't be fooled — wrap up warm."
  }
  if (code === 2 || code === 3) return {
    headline: isNight ? "Overcast and quiet tonight." : temp >= 25 ? "Warm and cloudy right now." : "Grey skies but staying dry.",
    advice: isNight ? "Mild night ahead. Nothing dramatic." : "No rain expected. Grey but manageable — no umbrella needed."
  }

  // Temperature extremes
  if (temp >= 38) return { headline: "Dangerously hot outside right now.", advice: "This is a heat emergency. Stay hydrated, stay inside if you can." }
  if (temp <= 0) return { headline: "Freezing cold — below zero right now.", advice: "Bundle up completely. Watch for ice on roads and pavements." }
  if (temp <= 8) return { headline: "Cold one out there today.", advice: "A proper coat and layers. It's sharper than it looks." }

  return {
    headline: isNight ? "Quiet and still outside tonight." : "Conditions are pretty normal today.",
    advice: "Nothing out of the ordinary. Check the hourly for any changes."
  }
}

export default function Home() {
  const router = useRouter()
  const { theme } = useTheme()
  const { tempUnit, windUnit } = useSettings()
  const haptic = useHaptic()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { location, locLoading, searchCity, current, hourly, daily, sun, refresh: refreshWeather, loading: weatherLoading } = useWeatherContext()
  const { data: airData } = useSWR(
    location ? `/api/airpollution?lat=${location.lat}&lon=${location.lon}` : null,
    (url: string) => fetch(url).then(r => r.json()),
    { refreshInterval: 600000 }
  )
  const aqiLevel: number | null = airData?.list?.[0]?.main?.aqi ?? null
  const { content: aiContent, loading: aiLoading, refresh: refreshAi } = useAiContent(current, hourly, daily)

  // Swipe left/right to navigate between pages
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      haptic.light()
      router.push('/technical')
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
    delta: 80,
  })

  const loading = locLoading || weatherLoading
  const isDark = theme !== 'light'

  // Particle effect based on current conditions
  const particleEffect = current ? getEffect(current.conditionCode, current.isDay) : 'none'

  // Dynamic sky tint based on time of day
  const getSkyTint = () => {
    if (!current) return null
    const now = Date.now() / 1000
    if (!sun) return null
    const { sunrise, sunset } = sun
    const dawnStart = sunrise - 30 * 60
    const dawnEnd = sunrise + 30 * 60
    const duskStart = sunset - 30 * 60
    const duskEnd = sunset + 30 * 60
    if (now >= dawnStart && now < dawnEnd) return 'rgba(255,140,60,0.07)'  // dawn orange
    if (now >= duskStart && now < duskEnd) return 'rgba(255,80,100,0.07)' // dusk pink
    if (!current.isDay) return 'rgba(20,30,80,0.12)'                       // night blue
    return null
  }
  const skyTint = getSkyTint()

  const handleShare = async () => {
    if (!current || !location) return
    const text = `Weather in ${location.name}: ${current.temp}°C, ${current.description}. Feels like ${current.feelsLike}°C. — via Atmos`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Atmos Weather', text })
      } else {
        await navigator.clipboard.writeText(text)
      }
    } catch {}
  }

  // Sunrise/sunset progress (0-1)
  const dayProgress = (() => {
    if (!sun || !current?.isDay) return null
    const now = Date.now() / 1000
    const { sunrise, sunset } = sun
    if (now < sunrise || now > sunset) return null
    return Math.min(1, Math.max(0, (now - sunrise) / (sunset - sunrise)))
  })()

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
   * Container-relative font sizing: fills the flex-1 headline zone.
   * Uses cqw/cqh so type scales with the available container, not viewport.
   */
  const getHeadlineFontSize = (text: string) => {
    const words = text.split(' ').filter(Boolean).length
    if (words <= 3) return 'clamp(3.2rem, min(18cqw, 30cqh), 8rem)'
    if (words <= 5) return 'clamp(2.6rem, min(14cqw, 24cqh), 6rem)'
    if (words <= 8) return 'clamp(2rem, min(11cqw, 18cqh), 5rem)'
    return 'clamp(1.6rem, min(9cqw, 14cqh), 4rem)'
  }

  const buildHeadlineLines = (plain: string, gradient: string): string[] => {
    const words = plain.split(' ').filter(Boolean)
    const total = words.length + 1
    // For short headlines, each word on its own line — maximum drama
    if (total <= 3) return [...words, gradient]
    // For medium headlines, 2 words per line
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
    <div
      className="relative flex flex-col h-[100dvh] overflow-hidden"
      style={{ background: 'var(--bg)' }}
      {...swipeHandlers}
    >
      {/* Decorative glow — not a layout element */}
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />
      {/* Dynamic sky tint (dawn/dusk/night) */}
      {skyTint && (
        <div className="absolute inset-0 pointer-events-none transition-colors duration-[3000ms]" style={{ background: skyTint }} />
      )}
      {/* Weather particle system */}
      <WeatherParticles effect={particleEffect} intensity={0.6} />

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
                  <span className="relative z-10 text-2xl leading-none" role="img" aria-label={current.description}>
                    {wmoEmoji(current.conditionCode, current.isDay ? 1 : 0)}
                  </span>
                </div>
              </div>
              <div>
                <div
                  className="font-headline font-bold leading-none tracking-tighter"
                  style={{ fontSize: 'clamp(3.5rem, 15vw, 6rem)', color: 'var(--text)' }}
                >
                  <AnimatedNumber
                    value={tempUnit === 'F' ? Math.round(current.temp * 9 / 5 + 32) : current.temp}
                    format={n => `${Math.round(n)}°${tempUnit}`}
                    duration={600}
                    className="font-headline font-bold leading-none tracking-tighter"
                    style={{ fontSize: 'clamp(3.5rem, 15vw, 6rem)', color: 'var(--text)' }}
                  />
                </div>
                <p className="font-label text-[11px] mt-1 mb-2">
                  <span style={{ color: 'var(--text-muted)' }}>Feels like </span>
                  <span style={{
                    color: current.feelsLike - current.temp >= 4 ? '#f97316'
                      : current.feelsLike - current.temp <= -4 ? '#60a5fa'
                      : 'var(--text-muted)',
                  }}>
                    {displayTemp(current.feelsLike, tempUnit)}
                  </span>
                </p>
                
                {/* Stats Row (#012) */}
                <div className="flex items-center gap-3 text-[11px] font-label tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    H:{displayTempShort(daily?.[0]?.tempMax ?? current.tempMax, tempUnit)}
                    &nbsp;&nbsp;
                    L:{displayTempShort(daily?.[0]?.tempMin ?? current.tempMin, tempUnit)}
                  </span>
                  <span>{hourly?.[0]?.pop ?? 0}% Rain</span>
                  <span>
                    {displayWind(current.windSpeed, windUnit)}
                    {current.windGusts > current.windSpeed + 8 && (
                      <span className="opacity-70"> ↑{displayWind(current.windGusts, windUnit)}</span>
                    )}
                  </span>
                  <span className="opacity-50">· {timeAgo(current.dt)}</span>
                  {aqiLevel !== null && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-bold font-label"
                      style={{ background: `${aqiColor(aqiLevel)}25`, color: aqiColor(aqiLevel) }}
                    >
                      AQI {aqiLabel(aqiLevel)}
                    </span>
                  )}
                </div>

                {/* Sunrise/sunset SVG arc */}
                {sun && (
                  <div className="mt-1 -mx-2">
                    <SunArc sunrise={sun.sunrise} sunset={sun.sunset} />
                  </div>
                )}
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
            {displayed && (
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
                    className="flex justify-between items-center px-5 py-2.5 rounded-full border border-solid shadow-sm transition-all active:scale-[0.97]"
                    style={{ 
                      background: 'var(--surface)', 
                      borderColor: 'rgba(128, 110, 248, 0.2)', 
                      color: 'var(--text)' 
                    }}
                  >
                    <span className="text-[11px] font-label font-black tracking-[0.05em] uppercase flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                      Daily Briefing <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={aiLoading}
                    aria-label="Refresh AI summary"
                    className="flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest transition-opacity active:scale-95 disabled:opacity-30 px-3 py-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    {aiLoading ? 'Updating…' : 'Refresh'}
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="Share weather"
                    className="flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest transition-opacity active:scale-95 px-3 py-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Share
                  </button>
                  <button
                    onClick={() => router.push('/radar')}
                    aria-label="Live radar map"
                    className="flex items-center gap-1.5 text-[11px] font-label uppercase tracking-widest transition-opacity active:scale-95 px-3 py-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    🛰️ Radar
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

            {/* No inline AI chat bar — see floating AI FAB below */}
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
          FLOATING AI FAB — pulsing button that draws eye to chat
          Positioned above the inline nav bar
          ═══════════════════════════════════════════════════════════ */}
      {current && (
        <button
          onClick={() => router.push('/chat')}
          aria-label="Chat with Atmos AI"
          className="absolute right-5 z-30 active:scale-90 transition-transform"
          style={{ bottom: '90px' }}
        >
          {/* Outer halo — slow pulse */}
          <span
            className="absolute inset-[-8px] rounded-full opacity-20 animate-pulse"
            style={{ background: 'linear-gradient(135deg, #806EF8, #5896FD)' }}
            aria-hidden="true"
          />
          {/* Mid ring — fast ping */}
          <span
            className="absolute inset-[-3px] rounded-full opacity-30 animate-ping"
            style={{ background: 'linear-gradient(135deg, #806EF8, #5896FD)' }}
            aria-hidden="true"
          />
          {/* Button body */}
          <div
            className="relative w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #806EF8, #5896FD)',
              boxShadow: '0 0 28px rgba(128,110,248,0.6), 0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM NAV — inline in flow, no fixed positioning
          ═══════════════════════════════════════════════════════════ */}
      <BottomNav inline />
    </div>
  )
}
