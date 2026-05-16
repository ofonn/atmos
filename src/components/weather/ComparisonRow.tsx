'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface Props {
  lat: number
  lon: number
  todayMax: number
  todayMin: number
}

interface Historical {
  tempMax: number
  tempMin: number
  precipitation: number
}

export function ComparisonRow({ lat, lon, todayMax, todayMin }: Props) {
  const [data, setData] = useState<Historical | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/historical?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (!d.error) setData(d)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lat, lon])

  if (loading || !data) return null

  const dMax = todayMax - data.tempMax
  const dMin = todayMin - data.tempMin

  return (
    <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
      <p
        className="text-[11px] font-label uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        vs Yesterday
      </p>
      <div className="grid grid-cols-2 gap-4">
        <DeltaCell label="High" delta={dMax} reference={data.tempMax} />
        <DeltaCell label="Low" delta={dMin} reference={data.tempMin} />
      </div>
    </div>
  )
}

function DeltaCell({ label, delta, reference }: { label: string; delta: number; reference: number }) {
  const rounded = Math.round(delta * 10) / 10
  const abs = Math.abs(rounded)
  let icon = <Minus className="w-4 h-4" />
  let color = 'var(--text-muted)'
  if (rounded > 0.5) {
    icon = <ArrowUp className="w-4 h-4" />
    color = '#ef4444'
  } else if (rounded < -0.5) {
    icon = <ArrowDown className="w-4 h-4" />
    color = '#3b82f6'
  }
  return (
    <div>
      <p className="text-[10px] font-label uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="flex items-center" style={{ color }}>
          {icon}
        </span>
        <span className="text-2xl font-bold font-headline" style={{ color: 'var(--text)' }}>
          {abs.toFixed(1)}°
        </span>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          (was {Math.round(reference)}°)
        </span>
      </div>
    </div>
  )
}
