'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TempUnit = 'C' | 'F'
export type WindUnit = 'kmh' | 'mph'
export type TimeFormat = '12h' | '24h'

export interface Settings {
  tempUnit: TempUnit
  windUnit: WindUnit
  timeFormat: TimeFormat
}

const defaults: Settings = {
  tempUnit: 'C',
  windUnit: 'kmh',
  timeFormat: '24h',
}

const CACHE_KEY = 'atmos_settings'

interface SettingsContextType extends Settings {
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const SettingsContext = createContext<SettingsContextType>({
  ...defaults,
  updateSetting: () => {},
})

function readCache(): Settings {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Always start with defaults to match server render, then hydrate from localStorage
  const [settings, setSettings] = useState<Settings>(defaults)

  useEffect(() => {
    const cached = readCache()
    setSettings(cached)
  }, [])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <SettingsContext.Provider value={{ ...settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
