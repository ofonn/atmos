'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BottomNav } from '@/components/layout/BottomNav'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useAiContent } from '@/hooks/useAiContent'
import { useSettings } from '@/contexts/SettingsContext'
import { displayTempShort, formatTime, displayWind } from '@/lib/utils'
import {
  ChevronDown, ChevronUp, Droplets, Wind, Eye, Gauge,
  Thermometer, Sparkles, Sun, Sunrise, Sunset, AlertTriangle, Info
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then(r => r.json())

function getWindDir16(deg: number): string {
  const pts = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return pts[Math.round(deg / 22.5) % 16]
}

function getMoonPhase(phase: number): { label: string; emoji: string } {
  if (phase === 0 || phase === 1) return { label: 'New Moon', emoji: '🌑' }
  if (phase < 0.25) return { label: 'Waxing Crescent', emoji: '🌒' }
  if (phase === 0.25) return { label: 'First Quarter', emoji: '🌓' }
  if (phase < 0.5) return { label: 'Waxing Gibbous', emoji: '🌔' }
  if (phase === 0.5) return { label: 'Full Moon', emoji: '🌕' }
  if (phase < 0.75) return { label: 'Waning Gibbous', emoji: '🌖' }
  if (phase === 0.75) return { label: 'Last Quarter', emoji: '🌗' }
  return { label: 'Waning Crescent', emoji: '🌘' }
}

function getUviColor(uvi: number): string {
  if (uvi <= 2) return '#22c55e'
  if (uvi <= 5) return '#eab308'
  if (uvi <= 7) return '#f97316'
  if (uvi <= 10) return '#ef4444'
  return '#a855f7'
}

function getUviLabel(uvi: number): string {
  if (uvi <= 2) return 'Low'
  if (uvi <= 5) return 'Moderate'
  if (uvi <= 7) return 'High'
  if (uvi <= 10) return 'Very High'
  return 'Extreme'
}

function getAqiColor(aqi: number): string {
  return ['#22c55e','#a3e635','#eab308','#f97316','#ef4444'][aqi - 1] ?? '#94a3b8'
}

function getAqiLabel(aqi: number): string {
  return ['Good','Fair','Moderate','Poor','Very Poor'][aqi - 1] ?? 'Unknown'
}

function formatUnixLocal(dt: number, offset: number, mode: 'time' | 'date' = 'time'): string {
  const ms = (dt + offset) * 1000
  const d = new Date(ms)
  if (mode === 'date') {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
}

function dayLength(sunrise: number, sunset: number): string {
  const secs = sunset - sunrise
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h ${m}m`
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: open ? '0.5px solid var(--outline)' : 'none' }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-headline font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  )
}

function DataRow({ label, value, unit, tooltip }: { label: string; value: React.ReactNode; unit?: string; tooltip?: string }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '0.5px solid var(--outline)' }}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-label" style={{ color: 'var(--text-muted)' }}>{label}</span>
        {tooltip && (
          <div className="relative">
            <button onClick={() => setShowTip(v => !v)} className="opacity-40 hover:opacity-80 transition-opacity">
              <Info className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
            </button>
            {showTip && (
              <div className="absolute left-0 bottom-5 z-50 w-52 text-[11px] leading-snug rounded-xl p-3 shadow-xl"
                style={{ background: 'var(--surface-mid)', color: 'var(--text-muted)', border: '0.5px solid var(--outline)' }}>
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <span className="text-xs font-bold font-headline text-right" style={{ color: 'var(--text)' }}>
        {value}{unit ? <span className="font-normal opacity-60 ml-0.5">{unit}</span> : null}
      </span>
    </div>
  )
}

function DataGrid({ items }: { items: { label: string; value: React.ReactNode; accent?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ label, value, accent }) => (
        <div key={label} className="rounded-xl p-3" style={{ background: 'var(--surface-mid)' }}>
          <p className="text-[0.6rem] font-label uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-sm font-bold font-headline" style={{ color: accent ?? 'var(--text)' }}>{value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TechnicalPage() {
  const { location, current, hourly, daily } = useWeatherContext()
  const { windUnit, tempUnit } = useSettings()
  const { content: aiContent } = useAiContent(current, hourly, daily)

  const { data: oneCall, error: oneCallError } = useSWR(
    location ? `/api/onecall?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher,
    { refreshInterval: 300000 }
  )

  const { data: airData } = useSWR(
    location ? `/api/airpollution?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher,
    { refreshInterval: 300000 }
  )

  const oc = oneCall // One Call 3.0 raw response
  const cur = oc?.current
  const offset = oc?.timezone_offset ?? 0
  const air = airData?.list?.[0]

  const glassCard: React.CSSProperties = { background: 'var(--surface)', border: '0.5px solid var(--outline)' }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'transparent' }}>
        <h1 className="text-2xl font-bold tracking-tighter font-headline" style={{ color: 'var(--primary)' }}>Atmos</h1>
      </header>

      <main className="pt-24 px-4 pb-32">
        {/* Page title */}
        <div className="mb-6 px-2">
          <h2 className="text-[2.6rem] font-extrabold font-headline leading-none tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
            Technical<br />Details
          </h2>
          <p className="font-label tracking-widest uppercase text-[0.65rem]" style={{ color: 'var(--text-muted)' }}>
            Live Atmospheric Precision
          </p>
        </div>

        {/* ── Weather Alerts ─────────────────────────────────────────── */}
        {oc?.alerts?.map((alert: any, i: number) => (
          <div key={i} className="rounded-2xl p-4 mb-4 flex gap-3"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400 mb-0.5">{alert.event}</p>
              <p className="text-[0.7rem] font-label opacity-70" style={{ color: 'var(--text)' }}>
                {formatUnixLocal(alert.start, offset)} → {formatUnixLocal(alert.end, offset)} · {alert.sender_name}
              </p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{alert.description}</p>
            </div>
          </div>
        ))}

        {/* ── Proactive AI Insight ───────────────────────────────────── */}
        <div className="rounded-2xl p-5 mb-4 relative overflow-hidden" style={glassCard}>
          <div className="absolute -right-12 -top-12 w-44 h-44 blur-[70px] rounded-full pointer-events-none"
            style={{ background: 'rgba(199,191,255,0.18)' }} />
          <div className="relative z-10">
            <h3 className="text-sm font-bold font-headline mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              Proactive Insight
            </h3>
            <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {aiContent?.proactiveInsight ?? 'Analyzing current conditions…'}
            </p>
          </div>
        </div>

        {/* ── Current Conditions ─────────────────────────────────────── */}
        {cur ? (
          <Section title="Current Conditions" icon={<Thermometer className="w-4 h-4" style={{ color: 'var(--primary)' }} />}>
            {/* Hero row */}
            <div className="flex items-center gap-4 mb-5">
              <img
                src={`https://openweathermap.org/img/wn/${cur.weather[0].icon}@2x.png`}
                alt={cur.weather[0].description}
                className="w-14 h-14"
              />
              <div>
                <p className="text-3xl font-extrabold font-headline leading-none" style={{ color: 'var(--text)' }}>
                  {cur.temp.toFixed(1)}°C
                </p>
                <p className="text-xs mt-0.5 font-label capitalize" style={{ color: 'var(--text-muted)' }}>
                  {cur.weather[0].description}
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem]"
                    style={{ background: 'var(--surface-mid)', color: 'var(--text-muted)' }}>
                    #{cur.weather[0].id}
                  </span>
                </p>
              </div>
            </div>

            <DataGrid items={[
              { label: 'Feels Like', value: `${cur.feels_like.toFixed(1)}°C` },
              { label: 'Difference', value: `${cur.feels_like >= cur.temp ? '+' : ''}${(cur.feels_like - cur.temp).toFixed(1)}°` },
              { label: 'Humidity', value: `${cur.humidity}%` },
              { label: 'Dew Point', value: `${cur.dew_point.toFixed(1)}°C` },
              { label: 'Pressure', value: `${cur.pressure} hPa` },
              { label: 'Clouds', value: `${cur.clouds}%` },
            ]} />

            <div className="mt-3 space-y-0">
              <DataRow label="Visibility" value={`${(cur.visibility / 1000).toFixed(1)}`} unit="km" />
              <DataRow
                label="UV Index"
                value={<span style={{ color: getUviColor(cur.uvi) }}>{cur.uvi.toFixed(1)} — {getUviLabel(cur.uvi)}</span>}
                tooltip="Measures solar UV radiation. 0-2: Low, 3-5: Moderate, 6-7: High, 8-10: Very High, 11+: Extreme."
              />
              <DataRow
                label="Wind"
                value={`${cur.wind_speed.toFixed(1)} m/s ${getWindDir16(cur.wind_deg)} (${cur.wind_deg}°)`}
              />
              {cur.wind_gust && <DataRow label="Wind Gust" value={`${cur.wind_gust.toFixed(1)}`} unit="m/s" />}
              {cur.rain?.['1h'] !== undefined && <DataRow label="Rain (1h)" value={`${cur.rain['1h'].toFixed(1)}`} unit="mm/h" />}
              {cur.snow?.['1h'] !== undefined && <DataRow label="Snow (1h)" value={`${cur.snow['1h'].toFixed(1)}`} unit="mm/h" />}
              <DataRow
                label="Sunrise / Sunset"
                value={`${formatUnixLocal(cur.sunrise, offset)} / ${formatUnixLocal(cur.sunset, offset)}`}
              />
              <DataRow label="Day Length" value={dayLength(cur.sunrise, cur.sunset)} />
              <DataRow label="Last Updated" value={formatUnixLocal(cur.dt, offset)} />
            </div>
          </Section>
        ) : oneCallError ? (
          <div className="rounded-2xl p-5 mb-4 text-sm text-center" style={{ ...glassCard, color: 'var(--text-muted)' }}>
            One Call 3.0 API not available. Ensure your API key has One Call subscription.
          </div>
        ) : (
          <div className="h-48 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
        )}

        {/* ── Minutely Precipitation ─────────────────────────────────── */}
        {oc?.minutely && (
          <Section title="Next 60 Minutes" icon={<Droplets className="w-4 h-4" style={{ color: 'var(--secondary)' }} />}>
            {oc.minutely.every((m: any) => m.precipitation === 0) ? (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                No precipitation expected in the next hour.
              </p>
            ) : (
              <div>
                <div className="flex items-end gap-px h-12">
                  {oc.minutely.map((m: any, i: number) => {
                    const maxPrecip = Math.max(...oc.minutely.map((x: any) => x.precipitation))
                    const h = maxPrecip > 0 ? Math.max(4, (m.precipitation / maxPrecip) * 100) : 4
                    return (
                      <div key={i} className="flex-1 rounded-t-sm transition-all"
                        style={{
                          height: `${h}%`,
                          background: m.precipitation > 0
                            ? `rgba(96,165,250,${0.4 + (m.precipitation / maxPrecip) * 0.6})`
                            : 'var(--surface-mid)',
                        }} />
                    )
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  {[0, 15, 30, 45, 60].map(min => (
                    <span key={min} className="text-[0.6rem] font-label" style={{ color: 'var(--text-muted)' }}>
                      {min === 0 ? 'Now' : `+${min}m`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── Hourly Timeline (kept from original) ──────────────────── */}
        {oc?.hourly && (
          <HourlySection hourly={oc.hourly} offset={offset} tempUnit={tempUnit} />
        )}

        {/* ── 8-Day Forecast ─────────────────────────────────────────── */}
        {oc?.daily && (
          <Section title="8-Day Forecast" icon={<Sun className="w-4 h-4" style={{ color: 'var(--primary)' }} />}>
            {oc.daily.map((day: any) => (
              <DayRow key={day.dt} day={day} offset={offset} tempUnit={tempUnit} />
            ))}
          </Section>
        )}

        {/* ── Air Quality ────────────────────────────────────────────── */}
        {air && (
          <Section title="Air Quality" icon={<Wind className="w-4 h-4" style={{ color: 'var(--secondary)' }} />}>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--surface-mid)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: getAqiColor(air.main.aqi) }}>
                {air.main.aqi}
              </div>
              <div>
                <p className="font-bold text-sm font-headline" style={{ color: 'var(--text)' }}>
                  {getAqiLabel(air.main.aqi)}
                </p>
                <p className="text-[0.65rem] font-label" style={{ color: 'var(--text-muted)' }}>Air Quality Index</p>
              </div>
            </div>
            <div className="space-y-0">
              {Object.entries({
                co: ['Carbon Monoxide', 'CO'],
                no: ['Nitrogen Monoxide', 'NO'],
                no2: ['Nitrogen Dioxide', 'NO₂'],
                o3: ['Ozone', 'O₃'],
                so2: ['Sulphur Dioxide', 'SO₂'],
                pm2_5: ['Fine Particles', 'PM2.5'],
                pm10: ['Coarse Particles', 'PM10'],
                nh3: ['Ammonia', 'NH₃'],
              }).map(([key, [name, formula]]) => (
                <DataRow
                  key={key}
                  label={`${name} (${formula})`}
                  value={(air.components[key] as number).toFixed(2)}
                  unit=" μg/m³"
                />
              ))}
            </div>
          </Section>
        )}

        {/* ── Location Metadata ──────────────────────────────────────── */}
        {oc && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
            <p className="text-[0.6rem] font-label uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Location Metadata
            </p>
            <div className="space-y-0">
              <DataRow label="Coordinates" value={`${oc.lat.toFixed(4)}, ${oc.lon.toFixed(4)}`} />
              <DataRow label="Timezone" value={oc.timezone} />
              <DataRow label="UTC Offset" value={`${oc.timezone_offset >= 0 ? '+' : ''}${(oc.timezone_offset / 3600).toFixed(1)}h`} />
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

// ── Hourly Section ─────────────────────────────────────────────────────────

function HourlySection({ hourly, offset, tempUnit }: { hourly: any[]; offset: number; tempUnit: string }) {
  const [showFull, setShowFull] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const displayed = showFull ? hourly : hourly.slice(0, 8)

  function getHourlySummary(h: any): string {
    const code = h.weather[0].id
    const pop = Math.round(h.pop * 100)
    if (code >= 200 && code < 300) return 'Thunderstorm · Stay indoors'
    if (code >= 300 && code < 400) return 'Light drizzle · Jacket advised'
    if (code >= 500 && code < 600) return pop > 70 ? 'Heavy rain · Umbrella needed' : 'Rain likely · Grab umbrella'
    if (code >= 600 && code < 700) return 'Snow · Roads may be slippery'
    if (code >= 700 && code < 800) return 'Foggy · Low visibility'
    if (code === 800) return h.temp >= 30 ? 'Sunny & hot · Stay hydrated' : h.temp >= 22 ? 'Clear skies · Great outdoors' : 'Clear but cool · Bring a layer'
    if (code <= 802) return 'Partly cloudy · Mild conditions'
    return pop > 40 ? `Overcast · ${pop}% rain chance` : 'Overcast · No rain expected'
  }

  return (
    <Section title="Hourly Timeline" icon={<Eye className="w-4 h-4" style={{ color: 'var(--secondary)' }} />}>
      <div className="flex flex-col gap-2">
        {displayed.map((h: any, i: number) => {
          const isNow = i === 0
          const pop = Math.round(h.pop * 100)
          const isOpen = expanded === i
          return (
            <div key={h.dt}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full rounded-xl p-3 flex items-center gap-3 text-left transition-colors"
                style={{
                  background: isNow ? 'rgba(199,191,255,0.12)' : 'var(--surface-mid)',
                  border: isNow ? '1px solid rgba(199,191,255,0.25)' : '1px solid transparent',
                }}
              >
                <span className="text-[0.68rem] font-label font-bold w-10 flex-shrink-0"
                  style={{ color: isNow ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {isNow ? 'Now' : formatUnixLocal(h.dt, offset)}
                </span>
                <img src={`https://openweathermap.org/img/wn/${h.weather[0].icon}.png`} alt="" className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold font-headline" style={{ color: 'var(--text)' }}>
                      {h.temp.toFixed(1)}°C
                    </span>
                    {pop > 0 && (
                      <span className="text-[0.65rem] font-label" style={{ color: pop > 50 ? '#60a5fa' : 'var(--text-muted)' }}>
                        {pop}% rain
                      </span>
                    )}
                  </div>
                  <p className="text-[0.7rem] font-body truncate" style={{ color: 'var(--text-muted)' }}>
                    {getHourlySummary(h)}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                  style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : '' }} />
              </button>

              {isOpen && (
                <div className="mt-1 rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1"
                  style={{ background: 'rgba(39,42,51,0.5)', border: '0.5px solid var(--outline)' }}>
                  {[
                    ['Feels Like', `${h.feels_like.toFixed(1)}°C`],
                    ['Humidity', `${h.humidity}%`],
                    ['Dew Point', `${h.dew_point.toFixed(1)}°C`],
                    ['Pressure', `${h.pressure} hPa`],
                    ['Wind', `${h.wind_speed.toFixed(1)} m/s ${getWindDir16(h.wind_deg)}`],
                    ...(h.wind_gust ? [['Gust', `${h.wind_gust.toFixed(1)} m/s`]] : []),
                    ['UV Index', `${h.uvi.toFixed(1)} ${getUviLabel(h.uvi)}`],
                    ['Clouds', `${h.clouds}%`],
                    ['Visibility', `${(h.visibility / 1000).toFixed(1)} km`],
                    ...(h.rain?.['1h'] ? [['Rain', `${h.rain['1h'].toFixed(1)} mm/h`]] : []),
                    ...(h.snow?.['1h'] ? [['Snow', `${h.snow['1h'].toFixed(1)} mm/h`]] : []),
                  ].map(([label, val]) => (
                    <div key={label} className="py-1" style={{ borderBottom: '0.5px solid var(--outline)' }}>
                      <p className="text-[0.58rem] font-label uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button onClick={() => setShowFull(v => !v)}
        className="mt-3 w-full text-center text-xs font-label uppercase tracking-widest py-2 rounded-xl transition-colors"
        style={{ background: 'var(--surface-mid)', color: 'var(--primary)' }}>
        {showFull ? 'Show Less' : `Show All 48 Hours`}
      </button>
    </Section>
  )
}

// ── Day Row ────────────────────────────────────────────────────────────────

function DayRow({ day, offset, tempUnit }: { day: any; offset: number; tempUnit: string }) {
  const [open, setOpen] = useState(false)
  const moon = getMoonPhase(day.moon_phase)
  const pop = Math.round(day.pop * 100)
  const label = formatUnixLocal(day.dt, offset, 'date')

  return (
    <div className="mb-2 rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--outline)' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 text-left"
        style={{ background: 'var(--surface-mid)' }}>
        <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="" className="w-9 h-9 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{label}</p>
          <p className="text-[0.65rem] font-body capitalize truncate" style={{ color: 'var(--text-muted)' }}>
            {day.weather[0].description}
            {pop > 0 ? ` · ${pop}% rain` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{day.temp.max.toFixed(0)}°</span>
          <span className="text-xs font-label" style={{ color: 'var(--text-muted)' }}>{day.temp.min.toFixed(0)}°</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform ml-1"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : '' }} />
      </button>

      {open && (
        <div className="p-3 space-y-3" style={{ borderTop: '0.5px solid var(--outline)' }}>
          {/* Summary */}
          {day.summary && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{day.summary}</p>
          )}

          {/* Temps by period */}
          <div className="grid grid-cols-4 gap-1.5">
            {[['Morn', day.temp.morn, day.feels_like.morn],
              ['Day', day.temp.day, day.feels_like.day],
              ['Eve', day.temp.eve, day.feels_like.eve],
              ['Night', day.temp.night, day.feels_like.night]].map(([label, temp, feels]) => (
              <div key={label as string} className="rounded-lg p-2 text-center" style={{ background: 'var(--surface-mid)' }}>
                <p className="text-[0.55rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label as string}</p>
                <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{(temp as number).toFixed(0)}°</p>
                <p className="text-[0.55rem] font-label" style={{ color: 'var(--text-muted)' }}>feels {(feels as number).toFixed(0)}°</p>
              </div>
            ))}
          </div>

          {/* Sun / Moon */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
              <p className="text-[0.6rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Sunrise / Sunset</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {formatUnixLocal(day.sunrise, offset)} / {formatUnixLocal(day.sunset, offset)}
              </p>
              <p className="text-[0.6rem] font-label mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Day: {dayLength(day.sunrise, day.sunset)}
              </p>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: 'var(--surface-mid)' }}>
              <p className="text-[0.6rem] font-label uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Moon Phase</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {moon.emoji} {moon.label}
              </p>
              <p className="text-[0.6rem] font-label mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {formatUnixLocal(day.moonrise, offset)} rise · {formatUnixLocal(day.moonset, offset)} set
              </p>
            </div>
          </div>

          {/* Other metrics */}
          <div className="space-y-0">
            <DataRow label="Humidity" value={`${day.humidity}%`} />
            <DataRow label="Dew Point" value={`${day.dew_point.toFixed(1)}°C`} tooltip="Temperature at which air becomes saturated and dew forms." />
            <DataRow label="Pressure" value={`${day.pressure}`} unit=" hPa" tooltip="Atmospheric pressure at sea level. ~1013 hPa is standard." />
            <DataRow label="Wind" value={`${day.wind_speed.toFixed(1)} m/s ${getWindDir16(day.wind_deg)} (${day.wind_deg}°)`} />
            {day.wind_gust && <DataRow label="Gust" value={`${day.wind_gust.toFixed(1)}`} unit=" m/s" />}
            <DataRow label="Clouds" value={`${day.clouds}%`} />
            <DataRow label="UV Index" value={<span style={{ color: getUviColor(day.uvi) }}>{day.uvi.toFixed(1)} — {getUviLabel(day.uvi)}</span>}
              tooltip="UV radiation intensity. 0-2: Low, 3-5: Moderate, 6-7: High, 8-10: Very High, 11+: Extreme." />
            {day.rain !== undefined && <DataRow label="Rain Volume" value={`${day.rain.toFixed(1)}`} unit=" mm" />}
            {day.snow !== undefined && <DataRow label="Snow Volume" value={`${day.snow.toFixed(1)}`} unit=" mm" />}
          </div>
        </div>
      )}
    </div>
  )
}
