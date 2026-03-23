'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Location } from '@/types/weather'

const CACHE_KEY = 'atmos_location'

function getCached(): Location | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setCache(loc: Location) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(loc))
  } catch {}
}

export function useLocation() {
  // Start with null to match server render, then hydrate from localStorage
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Immediately use cached location
    const cached = getCached()
    if (cached) {
      setLocation(cached)
      setLoading(false)
    }

    // Always try to refresh location in the background
    if (!navigator.geolocation) {
      if (!cached) {
        setError('Geolocation is not supported')
        setLoading(false)
      }
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const reverseRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
          const weatherData = await reverseRes.json()
          const loc: Location = {
            lat: latitude,
            lon: longitude,
            name: weatherData.name || 'Unknown',
            country: weatherData.sys?.country || '',
          }
          setCache(loc)
          setLocation(loc)
        } catch {
          // Only set fallback if we don't already have a cached location
          if (!cached) {
            const loc: Location = { lat: latitude, lon: longitude, name: 'Current Location', country: '' }
            setCache(loc)
            setLocation(loc)
          }
        }
        setLoading(false)
      },
      () => {
        // Geolocation denied — use cache if available, otherwise show error
        if (!cached) {
          setError('Location access denied')
        }
        setLoading(false)
      }
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const searchCity = useCallback(async (city: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(city)}`)
      const data = await res.json()
      if (data.length > 0) {
        const loc: Location = {
          lat: data[0].lat,
          lon: data[0].lon,
          name: data[0].name,
          country: data[0].country,
        }
        setCache(loc)
        setLocation(loc)
      } else {
        setError('City not found')
      }
    } catch {
      setError('Failed to search city')
    }
    setLoading(false)
  }, [])

  const syncLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const reverseRes = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
          const weatherData = await reverseRes.json()
          const loc: Location = {
            lat: latitude,
            lon: longitude,
            name: weatherData.name || 'Unknown',
            country: weatherData.sys?.country || '',
          }
          setCache(loc)
          setLocation(loc)
        } catch {
          const loc: Location = { lat: latitude, lon: longitude, name: 'Current Location', country: '' }
          setCache(loc)
          setLocation(loc)
        }
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [])

  return { location, loading, error, searchCity, syncLocation }
}
