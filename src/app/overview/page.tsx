'use client'

import { useRouter } from 'next/navigation'
import { MapPin, Sparkles } from 'lucide-react'
import { BottomNav } from '@/components/layout/BottomNav'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeather } from '@/hooks/useWeather'
import { useLocation } from '@/hooks/useLocation'
import { useSettings } from '@/contexts/SettingsContext'
import { formatDay, displayTempShort } from '@/lib/utils'

export default function OverviewPage() {
  const router = useRouter()
  const { location } = useLocation()
  const { tempUnit } = useSettings()
  const { current, daily, loading, error } = useWeather(
    location?.lat ?? null,
    location?.lon ?? null
  )

  const featured = daily?.[1] ?? null
  const rest = daily?.slice(2) ?? []

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4"
        style={{ background: 'transparent' }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span
            className="font-headline font-extrabold tracking-tight text-2xl"
            style={{ color: 'var(--primary)' }}
          >
            Atmos
          </span>
        </div>
        <div />

      </header>

      <main className="pt-24 pb-32 px-6">
        <p className="font-label text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--primary)' }}>
          Atmospheric Narrative
        </p>
        <h1 className="font-headline text-5xl font-extrabold tracking-tighter mb-3 leading-none" style={{ color: 'var(--text)' }}>
          Weekly Outlook
        </h1>
        <p className="text-sm font-body mb-10 max-w-sm" style={{ color: 'var(--text-muted)' }}>
          An intelligent synthesis of the coming days.
          {featured ? ` Tomorrow brings ${featured.description}.` : ''}
        </p>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm text-center mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-56 rounded-[2rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-36 rounded-[1.5rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Featured Day (Tomorrow) */}
            {featured && (
              <section className="mb-8">
                <div
                  className="rounded-[2rem] p-7 relative overflow-hidden flex items-center gap-6"
                  style={{
                    background: 'var(--surface)',
                    border: '0.5px solid var(--outline)',
                  }}
                >
                  <div className="absolute -top-20 -right-20 w-56 h-56 blur-[80px] rounded-full pointer-events-none"
                    style={{ background: 'rgba(199,191,255,0.2)' }} />

                  <div className="relative z-10 flex-1">
                    <span
                      className="font-label text-[10px] px-3 py-1 rounded-full mb-4 inline-block uppercase tracking-widest"
                      style={{ background: 'rgba(199,191,255,0.1)', color: 'var(--primary)' }}
                    >
                      Tomorrow
                    </span>
                    <h2 className="font-headline text-3xl font-bold mb-2 capitalize" style={{ color: 'var(--text)' }}>
                      {featured.description}
                    </h2>
                    <p className="text-sm mb-5 font-label" style={{ color: 'var(--text-muted)' }}>
                      {featured.pop > 0 ? `${featured.pop}% chance of precipitation.` : 'Clear skies expected.'}
                    </p>
                    <div className="flex items-end gap-4">
                      <span className="font-headline text-6xl font-extrabold tracking-tighter" style={{ color: 'var(--text)' }}>
                        {displayTempShort(featured.tempMax, tempUnit)}
                      </span>
                      <div className="pb-1">
                        <span className="block font-label uppercase text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>Low</span>
                        <span className="font-headline text-2xl font-bold" style={{ color: 'var(--text-muted)' }}>
                          {displayTempShort(featured.tempMin, tempUnit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-28 h-28 flex items-center justify-center">
                      <WeatherIcon conditionCode={featured.conditionCode} iconCode={featured.icon} size={80} />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 7-Day Grid */}
            {rest.length > 0 && (
              <section className="grid grid-cols-2 gap-4 mb-10">
                {rest.map((day, i) => (
                  <div
                    key={day.dt}
                    className="rounded-[1.5rem] p-5 transition-colors"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <p className="font-label uppercase text-[10px] tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
                          {i === 0 ? 'Today' : formatDay(day.dt)}
                        </p>
                        <h3 className="font-headline text-lg font-bold" style={{ color: 'var(--text)' }}>
                          {new Date(day.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h3>
                      </div>
                      <WeatherIcon conditionCode={day.conditionCode} iconCode={day.icon} size={28} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-2xl font-bold" style={{ color: 'var(--text)' }}>
                        {displayTempShort(day.tempMax, tempUnit)}
                      </span>
                      <span className="font-label text-sm" style={{ color: 'var(--text-muted)' }}>
                        / {displayTempShort(day.tempMin, tempUnit)}
                      </span>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Proactive AI Card */}
            <section>
              <div
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{
                  background: 'var(--surface)',
                  border: '0.5px solid var(--outline)',
                }}
              >
                <div className="rounded-xl p-2.5" style={{ background: 'rgba(199,191,255,0.1)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-headline text-base font-bold mb-0.5" style={{ color: 'var(--text)' }}>Plan your week</h4>
                  <p className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>
                    Ask Atmos about the best days for outdoor activities.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-5 py-2 rounded-full font-label text-xs uppercase tracking-widest font-bold text-white active:scale-95 transition-transform flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #806EF8 0%, #5896FD 100%)' }}
                >
                  Ask
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
