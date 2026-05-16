'use client'

import { Leaf } from 'lucide-react'

interface Pollen {
  alder: number | null
  birch: number | null
  grass: number | null
  mugwort: number | null
  olive: number | null
  ragweed: number | null
}

interface Props {
  pollen: Pollen | null | undefined
}

function level(value: number | null): { label: string; color: string; width: string } {
  if (value === null || value === undefined || isNaN(value)) {
    return { label: '—', color: 'var(--surface-mid)', width: '0%' }
  }
  if (value >= 50) return { label: 'Very High', color: '#ef4444', width: '95%' }
  if (value >= 20) return { label: 'High', color: '#f97316', width: '75%' }
  if (value >= 5) return { label: 'Moderate', color: '#eab308', width: '50%' }
  if (value > 0) return { label: 'Low', color: '#22c55e', width: '25%' }
  return { label: 'None', color: 'var(--surface-mid)', width: '0%' }
}

export function PollenCard({ pollen }: Props) {
  if (!pollen) return null

  const rows: { key: keyof Pollen; label: string }[] = [
    { key: 'grass', label: 'Grass' },
    { key: 'birch', label: 'Birch' },
    { key: 'alder', label: 'Alder' },
    { key: 'ragweed', label: 'Ragweed' },
    { key: 'olive', label: 'Olive' },
    { key: 'mugwort', label: 'Mugwort' },
  ]

  const hasAny = rows.some((r) => pollen[r.key] && (pollen[r.key] as number) > 0)
  if (!hasAny) return null

  return (
    <div className="px-5 py-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          Pollen
        </span>
      </div>
      <div className="space-y-2.5">
        {rows
          .filter((r) => pollen[r.key] !== null && pollen[r.key] !== undefined)
          .map((r) => {
            const v = pollen[r.key] as number
            const l = level(v)
            return (
              <div key={r.key} className="flex items-center gap-3">
                <span className="text-xs w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {r.label}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--surface-mid)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: l.width, background: l.color }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold font-label uppercase w-16 text-right flex-shrink-0"
                  style={{ color: l.color }}
                >
                  {l.label}
                </span>
              </div>
            )
          })}
      </div>
    </div>
  )
}
