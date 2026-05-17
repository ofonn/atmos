'use client'

import { useEffect, useRef, useState } from 'react'
import { useSettings } from '@/contexts/SettingsContext'

/**
 * Map a WMO weather code + is-day flag to a background video clip.
 * Drop the files in `public/videos/` — paths must match exactly.
 *
 * Recommended sources for stock loops: pexels.com/videos,
 * pixabay.com/videos, coverr.co. Look for portrait-orientation,
 * 5-15s clips that loop cleanly. Aim for ~1-3 MB each at 720p.
 */
export function videoForCondition(
  conditionCode: number | undefined,
  isDay: boolean,
  quality: 'low' | 'hd',
): string | null {
  if (conditionCode === undefined || conditionCode === null) return null
  const q = quality === 'low' ? '-low' : ''
  // Clear / mainly clear
  if (conditionCode === 0) return `/videos/clear-${isDay ? 'day' : 'night'}${q}.mp4`
  if (conditionCode === 1 || conditionCode === 2)
    return `/videos/partly-cloudy-${isDay ? 'day' : 'night'}${q}.mp4`
  // Overcast
  if (conditionCode === 3) return `/videos/cloudy${q}.mp4`
  // Fog
  if (conditionCode === 45 || conditionCode === 48) return `/videos/fog${q}.mp4`
  // Drizzle / light rain
  if (conditionCode >= 51 && conditionCode <= 57) return `/videos/drizzle${q}.mp4`
  // Rain
  if (conditionCode >= 61 && conditionCode <= 67) return `/videos/rain${q}.mp4`
  // Snow
  if (conditionCode >= 71 && conditionCode <= 77) return `/videos/snow${q}.mp4`
  // Showers
  if (conditionCode >= 80 && conditionCode <= 82) return `/videos/showers${q}.mp4`
  // Snow showers
  if (conditionCode === 85 || conditionCode === 86) return `/videos/snow-showers${q}.mp4`
  // Thunderstorm
  if (conditionCode >= 95 && conditionCode <= 99) return `/videos/thunder${q}.mp4`
  return null
}

interface Props {
  conditionCode: number | undefined
  isDay: boolean
  /** Forces off — useful for low-power overrides outside settings. */
  forceOff?: boolean
}

export function WeatherVideoBackground({ conditionCode, isDay, forceOff }: Props) {
  const { videoBackground, videoBackgroundQuality } = useSettings()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [availability, setAvailability] = useState<Record<string, boolean>>({})

  const effectiveQuality = useEffectiveQuality(videoBackgroundQuality)
  const src = videoForCondition(conditionCode, isDay, effectiveQuality)

  // Pause when tab hidden to save battery.
  useEffect(() => {
    const onVis = () => {
      const v = videoRef.current
      if (!v) return
      if (document.hidden) v.pause()
      else v.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Probe HEAD to avoid 404 noise / black flash when a clip is missing.
  useEffect(() => {
    if (!src) return
    if (src in availability) return
    let cancelled = false
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        if (cancelled) return
        setAvailability((m) => ({ ...m, [src]: r.ok }))
      })
      .catch(() => {
        if (cancelled) return
        setAvailability((m) => ({ ...m, [src]: false }))
      })
    return () => {
      cancelled = true
    }
  }, [src, availability])

  if (forceOff || videoBackground !== 'on') return null
  if (!src || availability[src] === false) return null

  return (
    <video
      ref={videoRef}
      key={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="fixed inset-0 w-full h-full object-cover pointer-events-none -z-10"
      style={{ opacity: 0.55 }}
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}

/** Adapt to network + battery when quality='auto'. Returns 'low' or 'hd'. */
function useEffectiveQuality(pref: 'auto' | 'low' | 'hd'): 'low' | 'hd' {
  const [q, setQ] = useState<'low' | 'hd'>(pref === 'auto' ? 'hd' : pref)

  useEffect(() => {
    if (pref !== 'auto') {
      setQ(pref)
      return
    }
    const conn = (navigator as any).connection
    const slow =
      conn?.saveData === true ||
      ['slow-2g', '2g', '3g'].includes(conn?.effectiveType)
    setQ(slow ? 'low' : 'hd')

    if (conn && 'addEventListener' in conn) {
      const onChange = () => {
        const isSlow =
          conn.saveData === true ||
          ['slow-2g', '2g', '3g'].includes(conn.effectiveType)
        setQ(isSlow ? 'low' : 'hd')
      }
      conn.addEventListener('change', onChange)
      return () => conn.removeEventListener('change', onChange)
    }
  }, [pref])

  return q
}
