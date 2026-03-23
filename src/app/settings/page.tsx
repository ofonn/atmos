'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { useSettings } from '@/contexts/SettingsContext'
import { useLocation } from '@/hooks/useLocation'
import {
  Sun,
  Moon,
  Thermometer,
  Wind,
  Clock,
  MapPin,
  ChevronRight,
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
  const { location } = useLocation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="px-6 pt-14 pb-2">
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

      <main className="flex-1 px-6 pt-6 pb-32 space-y-3">
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

        <div
          className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {location
                  ? `${location.name}${location.country ? `, ${location.country}` : ''}`
                  : 'Not set'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {location
                  ? `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`
                  : 'Allow location access or search a city'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
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
