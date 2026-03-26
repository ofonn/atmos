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

  // Scale bars: if raining use actual values, if dry use a flat baseline visual
  const maxPrecip = isRaining ? Math.max(0.1, ...data.map(d => d.precipitation)) : 1

  // Placeholder slots when no data yet
  const displaySlots = data.length > 0
    ? data
    : [{ time: '', precipitation: 0 }, { time: '', precipitation: 0 }, { time: '', precipitation: 0 }, { time: '', precipitation: 0 }]

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
          <p className="text-sm font-medium mb-6 text-[var(--text-muted)]">{rainMessage}</p>

          <div className="relative h-16 flex items-end justify-between gap-2">
            {/* Horizontal baseline */}
            <div className="absolute bottom-6 left-0 right-0 h-[1px]" style={{ background: 'var(--outline)' }} />

            {displaySlots.map((slot, i) => {
              // When no rain: show a thin flat bar so the chart frame is always visible
              const heightPct = isRaining
                ? Math.min(100, Math.max(12, (slot.precipitation / maxPrecip) * 100))
                : 8

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 relative group">
                  <div
                    className="w-full rounded-t transition-all duration-500 ease-out"
                    style={{
                      height: `${heightPct}%`,
                      background: slot.precipitation > 0
                        ? 'linear-gradient(to top, var(--primary), rgba(199,191,255,0.5))'
                        : 'var(--surface-mid)',
                      opacity: slot.precipitation > 0 ? 0.9 : 0.5,
                    }}
                  />
                  <span className="text-[10px] font-label whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {i === 0 ? 'Now' : `+${i * 15}m`}
                  </span>

                  {/* Tooltip */}
                  {slot.precipitation > 0 && (
                    <div
                      className="absolute -top-8 text-[10px] font-bold px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--surface-mid)', color: 'var(--text)' }}
                    >
                      {slot.precipitation.toFixed(1)}mm
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
