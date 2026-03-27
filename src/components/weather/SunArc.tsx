'use client'

import { motion } from 'framer-motion'

interface SunArcProps {
  sunrise: number // unix timestamp
  sunset: number  // unix timestamp
  now?: number    // unix timestamp (default: Date.now())
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

  // SVG dimensions — compact like iOS
  const W = 200
  const PAD = 16
  const arcH = 36
  const horizonY = arcH + 8
  const SVGH = horizonY + 6
  const startX = PAD
  const endX = W - PAD

  // Day arc goes UP, night arc goes DOWN
  const cpY = isDay
    ? horizonY - arcH * 2.2
    : horizonY + arcH * 1.6
  const cp1X = startX + (endX - startX) * 0.25
  const cp2X = startX + (endX - startX) * 0.75

  const arcPath = `M ${startX},${horizonY} C ${cp1X},${cpY} ${cp2X},${cpY} ${endX},${horizonY}`

  // Cubic bezier point at parameter t
  const bp = (t: number, p0: number, p1: number, p2: number, p3: number) =>
    (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3

  const dotX = bp(progress, startX, cp1X, cp2X, endX)
  const dotY = bp(progress, horizonY, cpY, cpY, horizonY)

  const fmtTime = (unix: number) =>
    new Date(unix * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })

  const nextEvent = isDay ? sunset : nextSunrise
  const nextEventLabel = isDay ? 'Sunset' : 'Sunrise'
  const oppositeLabel = isDay ? 'Sunrise' : 'Sunset'
  const oppositeTime = isDay ? fmtTime(sunrise) : fmtTime(sunset)

  // Golden hour: last 30 min before sunset
  const isGoldenHour = isDay && (sunset - now) < 1800
  const dotColor = isGoldenHour ? '#f97316' : isDay ? '#fbbf24' : '#a5b4fc'
  const progressColor = isGoldenHour ? '#f97316' : isDay ? '#fbbf24' : '#806EF8'
  const arcTrackColor = isDay ? 'var(--text-muted)' : 'var(--text-muted)'

  return (
    <div
      className="rounded-2xl p-4 flex flex-col"
      style={{ background: 'var(--surface-mid)' }}
    >
      {/* Label row — icon + "SUNSET" */}
      <div className="flex items-center gap-1.5 mb-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          {isDay ? (
            <>
              <path d="M12 2v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M18 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 16v5M8 21h8" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M18 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </>
          )}
        </svg>
        <span
          className="text-[10px] font-label uppercase tracking-[0.1em] font-semibold"
          style={{ color: 'var(--text-muted)', opacity: 0.7 }}
        >
          {nextEventLabel}
        </span>
      </div>

      {/* Big time */}
      <p
        className="text-[1.6rem] font-headline font-bold leading-none tracking-tight mb-3"
        style={{ color: 'var(--text)' }}
      >
        {fmtTime(nextEvent)}
      </p>

      {/* Arc visualization */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${SVGH}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible mb-2"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={progressColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={progressColor} stopOpacity="1" />
          </linearGradient>
          <filter id="sunGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc track */}
        <path
          d={arcPath}
          fill="none"
          stroke={arcTrackColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
        />

        {/* Progress fill */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke="url(#sunArcGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
        />

        {/* Horizon dashes */}
        <line
          x1={startX}
          y1={horizonY}
          x2={endX}
          y2={horizonY}
          stroke="var(--text-muted)"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.2"
        />

        {/* Sun/Moon dot */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
          style={{ originX: `${dotX}px`, originY: `${dotY}px` }}
        >
          {/* Glow */}
          <circle cx={dotX} cy={dotY} r={8} fill={isGoldenHour ? 'rgba(249,115,22,0.3)' : isDay ? 'rgba(251,191,36,0.3)' : 'rgba(165,180,252,0.25)'} />
          {/* Dot */}
          <circle cx={dotX} cy={dotY} r={5} fill={dotColor} filter="url(#sunGlow)" />
          <circle cx={dotX} cy={dotY} r={2.5} fill="#fff" opacity="0.8" />
        </motion.g>
      </svg>

      {/* Bottom label — "Sunrise: 7:18 AM" */}
      <p
        className="text-[11px] font-label"
        style={{ color: 'var(--text-muted)', opacity: 0.7 }}
      >
        {oppositeLabel}: {oppositeTime}
      </p>
    </div>
  )
}
