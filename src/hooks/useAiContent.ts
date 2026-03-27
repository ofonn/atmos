'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CurrentWeatherData, HourlyData, DailyData } from '@/types/weather'
import type { HeadlineTone } from '@/contexts/SettingsContext'

const CACHE_KEY = 'atmos_ai_content'
const CACHE_TTL = 60 * 60 * 1000
const CACHE_SCHEMA_VERSION = 2

export interface AiContent {
  headline: string
  hook?: string | null   // two-line mode: the setup line (plain), headline = payoff (gradient)
  toneUsed?: string | null
  advice: string
  proactiveInsight: string
  weekSummary: string
  outfit: string
  activity: string
  fetchedAt: number
  cacheKey?: string
  schemaVersion?: number
}

export interface HeadlineOptions {
  headlineTone: HeadlineTone
  headlineTwoLine: boolean
  headlineLocationFlavor: boolean
  headlineTimeAware: boolean
  locationName?: string
  locationCountry?: string
}

function buildRequestCacheKey(
  current: CurrentWeatherData | null,
  hourly: HourlyData[] | null,
  daily: DailyData[] | null,
  options?: HeadlineOptions
) {
  return JSON.stringify({
    tone: options?.headlineTone ?? 'casual',
    twoLine: options?.headlineTwoLine ?? false,
    locationFlavor: options?.headlineLocationFlavor ?? false,
    timeAware: options?.headlineTimeAware ?? false,
    locationName: options?.locationName ?? '',
    locationCountry: options?.locationCountry ?? '',
    temp: current?.temp ?? null,
    feelsLike: current?.feelsLike ?? null,
    code: current?.conditionCode ?? null,
    nowHour: hourly?.[0]?.dt ?? null,
    today: daily?.[0]?.dt ?? null,
  })
}

function getCache(expectedKey?: string): AiContent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: AiContent = JSON.parse(raw)
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null
    if (expectedKey && (parsed.schemaVersion !== CACHE_SCHEMA_VERSION || parsed.cacheKey !== expectedKey)) return null
    return parsed
  } catch {
    return null
  }
}

function setCache(content: AiContent, cacheKey: string) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...content, cacheKey, schemaVersion: CACHE_SCHEMA_VERSION })
    )
  } catch {}
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
  const lastRequestKey = useRef<string | null>(null)
  const requestCacheKey = buildRequestCacheKey(current, hourly, daily, options)

  const fetchContent = useCallback(async (force = false) => {
    if (!current) return
    setLoading(true)
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
          toneUsed: data.toneUsed ?? null,
          advice: data.advice,
          proactiveInsight: data.proactiveInsight,
          weekSummary: data.weekSummary,
          outfit: data.outfit,
          activity: data.activity,
          fetchedAt: Date.now(),
          cacheKey: requestCacheKey,
          schemaVersion: CACHE_SCHEMA_VERSION,
        }
        setContent(newContent)
        setCache(newContent, requestCacheKey)
      }
    } catch {}
    setLoading(false)
  }, [current, hourly, daily, options?.headlineTone, options?.headlineTwoLine, options?.headlineLocationFlavor, options?.headlineTimeAware, options?.locationName, options?.locationCountry, requestCacheKey]) // eslint-disable-line

  useEffect(() => {
    if (!current) {
      const cached = getCache()
      if (cached) setContent(cached)
      return
    }

    if (lastRequestKey.current === requestCacheKey) return
    lastRequestKey.current = requestCacheKey

    const cached = getCache(requestCacheKey)
    if (cached) {
      setContent(cached)
      return
    }

    fetchContent(true)
  }, [current, fetchContent, requestCacheKey])

  return { content, loading, refresh: () => fetchContent(true) }
}
