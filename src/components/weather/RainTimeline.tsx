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

  // Scale bars using fixed px heights — % height doesn't work reliably in flex-col
  const MAX_BAR_PX = 44
  const maxPrecip = isRaining ? Math.max(0.1, ...data.map(d => d.precipitation)) : 1

  // Placeholder slots when no data yet
  const displaySlots = data.length > 0
    ? data
    : Array.from({ length: 4 }, () => ({ time: '', precipitation: 0 }))

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
          <p className="text-sm font-medium mb-4 text-[var(--text-muted)]">{rainMessage}</p>

          {/* Bar chart — bars are fixed px height, labels separate below */}
          <div className="flex items-end gap-2" style={{ height: `${MAX_BAR_PX + 4}px` }}>
            {displaySlots.map((slot, i) => {
              const barPx = isRaining
                ? Math.max(4, Math.round((slot.precipitation / maxPrecip) * MAX_BAR_PX))
                : 3
              return (
                <div key={i} className="flex-1 relative group">
                  <div
                    className="w-full rounded-t transition-all duration-500 ease-out"
                    style={{
                      height: `${barPx}px`,
                      background: slot.precipitation > 0
                        ? 'linear-gradient(to top, var(--primary), rgba(199,191,255,0.55))'
                        : 'rgba(199,191,255,0.18)',
                    }}
                  />
                  {slot.precipitation > 0 && (
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
                    >
                      {slot.precipitation.toFixed(1)}mm
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Baseline line */}
          <div className="h-[1px] mb-1.5" style={{ background: 'var(--outline)' }} />

          {/* Labels */}
          <div className="flex gap-2">
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
