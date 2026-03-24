'use client'

import { useTheme } from 'next-themes'
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
} from 'lucide-react'

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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { tempUnit, windUnit, timeFormat, updateSetting } = useSettings()
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

  const isDark = theme === 'dark'

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      {/* Header */}
      <header className="relative z-10 px-6 pt-14 pb-2">
        <h1
          className="text-3xl font-extrabold font-headline tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Customize your Atmos experience.
        </p>
      </header>

      <main className="relative z-10 flex-1 px-6 pt-6 pb-32 space-y-3">
        {/* Appearance section */}
        <p
          className="text-[10px] font-label uppercase tracking-widest px-1 mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Appearance
        </p>

        <SettingRow icon={isDark ? Moon : Sun} label="Theme">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative flex items-center w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0"
            style={{
              background: isDark
                ? 'rgba(199,191,255,0.15)'
                : 'rgba(255,184,0,0.2)',
              border: isDark
                ? '1px solid rgba(199,191,255,0.2)'
                : '1px solid rgba(255,184,0,0.3)',
            }}
            aria-label="Toggle theme"
          >
            <Moon className="absolute left-1.5 w-3.5 h-3.5 text-[#c7bfff]" />
            <Sun className="absolute right-1.5 w-3.5 h-3.5 text-amber-400" />
            <span
              className="absolute w-5 h-5 rounded-full shadow-sm transition-all duration-300"
              style={{
                left: isDark ? '2px' : 'calc(100% - 22px)',
                background: isDark
                  ? 'linear-gradient(135deg, #c7bfff, #806EF8)'
                  : 'linear-gradient(135deg, #FFB800, #FF8C00)',
              }}
            />
          </button>
        </SettingRow>

        {/* Units section */}
        <div className="pt-4">
          <p
            className="text-[10px] font-label uppercase tracking-widest px-1 mb-1"
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

        {/* Location section */}
        <div className="pt-4">
          <p
            className="text-[10px] font-label uppercase tracking-widest px-1 mb-1"
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
                  : 'Not set'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {location
                  ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`
                  : 'No location set'}
              </p>
            </div>
          </div>

          {/* City search input */}
          {cityEditOpen && (
            <form onSubmit={handleCitySubmit} className="mb-3">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: 'var(--surface-mid)', border: '0.5px solid var(--outline)' }}
              >
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  autoFocus
                  type="text"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  placeholder="Type a city name…"
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ color: 'var(--text)' }}
                />
                <button type="button" onClick={() => setCityEditOpen(false)}>
                  <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </form>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => syncLocation()}
              disabled={locLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
            >
              <LocateFixed className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              {locLoading ? 'Syncing…' : 'Sync GPS'}
            </button>
            <button
              onClick={() => setCityEditOpen(v => !v)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              Enter City
            </button>
          </div>
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
            Powered by OpenWeather &amp; Google Gemini. Built with Next.js.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
