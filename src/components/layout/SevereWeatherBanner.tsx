'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

// Hash a string to a short stable id for the dismissal key.
function hashStr(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

const DISMISS_PREFIX = 'atmos_severe_dismissed_'
const REMEMBER_HOURS = 12

export function SevereWeatherBanner({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  const id = title ? hashStr(`${title}:${description ?? ''}`) : ''
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!id) return
    try {
      const ts = Number(localStorage.getItem(DISMISS_PREFIX + id) || '0')
      if (ts && Date.now() - ts < REMEMBER_HOURS * 3_600_000) {
        setDismissed(true)
      }
    } catch {}
  }, [id])

  if (!title || dismissed) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_PREFIX + id, String(Date.now())) } catch {}
    setDismissed(true)
  }

  return (
    <div
      className="w-full px-4 py-3 pb-4 mb-2 relative overflow-hidden flex items-start gap-3"
      style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)',
      }}
      role="alert"
    >
      <div
        className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 blur-2xl rounded-full"
        style={{ pointerEvents: 'none' }}
      />
      <div className="mt-0.5 rounded-full p-1 bg-white/20 flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 pr-8">
        <h3 className="font-headline font-bold text-sm text-white mb-0.5">{title}</h3>
        {description && (
          <p className="font-body text-xs text-white/90 leading-snug">{description}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss alert"
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}
