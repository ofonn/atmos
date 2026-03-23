'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Sparkles, ChevronDown, ChevronUp, Sun, Info } from 'lucide-react'
import useSWR from 'swr'
import { BottomNav } from '@/components/layout/BottomNav'
import { WeatherIcon } from '@/components/weather/WeatherIcon'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useSettings } from '@/contexts/SettingsContext'
import { formatDay, displayTempShort } from '@/lib/utils'

// ── Helpers ─────────────────────────────────────────────────────────────────

const WMO: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail',
}
function wmoDesc(code: number): string { return WMO[code] ?? `Code ${code}` }
function wmoEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️'
  if (code === 2 || code === 3) return '⛅'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 95) return '⛈️'
  return '🌤️'
}
function kelvinToC(k: number): number { return k - 273.15 }
function kC(k: number): string { return kelvinToC(k).toFixed(1) }
function secsToHm(s: number): string { return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` }
function fmtISOTime(iso: string): string { return iso.slice(11, 16) }
function fmtISODate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}
function fmtUnix(dt: number, off: number): string {
  return new Date((dt + off) * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  })
}
function getWindDir16(deg: number): string {
  return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(deg / 22.5) % 16]
}
function uviColor(u: number) { return u <= 2 ? '#22c55e' : u <= 5 ? '#eab308' : u <= 7 ? '#f97316' : u <= 10 ? '#ef4444' : '#a855f7' }
function uviLabel(u: number) { return u <= 2 ? 'Low' : u <= 5 ? 'Moderate' : u <= 7 ? 'High' : u <= 10 ? 'Very High' : 'Extreme' }

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: open ? '0.5px solid var(--outline)' : 'none' }}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-headline font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
               : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
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
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '0.5px solid var(--outline)' }}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-label" style={{ color: 'var(--text-muted)' }}>{label}</span>
        {tooltip && (
          <div className="relative">
            <button onClick={() => setTip(v => !v)} className="opacity-40 hover:opacity-80">
              <Info className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
            </button>
            {tip && (
              <div className="absolute left-0 bottom-5 z-50 w-52 text-[11px] leading-snug rounded-xl p-3 shadow-xl"
                style={{ background: 'var(--surface-mid)', color: 'var(--text-muted)', border: '0.5px solid var(--outline)' }}>
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

  const { data: forecastRaw } = useSWR(
    location ? `/api/forecast?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )
  const { data: meteo } = useSWR(
    location ? `/api/openmeteo?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )

  const forecast = forecastRaw && !forecastRaw.error ? forecastRaw : null
  const md = meteo?.daily
  const offset: number = forecast?.city?.timezone ?? 0

  const forecastByDay = useMemo(() => {
    if (!forecast?.list) return [] as [string, any[]][]
    const groups: Record<string, any[]> = {}
    forecast.list.forEach((item: any) => {
      const date = item.dt_txt.slice(0, 10)
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    })
    return Object.entries(groups) as [string, any[]][]
  }, [forecast])

  const featured = daily?.[1] ?? null
  const rest = daily?.slice(2) ?? []

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4"
        style={{ background: 'transparent' }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span className="font-headline font-extrabold tracking-tight text-2xl" style={{ color: 'var(--primary)' }}>
            Atmos
          </span>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4">
        <div className="px-2 mb-6">
          <p className="font-label text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--primary)' }}>
            Atmospheric Narrative
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
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-36 rounded-[1.5rem] animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Featured Day (Tomorrow) */}
            {featured && (
              <section className="px-2 mb-6">
                <div className="rounded-[2rem] p-7 relative overflow-hidden flex items-center gap-6"
                  style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
                  <div className="absolute -top-20 -right-20 w-56 h-56 blur-[80px] rounded-full pointer-events-none"
                    style={{ background: 'rgba(199,191,255,0.2)' }} />
                  <div className="relative z-10 flex-1">
                    <span className="font-label text-[10px] px-3 py-1 rounded-full mb-4 inline-block uppercase tracking-widest"
                      style={{ background: 'rgba(199,191,255,0.1)', color: 'var(--primary)' }}>
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

            {/* 5-Day Grid */}
            {rest.length > 0 && (
              <section className="px-2 grid grid-cols-2 gap-4 mb-6">
                {rest.map((day, i) => (
                  <div key={day.dt} className="rounded-[1.5rem] p-5" style={{ background: 'var(--surface)' }}>
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

            {/* 5-Day / 3-Hour Forecast */}
            {forecast ? (
              <ForecastSection forecastByDay={forecastByDay} offset={offset} />
            ) : (
              <div className="h-16 rounded-2xl animate-pulse mb-4 mx-0" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
            )}

            {/* 16-Day Daily */}
            {md ? (
              <DailyMeteoSection md={md} />
            ) : (
              <div className="h-16 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
            )}

            {/* Plan Your Week AI Card */}
            <section className="px-0 mb-4">
              <div className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
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
                  onClick={() => {
                    try {
                      localStorage.setItem('atmos_chat_pending', 'Plan my week based on the weather forecast. Tell me which days are best for outdoor activities, when to expect rain, and what I should prepare for each day.')
                    } catch {}
                    router.push('/chat')
                  }}
                  className="px-5 py-2 rounded-full font-label text-xs uppercase tracking-widest font-bold text-white active:scale-95 transition-transform flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #806EF8 0%, #5896FD 100%)' }}>
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

// ── 5-Day / 3-Hour Forecast ──────────────────────────────────────────────────

function ForecastSection({ forecastByDay, offset }: { forecastByDay: [string, any[]][]; offset: number }) {
  return (
    <Section title="5-Day / 3-Hour Forecast" icon={<Sun className="w-4 h-4" style={{ color: 'var(--primary)' }} />} defaultOpen={false}>
      {forecastByDay.map(([date, items]) => (
        <ForecastDayGroup key={date} date={date} items={items} offset={offset} />
      ))}
    </Section>
  )
}

function ForecastDayGroup({ date, items, offset }: { date: string; items: any[]; offset: number }) {
  const label = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
  return (
    <div className="mb-4">
      <p className="text-[0.65rem] font-label uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex flex-col gap-1.5">
        {items.map((item: any) => <ForecastSlot key={item.dt} item={item} offset={offset} />)}
      </div>
    </div>
  )
}

function ForecastSlot({ item, offset }: { item: any; offset: number }) {
  const [open, setOpen] = useState(false)
  const pop = Math.round(item.pop * 100)
  const isDay = item.sys?.pod === 'd'

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--outline)' }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 p-2.5 text-left"
        style={{ background: 'var(--surface-mid)' }}>
        <span className="text-[0.68rem] font-label font-bold w-10 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {fmtUnix(item.dt, offset)}
        </span>
        <span className="text-base flex-shrink-0">{isDay ? '☀️' : '🌙'}</span>
        <img src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`} alt="" className="w-7 h-7 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{kC(item.main.temp)}°C</span>
          <span className="text-[0.65rem] font-label ml-2 capitalize" style={{ color: 'var(--text-muted)' }}>
            {item.weather[0].description}
          </span>
        </div>
        {pop > 0 && <span className="text-[0.65rem] font-label flex-shrink-0" style={{ color: '#60a5fa' }}>{pop}%</span>}
        <ChevronDown className="w-3 h-3 flex-shrink-0 ml-1"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : '' }} />
      </button>
      {open && (
        <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-1" style={{ borderTop: '0.5px solid var(--outline)' }}>
          {([
            ['Feels Like', `${kC(item.main.feels_like)}°C`],
            ['Min / Max', `${kC(item.main.temp_min)} / ${kC(item.main.temp_max)}°C`],
            ['Humidity', `${item.main.humidity}%`],
            ['Pressure', `${item.main.sea_level ?? item.main.pressure} hPa`],
            ['Ground P.', item.main.grnd_level ? `${item.main.grnd_level} hPa` : null],
            ['Wind', `${item.wind.speed.toFixed(1)} m/s ${getWindDir16(item.wind.deg)}`],
            ['Gust', item.wind.gust > 0 ? `${item.wind.gust.toFixed(1)} m/s` : null],
            ['Visibility', `${(item.visibility / 1000).toFixed(1)} km`],
            ['Clouds', `${item.clouds.all}%`],
            ['Rain (3h)', item.rain?.['3h'] > 0 ? `${item.rain['3h'].toFixed(1)} mm` : null],
            ['Snow (3h)', item.snow?.['3h'] > 0 ? `${item.snow['3h'].toFixed(1)} mm` : null],
            ['Day/Night', isDay ? 'Day ☀️' : 'Night 🌙'],
          ] as [string, string | null][]).filter(([, v]) => v != null).map(([label, val]) => (
            <div key={label} className="py-1" style={{ borderBottom: '0.5px solid var(--outline)' }}>
              <p className="text-[0.58rem] font-label uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 16-Day Daily Forecast ────────────────────────────────────────────────────

function DailyMeteoSection({ md }: { md: any }) {
  return (
    <Section title="16-Day Forecast" icon={<Sun className="w-4 h-4" style={{ color: 'var(--primary)' }} />} defaultOpen={false}>
      {(md.time as string[]).map((_, i) => (
        <DailyMeteoRow key={md.time[i]} md={md} idx={i} />
      ))}
    </Section>
  )
}

function DailyMeteoRow({ md, idx }: { md: any; idx: number }) {
  const [open, setOpen] = useState(false)
  const label = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : fmtISODate(md.time[idx])
  const wmo: number = md.weather_code?.[idx] ?? 0
  const tmax: string = md.temperature_2m_max?.[idx]?.toFixed(1) ?? '—'
  const tmin: string = md.temperature_2m_min?.[idx]?.toFixed(1) ?? '—'
  const pop: number = md.precipitation_probability_max?.[idx] ?? 0
  const uvi: number | null = md.uv_index_max?.[idx] ?? null

  return (
    <div className="mb-2 rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--outline)' }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-3 text-left"
        style={{ background: 'var(--surface-mid)' }}>
        <span className="text-lg flex-shrink-0">{wmoEmoji(wmo)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{label}</p>
          <p className="text-[0.65rem] font-body truncate" style={{ color: 'var(--text-muted)' }}>{wmoDesc(wmo)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-xs">
          {pop > 0 && <span className="font-label" style={{ color: '#60a5fa' }}>{pop}%</span>}
          {uvi != null && <span className="font-label" style={{ color: uviColor(uvi) }}>UV {uvi.toFixed(0)}</span>}
          <span className="font-bold font-headline" style={{ color: 'var(--text)' }}>{tmax}°</span>
          <span className="font-label" style={{ color: 'var(--text-muted)' }}>{tmin}°</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 ml-1"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : '' }} />
      </button>
      {open && (
        <div className="p-3 space-y-3" style={{ borderTop: '0.5px solid var(--outline)' }}>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['High', `${tmax}°C`], ['Low', `${tmin}°C`],
              ['Feels High', md.apparent_temperature_max?.[idx] != null ? `${md.apparent_temperature_max[idx].toFixed(1)}°C` : null],
              ['Feels Low', md.apparent_temperature_min?.[idx] != null ? `${md.apparent_temperature_min[idx].toFixed(1)}°C` : null],
            ] as [string, string | null][]).filter(([, v]) => v != null).map(([l, v]) => (
              <div key={l} className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
                <p className="text-[0.55rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{l}</p>
                <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{v}</p>
              </div>
            ))}
          </div>
          {md.sunrise?.[idx] && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
                <p className="text-[0.6rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Sunrise / Sunset</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  {fmtISOTime(md.sunrise[idx])} / {fmtISOTime(md.sunset[idx])}
                </p>
                {md.daylight_duration?.[idx] != null && (
                  <p className="text-[0.6rem] mt-0.5" style={{ color: 'var(--text-muted)' }}>Daylight: {secsToHm(md.daylight_duration[idx])}</p>
                )}
              </div>
              {md.sunshine_duration?.[idx] != null && (
                <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
                  <p className="text-[0.6rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Sunshine</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{secsToHm(md.sunshine_duration[idx])}</p>
                </div>
              )}
            </div>
          )}
          <div className="space-y-0">
            {uvi != null && (
              <DataRow label="UV Index Max"
                value={<span style={{ color: uviColor(uvi) }}>{uvi.toFixed(1)} — {uviLabel(uvi)}</span>}
                tooltip="Solar UV radiation intensity. 0-2: Low, 3-5: Moderate, 6-7: High, 8-10: Very High, 11+: Extreme." />
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
