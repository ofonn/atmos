'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useAiContent } from '@/hooks/useAiContent'
import { useSettings } from '@/contexts/SettingsContext'
import { formatTime, displayWind, displayTempShort } from '@/lib/utils'
import { Droplets, Wind, Eye, Gauge, Thermometer, Sparkles } from 'lucide-react'

function getWindDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function getHourlySummary(hour: { conditionCode: number; temp: number; pop: number; description: string }): string {
  const { conditionCode, temp, pop, description } = hour
  const parts: string[] = []

  if (conditionCode >= 200 && conditionCode < 300) {
    parts.push('Thunderstorm')
    parts.push('Stay indoors')
  } else if (conditionCode >= 300 && conditionCode < 400) {
    parts.push('Light drizzle')
    parts.push('Jacket advised')
  } else if (conditionCode >= 500 && conditionCode < 600) {
    if (pop > 70) parts.push('Heavy rain expected')
    else parts.push('Rain likely')
    parts.push('Grab an umbrella')
  } else if (conditionCode >= 600 && conditionCode < 700) {
    parts.push('Snow')
    parts.push('Roads may be slippery')
  } else if (conditionCode >= 700 && conditionCode < 800) {
    parts.push('Foggy')
    parts.push('Low visibility')
  } else if (conditionCode === 800) {
    if (temp >= 35) { parts.push('Blazing sun'); parts.push('Stay hydrated') }
    else if (temp >= 28) { parts.push('Sunny & hot'); parts.push('Good for outdoor') }
    else if (temp >= 20) { parts.push('Clear skies'); parts.push('Great conditions') }
    else { parts.push('Clear but cool'); parts.push('Bring a layer') }
  } else if (conditionCode === 801 || conditionCode === 802) {
    parts.push('Partly cloudy')
    if (temp >= 25) parts.push('Warm & pleasant')
    else parts.push('Mild conditions')
  } else {
    parts.push('Overcast')
    if (pop > 40) parts.push(`${pop}% rain chance`)
    else parts.push('No rain expected')
  }

  if (pop > 50 && conditionCode < 500) {
    parts.push(`${pop}% rain chance`)
  }

  return parts.join(' · ')
}

