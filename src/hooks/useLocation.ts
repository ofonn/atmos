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

/** Get approximate location from IP address */
async function getIpLocation(): Promise<Location | null> {
  try {
    const res = await fetch('/api/ip-location')
    if (!res.ok) return null
    const data = await res.json()
    if (data.lat && data.lon) {
      return { lat: data.lat, lon: data.lon, name: data.name, country: data.country }
    }
  } catch {}
  return null
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [savedLocations, setSavedLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = getCached()
    setSavedLocations(getSavedCached())

    // If we have a cached location, use it immediately
    if (cached) {
      setLocation(cached)
      setLoading(false)
      // Still try to refresh via geolocation in the background
      refreshFromGeolocation(false)
      return
    }

    // First-time visitor: no cache — use IP location as instant fallback,
    // then ask for precise geolocation in background
    initFirstVisit()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** For first-time visitors: get IP location immediately, then try geolocation */
  async function initFirstVisit() {
    // Step 1: Get approximate location from IP right away
    const ipLoc = await getIpLocation()
    if (ipLoc) {
      setLocation(ipLoc)
      setCache(ipLoc)
      setLoading(false)
    }

    // Step 2: Try browser geolocation — if user accepts, upgrade to precise location
    refreshFromGeolocation(!ipLoc)
  }

  /** Try to get precise location from browser geolocation */
  function refreshFromGeolocation(setLoadingOnFail: boolean) {
    if (!navigator.geolocation) {
      if (setLoadingOnFail) {
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
        // User denied — keep IP-based location (or show error if we have nothing)
        if (setLoadingOnFail) {
          setError('Location access denied')
          setLoading(false)
        }
      }
    )
  }

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
