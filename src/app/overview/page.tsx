'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Sparkles, ChevronDown, Sun, Info } from 'lucide-react'
import useSWR from 'swr'
import { BottomNav } from '@/components/layout/BottomNav'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useSettings } from '@/contexts/SettingsContext'
import { formatDay, displayTempShort, displayTemp } from '@/lib/utils'
import {
  wmoDesc, wmoEmoji, getWindDir16, secsToHm, uviColor, uviLabel,
  fmtISOTime, fmtISODate, displayCelsius,
} from '@/lib/weatherUtils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ── Shared sub-components ────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: open ? '0.5px solid var(--outline)' : 'none' }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-headline font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>{title}</span>
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : '' }}
          aria-hidden="true"
        />
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  )
}

function DataRow({ label, value, unit, tooltip }: {
  label: string; value: React.ReactNode; unit?: string; tooltip?: string
}) {
  const [tip, setTip] = useState(false)
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '0.5px solid var(--outline)' }}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-label" style={{ color: 'var(--text-muted)' }}>{label}</span>
        {tooltip && (
          <div className="relative">
            <button
              onClick={() => setTip(v => !v)}
              aria-label={`Info: ${label}`}
              aria-expanded={tip}
              className="opacity-40 hover:opacity-80 transition-opacity"
            >
              <Info className="w-3 h-3" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            </button>
            {tip && (
              <div
                className="absolute left-0 bottom-6 z-50 w-56 text-xs leading-snug rounded-xl p-3 shadow-xl"
                style={{ background: 'var(--surface-mid)', color: 'var(--text-muted)', border: '0.5px solid var(--outline)' }}
                role="tooltip"
              >
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <span className="text-xs font-bold font-headline text-right max-w-[60%]" style={{ color: 'var(--text)' }}>
        {value}{unit ? <span className="font-normal opacity-60 ml-0.5">{unit}</span> : null}
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const router = useRouter()
  const { location, current, daily, loading, error } = useWeatherContext()
  const { tempUnit } = useSettings()

  const { data: meteo } = useSWR(
    location ? `/api/openmeteo?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )

  const md = meteo?.daily

  const today = daily?.[0] ?? null     // Today
  const featured = daily?.[1] ?? null  // Tomorrow
  const rest = daily?.slice(2) ?? []   // Day after tomorrow onward
  const listDays = [today, ...rest].filter(Boolean) as any[]

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header className="sticky top-0 z-30 flex justify-between items-center px-6 py-4 backdrop-blur-xl w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <span className="font-headline font-extrabold tracking-tight text-2xl" style={{ color: 'var(--primary)' }}>
            Atmos
          </span>
        </div>
      </header>

      <main className="relative z-10 pb-32 px-4 w-full max-w-4xl mx-auto">
        <div className="px-2 mb-6 mt-2">
          <p className="font-label text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            {today ? `${new Date(today.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}` : 'Updating…'}
          </p>
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter mb-3 leading-none" style={{ color: 'var(--text)' }}>
            Weekly<br />Outlook
          </h1>
          <p className="text-sm font-body mb-6 max-w-sm" style={{ color: 'var(--text-muted)' }}>
            An intelligent synthesis of the coming days.
            {featured ? ` Tomorrow brings ${featured.description}.` : ''}
          </p>
        </div>

        {error && (
          <div className="mx-2 p-3 bg-red-500/10 text-red-400 rounded-xl text-sm text-center mb-6">{error}</div>
        )}

        {loading ? (
          <div className="px-2 space-y-4">
            <div className="h-56 rounded-[2rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-36 rounded-[1.5rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start">
            <div className="flex flex-col gap-0 md:sticky md:top-24">
            {/* Featured Day — Tomorrow */}
            {featured && (
              <section className="px-2 mb-6">
                <div
                  className="rounded-[2rem] p-5 relative overflow-hidden flex items-center gap-4"
                  style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
                >
                  <div
                    className="absolute -top-20 -right-20 w-56 h-56 blur-[80px] rounded-full pointer-events-none"
                    style={{ background: 'rgba(199,191,255,0.2)' }}
                  />
                  <div className="relative z-10 flex-1">
                    <span
                      className="font-label text-[11px] px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-widest"
                      style={{ background: 'rgba(199,191,255,0.1)', color: 'var(--primary)' }}
                    >
                      Tomorrow • {featured.date ? new Date(featured.date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''}
                    </span>
                    <h2 className="font-headline text-2xl font-bold mb-2 capitalize" style={{ color: 'var(--text)' }}>
                      {featured.description}
                    </h2>
                    <p className="text-sm mb-4 font-label" style={{ color: 'var(--text-muted)' }}>
                      {featured.pop > 0 ? `${featured.pop}% precipitation.` : 'Clear skies expected.'}
                    </p>
                    <div className="flex items-end gap-3">
                      <span className="font-headline text-5xl font-extrabold tracking-tighter leading-none" style={{ color: 'var(--text)' }}>
                        {displayTempShort(featured.tempMax, tempUnit)}
                      </span>
                      <div className="pb-0.5">
                        <span className="block font-label uppercase text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>Low</span>
                        <span className="font-headline text-xl font-bold leading-none" style={{ color: 'var(--text-muted)' }}>
                          {displayTempShort(featured.tempMin, tempUnit)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-20 h-20 flex items-center justify-center">
                      <WeatherIcon conditionCode={featured.conditionCode} iconCode={featured.icon} size={64} />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Plan Your Week AI Card */}
            <section className="px-2 mb-6 md:mb-0">
              <div
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
              >
                <div className="rounded-xl p-2.5" style={{ background: 'rgba(199,191,255,0.1)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h4 className="font-headline text-base font-bold mb-0.5" style={{ color: 'var(--text)' }}>Plan your week</h4>
                  <p className="text-sm font-body" style={{ color: 'var(--text-muted)' }}>
                    Ask Atmos about the best days for outdoor activities.
                  </p>
                </div>
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem('atmos_chat_pending', 'Plan my week based on the weather forecast. Tell me which days are best for outdoor activities, when to expect rain, and what I should prepare for each day.')
                    } catch {}
                    router.push('/chat')
                  }}
                  className="px-5 py-2 rounded-full font-label text-xs uppercase tracking-widest font-bold text-white active:scale-95 transition-transform flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--gradient-text-from) 0%, var(--gradient-text-to) 100%)' }}
                >
                  Ask
                </button>
              </div>
            </section>
            </div>

            <div className="flex flex-col gap-0 md:gap-4 mt-6 md:mt-0">
            {/* Vertical Day List — starting with Today */}
            {listDays.length > 0 && (
              <section className="px-2 flex flex-col gap-3 mb-6">
                {listDays.map((day) => {
                  const isToday = day.dt === today?.dt;
                  return (
                    <div
                      key={day.dt}
                      className="rounded-2xl p-4 flex items-center justify-between"
                      style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
                    >
                      {/* Left: Date */}
                      <div className="w-2/5 pr-2">
                        <h3 className="font-headline text-base font-bold" style={{ color: 'var(--text)' }}>
                          {isToday ? 'Today' : formatDay(day.dt)}
                        </h3>
                        {!isToday && (
                          <p className="font-label text-[11px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            {day.date ? new Date(day.date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''}
                          </p>
                        )}
                        <p className="font-label text-[11px] tracking-wider capitalize" style={{ color: 'var(--text-muted)' }}>
                          {isToday ? day.description : ''}
                        </p>
                      </div>

                      {/* Middle: Condition & Rain Status */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <WeatherIcon conditionCode={day.conditionCode} iconCode={day.icon} size={28} />
                        {day.pop > 0 && (
                          <div className="flex items-center justify-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#60a5fa' }} />
                            <span className="text-[10px] font-label font-bold" style={{ color: '#60a5fa' }}>{day.pop}%</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Truncated vertical Stack for Temps */}
                      <div className="w-1/4 flex flex-col items-end pl-2">
                        <span className="font-headline text-[1.15rem] font-extrabold leading-tight" style={{ color: 'var(--text)' }}>
                          {displayTempShort(day.tempMax, tempUnit)}
                        </span>
                        <span className="font-label text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          {displayTempShort(day.tempMin, tempUnit)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {/* 16-Day Daily */}
            {md ? (
              <DailyMeteoSection md={md} tempUnit={tempUnit} />
            ) : (
              <div className="h-16 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
            )}

            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

// ── 16-Day Daily Forecast ────────────────────────────────────────────────────

function DailyMeteoSection({ md, tempUnit }: { md: any; tempUnit: 'C' | 'F' }) {
  return (
    <Section
      title="16-Day Forecast"
      icon={<Sun className="w-4 h-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />}
      defaultOpen={false}
    >
      {(md.time as string[]).map((_, i) => (
        <DailyMeteoRow key={md.time[i]} md={md} idx={i} tempUnit={tempUnit} />
      ))}
    </Section>
  )
}

function DailyMeteoRow({ md, idx, tempUnit }: { md: any; idx: number; tempUnit: 'C' | 'F' }) {
  const [open, setOpen] = useState(false)
  const label = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : fmtISODate(md.time[idx])
  const wmo: number = md.weather_code?.[idx] ?? 0
  const tmax = md.temperature_2m_max?.[idx]
  const tmin = md.temperature_2m_min?.[idx]
  const pop: number = md.precipitation_probability_max?.[idx] ?? 0
  const uvi: number | null = md.uv_index_max?.[idx] ?? null

  const tmaxStr = tmax != null ? displayCelsius(tmax, tempUnit, 1) : '—'
  const tminStr = tmin != null ? displayCelsius(tmin, tempUnit, 1) : '—'

  return (
    <div className="mb-2 rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--outline)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-3 text-left"
        style={{ background: 'var(--surface-mid)' }}
      >
        <span className="text-lg flex-shrink-0" role="img" aria-label={wmoDesc(wmo)}>{wmoEmoji(wmo)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{label}</p>
          <p className="text-xs font-body truncate" style={{ color: 'var(--text-muted)' }}>{wmoDesc(wmo)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-xs">
          {pop > 0 && <span className="font-label" style={{ color: '#60a5fa' }}>{pop}%</span>}
          {uvi != null && <span className="font-label" style={{ color: uviColor(uvi) }}>UV {uvi.toFixed(0)}</span>}
          <span className="font-bold font-headline" style={{ color: 'var(--text)' }}>{tmaxStr}</span>
          <span className="font-label" style={{ color: 'var(--text-muted)' }}>{tminStr}</span>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 flex-shrink-0 ml-1 transition-transform"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : '' }}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="p-3 space-y-3" style={{ borderTop: '0.5px solid var(--outline)' }}>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['High', tmax != null ? displayCelsius(tmax, tempUnit) : null],
              ['Low', tmin != null ? displayCelsius(tmin, tempUnit) : null],
              ['Feels High', md.apparent_temperature_max?.[idx] != null ? displayCelsius(md.apparent_temperature_max[idx], tempUnit) : null],
              ['Feels Low', md.apparent_temperature_min?.[idx] != null ? displayCelsius(md.apparent_temperature_min[idx], tempUnit) : null],
            ] as [string, string | null][]).filter(([, v]) => v != null).map(([l, v]) => (
              <div key={l} className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
                <p className="text-[0.65rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{l}</p>
                <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{v}</p>
              </div>
            ))}
          </div>
          {md.sunrise?.[idx] && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
                <p className="text-[0.65rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Sunrise / Sunset</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  {fmtISOTime(md.sunrise[idx])} / {fmtISOTime(md.sunset[idx])}
                </p>
                {md.daylight_duration?.[idx] != null && (
                  <p className="text-[0.65rem] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Daylight: {secsToHm(md.daylight_duration[idx])}
                  </p>
                )}
              </div>
              {md.sunshine_duration?.[idx] != null && (
                <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
                  <p className="text-[0.65rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Sunshine</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{secsToHm(md.sunshine_duration[idx])}</p>
                </div>
              )}
            </div>
          )}
          <div>
            {uvi != null && (
              <DataRow
                label="UV Index Max"
                value={<span style={{ color: uviColor(uvi) }}>{uvi.toFixed(1)} — {uviLabel(uvi)}</span>}
                tooltip="Solar UV radiation intensity. 0-2: Low, 3-5: Moderate, 6-7: High, 8-10: Very High, 11+: Extreme."
              />
            )}
            {md.precipitation_sum?.[idx] > 0 && <DataRow label="Precipitation" value={`${md.precipitation_sum[idx].toFixed(1)}`} unit=" mm" />}
            {md.rain_sum?.[idx] > 0 && <DataRow label="Rain Total" value={`${md.rain_sum[idx].toFixed(1)}`} unit=" mm" />}
            {md.snowfall_sum?.[idx] > 0 && <DataRow label="Snowfall" value={`${md.snowfall_sum[idx].toFixed(1)}`} unit=" cm" />}
            {md.precipitation_hours?.[idx] > 0 && <DataRow label="Precip Hours" value={`${md.precipitation_hours[idx]}h`} />}
            {md.wind_speed_10m_max?.[idx] != null && <DataRow label="Max Wind" value={`${md.wind_speed_10m_max[idx].toFixed(1)}`} unit=" km/h" />}
            {md.wind_gusts_10m_max?.[idx] > 0 && <DataRow label="Max Gust" value={`${md.wind_gusts_10m_max[idx].toFixed(1)}`} unit=" km/h" />}
            {md.wind_direction_10m_dominant?.[idx] != null && (
              <DataRow label="Dominant Wind" value={`${getWindDir16(md.wind_direction_10m_dominant[idx])} (${md.wind_direction_10m_dominant[idx]}°)`} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
