'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CurrentWeatherData, HourlyData, DailyData } from '@/types/weather'

const CACHE_KEY = 'atmos_ai_content'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in ms

export interface AiContent {
  headline: string
  advice: string
  proactiveInsight: string
  weekSummary: string
  outfit: string
  activity: string
  fetchedAt: number
}

function getCache(): AiContent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: AiContent = JSON.parse(raw)
    const age = Date.now() - parsed.fetchedAt
    if (age > CACHE_TTL) return null // expired
    return parsed
  } catch {
    return null
  }
}

function setCache(content: AiContent) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(content))
  } catch {}
}

export function useAiContent(
  current: CurrentWeatherData | null,
  hourly: HourlyData[] | null,
  daily: DailyData[] | null
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
        body: JSON.stringify({ current, hourly, daily }),
      })
      const data = await res.json()
      if (data.headline) {
        const newContent: AiContent = {
          headline: data.headline,
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
  }, [current, hourly, daily])

  // On mount or when weather data arrives: use cache if fresh, otherwise fetch
  useEffect(() => {
    if (!current || hasFetched.current) return

    const cached = getCache()
    if (cached) {
      // Cache is fresh — use it immediately, no API call
      setContent(cached)
      hasFetched.current = true
    } else {
      // Cache expired or empty — fetch fresh AI content
      fetchContent()
    }
  }, [current, fetchContent])

  return { content, loading, refresh: () => fetchContent(true) }
}