export default function TechnicalPage() {
  const [showFullDay, setShowFullDay] = useState(false)
  const { location } = useLocation()
  const { windUnit, tempUnit } = useSettings()
  const { current, hourly, daily, metrics, loading, error } = useWeather(
    location?.lat ?? null,
    location?.lon ?? null
  )
  const { content: aiContent } = useAiContent(current, hourly, daily)

  const glassStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '0.5px solid var(--outline)',
  }

  const displayedHours = showFullDay ? hourly : hourly?.slice(0, 4)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'transparent' }}>
        <h1 className="text-2xl font-bold tracking-tighter font-headline" style={{ color: 'var(--primary)' }}>Atmos</h1>
        <div />
      </header>

      <main className="pt-24 px-6 pb-32">
        <header className="mb-8">
          <h2
            className="text-[3rem] font-extrabold font-headline leading-none tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Technical<br />Details
          </h2>
          <p className="font-label tracking-widest uppercase text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
            Live Atmospheric Precision
          </p>
        </header>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm text-center mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-44 rounded-[1.5rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
              ))}
            </div>
            <div className="h-36 rounded-[1.5rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
            <div className="h-40 rounded-[1.5rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
          </div>
        ) : current && metrics ? (
          <>
            {/* 2x2 Bento Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Humidity */}
              <div className="rounded-[1.5rem] p-5 flex flex-col justify-between h-44" style={glassStyle}>
                <div className="flex justify-between items-start">
                  <Droplets className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  <span className="text-[0.6rem] font-label uppercase tracking-tight" style={{ color: 'var(--text-muted)' }}>Relative</span>
                </div>
                <div>
                  <div className="text-[1.75rem] font-headline font-bold leading-none mb-1" style={{ color: 'var(--text)' }}>
                    {current.humidity}%
                  </div>
                  <div className="text-[0.8rem]" style={{ color: 'var(--text-muted)' }}>
                    {current.humidity < 40 ? 'Dry conditions.' : current.humidity < 65 ? 'Optimal humidity for comfort.' : 'High moisture levels.'}
                  </div>
                </div>
              </div>

              {/* Pressure */}
              <div className="rounded-[1.5rem] p-5 flex flex-col justify-between h-44" style={glassStyle}>
                <div className="flex justify-between items-start">
                  <Thermometer className="w-5 h-5" style={{ color: 'var(--secondary)' }} />
                  <span className="text-[0.6rem] font-label uppercase tracking-tight" style={{ color: 'var(--text-muted)' }}>Pressure</span>
                </div>
                <div>
                  <div className="text-[1.75rem] font-headline font-bold leading-none mb-1" style={{ color: 'var(--text)' }}>
                    {current.pressure} <span className="text-base font-normal">hPa</span>
                  </div>
                  <div className="text-[0.8rem]" style={{ color: 'var(--text-muted)' }}>
                    {current.pressure > 1013 ? 'High pressure system.' : current.pressure > 1000 ? 'Normal conditions.' : 'Low pressure — change ahead.'}
                  </div>
                </div>
              </div>

              {/* Wind */}
              <div className="rounded-[1.5rem] p-5 flex flex-col justify-between h-44" style={glassStyle}>
                <div className="flex justify-between items-start">
                  <Wind className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  <span className="text-[0.6rem] font-label uppercase tracking-tight" style={{ color: 'var(--text-muted)' }}>Vector</span>
                </div>
                <div>
                  <div className="text-[1.75rem] font-headline font-bold leading-none mb-1" style={{ color: 'var(--text)' }}>
                    {displayWind(current.windSpeed, windUnit).split(' ')[0]}{' '}
                    <span className="text-base font-normal">{windUnit === 'mph' ? 'mph' : 'km/h'}</span>
                  </div>
                  <div className="text-[0.8rem]" style={{ color: 'var(--text-muted)' }}>
                    From {getWindDirection(current.windDeg)}.
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="rounded-[1.5rem] p-5 flex flex-col justify-between h-44" style={glassStyle}>
                <div className="flex justify-between items-start">
                  <Eye className="w-5 h-5" style={{ color: 'var(--secondary)' }} />
                  <span className="text-[0.6rem] font-label uppercase tracking-tight" style={{ color: 'var(--text-muted)' }}>Range</span>
                </div>
                <div>
                  <div className="text-[1.75rem] font-headline font-bold leading-none mb-1" style={{ color: 'var(--text)' }}>
                    {metrics.visibility} <span className="text-base font-normal">km</span>
                  </div>
                  <div className="text-[0.8rem]" style={{ color: 'var(--text-muted)' }}>
                    {metrics.visibility >= 10 ? 'Excellent clarity today.' : metrics.visibility >= 5 ? 'Good visibility.' : 'Reduced visibility.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Proactive Insight Card — uses AI content if available */}
            <div className="rounded-[1.5rem] p-6 mb-8 relative overflow-hidden" style={glassStyle}>
              <div className="absolute -right-16 -top-16 w-56 h-56 blur-[80px] rounded-full pointer-events-none"
                style={{ background: 'rgba(199,191,255,0.2)' }} />
              <div className="relative z-10">
                <h3 className="text-lg font-bold font-headline mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  Proactive Insight
                </h3>
                <p className="text-sm font-body leading-relaxed max-w-sm" style={{ color: 'var(--text)' }}>
                  {aiContent?.proactiveInsight ?? (
                    current.humidity > 75
                      ? 'High moisture levels may make the temperature feel warmer. Stay hydrated and wear breathable fabrics.'
                      : current.windSpeed > 30
                        ? 'Strong winds expected. Secure loose outdoor items and be cautious when cycling or walking.'
                        : metrics.visibility < 3
                          ? 'Reduced visibility today. Drive carefully and use appropriate lighting when outdoors.'
                          : 'Current atmospheric conditions are stable. A great window for outdoor activities throughout the day.'
                  )}
                </p>
              </div>
            </div>

            {/* Hourly Timeline — vertical cards */}
            {hourly && (
              <section>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold font-headline" style={{ color: 'var(--text)' }}>Hourly Timeline</h3>
                  <button
                    onClick={() => setShowFullDay(v => !v)}
                    className="font-label text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--primary)' }}
                  >
                    {showFullDay ? 'Show Less' : 'Full Day'}
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {displayedHours?.map((hour, i) => {
                    const summary = getHourlySummary(hour)
                    const isNow = i === 0
                    const isRainy = hour.conditionCode >= 300 && hour.conditionCode < 700
                    const isAlert = hour.pop > 60

                    return (
                      <div
                        key={hour.dt}
                        className="rounded-2xl p-4 flex items-center gap-4"
                        style={{
                          ...glassStyle,
                          ...(isNow ? { borderColor: 'var(--primary)', borderWidth: '1px' } : {}),
                          ...(isAlert && isRainy ? { background: 'rgba(96,165,250,0.08)' } : {}),
                        }}
                      >
                        {/* Time */}
                        <div className="flex flex-col items-center min-w-[48px]">
                          <span
                            className="text-[0.7rem] font-label font-bold uppercase tracking-wider"
                            style={{ color: isNow ? 'var(--primary)' : 'var(--text-muted)' }}
                          >
                            {isNow ? 'Now' : formatTime(hour.dt)}
                          </span>
                        </div>

                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <WeatherIcon conditionCode={hour.conditionCode} iconCode={hour.icon} size={28} />
                        </div>

                        {/* Temp + Summary */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-base font-bold font-headline" style={{ color: 'var(--text)' }}>
                              {displayTempShort(hour.temp, tempUnit)}
                            </span>
                            {hour.pop > 0 && (
                              <span className="text-[0.65rem] font-label" style={{ color: isAlert ? '#60a5fa' : 'var(--text-muted)' }}>
                                {hour.pop}% rain
                              </span>
                            )}
                          </div>
                          <p className="text-[0.75rem] font-body leading-snug truncate" style={{ color: 'var(--text-muted)' }}>
                            {summary}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-center">
            <Gauge className="w-10 h-10 mb-4" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>
              Allow location access to see technical details.
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
