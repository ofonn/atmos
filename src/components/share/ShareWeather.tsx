'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface Props {
  cityName: string
  temp: number
  feelsLike: number
  description: string
  tempMin: number
  tempMax: number
  unit: 'C' | 'F'
}

export function ShareWeather({ cityName, temp, feelsLike, description, tempMin, tempMax, unit }: Props) {
  const [copied, setCopied] = useState(false)

  const text =
    `Atmos — ${cityName}\n` +
    `${Math.round(temp)}°${unit} · ${description}\n` +
    `Feels like ${Math.round(feelsLike)}°${unit} · High ${Math.round(tempMax)}° / Low ${Math.round(tempMin)}°`

  const handle = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Atmos', text })
        return
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:scale-95"
      style={{ background: 'var(--surface)', color: 'var(--text)', border: '0.5px solid var(--outline)' }}
      aria-label="Share weather"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
