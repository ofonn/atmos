'use client'

import { useEffect, useState } from 'react'
import { Shirt, Loader2 } from 'lucide-react'

interface Props {
  temp: number
  feelsLike: number
  conditionCode: number
  windSpeed: number
  humidity: number
  pop?: number
}

interface OutfitData {
  tldr: string
  items: string[]
  tip: string
}

export function OutfitCard(props: Props) {
  const [data, setData] = useState<OutfitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/outfit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(props),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(props.temp), props.conditionCode])

  return (
    <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Shirt className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          What to wear
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Thinking…</span>
        </div>
      )}
      {error && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Couldn&apos;t generate a recommendation.
        </p>
      )}
      {data && (
        <>
          <p className="text-base font-bold font-headline mb-3" style={{ color: 'var(--text)' }}>
            {data.tldr}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {data.items.map((item, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
              >
                {item}
              </span>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed pt-3 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--outline)' }}>
            {data.tip}
          </p>
        </>
      )}
    </div>
  )
}
