'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TempUnit = 'C' | 'F'
export type WindUnit = 'kmh' | 'mph'
export type TimeFormat = '12h' | '24h'
export type HeadlineTone =
  | 'casual'
  | 'punchy'
  | 'sarcastic'
  | 'funny'
  | 'dramatic'
  | 'informative'
  | 'smart'
  | 'local'
export type AiEmojiUse = 'none' | 'light' | 'heavy'
export type AiVerbosity = 'short' | 'medium' | 'long'

export interface Settings {
  tempUnit: TempUnit
  windUnit: WindUnit
  timeFormat: TimeFormat
  headlineTone: HeadlineTone
  headlineTwoLine: boolean
  headlineLocationFlavor: boolean
  headlineTimeAware: boolean
  aiEmojiUse: AiEmojiUse
  aiVerbosity: AiVerbosity
  language: string
}

const defaults: Settings = {
  tempUnit: 'C',
  windUnit: 'kmh',
  timeFormat: '24h',
  headlineTone: 'casual',
  headlineTwoLine: false,
  headlineLocationFlavor: false,
  headlineTimeAware: false,
  aiEmojiUse: 'light',
  aiVerbosity: 'medium',
  language: 'en',
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
  const [settings, setSettings] = useState<Settings>(defaults)

  useEffect(() => {
    setSettings(readCache())
    const onStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY || e.key === null) {
        setSettings(readCache())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
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
