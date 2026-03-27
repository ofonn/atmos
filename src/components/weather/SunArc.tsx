'use client'

import { motion } from 'framer-motion'

interface SunArcProps {
  sunrise: number // unix timestamp (seconds)
  sunset: number  // unix timestamp (seconds)
  now?: number    // unix timestamp (seconds, default: Date.now())
}

export function SunArc({ sunrise, sunset, now: nowProp }: SunArcProps) {
  const now = nowProp ?? Date.now() / 1000
  const isDay = now >= sunrise && now <= sunset
  const nextSunrise = sunrise + 86400

  const progress = isDay
    ? Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)))
    : now < sunrise
      ? 0
      : Math.max(0, Math.min(1, (now - sunset) / (nextSunrise - sunset)))

  // ── Arc geometry (matches iOS Weather proportions) ───────────────────────
  const W = 220
  const PAD = 14
  const horizonY = 56
  const peakH = 46         // arc peak above/below horizon
  const SVGH = 70
  const startX = PAD
  const endX = W - PAD
  const cp1X = startX + (endX - startX) * 0.25
  const cp2X = startX + (endX - startX) * 0.75
  const cpY = isDay ? horizonY - peakH : horizonY + peakH

  const arcPath = `M ${startX},${horizonY} C ${cp1X},${cpY} ${cp2X},${cpY} ${endX},${horizonY}`

  const bp = (t: number, p0: number, p1: number, p2: number, p3: number) =>
    (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3

  const dotX = bp(progress, startX, cp1X, cp2X, endX)
  const dotY = bp(progress, horizonY, cpY, cpY, horizonY)

  // ── Time helpers ─────────────────────────────────────────────────────────
  const fmtTime = (unix: number) =>
    new Date(unix * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })

  // ── Derived values ────────────────────────────────────────────────────────
  const nextEvent = isDay ? sunset : nextSunrise
  const nextEventLabel = isDay ? 'SUNSET' : 'SUNRISE'
  const oppositeLabel = isDay ? 'Sunrise' : 'Sunset'
  const oppositeTime = isDay ? sunrise : sunset

  const dayLengthSecs = sunset - sunrise
  const dayLengthH = Math.floor(dayLengthSecs / 3600)
  const dayLengthM = Math.floor((dayLengthSecs % 3600) / 60)
  const solarNoon = (sunrise + sunset) / 2
  const goldenHour = sunset - 3600        // ~1 h before sunset
  const dawn = sunrise - 1800             // ~30 min before sunrise (civil twilight approx)

  const isGoldenHour = isDay && (sunset - now) < 3600
  const dotColor = isGoldenHour ? '#f97316' : isDay ? '#fbbf24' : '#a5b4fc'

  return (
    <div
      className="rounded-2xl p-4 flex flex-col"
      style={{ background: 'var(--surface-mid)' }}
    >
      {/* ── Label row ── */}
      <div className="flex items-center gap-1.5 mb-1">
        {/* Sun icon matching iOS style */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ color: 'var(--text-muted)', opacity: 0.55 }}>
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
          <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
          <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
          {isDay && <><line x1="12" y1="17" x2="12" y2="22" /><line x1="9" y1="21" x2="15" y2="21" /></>}
        </svg>
        <span
          className="text-[9px] font-label uppercase tracking-widest font-semibold"
          style={{ color: 'var(--text-muted)', opacity: 0.6 }}
        >
          {nextEventLabel}
        </span>
      </div>

      {/* ── Big time — iOS dominant element ── */}
      <p
        className="font-headline font-bold leading-none tracking-tight mb-2.5"
        style={{ fontSize: '1.9rem', color: 'var(--text)' }}
      >
        {fmtTime(nextEvent)}
      </p>

      {/* ── Arc SVG ── */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${SVGH}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
        style={{ marginBottom: '8px' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="sunGlowArc" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="arcFillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--text)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--text)" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Track — very faint, like iOS */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--text)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.14"
        />

        {/* Animated progress — bright, matches iOS */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke="url(#arcFillGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.1 }}
        />

        {/* Dot — solid circle with highlight like iOS */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.3 }}
          style={{ transformOrigin: `${dotX}px ${dotY}px` }}
        >
          {/* Soft glow */}
          <circle cx={dotX} cy={dotY} r={10} fill={dotColor} opacity="0.18" />
          {/* Main dot */}
          <circle cx={dotX} cy={dotY} r={5.5} fill={dotColor} filter="url(#sunGlowArc)" />
          {/* Inner white highlight */}
          <circle cx={dotX - 1.5} cy={dotY - 1.5} r={2} fill="rgba(255,255,255,0.75)" />
        </motion.g>
      </svg>

      {/* ── Opposite event label ── */}
      <p className="text-[11px] font-label mb-3" style={{ color: 'var(--text-muted)', opacity: 0.65 }}>
        {oppositeLabel}: {fmtTime(oppositeTime)}
      </p>

      {/* ── Divider ── */}
      <div className="w-full h-px mb-3" style={{ background: 'var(--outline)' }} />

      {/* ── 4 extra data points ── */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
        <div>
          <p className="text-[8.5px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Day Length</p>
          <p className="text-[12px] font-semibold font-headline" style={{ color: 'var(--text)' }}>
            {dayLengthH}h {dayLengthM}m
          </p>
        </div>
        <div>
          <p className="text-[8.5px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Solar Noon</p>
          <p className="text-[12px] font-semibold font-headline" style={{ color: 'var(--text)' }}>
            {fmtTime(solarNoon)}
          </p>
        </div>
        <div>
          <p className="text-[8.5px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Golden Hour</p>
          <p className="text-[12px] font-semibold font-headline" style={{ color: isGoldenHour ? '#f97316' : 'var(--text)' }}>
            {fmtTime(goldenHour)}
          </p>
        </div>
        <div>
          <p className="text-[8.5px] font-label uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Dawn</p>
          <p className="text-[12px] font-semibold font-headline" style={{ color: 'var(--text)' }}>
            {fmtTime(dawn)}
          </p>
        </div>
      </div>
    </div>
  )
}
