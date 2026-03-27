'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CurrentWeatherData, HourlyData, DailyData } from '@/types/weather'
import type { HeadlineTone } from '@/contexts/SettingsContext'

const CACHE_KEY = 'atmos_ai_content'
const CACHE_TTL = 60 * 60 * 1000

export interface AiContent {
  headline: string
  hook?: string | null   // two-line mode: the setup line (plain), headline = payoff (gradient)
  advice: string
  proactiveInsight: string
  weekSummary: string
  outfit: string
  activity: string
  fetchedAt: number
}

export interface HeadlineOptions {
  headlineTone: HeadlineTone
  headlineTwoLine: boolean
  headlineLocationFlavor: boolean
  headlineTimeAware: boolean
  locationName?: string
  locationCountry?: string
}

function getCache(): AiContent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: AiContent = JSON.parse(raw)
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null
    return parsed
  } catch {
    return null
  }
}

function setCache(content: AiContent) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(content)) } catch {}
}

export function clearAiCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

export function useAiContent(
  current: CurrentWeatherData | null,
  hourly: HourlyData[] | null,
  daily: DailyData[] | null,
  options?: HeadlineOptions
) {
  const [content, setContent] = useState<AiContent | null>(null)
  const [loading, setLoading] = useState(false)
  const hasFetched = useRef(false)

  const fetchContent = useCallback(async (force = false) => {
    if (!current) return
    setLoading(true)
    hasFetched.current = true
    try {
      const res = await fetch('/api/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current, hourly, daily,
          localHour: new Date().getHours(),
          localMinute: new Date().getMinutes(),
          headlineTone: options?.headlineTone ?? 'casual',
          headlineTwoLine: options?.headlineTwoLine ?? false,
          headlineLocationFlavor: options?.headlineLocationFlavor ?? false,
          headlineTimeAware: options?.headlineTimeAware ?? false,
          locationName: options?.locationName,
          locationCountry: options?.locationCountry,
        }),
      })
      const data = await res.json()
      if (data.headline) {
        const newContent: AiContent = {
          headline: data.headline,
          hook: data.hook ?? null,
          advice: data.advice,
          proactiveInsight: data.proactiveInsight,
          weekSummary: data.weekSummary,
          outfit: data.outfit,
          activity: data.activity,
          fetchedAt: Date.now(),
        }
        setContent(newContent)
        setCache(newContent)
      }
    } catch {}
    setLoading(false)
  }, [current, hourly, daily, options?.headlineTone, options?.headlineTwoLine, options?.headlineLocationFlavor, options?.headlineTimeAware, options?.locationName, options?.locationCountry]) // eslint-disable-line

  useEffect(() => {
    if (!current || hasFetched.current) return
    const cached = getCache()
    if (cached) {
      setContent(cached)
      hasFetched.current = true
    } else {
      fetchContent()
    }
  }, [current, fetchContent])

  return { content, loading, refresh: () => fetchContent(true) }
}
