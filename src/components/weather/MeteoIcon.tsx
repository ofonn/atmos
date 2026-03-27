'use client'

import { useState } from 'react'
import { meteoconUrl } from '@/lib/meteocons'
import { wmoEmoji } from '@/lib/weatherUtils'

interface MeteoIconProps {
  conditionCode: number
  isDay: boolean
  /** Rendered width/height in px */
  size?: number
  className?: string
}

/**
 * Renders an animated 3D weather icon from Meteocons (Bas Milius).
 * Falls back to the WMO emoji if the image fails to load.
 */
export function MeteoIcon({ conditionCode, isDay, size = 64, className = '' }: MeteoIconProps) {
  const [failed, setFailed] = useState(false)
  const url = meteoconUrl(conditionCode, isDay)

  if (failed) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.6, lineHeight: 1 }}
        role="img"
        aria-label="weather icon"
      >
        {wmoEmoji(conditionCode, isDay ? 1 : 0)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      onError={() => setFailed(true)}
      aria-hidden="true"
      draggable={false}
    />
  )
}
