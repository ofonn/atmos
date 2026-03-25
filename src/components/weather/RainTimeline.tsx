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

  if (loading) {
    return (
      <div className="w-full h-32 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
    )
  }

  if (data.length === 0) return null

  // Calculate intensity text
  const totalRain = data.reduce((acc, d) => acc + d.precipitation, 0)
  const isRaining = totalRain > 0
  
  let rainMessage = 'No precipitation expected in the next hour.'
  if (isRaining) {
    if (data[0].precipitation === 0) {
      // Starts later
      const startIdx = data.findIndex(d => d.precipitation > 0)
      rainMessage = `Expect rain starting in about ${startIdx * 15} minutes.`
    } else {
      // Raining now
      const stopIdx = data.findIndex(d => d.precipitation === 0)
      if (stopIdx === -1) {
        rainMessage = 'Rain continues for the next hour.'
      } else {
        rainMessage = `Rain expected to stop in about ${stopIdx * 15} minutes.`
      }
    }
  }

  // Max precip in the 60 min to scale the bars (let's say 10mm is 100% height, but scale up if less)
  const maxPrecip = Math.max(0.5, ...data.map(d => d.precipitation))

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
      
      <p className="text-sm font-medium mb-6 text-[var(--text-muted)]">{rainMessage}</p>
      
      <div className="relative h-16 flex items-end justify-between gap-1">
        {/* Horizontal baseline */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'var(--outline)' }} />
        
        {data.map((slot, i) => {
          const heightPct = Math.min(100, Math.max(5, (slot.precipitation / maxPrecip) * 100))
          // Format time as HH:MM
          const date = new Date(slot.time)
          const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 relative z-10 group">
              <div 
                className="w-full rounded-t-sm transition-all duration-500 ease-out"
                style={{
                  height: `${heightPct}%`,
                  background: slot.precipitation > 0 ? 'var(--primary)' : 'var(--surface-mid)',
                  opacity: slot.precipitation > 0 ? 0.8 : 0.3
                }}
              />
              <span className="text-[10px] font-label text-[var(--text-muted)] whitespace-nowrap">
                {i === 0 ? 'Now' : `+${i * 15}m`}
              </span>
              
              {/* Tooltip */}
              {slot.precipitation > 0 && (
                <div className="absolute -top-8 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {slot.precipitation.toFixed(1)}mm
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
