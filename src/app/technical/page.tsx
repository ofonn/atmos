'use client'

import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useSettings } from '@/contexts/SettingsContext'
import { formatTime, displayWind, displayTempShort } from '@/lib/utils'
import { Droplets, Wind, Eye, Gauge, Thermometer, Sparkles } from 'lucide-react'

function getWindDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function getProactiveInsight(data: { humidity: number; windSpeed: number; visibility: number; pressure: number }) {
  const { humidity, windSpeed, visibility, pressure } = data
  if (pressure < 1005) {
    return 'A minor pressure drop suggests light precipitation might arrive soon. Optimal window for outdoor activities ends in a few hours.'
  }
  if (humidity > 75) {
    return 'High humidity levels may make the temperature feel warmer. Stay hydrated and wear breathable fabrics.'
  }
  if (windSpeed > 30) {
    return 'Strong winds expected. Secure loose outdoor items and be cautious when cycling or walking in open areas.'
  }
  if (visibility < 3) {
    return 'Reduced visibility today. Drive carefully and use appropriate lighting when outdoors.'
  }
  return 'Current atmospheric conditions are stable. A great window for outdoor activities throughout the day.'
}

export default function TechnicalPage() {
  const router = useRouter()
  const { location } = useLocation()
  const { windUnit, tempUnit } = useSettings()
  const { current, hourly, metrics, loading, error } = useWeather(
    location?.lat ?? null,
    location?.lon ?? null
  )

  const glassStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '0.5px solid var(--outline)',
  }

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

            {/* Proactive Insight Card */}
            <div className="rounded-[1.5rem] p-6 mb-8 relative overflow-hidden" style={glassStyle}>
              <div className="absolute -right-16 -top-16 w-56 h-56 blur-[80px] rounded-full pointer-events-none"
                style={{ background: 'rgba(199,191,255,0.2)' }} />
              <div className="relative z-10">
                <h3 className="text-lg font-bold font-headline mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  Proactive Insight
                </h3>
                <p className="text-sm font-body leading-relaxed max-w-sm" style={{ color: 'var(--text)' }}>
                  {getProactiveInsight({
                    humidity: current.humidity,
                    windSpeed: current.windSpeed,
                    visibility: metrics.visibility,
                    pressure: current.pressure,
                  })}
                </p>
              </div>
            </div>

            {/* Hourly Timeline */}
            {hourly && (
              <section>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold font-headline" style={{ color: 'var(--text)' }}>Hourly Timeline</h3>
                  <button className="font-label text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--primary)' }}>
                    Full Day
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {hourly.map((hour, i) => (
                    <div
                      key={hour.dt}
                      className="rounded-[2rem] p-4 flex flex-col items-center gap-3 min-w-[88px]"
                      style={{
                        ...glassStyle,
                        ...(i === 0 ? { borderColor: 'var(--primary)' } : {}),
                      }}
                    >
                      <span className="text-[0.7rem] font-label" style={{ color: 'var(--text-muted)' }}>
                        {i === 0 ? 'Now' : formatTime(hour.dt)}
                      </span>
                      <div className="w-10 h-10 flex items-center justify-center">
                        <WeatherIcon conditionCode={hour.conditionCode} iconCode={hour.icon} size={32} />
                      </div>
                      <span className="text-base font-bold font-headline" style={{ color: 'var(--text)' }}>{displayTempShort(hour.temp, tempUnit)}</span>
                    </div>
                  ))}
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
