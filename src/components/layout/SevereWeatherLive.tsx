'use client'

import { useEffect, useState } from 'react'
import { SevereWeatherBanner } from './SevereWeatherBanner'

interface Warning {
  id: string
  title: string
  description: string
  severity: 'info' | 'warn' | 'severe'
}

/**
 * Client-side live wrapper that calls `/api/warnings` for the given
 * coords and renders the first active alert (if any) via the
 * existing `SevereWeatherBanner`. Per-event dismissal is handled by
 * the banner itself (12-hour localStorage key).
 */
export function SevereWeatherLive({ lat, lon }: { lat: number; lon: number }) {
  const [warning, setWarning] = useState<Warning | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/warnings?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (Array.isArray(d.warnings) && d.warnings.length > 0) {
          setWarning(d.warnings[0])
        } else {
          setWarning(null)
        }
      })
      .catch(() => {
        if (!cancelled) setWarning(null)
      })
    return () => {
      cancelled = true
    }
  }, [lat, lon])

  if (!warning) return null
  return <SevereWeatherBanner title={warning.title} description={warning.description} />
}
