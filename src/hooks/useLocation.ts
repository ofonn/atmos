'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Location } from '@/types/weather'

const CACHE_KEY = 'atmos_location'
const SAVED_KEY = 'atmos_saved_locations'

function getCached(): Location | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getSavedCached(): Location[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCache(loc: Location) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(loc)) } catch {}
}

function setSavedCache(locs: Location[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(locs)) } catch {}
}

/** Reverse geocode coords to city name via /api/geocode */
async function reverseGeocode(lat: number, lon: number): Promise<Location> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`)
    const data = await res.json()
    if (data.length > 0) {
      return { lat, lon, name: data[0].name, country: data[0].country }
    }
  } catch {}
  return { lat, lon, name: 'Current Location', country: '' }
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [savedLocations, setSavedLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = getCached()
    if (cached) {
      setLocation(cached)
      setLoading(false)
    }

    setSavedLocations(getSavedCached())

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
        const loc = await reverseGeocode(latitude, longitude)
        setCache(loc)
        setLocation(loc)
        setLoading(false)
      },
      () => {
        if (!cached) setError('Location access denied')
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
        setSavedLocations(prev => {
          if (prev.some(p => p.lat === loc.lat && p.lon === loc.lon)) return prev
          const next = [...prev, loc]
          setSavedCache(next)
          return next
        })
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
        const loc = await reverseGeocode(latitude, longitude)
        setCache(loc)
        setLocation(loc)
        setSavedLocations(prev => {
          if (prev.some(p => p.lat === loc.lat && p.lon === loc.lon)) return prev
          const next = [...prev, loc]
          setSavedCache(next)
          return next
        })
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [])

  const saveLocation = useCallback((loc: Location) => {
    setSavedLocations(prev => {
      if (prev.some(p => p.lat === loc.lat && p.lon === loc.lon)) return prev
      const next = [...prev, loc]
      setSavedCache(next)
      return next
    })
  }, [])

  const removeLocation = useCallback((loc: Location) => {
    setSavedLocations(prev => {
      const next = prev.filter(p => p.lat !== loc.lat || p.lon !== loc.lon)
      setSavedCache(next)
      return next
    })
  }, [])

  const setAsCurrentLocation = useCallback((loc: Location) => {
    setCache(loc)
    setLocation(loc)
  }, [])

  return { location, savedLocations, loading, error, searchCity, syncLocation, saveLocation, removeLocation, setAsCurrentLocation }
}
