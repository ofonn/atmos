'use client'

import { useState, useEffect } from 'react'
import { CloudRain } from 'lucide-react'

interface RainTimelineProps {
  lat: number
  lon: number
}

interface MinutelyData {
  time: string
  precipitation: number
}

export function RainTimeline({ lat, lon }: RainTimelineProps) {
  const [data, setData] = useState<MinutelyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMinutely() {
      try {
        setLoading(true)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation&forecast_days=2&timezone=auto`
        )
        const json = await res.json()
        
        if (json.minutely_15?.time && json.minutely_15?.precipitation) {
          const times: string[] = json.minutely_15.time
          const precip: number[] = json.minutely_15.precipitation
          
          // Find the current time index (we fetched 2 days just in case it crosses midnight)
          const now = new Date()
          // Open-Meteo timezone=auto matches local time of the coordinates.
          // It's safer to compare ISO strings loosely or parse.
          
          // Find the first time slot that is in the future or within the last 15 mins
          let startIndex = 0
          const nowTime = now.getTime()
          
          for (let i = 0; i < times.length; i++) {
            const slotTime = new Date(times[i]).getTime()
            if (slotTime + 15 * 60000 >= nowTime) {
              startIndex = i
              break
            }
          }
          
          // Grab the next 4 slots (60 mins)
          const next60 = []
          for (let i = startIndex; i < startIndex + 4 && i < times.length; i++) {
            next60.push({
              time: times[i],
              precipitation: precip[i]
            })
          }
          setData(next60)
        }
      } catch (e) {
        console.error('Failed to fetch minutely rain data', e)
      } finally {
        setLoading(false)
      }
    }
    fetchMinutely()
  }, [lat, lon])

  // Calculate intensity text and chart data
  const totalRain = data.reduce((acc, d) => acc + d.precipitation, 0)
  const isRaining = totalRain > 0

  let rainMessage = 'No precipitation expected in the next hour.'
  if (data.length === 0 && !loading) {
    rainMessage = 'No precipitation data available.'
  } else if (isRaining) {
    if (data[0]?.precipitation === 0) {
      const startIdx = data.findIndex(d => d.precipitation > 0)
      rainMessage = `Rain starting in about ${startIdx * 15} minutes.`
    } else {
      const stopIdx = data.findIndex(d => d.precipitation === 0)
      if (stopIdx === -1) {
        rainMessage = 'Rain continues for the next hour.'
      } else {
        rainMessage = `Rain expected to stop in about ${stopIdx * 15} minutes.`
      }
    }
  }

  // SVG line graph dimensions
  const W = 280
  const H = 56
  const maxPrecip = isRaining ? Math.max(0.1, ...data.map(d => d.precipitation)) : 0.1

  // Placeholder slots when no data yet
  const displaySlots = data.length > 0
    ? data
    : Array.from({ length: 4 }, () => ({ time: '', precipitation: 0 }))

  // Map data to SVG points — y is inverted (SVG 0 = top)
  const pts = displaySlots.map((slot, i) => ({
    x: (i / (displaySlots.length - 1)) * W,
    y: isRaining
      ? H - Math.max(6, (slot.precipitation / maxPrecip) * H)
      : H - 4,
    v: slot.precipitation,
  }))

  // Catmull-Rom → cubic bezier smooth path
  function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return ''
    let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
    const t = 0.38
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      const cp1x = p1.x + (p2.x - p0.x) * t / 3
      const cp1y = p1.y + (p2.y - p0.y) * t / 3
      const cp2x = p2.x - (p3.x - p1.x) * t / 3
      const cp2y = p2.y - (p3.y - p1.y) * t / 3
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
    }
    return d
  }

  const linePath = smoothPath(pts)
  const areaPath = linePath + ` L ${W},${H} L 0,${H} Z`
  const gradId = 'rainGrad'

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{ background: 'var(--surface-mid)' }}>
          <CloudRain className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h4 className="font-headline font-bold text-sm text-[var(--text)]">60-Min Precipitation</h4>
        </div>
      </div>

      {loading ? (
        <div className="h-20 rounded-lg animate-pulse" style={{ background: 'var(--surface-mid)' }} />
      ) : (
        <>
          <p className="text-sm font-medium mb-3 text-[var(--text-muted)]">{rainMessage}</p>

          {/* SVG freehand line graph */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            style={{ overflow: 'visible', display: 'block' }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(199,191,255,0.45)" />
                <stop offset="100%" stopColor="rgba(199,191,255,0.03)" />
              </linearGradient>
            </defs>

            {/* Baseline */}
            <line x1="0" y1={H} x2={W} y2={H} stroke="var(--outline)" strokeWidth="1" />

            {/* Area fill */}
            {isRaining && (
              <path d={areaPath} fill={`url(#${gradId})`} />
            )}

            {/* Flat baseline when no rain */}
            {!isRaining && (
              <line x1="0" y1={H - 4} x2={W} y2={H - 4} stroke="rgba(199,191,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
            )}

            {/* Line */}
            {isRaining && (
              <path
                d={linePath}
                fill="none"
                stroke="rgba(199,191,255,0.75)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points with value labels */}
            {pts.map((p, i) => (
              <g key={i}>
                {p.v > 0 && (
                  <>
                    <circle cx={p.x} cy={p.y} r="3" fill="var(--primary)" opacity="0.85" />
                    <text
                      x={p.x}
                      y={p.y - 7}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--text-muted)"
                      fontFamily="var(--font-inter, sans-serif)"
                    >
                      {p.v.toFixed(1)}
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>

          {/* Time labels */}
          <div className="flex mt-1">
            {displaySlots.map((_, i) => (
              <span key={i} className="flex-1 text-center text-[10px] font-label" style={{ color: 'var(--text-muted)' }}>
                {i === 0 ? 'Now' : `+${i * 15}m`}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
