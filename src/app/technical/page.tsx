'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { BottomNav } from '@/components/layout/BottomNav'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useAiContent } from '@/hooks/useAiContent'
import {
  ChevronDown, ChevronUp, Wind, Thermometer, Sparkles, Sun, Info, Clock,
} from 'lucide-react'

// ── WMO weather code map ────────────────────────────────────────────────────

const WMO: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail',
}

function wmoDesc(code: number): string { return WMO[code] ?? `Code ${code}` }

function wmoEmoji(code: number, isDay = 1): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code === 1) return isDay ? '🌤️' : '🌙'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 55) return '🌦️'
  if (code >= 56 && code <= 57) return '🌨️'
  if (code >= 61 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return isDay ? '🌤️' : '🌙'
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function kelvinToC(k: number): number { return k - 273.15 }
function kC(k: number): string { return kelvinToC(k).toFixed(1) }

function getWindDir16(deg: number): string {
  const pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return pts[Math.round(deg / 22.5) % 16]
}

function secsToHm(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h ${m}m`
}

function fmtUnix(dt: number, offsetSecs: number, mode: 'time' | 'date' = 'time'): string {
  const d = new Date((dt + offsetSecs) * 1000)
  if (mode === 'date') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
}

function fmtISOTime(iso: string): string { return iso.slice(11, 16) }

function fmtISODate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

function uviColor(uvi: number): string {
  if (uvi <= 2) return '#22c55e'
  if (uvi <= 5) return '#eab308'
  if (uvi <= 7) return '#f97316'
  if (uvi <= 10) return '#ef4444'
  return '#a855f7'
}
function uviLabel(uvi: number): string {
  if (uvi <= 2) return 'Low'
  if (uvi <= 5) return 'Moderate'
  if (uvi <= 7) return 'High'
  if (uvi <= 10) return 'Very High'
  return 'Extreme'
}
function aqiColor(aqi: number): string {
  return ['#22c55e', '#a3e635', '#eab308', '#f97316', '#ef4444'][aqi - 1] ?? '#94a3b8'
}
function aqiLabel(aqi: number): string {
  return ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][aqi - 1] ?? 'Unknown'
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ── Sub-components ──────────────────────────────────────────────────────────

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
        {open
          ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
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
            <button onClick={() => setTip(v => !v)} className="opacity-40 hover:opacity-80 transition-opacity">
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

function DataGrid({ items }: { items: { label: string; value: React.ReactNode; accent?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {items.map(({ label, value, accent }) => (
        <div key={label} className="rounded-xl p-3" style={{ background: 'var(--surface-mid)' }}>
          <p className="text-[0.6rem] font-label uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-sm font-bold font-headline" style={{ color: accent ?? 'var(--text)' }}>{value}</p>
        </div>
      ))}
    </div>
  )
}

function SubHead({ title }: { title: string }) {
  return <p className="text-[0.6rem] font-label uppercase tracking-widest pt-4 pb-2" style={{ color: 'var(--text-muted)' }}>{title}</p>
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TechnicalPage() {
  const { location, current: ctxCurrent, hourly: ctxHourly, daily: ctxDaily } = useWeatherContext()
  const { content: aiContent } = useAiContent(ctxCurrent, ctxHourly, ctxDaily)

  const { data: owmRaw } = useSWR(
    location ? `/api/weather?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )
  const { data: meteo } = useSWR(
    location ? `/api/openmeteo?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )
  const { data: airData } = useSWR(
    location ? `/api/airpollution?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )

  const owm = owmRaw && !owmRaw.error ? owmRaw : null
  const mc = meteo?.current
  const mh = meteo?.hourly
  const air = airData?.list?.[0]
  const offset: number = owm?.timezone ?? 0

  const nowHourIdx = useMemo(() => {
    if (!mh?.time) return 0
    const nowUtcMs = Date.now()
    const localMs = nowUtcMs + offset * 1000
    const d = new Date(localMs)
    const pad = (n: number) => String(n).padStart(2, '0')
    const nowStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`
    const idx = mh.time.findIndex((t: string) => t >= nowStr)
    return idx >= 0 ? idx : 0
  }, [mh, offset])

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="fixed top-0 w-full z-50 px-6 py-4"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'transparent' }}>
        <h1 className="text-2xl font-bold tracking-tighter font-headline" style={{ color: 'var(--primary)' }}>Atmos</h1>
      </header>

      <main className="pt-20 px-4 pb-32">
        {/* Title */}
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

        {/* AI Proactive Insight */}
        <div className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
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

        {/* ── Current Conditions ──────────────────────────────────────── */}
        {owm ? (
          <Section title="Current Conditions" icon={<Thermometer className="w-4 h-4" style={{ color: 'var(--primary)' }} />}>
            {/* Hero */}
            <div className="flex items-center gap-4 mb-4">
              <img
                src={`https://openweathermap.org/img/wn/${owm.weather[0].icon}@2x.png`}
                alt={owm.weather[0].description}
                className="w-14 h-14"
              />
              <div>
                <p className="text-3xl font-extrabold font-headline leading-none" style={{ color: 'var(--text)' }}>
                  {kC(owm.main.temp)}°C
                </p>
                <p className="text-xs mt-0.5 font-label capitalize" style={{ color: 'var(--text-muted)' }}>
                  {owm.weather[0].description}
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[0.6rem]"
                    style={{ background: 'var(--surface-mid)', color: 'var(--text-muted)' }}>
                    #{owm.weather[0].id}
                  </span>
                </p>
              </div>
            </div>

            {/* Temperature & Comfort */}
            <SubHead title="Temperature & Comfort" />
            <DataGrid items={[
              { label: 'Temperature', value: `${kC(owm.main.temp)}°C` },
              { label: 'Feels Like', value: `${kC(owm.main.feels_like)}°C` },
              {
                label: 'Difference',
                value: `${(kelvinToC(owm.main.feels_like) - kelvinToC(owm.main.temp) >= 0) ? '+' : ''}${(kelvinToC(owm.main.feels_like) - kelvinToC(owm.main.temp)).toFixed(1)}°`,
              },
              { label: 'Humidity', value: `${owm.main.humidity}%` },
              { label: 'Daily Low', value: `${kC(owm.main.temp_min)}°C` },
              { label: 'Daily High', value: `${kC(owm.main.temp_max)}°C` },
            ]} />
            {mh?.dew_point_2m && (
              <DataRow
                label="Dew Point"
                value={`${mh.dew_point_2m[nowHourIdx]?.toFixed(1)}°C`}
                tooltip="The temperature at which air becomes saturated and dew forms. Closer to actual temp = more humid it feels."
              />
            )}

            {/* Wind */}
            <SubHead title="Wind" />
            <div className="space-y-0">
              <DataRow label="Speed" value={`${owm.wind.speed.toFixed(1)} m/s`} />
              <DataRow label="Direction" value={`${getWindDir16(owm.wind.deg)} (${owm.wind.deg}°)`} />
              {owm.wind.gust > 0 && <DataRow label="Gust" value={`${owm.wind.gust.toFixed(1)}`} unit=" m/s" />}
            </div>

            {/* Sky */}
            <SubHead title="Sky" />
            <div className="space-y-0">
              <DataRow label="Condition" value={`${owm.weather[0].main} — ${owm.weather[0].description}`} />
              <DataRow label="Cloud Cover" value={`${owm.clouds.all}%`} />
              <DataRow label="Visibility" value={`${(owm.visibility / 1000).toFixed(1)}`} unit=" km" />
            </div>

            {/* Atmosphere */}
            <SubHead title="Atmosphere" />
            <div className="space-y-0">
              <DataRow label="Pressure (sea level)" value={`${owm.main.pressure}`} unit=" hPa"
                tooltip="Atmospheric pressure at sea level. Standard ~1013 hPa. Falling pressure may indicate storms." />
              {owm.main.sea_level && <DataRow label="Sea Level" value={`${owm.main.sea_level}`} unit=" hPa" />}
              {owm.main.grnd_level && (
                <DataRow label="Ground Level" value={`${owm.main.grnd_level}`} unit=" hPa"
                  tooltip="Actual pressure at ground level. Lower than sea-level pressure at higher elevations." />
              )}
              {mc?.surface_pressure != null && (
                <DataRow label="Surface Pressure" value={`${mc.surface_pressure.toFixed(1)}`} unit=" hPa"
                  tooltip="Actual pressure at ground level. Lower than sea-level pressure at higher elevations." />
              )}
              {mh?.uv_index && mh.uv_index[nowHourIdx] != null && (
                <DataRow
                  label="UV Index"
                  value={
                    <span style={{ color: uviColor(mh.uv_index[nowHourIdx]) }}>
                      {mh.uv_index[nowHourIdx].toFixed(1)} — {uviLabel(mh.uv_index[nowHourIdx])}
                    </span>
                  }
                  tooltip="Solar UV radiation intensity. 0-2: Low, 3-5: Moderate, 6-7: High, 8-10: Very High, 11+: Extreme."
                />
              )}
              {mh?.cape && mh.cape[nowHourIdx] > 0 && (
                <DataRow label="CAPE" value={`${mh.cape[nowHourIdx].toFixed(0)}`} unit=" J/kg"
                  tooltip="Convective Available Potential Energy. Higher = more thunderstorm potential. >1000 J/kg = significant instability." />
              )}
              {mh?.vapour_pressure_deficit && mh.vapour_pressure_deficit[nowHourIdx] != null && (
                <DataRow label="Vapour Pressure Deficit" value={`${mh.vapour_pressure_deficit[nowHourIdx].toFixed(2)}`} unit=" kPa"
                  tooltip="High VPD (>1.6) = very dry air. Low VPD (<0.4) = very humid." />
              )}
              {mh?.freezing_level_height && mh.freezing_level_height[nowHourIdx] > 0 && (
                <DataRow label="Freezing Level" value={`${mh.freezing_level_height[nowHourIdx].toFixed(0)}`} unit=" m"
                  tooltip="Altitude where temperature reaches 0°C." />
              )}
            </div>

            {/* Sun */}
            <SubHead title="Sun" />
            <div className="space-y-0">
              <DataRow label="Sunrise" value={fmtUnix(owm.sys.sunrise, offset)} />
              <DataRow label="Sunset" value={fmtUnix(owm.sys.sunset, offset)} />
              <DataRow label="Day Length" value={secsToHm(owm.sys.sunset - owm.sys.sunrise)} />
              <DataRow label="Last Updated" value={fmtUnix(owm.dt, offset)} />
            </div>

            {/* Precipitation */}
            <SubHead title="Precipitation" />
            <div className="space-y-0">
              {mc?.rain > 0 && <DataRow label="Rain" value={`${mc.rain.toFixed(1)}`} unit=" mm" />}
              {mc?.showers > 0 && <DataRow label="Showers" value={`${mc.showers.toFixed(1)}`} unit=" mm" />}
              {mc?.snowfall > 0 && <DataRow label="Snowfall" value={`${mc.snowfall.toFixed(1)}`} unit=" cm" />}
              {mh?.evapotranspiration && mh.evapotranspiration[nowHourIdx] > 0 && (
                <DataRow label="Evapotranspiration" value={`${mh.evapotranspiration[nowHourIdx].toFixed(2)}`} unit=" mm"
                  tooltip="Water lost from soil and plants to atmosphere. 1mm/h = 1 litre per square metre." />
              )}
              {(!mc || (mc.rain === 0 && mc.showers === 0 && mc.snowfall === 0)) && (
                <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>No active precipitation</p>
              )}
            </div>
          </Section>
        ) : (
          <div className="h-48 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
        )}

        {/* ── Hourly Forecast (Open-Meteo) ────────────────────────────── */}
        {mh ? (
          <HourlyMeteoSection mh={mh} startIdx={nowHourIdx} />
        ) : (
          <div className="h-24 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
        )}

        {/* ── Air Quality ──────────────────────────────────────────────── */}
        {air && (
          <Section title="Air Quality" icon={<Wind className="w-4 h-4" style={{ color: 'var(--secondary)' }} />}>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--surface-mid)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: aqiColor(air.main.aqi) }}>
                {air.main.aqi}
              </div>
              <div>
                <p className="font-bold text-sm font-headline" style={{ color: 'var(--text)' }}>{aqiLabel(air.main.aqi)}</p>
                <p className="text-[0.65rem] font-label" style={{ color: 'var(--text-muted)' }}>
                  Air Quality Index (1 = Good, 5 = Very Poor)
                </p>
              </div>
            </div>
            <div className="space-y-0">
              {([
                ['co', 'Carbon Monoxide (CO)'],
                ['no', 'Nitrogen Monoxide (NO)'],
                ['no2', 'Nitrogen Dioxide (NO₂)'],
                ['o3', 'Ozone (O₃)'],
                ['so2', 'Sulphur Dioxide (SO₂)'],
                ['pm2_5', 'Fine Particles (PM2.5)'],
                ['pm10', 'Coarse Particles (PM10)'],
                ['nh3', 'Ammonia (NH₃)'],
              ] as [string, string][]).map(([key, name]) => (
                <DataRow key={key} label={name} value={(air.components[key] as number).toFixed(2)} unit=" μg/m³" />
              ))}
            </div>
          </Section>
        )}

        {/* ── Location Metadata ────────────────────────────────────────── */}
        {owm?.coord && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
            <p className="text-[0.6rem] font-label uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Location Metadata
            </p>
            <div className="space-y-0">
              <DataRow label="City" value={`${owm.name}, ${owm.sys.country}`} />
              <DataRow label="Coordinates" value={`${owm.coord.lat.toFixed(4)}, ${owm.coord.lon.toFixed(4)}`} />
              <DataRow label="UTC Offset" value={`UTC${offset >= 0 ? '+' : ''}${(offset / 3600).toFixed(0)}h`} />
              {forecast?.city?.population > 0 && (
                <DataRow label="Population" value={forecast.city.population.toLocaleString()} />
              )}
            </div>
            <p className="text-[0.55rem] font-label mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
              Data: OpenWeatherMap · Open-Meteo · Air Pollution API
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

// ── Hourly Section (Open-Meteo) ─────────────────────────────────────────────

function HourlyMeteoSection({ mh, startIdx }: { mh: any; startIdx: number }) {
  const [showFull, setShowFull] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const count = showFull ? 48 : 24
  const indices = Array.from({ length: count }, (_, i) => startIdx + i).filter(i => i < mh.time.length)

  return (
    <Section title="Hourly Forecast" icon={<Clock className="w-4 h-4" style={{ color: 'var(--secondary)' }} />}>
      <div className="flex flex-col gap-2">
        {indices.map((idx, pos) => {
          const isNow = pos === 0
          const isOpen = expanded === idx
          const temp = mh.temperature_2m?.[idx]
          const pop = mh.precipitation_probability?.[idx] ?? 0
          const uvi = mh.uv_index?.[idx] ?? 0
          const wmo = mh.weather_code?.[idx] ?? 0
          const isDay = mh.is_day?.[idx] ?? 1

          return (
            <div key={idx}>
              <button
                onClick={() => setExpanded(isOpen ? null : idx)}
                className="w-full rounded-xl p-3 flex items-center gap-3 text-left transition-colors"
                style={{
                  background: isNow ? 'rgba(199,191,255,0.12)' : 'var(--surface-mid)',
                  border: isNow ? '1px solid rgba(199,191,255,0.25)' : '1px solid transparent',
                }}
              >
                <span className="text-[0.68rem] font-label font-bold w-10 flex-shrink-0"
                  style={{ color: isNow ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {isNow ? 'Now' : fmtISOTime(mh.time[idx])}
                </span>
                <span className="text-lg flex-shrink-0">{wmoEmoji(wmo, isDay)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold font-headline" style={{ color: 'var(--text)' }}>
                      {temp?.toFixed(1)}°C
                    </span>
                    {pop > 0 && (
                      <span className="text-[0.65rem] font-label" style={{ color: pop > 50 ? '#60a5fa' : 'var(--text-muted)' }}>
                        {pop}% rain
                      </span>
                    )}
                    {uvi > 0 && (
                      <span className="text-[0.65rem] font-label" style={{ color: uviColor(uvi) }}>
                        UV {uvi.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-[0.7rem] font-body truncate" style={{ color: 'var(--text-muted)' }}>{wmoDesc(wmo)}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                  style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : '' }} />
              </button>

              {isOpen && (
                <div className="mt-1 rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1"
                  style={{ background: 'rgba(39,42,51,0.5)', border: '0.5px solid var(--outline)' }}>
                  {([
                    ['Feels Like', mh.apparent_temperature?.[idx] != null ? `${mh.apparent_temperature[idx].toFixed(1)}°C` : null],
                    ['Dew Point', mh.dew_point_2m?.[idx] != null ? `${mh.dew_point_2m[idx].toFixed(1)}°C` : null],
                    ['Humidity', mh.relative_humidity_2m?.[idx] != null ? `${mh.relative_humidity_2m[idx]}%` : null],
                    ['Pressure', mh.pressure_msl?.[idx] != null ? `${mh.pressure_msl[idx].toFixed(0)} hPa` : null],
                    ['Surface P.', mh.surface_pressure?.[idx] != null ? `${mh.surface_pressure[idx].toFixed(0)} hPa` : null],
                    ['Wind', mh.wind_speed_10m?.[idx] != null ? `${mh.wind_speed_10m[idx].toFixed(1)} km/h ${getWindDir16(mh.wind_direction_10m?.[idx] ?? 0)}` : null],
                    ['Gust', mh.wind_gusts_10m?.[idx] > 0 ? `${mh.wind_gusts_10m[idx].toFixed(1)} km/h` : null],
                    ['Clouds', mh.cloud_cover?.[idx] != null ? `${mh.cloud_cover[idx]}%` : null],
                    ['Low Clouds', mh.cloud_cover_low?.[idx] != null ? `${mh.cloud_cover_low[idx]}%` : null],
                    ['Mid Clouds', mh.cloud_cover_mid?.[idx] != null ? `${mh.cloud_cover_mid[idx]}%` : null],
                    ['High Clouds', mh.cloud_cover_high?.[idx] != null ? `${mh.cloud_cover_high[idx]}%` : null],
                    ['Visibility', mh.visibility?.[idx] != null ? `${(mh.visibility[idx] / 1000).toFixed(1)} km` : null],
                    ['UV Index', mh.uv_index?.[idx] != null ? `${mh.uv_index[idx].toFixed(1)} — ${uviLabel(mh.uv_index[idx])}` : null],
                    ['Precip.', mh.precipitation?.[idx] > 0 ? `${mh.precipitation[idx].toFixed(1)} mm` : null],
                    ['Rain', mh.rain?.[idx] > 0 ? `${mh.rain[idx].toFixed(1)} mm` : null],
                    ['Snow', mh.snowfall?.[idx] > 0 ? `${mh.snowfall[idx].toFixed(1)} cm` : null],
                    ['CAPE', mh.cape?.[idx] > 0 ? `${mh.cape[idx].toFixed(0)} J/kg` : null],
                    ['VPD', mh.vapour_pressure_deficit?.[idx] != null ? `${mh.vapour_pressure_deficit[idx].toFixed(2)} kPa` : null],
                    ['Freezing Lvl', mh.freezing_level_height?.[idx] > 0 ? `${mh.freezing_level_height[idx].toFixed(0)} m` : null],
                    ['Sunshine', mh.sunshine_duration?.[idx] > 0 ? `${Math.round(mh.sunshine_duration[idx] / 60)} min` : null],
                    ['Evapotransp.', mh.evapotranspiration?.[idx] > 0 ? `${mh.evapotranspiration[idx].toFixed(2)} mm` : null],
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
        })}
      </div>
      <button onClick={() => setShowFull(v => !v)}
        className="mt-3 w-full text-center text-xs font-label uppercase tracking-widest py-2 rounded-xl"
        style={{ background: 'var(--surface-mid)', color: 'var(--primary)' }}>
        {showFull ? 'Show 24h' : 'Show 48 Hours'}
      </button>
    </Section>
  )
}

