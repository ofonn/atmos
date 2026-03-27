'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { BottomNav } from '@/components/layout/BottomNav'
import { RainTimeline } from '@/components/weather/RainTimeline'
import { WindCompass } from '@/components/weather/WindCompass'
import { MoonPhase } from '@/components/weather/MoonPhase'
import { SunArc } from '@/components/weather/SunArc'
import { PressureSparkline } from '@/components/weather/PressureSparkline'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useAiContent } from '@/hooks/useAiContent'
import { useSettings } from '@/contexts/SettingsContext'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronUp, Wind, Thermometer, Sparkles, Info, Clock,
  ThumbsUp, ThumbsDown, ArrowRight, Radio, Droplets, Eye, Gauge
} from 'lucide-react'
import {
  wmoDesc, wmoEmoji, getWindDir16, secsToHm, fmtISOTime, fmtISOTimeFmt,
  uviColor, uviLabel, aqiColor, aqiLabel,
  displayCelsius,
} from '@/lib/weatherUtils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ── Shared sub-components ────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true, collapsible = true }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; collapsible?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
      <button
        onClick={() => collapsible && setOpen(v => !v)}
        aria-expanded={open}
        disabled={!collapsible}
        className={`w-full flex items-center justify-between px-5 py-4 text-left ${!collapsible && 'cursor-default'}`}
        style={{ borderBottom: open ? '0.5px solid var(--outline)' : 'none' }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-headline font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>{title}</span>
        </div>
        {collapsible && (open
          ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />)}
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

function DataGrid({ items }: { items: { label: string; value: React.ReactNode; accent?: string; icon?: React.ReactNode; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {items.map(({ label, value, accent, icon, sub }) => (
        <motion.div
          key={label}
          className="rounded-xl p-3 flex flex-col"
          style={{ background: 'var(--surface-mid)' }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            {icon && <span className="opacity-60 flex-shrink-0">{icon}</span>}
            <p className="text-[10px] font-label uppercase tracking-widest leading-none" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
          <p className="text-[19px] font-bold font-headline tracking-tight leading-none" style={{ color: accent ?? 'var(--text)' }}>{value}</p>
          {sub && <p className="text-[10px] font-label mt-1 leading-tight" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </motion.div>
      ))}
    </div>
  )
}

function SubHead({ title }: { title: string }) {
  return (
    <p className="text-[0.65rem] font-label uppercase tracking-widest pt-4 pb-2" style={{ color: 'var(--text-muted)' }}>
      {title}
    </p>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TechnicalPage() {
  const router = useRouter()
  const { location, current: ctxCurrent, hourly: ctxHourly, daily: ctxDaily } = useWeatherContext()
  const { content: aiContent } = useAiContent(ctxCurrent, ctxHourly, ctxDaily)
  const { tempUnit, windUnit, timeFormat } = useSettings()
  const fmtWind = (kmh: number) => windUnit === 'mph' ? `${Math.round(kmh * 0.621371)} mph` : `${kmh.toFixed(1)} km/h`

  const { data: meteo } = useSWR(
    location ? `/api/openmeteo?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )
  const { data: airData } = useSWR(
    location ? `/api/airpollution?lat=${location.lat}&lon=${location.lon}` : null,
    fetcher, { refreshInterval: 300000 }
  )

  const mc = meteo?.current
  const mh = meteo?.hourly
  const md = meteo?.daily
  const air = airData?.list?.[0]
  const offset: number = meteo?.utc_offset_seconds ?? 0

  const nowHourIdx = useMemo(() => {
    if (!mh?.time) return 0
    const now = Date.now()
    let closest = 0
    let minDiff = Infinity
    for (let i = 0; i < mh.time.length; i++) {
      const diff = Math.abs(new Date(mh.time[i]).getTime() - now)
      if (diff < minDiff) { minDiff = diff; closest = i }
    }
    return closest
  }, [mh])

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none bg-atmospheric-glow" />

      <header
        className="sticky top-0 z-50 px-6 py-3.5 backdrop-blur-2xl saturate-150"
        style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
      >
        <h1 className="text-xl font-bold tracking-tighter font-headline" style={{ color: 'var(--primary)' }}>Atmos</h1>
      </header>

      <main className="relative z-10 px-4 pb-32 max-w-5xl mx-auto w-full">
        <div className="md:grid md:grid-cols-2 md:gap-8 items-start">
          <div className="md:sticky md:top-20 flex flex-col">
            {/* Title */}
            <div className="mb-6 px-2">
              <h2
                className="text-[2.6rem] font-extrabold font-headline leading-none tracking-tight mb-1"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}
              >
                Conditions
              </h2>
              <div className="flex items-center gap-2">
                {mc && (
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#22c55e' }}
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden="true"
                  />
                )}
                <p className="font-label uppercase tracking-widest text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {mc ? `Updated at ${fmtISOTimeFmt(mc.time, timeFormat)}` : 'Updating…'}
                </p>
              </div>
            </div>

            {/* AI Proactive Insight */}
            <div
              className="rounded-2xl p-5 mb-4 relative overflow-hidden"
              style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
            >
              <div
                className="absolute -right-12 -top-12 w-44 h-44 blur-[70px] rounded-full pointer-events-none"
                style={{ background: 'rgba(199,191,255,0.18)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 mt-1">
                  <h3 className="text-sm font-bold font-headline flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                    Proactive Insight
                    {mc && <span className="text-[10px] uppercase tracking-wider font-normal opacity-60 ml-1 font-label" style={{ color: 'var(--text-muted)' }}>{fmtISOTimeFmt(mc.time, timeFormat)}</span>}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button aria-label="Helpful" className="p-1.5 opacity-40 hover:opacity-100 transition-opacity"><ThumbsUp className="w-3.5 h-3.5" style={{ color: 'var(--text)' }} /></button>
                    <button aria-label="Not helpful" className="p-1.5 opacity-40 hover:opacity-100 transition-opacity"><ThumbsDown className="w-3.5 h-3.5" style={{ color: 'var(--text)' }} /></button>
                  </div>
                </div>
                <p className="text-sm font-body leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                  {aiContent?.proactiveInsight ?? 'Analyzing current conditions…'}
                </p>
                <button
                  onClick={() => document.getElementById('conditions-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 text-[11px] uppercase font-label font-bold tracking-widest transition-opacity hover:opacity-70"
                  style={{ color: 'var(--primary)' }}
                >
                  Show data <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* ── Live Radar Preview Card — desktop: left col, mobile: right col order ── */}
            <button
              onClick={() => router.push('/radar')}
              className="w-full rounded-2xl overflow-hidden relative flex items-center gap-4 px-5 py-4 text-left active:scale-[0.98] transition-transform mb-4"
              style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}
              aria-label="Open live radar"
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(128,110,248,0.6) 0%, rgba(88,150,253,0.4) 50%, transparent 70%)' }}
              />
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              >
                🛰️
              </motion.div>
              <div
                className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #806EF8, #5896FD)' }}
              >
                <Radio className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="relative z-10 flex-1">
                <p className="text-sm font-bold font-headline" style={{ color: 'var(--text)' }}>Live Radar</p>
                <p className="text-[11px] font-label mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {location ? `${location.name} · Powered by RainViewer` : 'Real-time precipitation radar'}
                </p>
              </div>
              <ArrowRight className="relative z-10 w-4 h-4 flex-shrink-0 opacity-40" style={{ color: 'var(--text)' }} aria-hidden="true" />
            </button>

            {/* ── 60-Min Precipitation — desktop: left col ── */}
            {location && (
              <div className="mb-4">
                <RainTimeline lat={location.lat} lon={location.lon} />
              </div>
            )}

          </div>{/* end left col */}

          <div className="flex flex-col gap-4 mt-6 md:mt-0">

        {/* ── UV Warning Banner ──────────────────────────────────────── */}
        {mh && mh.uv_index?.[nowHourIdx] >= 6 && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{
              background: mh.uv_index[nowHourIdx] >= 11
                ? 'rgba(168,85,247,0.15)'
                : mh.uv_index[nowHourIdx] >= 8
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(249,115,22,0.12)',
              border: `1px solid ${uviColor(mh.uv_index[nowHourIdx])}33`,
            }}
          >
            <span className="text-xl flex-shrink-0">☀️</span>
            <div>
              <p className="text-xs font-bold font-headline" style={{ color: uviColor(mh.uv_index[nowHourIdx]) }}>
                UV {mh.uv_index[nowHourIdx].toFixed(0)} — {uviLabel(mh.uv_index[nowHourIdx])}
              </p>
              <p className="text-[11px] font-body" style={{ color: 'var(--text-muted)' }}>
                {mh.uv_index[nowHourIdx] >= 11
                  ? 'Extreme UV — stay inside or use SPF 50+ and cover up completely.'
                  : mh.uv_index[nowHourIdx] >= 8
                    ? 'Very high UV — limit sun exposure, use SPF 30+ and wear a hat.'
                    : 'High UV — apply sunscreen before going outside.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Current Conditions ─────────────────────────────────────── */}
        <div id="conditions-section" />
        {mc ? (
          <Section title="Current Conditions" icon={<Thermometer className="w-4 h-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />}>
            {/* Hero row */}
            <div className="flex items-center gap-4 mb-4 mt-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface-mid)' }}
              >
                <span className="text-3xl" role="img" aria-label={wmoDesc(mc.weather_code)}>
                  {wmoEmoji(mc.weather_code, mc.is_day)}
                </span>
              </div>
              <div>
                <p className="text-3xl font-extrabold font-headline leading-none" style={{ color: 'var(--text)' }}>
                  {displayCelsius(mc.temperature_2m, tempUnit)}
                </p>
                <p className="text-xs mt-1 font-label capitalize" style={{ color: 'var(--text-muted)' }}>
                  {wmoDesc(mc.weather_code)}
                </p>
              </div>
            </div>

            {/* Primary Grid */}
            <SubHead title="Primary Metrics" />
            <DataGrid items={[
              {
                label: 'Temperature',
                value: displayCelsius(mc.temperature_2m, tempUnit),
                icon: <Thermometer className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />,
              },
              {
                label: 'Feels Like',
                value: displayCelsius(mc.apparent_temperature, tempUnit),
                accent: mc.apparent_temperature - mc.temperature_2m >= 4 ? '#f97316'
                  : mc.apparent_temperature - mc.temperature_2m <= -4 ? '#60a5fa' : undefined,
                icon: <Thermometer className="w-3.5 h-3.5" style={{ color: '#f97316' }} />,
              },
              {
                label: 'Humidity',
                value: `${mc.relative_humidity_2m}%`,
                accent: mc.relative_humidity_2m >= 85 ? '#60a5fa' : undefined,
                icon: <Droplets className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />,
                sub: mc.relative_humidity_2m >= 85 ? 'Very humid' : mc.relative_humidity_2m <= 30 ? 'Very dry' : undefined,
              },
              {
                label: 'Wind',
                value: fmtWind(mc.wind_speed_10m),
                icon: <Wind className="w-3.5 h-3.5" style={{ color: 'var(--secondary)' }} />,
                sub: mc.wind_gusts_10m > mc.wind_speed_10m + 8 ? `Gusts ${fmtWind(mc.wind_gusts_10m)}` : undefined,
              },
            ]} />

            <SubHead title="Secondary Metrics" />
            <DataRow label="Feels Like Diff" value={displayCelsius(mc.apparent_temperature - mc.temperature_2m, tempUnit)} />
            {md?.temperature_2m_min?.[0] != null && <DataRow label="Daily Low" value={displayCelsius(md.temperature_2m_min[0], tempUnit)} />}
            {md?.temperature_2m_max?.[0] != null && <DataRow label="Daily High" value={displayCelsius(md.temperature_2m_max[0], tempUnit)} />}
            {mh?.dew_point_2m && (
              <DataRow
                label="Dew Point"
                value={displayCelsius(mh.dew_point_2m[nowHourIdx], tempUnit)}
                tooltip="The temperature at which air becomes saturated and dew forms. Closer to actual temp = more humid it feels."
              />
            )}
            <DataRow label="Wind Direction" value={`${getWindDir16(mc.wind_direction_10m)} (${mc.wind_direction_10m}°)`} />
            {mc.wind_gusts_10m > 0 && <DataRow label="Wind Gust" value={fmtWind(mc.wind_gusts_10m)} />}

            {/* Animated wind compass */}
            <div className="flex justify-center py-3">
              <WindCompass
                degrees={mc.wind_direction_10m}
                speed={parseFloat(fmtWind(mc.wind_speed_10m).split(' ')[0])}
                unit={windUnit === 'mph' ? 'mph' : 'km/h'}
              />
            </div>

            {/* Sky */}
            <SubHead title="Sky" />
            <DataRow label="Condition" value={wmoDesc(mc.weather_code)} />
            <DataRow label="Cloud Cover" value={`${mc.cloud_cover}%`} />
            {mh?.visibility?.[nowHourIdx] != null && (
              <DataRow label="Visibility" value={`${(mh.visibility[nowHourIdx] / 1000).toFixed(1)}`} unit=" km" />
            )}

            {/* Atmosphere */}
            <SubHead title="Atmosphere" />
            <DataRow
              label="Pressure (sea level)"
              value={`${mc.pressure_msl.toFixed(0)}`}
              unit=" hPa"
              tooltip="Atmospheric pressure at sea level. Standard ~1013 hPa. Falling pressure may indicate storms."
            />
            {/* Pressure trend sparkline */}
            {mh?.pressure_msl && (
              <div className="py-2">
                <PressureSparkline
                  data={mh.pressure_msl.slice(Math.max(0, nowHourIdx - 11), nowHourIdx + 1)}
                  height={36}
                  width={110}
                />
              </div>
            )}
            <DataRow
              label="Surface Pressure"
              value={`${mc.surface_pressure.toFixed(1)}`}
              unit=" hPa"
              tooltip="Actual pressure at ground level. Lower than sea-level pressure at higher elevations."
            />
            {mh?.uv_index && mh.uv_index[nowHourIdx] != null && (
              <div className="py-2.5" style={{ borderBottom: '0.5px solid var(--outline)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Eye className="w-3.5 h-3.5 opacity-50" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs font-label" style={{ color: 'var(--text-muted)' }}>UV Index</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold font-headline leading-none" style={{ color: uviColor(mh.uv_index[nowHourIdx]) }}>
                    {mh.uv_index[nowHourIdx].toFixed(0)}
                  </span>
                  <span className="text-sm font-semibold font-headline" style={{ color: uviColor(mh.uv_index[nowHourIdx]) }}>
                    {uviLabel(mh.uv_index[nowHourIdx])}
                  </span>
                </div>
                {/* UV colour scale bar */}
                <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #22c55e 0%, #84cc16 20%, #eab308 35%, #f97316 55%, #ef4444 70%, #a855f7 85%, #7c3aed 100%)' }}>
                  <div
                    className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 rounded-full border-2 border-white"
                    style={{
                      left: `${Math.min(100, (mh.uv_index[nowHourIdx] / 13) * 100)}%`,
                      background: uviColor(mh.uv_index[nowHourIdx]),
                      boxShadow: `0 0 4px ${uviColor(mh.uv_index[nowHourIdx])}`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-label" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>0</span>
                  <span className="text-[9px] font-label" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>11+</span>
                </div>
              </div>
            )}
            {mh?.cape && mh.cape[nowHourIdx] > 0 && (
              <DataRow
                label="CAPE"
                value={`${mh.cape[nowHourIdx].toFixed(0)}`}
                unit=" J/kg"
                tooltip="Convective Available Potential Energy. Higher = more thunderstorm potential. >1000 J/kg = significant instability."
              />
            )}
            {mh?.vapour_pressure_deficit && mh.vapour_pressure_deficit[nowHourIdx] != null && (
              <DataRow
                label="Vapour Pressure Deficit"
                value={`${mh.vapour_pressure_deficit[nowHourIdx].toFixed(2)}`}
                unit=" kPa"
                tooltip="High VPD (>1.6) = very dry air. Low VPD (<0.4) = very humid."
              />
            )}
            {mh?.freezing_level_height && mh.freezing_level_height[nowHourIdx] > 0 && (
              <DataRow
                label="Freezing Level"
                value={`${mh.freezing_level_height[nowHourIdx].toFixed(0)}`}
                unit=" m"
                tooltip="Altitude where temperature reaches 0°C."
              />
            )}

            {/* Sun */}
            <SubHead title="Sun & Moon" />
            {md?.sunrise?.[0] && <DataRow label="Sunrise" value={fmtISOTimeFmt(md.sunrise[0], timeFormat)} />}
            {md?.sunset?.[0] && <DataRow label="Sunset" value={fmtISOTimeFmt(md.sunset[0], timeFormat)} />}
            {md?.sunrise?.[0] && md?.sunset?.[0] && (
              <DataRow label="Day Length" value={secsToHm(
                (new Date(md.sunset[0]).getTime() - new Date(md.sunrise[0]).getTime()) / 1000
              )} />
            )}
            <DataRow label="Last Updated" value={fmtISOTimeFmt(mc.time, timeFormat)} />

            {/* Sun arc visualization */}
            {md?.sunrise?.[0] && md?.sunset?.[0] && (
              <div className="py-3">
                <SunArc
                  sunrise={new Date(md.sunrise[0]).getTime() / 1000}
                  sunset={new Date(md.sunset[0]).getTime() / 1000}
                />
              </div>
            )}

            <div className="py-3">
              <MoonPhase size={36} />
            </div>

            {/* Precipitation */}
            <SubHead title="Precipitation" />
            {mc.rain > 0 && <DataRow label="Rain" value={`${mc.rain.toFixed(1)}`} unit=" mm" />}
            {mc.showers > 0 && <DataRow label="Showers" value={`${mc.showers.toFixed(1)}`} unit=" mm" />}
            {mc.snowfall > 0 && <DataRow label="Snowfall" value={`${mc.snowfall.toFixed(1)}`} unit=" cm" />}
            {mh?.evapotranspiration && mh.evapotranspiration[nowHourIdx] > 0 && (
              <DataRow
                label="Evapotranspiration"
                value={`${mh.evapotranspiration[nowHourIdx].toFixed(2)}`}
                unit=" mm"
                tooltip="Water lost from soil and plants to atmosphere. 1mm/h = 1 litre per square metre."
              />
            )}
            {(mc.rain === 0 && mc.showers === 0 && mc.snowfall === 0) && (
              <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>No active precipitation</p>
            )}
          </Section>
        ) : (
          <div className="h-48 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
        )}

        {/* ── Hourly Forecast (Open-Meteo) ────────────────────────────── */}
        {mh ? (
          <HourlyMeteoSection mh={mh} startIdx={nowHourIdx} tempUnit={tempUnit} windUnit={windUnit} timeFormat={timeFormat} />
        ) : (
          <div className="h-24 rounded-2xl animate-pulse mb-4" style={{ background: 'var(--surface-mid)', opacity: 0.5 }} />
        )}

        {/* ── Air Quality ──────────────────────────────────────────────── */}
        <Section title="Air Quality" icon={<Wind className="w-4 h-4" style={{ color: 'var(--secondary)' }} aria-hidden="true" />}>
          {!airData ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--surface-mid)' }} />
              <div className="h-8 rounded animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.6 }} />
              <div className="h-8 rounded animate-pulse" style={{ background: 'var(--surface-mid)', opacity: 0.4 }} />
            </div>
          ) : !air ? (
            <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
              Air quality data unavailable for this location
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--surface-mid)' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: aqiColor(air.main.aqi) }}
                  aria-label={`AQI ${air.main.aqi}: ${aqiLabel(air.main.aqi)}`}
                >
                  {air.main.aqi}
                </div>
                <div>
                  <p className="font-bold text-sm font-headline" style={{ color: 'var(--text)' }}>{aqiLabel(air.main.aqi)}</p>
                  <p className="text-xs font-label" style={{ color: 'var(--text-muted)' }}>
                    Air Quality Index (1 = Good, 5 = Very Poor)
                  </p>
                </div>
              </div>
              {([
                ['co', 'Carbon Monoxide (CO)'],
                ['no2', 'Nitrogen Dioxide (NO₂)'],
                ['o3', 'Ozone (O₃)'],
                ['so2', 'Sulphur Dioxide (SO₂)'],
                ['pm2_5', 'Fine Particles (PM2.5)'],
                ['pm10', 'Coarse Particles (PM10)'],
              ] as [string, string][]).filter(([key]) => air.components[key] != null).map(([key, name]) => (
                <DataRow key={key} label={name} value={(air.components[key] as number).toFixed(2)} unit=" μg/m³" />
              ))}

              {/* Pollen data if available */}
              {air.pollen && Object.values(air.pollen).some(v => v !== null && (v as number) > 0) && (
                <>
                  <SubHead title="Pollen" />
                  {([
                    ['alder', 'Alder Pollen'],
                    ['birch', 'Birch Pollen'],
                    ['grass', 'Grass Pollen'],
                    ['mugwort', 'Mugwort Pollen'],
                    ['olive', 'Olive Pollen'],
                    ['ragweed', 'Ragweed Pollen'],
                  ] as [string, string][]).filter(([key]) => air.pollen[key] != null && air.pollen[key] > 0).map(([key, name]) => {
                    const val = air.pollen[key] as number
                    const level = val < 10 ? 'Low' : val < 30 ? 'Moderate' : val < 100 ? 'High' : 'Very High'
                    const color = val < 10 ? '#22c55e' : val < 30 ? '#f59e0b' : val < 100 ? '#f97316' : '#ef4444'
                    return (
                      <DataRow
                        key={key}
                        label={name}
                        value={<span style={{ color }}>{val.toFixed(0)} <span className="text-[10px] font-normal">{level}</span></span>}
                        unit=" /m³"
                      />
                    )
                  })}
                </>
              )}
            </>
          )}
        </Section>

        {/* ── Location Metadata ─────────────────────────────────────────── */}
        {location && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--outline)' }}>
            <p className="text-[0.65rem] font-label uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Location Metadata
            </p>
            <DataRow label="City" value={`${location.name}${location.country ? `, ${location.country}` : ''}`} />
            <DataRow label="Coordinates" value={`${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`} />
            <DataRow label="UTC Offset" value={`UTC${offset >= 0 ? '+' : ''}${(offset / 3600).toFixed(0)}h`} />
            <p className="text-[0.65rem] font-label mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
              Data: Open-Meteo · Air Quality API
            </p>
          </div>
        )}
        
        </div> {/* Closes right column */}
        </div> {/* Closes md:grid */}
      </main>

      <BottomNav />
    </div>
  )
}

// ── Hourly Section (Open-Meteo) ─────────────────────────────────────────────

function HourlyMeteoSection({ mh, startIdx, tempUnit, windUnit, timeFormat }: { mh: any; startIdx: number; tempUnit: 'C' | 'F'; windUnit: 'kmh' | 'mph'; timeFormat: '12h' | '24h' }) {
  const fmtWind = (kmh: number) => windUnit === 'mph' ? `${Math.round(kmh * 0.621371)} mph` : `${kmh.toFixed(1)} km/h`
  const [showFull, setShowFull] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const count = showFull ? 48 : 24
  const indices = Array.from({ length: count }, (_, i) => startIdx + i).filter(i => i < mh.time.length)
  const tempSuffix = tempUnit === 'F' ? '°F' : '°C'

  return (
    <Section title="Hourly Forecast" icon={<Clock className="w-4 h-4" style={{ color: 'var(--secondary)' }} aria-hidden="true" />}>
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
                aria-expanded={isOpen}
                className="w-full rounded-xl p-3 flex items-center gap-3 text-left transition-colors"
                style={{
                  background: isNow ? 'rgba(199,191,255,0.12)' : 'var(--surface-mid)',
                  border: isNow ? '1px solid rgba(199,191,255,0.25)' : '1px solid transparent',
                }}
              >
                <span
                  className="text-xs font-label font-bold w-10 flex-shrink-0"
                  style={{ color: isNow ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {isNow ? 'Now' : fmtISOTimeFmt(mh.time[idx], timeFormat)}
                </span>
                <span className="text-lg flex-shrink-0" role="img" aria-label={wmoDesc(wmo)}>
                  {wmoEmoji(wmo, isDay)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold font-headline" style={{ color: 'var(--text)' }}>
                      {temp != null ? displayCelsius(temp, tempUnit) : '—'}
                    </span>
                    {pop > 0 && (
                      <span className="text-xs font-label" style={{ color: pop > 50 ? '#60a5fa' : 'var(--text-muted)' }}>
                        {pop}% rain
                      </span>
                    )}
                    {uvi > 0 && (
                      <span className="text-xs font-label" style={{ color: uviColor(uvi) }}>
                        UV {uvi.toFixed(0)}
                      </span>
                    )}
                    {/* Storm badge — subtle indicator only */}
                    {(wmo >= 95 || (mh.cape?.[idx] >= 1500 && (mh.precipitation_probability?.[idx] ?? 0) >= 50)) && (
                      <span
                        className="text-[9px] font-label px-1 py-0.5 rounded"
                        style={{
                          background: wmo >= 95 ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)',
                          color: wmo >= 95 ? 'rgba(239,68,68,0.65)' : 'rgba(249,115,22,0.65)',
                        }}
                      >
                        {wmo >= 95 ? '⛈' : '⚡'} {wmo >= 95 ? 'Storm' : 'Storm possible'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-body truncate" style={{ color: 'var(--text-muted)' }}>{wmoDesc(wmo)}</p>
                </div>
                <ChevronDown
                  className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                  style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : '' }}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div
                  className="mt-1 rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1"
                  style={{ background: 'var(--surface-mid)', border: '0.5px solid var(--outline)' }}
                >
                  {([
                    ['Feels Like', mh.apparent_temperature?.[idx] != null ? displayCelsius(mh.apparent_temperature[idx], tempUnit) : null],
                    ['Dew Point', mh.dew_point_2m?.[idx] != null ? displayCelsius(mh.dew_point_2m[idx], tempUnit) : null],
                    ['Humidity', mh.relative_humidity_2m?.[idx] != null ? `${mh.relative_humidity_2m[idx]}%` : null],
                    ['Pressure', mh.pressure_msl?.[idx] != null ? `${mh.pressure_msl[idx].toFixed(0)} hPa` : null],
                    ['Surface P.', mh.surface_pressure?.[idx] != null ? `${mh.surface_pressure[idx].toFixed(0)} hPa` : null],
                    ['Wind', mh.wind_speed_10m?.[idx] != null ? `${fmtWind(mh.wind_speed_10m[idx])} ${getWindDir16(mh.wind_direction_10m?.[idx] ?? 0)}` : null],
                    ['Gust', mh.wind_gusts_10m?.[idx] > 0 ? fmtWind(mh.wind_gusts_10m[idx]) : null],
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
                    <div key={label} className="py-1.5" style={{ borderBottom: '0.5px solid var(--outline)' }}>
                      <p className="text-[0.65rem] font-label uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>{val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <button
        onClick={() => setShowFull(v => !v)}
        className="mt-3 w-full text-center text-xs font-label uppercase tracking-widest py-2 rounded-xl"
        style={{ background: 'var(--surface-mid)', color: 'var(--primary)' }}
      >
        {showFull ? 'Show 24h' : 'Show 48 Hours'}
      </button>
    </Section>
  )
}
