'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useSettings } from '@/contexts/SettingsContext'
import { useWeatherContext } from '@/contexts/WeatherContext'
import {
  Sun,
  Moon,
  Thermometer,
  Wind,
  Clock,
  MapPin,
  LocateFixed,
  Search,
  X,
  ChevronRight,
  Star,
  MessageSquareWarning,
  Sparkles,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

function SettingRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 rounded-2xl"
      style={{ background: 'var(--surface)' }}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: any) => void
}) {
  return (
    <div
      className="flex rounded-xl p-0.5 gap-0.5"
      style={{ background: 'var(--surface-mid)' }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2.5 rounded-lg text-xs transition-all min-h-[40px] ${
              active ? 'font-bold' : 'font-medium'
            }`}
            style={{
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--text-muted)',
              /* Secondary active signal: subtle ring on active (#007) */
              boxShadow: active ? '0 0 0 1px rgba(199,191,255,0.3)' : 'none',
            }}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { tempUnit, windUnit, timeFormat, headlineTone, headlineTwoLine, headlineLocationFlavor, headlineTimeAware, updateSetting } = useSettings()
  const { location, locLoading, searchCity, syncLocation } = useWeatherContext()
  const [mounted, setMounted] = useState(false)
  const [cityInput, setCityInput] = useState('')
  const [cityEditOpen, setCityEditOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cityInput.trim()) {
      searchCity(cityInput.trim())
      setCityInput('')
      setCityEditOpen(false)
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-3.5 backdrop-blur-2xl saturate-150"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <h1
          className="text-xl font-bold font-headline tracking-tight"
          style={{ color: 'var(--primary)' }}
        >
          Settings
        </h1>
      </header>

      <main className="relative z-10 flex-1 px-6 pt-6 pb-32 w-full max-w-4xl mx-auto">
        <div className="md:grid md:grid-cols-2 md:gap-12 items-start">
          <div className="space-y-3">
        {/* Appearance section */}
        <p
          className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Appearance
        </p>

        <SettingRow icon={theme === 'dark' ? Moon : Sun} label="Theme">
          <SegmentedControl
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            value={theme ?? 'system'}
            onChange={(v) => setTheme(v)}
          />
        </SettingRow>

        {/* Units section */}
        <div className="pt-4">
          <p
            className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Units
          </p>
        </div>

        <SettingRow icon={Thermometer} label="Temperature">
          <SegmentedControl
            options={[
              { value: 'C', label: '°C' },
              { value: 'F', label: '°F' },
            ]}
            value={tempUnit}
            onChange={(v) => updateSetting('tempUnit', v)}
          />
        </SettingRow>

        <SettingRow icon={Wind} label="Wind Speed">
          <SegmentedControl
            options={[
              { value: 'kmh', label: 'km/h' },
              { value: 'mph', label: 'mph' },
            ]}
            value={windUnit}
            onChange={(v) => updateSetting('windUnit', v)}
          />
        </SettingRow>

        <SettingRow icon={Clock} label="Time Format">
          <SegmentedControl
            options={[
              { value: '24h', label: '24h' },
              { value: '12h', label: '12h' },
            ]}
            value={timeFormat}
            onChange={(v) => updateSetting('timeFormat', v)}
          />
        </SettingRow>

        {/* AI & Headlines section */}
        <div className="pt-4">
          <p className="text-[11px] font-label uppercase tracking-widest px-1 mb-1" style={{ color: 'var(--text-muted)' }}>
            AI &amp; Headlines
          </p>
        </div>

        {/* Tone picker */}
        <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Headline Tone</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { value: 'casual',      label: 'Casual',       emoji: '💬' },
              { value: 'punchy',      label: 'Punchy',       emoji: '⚡' },
              { value: 'sarcastic',   label: 'Sarcastic',    emoji: '🙄' },
              { value: 'funny',       label: 'Funny',        emoji: '😄' },
              { value: 'dramatic',    label: 'Dramatic',     emoji: '🎭' },
              { value: 'informative', label: 'Inform.',      emoji: '📋' },
              { value: 'smart',       label: 'Smart',        emoji: '🧠' },
              { value: 'local',       label: 'Local',        emoji: '📍' },
            ] as { value: string; label: string; emoji: string }[]).map(opt => {
              const active = headlineTone === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => updateSetting('headlineTone', opt.value as any)}
                  className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-center transition-all"
                  style={{
                    background: active ? 'var(--primary)' : 'var(--surface-mid)',
                    color: active ? 'var(--bg)' : 'var(--text-muted)',
                    boxShadow: active ? '0 0 0 1px rgba(199,191,255,0.4)' : 'none',
                  }}
                  aria-pressed={active}
                >
                  <span className="text-base leading-none">{opt.emoji}</span>
                  <span className="text-[10px] font-bold font-label leading-none">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Toggle options */}
        {([
          { key: 'headlineTwoLine',        val: headlineTwoLine,        label: 'Two-line Hook + Punchline',  icon: '↵', desc: 'Short punchy setup, then the payoff on a new line' },
          { key: 'headlineLocationFlavor', val: headlineLocationFlavor, label: 'Local Flavour',              icon: '📍', desc: 'Mentions your city and climate naturally' },
          { key: 'headlineTimeAware',      val: headlineTimeAware,      label: 'Time-aware Tone',            icon: '🕐', desc: 'Morning = briefing, night = atmospheric, etc.' },
        ] as { key: any; val: boolean; label: string; icon: string; desc: string }[]).map(({ key, val, label, icon, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between px-5 py-4 rounded-2xl"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
              </div>
              <p className="text-[11px] font-label pl-7" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
            <button
              onClick={() => updateSetting(key, !val)}
              className="flex-shrink-0 w-12 h-6 rounded-full relative transition-colors duration-200"
              style={{ background: val ? 'var(--primary)' : 'var(--surface-mid)' }}
              aria-pressed={val}
              role="switch"
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                style={{
                  background: 'white',
                  transform: val ? 'translateX(24px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        ))}

          </div>

          <div className="space-y-3 mt-8 md:mt-0">
        {/* Location section */}
        <div>
          <p
            className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Location
          </p>
        </div>

        {/* Location display */}
        <div
          className="px-5 py-4 rounded-2xl"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {location
                  ? `${location.name}${location.country ? `, ${location.country}` : ''}`
                  : 'Location not set'}
              </p>
              <p
                className="text-[11px]"
                onDoubleClick={() => {
                  if (location) alert(`Raw Coordinates: ${location.lat}, ${location.lon}`)
                }}
                style={{ color: 'var(--text-muted)' }}
                title="Double tap for precise coordinates"
              >
                {location
                  ? `Precise location active • Synced recently`
                  : 'Search for a city or sync GPS'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--outline)' }}>
            <button
              onClick={() => router.push('/locations')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors active:scale-95"
              style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium">Manage Saved Places</span>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
            <button
              onClick={() => setCityEditOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors active:scale-95"
              style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium">Search for a city...</span>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
            <button
              onClick={() => syncLocation()}
              disabled={locLoading}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
            >
              <div className="flex items-center gap-3">
                <LocateFixed className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium">{locLoading ? 'Syncing...' : 'Use current location'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Feedback section */}
        <div className="pt-4">
          <p
            className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Feedback
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)' }}>
          {[
            { label: 'Rate Atmos', icon: Star },
            { label: 'Report issue', icon: MessageSquareWarning },
            { label: 'Send AI feedback', icon: Sparkles },
          ].map((item, i) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10"
              style={{ borderBottom: i < 2 ? '0.5px solid var(--outline)' : 'none' }}
              onClick={() => {}}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>

        {/* About section */}
        <div className="pt-4">
          <p
            className="text-[10px] font-label uppercase tracking-widest px-1 mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            About
          </p>
        </div>

        <div
          className="px-5 py-4 rounded-2xl"
          style={{ background: 'var(--surface)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Atmos
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            AI Weather Assistant &middot; v1.0.0
          </p>
          <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Powered by Open-Meteo &amp; Google Gemini. Built with Next.js.
          </p>
        </div>
          </div>
        </div>
      </main>

      <BottomNav />

      {/* Slide-out Bottom Sheet for Enter City (#035) */}
      <AnimatePresence>
        {cityEditOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCityEditOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 pb-12"
              style={{ background: 'var(--surface)', borderTop: '0.5px solid var(--outline)' }}
            >
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
              <h3 className="text-lg font-bold font-headline mb-4 tracking-tight" style={{ color: 'var(--text)' }}>Search Location</h3>
              <form onSubmit={handleCitySubmit} className="mb-2">
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{ background: 'var(--bg)', border: '0.5px solid var(--outline)' }}
                >
                  <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  <input
                    autoFocus
                    type="text"
                    value={cityInput}
                    onChange={e => setCityInput(e.target.value)}
                    placeholder="Enter city name..."
                    className="flex-1 bg-transparent border-none outline-none text-[15px] font-body"
                    style={{ color: 'var(--text)' }}
                  />
                  {cityInput && (
                    <button type="button" onClick={() => setCityInput('')}>
                      <X className="w-5 h-5 p-1" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
