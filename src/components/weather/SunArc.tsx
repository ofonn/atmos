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

  // Approximate next sunrise (+24h from today's sunrise)
  const nextSunrise = sunrise + 86400

  // Progress 0→1 along the current arc phase
  const progress = isDay
    ? Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)))
    : now < sunrise
      ? 0
      : Math.max(0, Math.min(1, (now - sunset) / (nextSunrise - sunset)))

  const W = 300
  const PAD = 14
  const arcH = 58 // peak height above/below horizon
  const horizonY = arcH + 18
  const SVGH = horizonY + 26
  const startX = PAD
  const endX = W - PAD

  // Bezier control points — day arcs UP, night arcs DOWN
  const cpY = isDay
    ? horizonY - arcH * 2.3   // above horizon
    : horizonY + arcH * 1.8   // below horizon
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
  const nextEventLabel = isDay ? 'SUNSET' : 'SUNRISE'
  const leftLabel = isDay ? fmtTime(sunrise) : fmtTime(sunset)
  const rightLabel = isDay ? fmtTime(sunset) : fmtTime(nextSunrise)

  const hoursLeft = (nextEvent - now) / 3600
  const timeLeftStr = hoursLeft >= 1
    ? `${Math.floor(hoursLeft)}h ${Math.round((hoursLeft % 1) * 60)}m`
    : `${Math.round(hoursLeft * 60)}m`

  // Golden hour: last 30 min before sunset
  const isGoldenHour = isDay && (sunset - now) < 1800
  const dotColor = isGoldenHour ? '#f97316' : isDay ? '#fbbf24' : '#a5b4fc'
  const glowColor = isGoldenHour ? 'rgba(249,115,22,0.4)' : isDay ? 'rgba(251,191,36,0.35)' : 'rgba(165,180,252,0.3)'
  const progressColor = isGoldenHour ? '#f97316' : isDay ? '#fbbf24' : '#806EF8'

  return (
    <div className="w-full">
      {/* iOS-style header — "SUNSET · 6:03 PM · in 2h 14m" */}
      <div className="flex items-baseline gap-2 mb-0.5 px-0.5">
        <span className="text-[9px] font-label uppercase tracking-[0.12em] font-semibold" style={{ color: 'var(--text-muted)', opacity: 0.65 }}>
          {nextEventLabel}
        </span>
        <span className="text-sm font-bold font-headline leading-none" style={{ color: 'var(--text)' }}>
          {fmtTime(nextEvent)}
        </span>
        {hoursLeft > 0 && hoursLeft < 24 && (
          <span className="text-[10px] font-label ml-auto" style={{ color: 'var(--text-muted)', opacity: 0.55 }}>
            {timeLeftStr}
          </span>
        )}
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${SVGH}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="sunDotGrad">
            <stop offset="0%" stopColor={isDay ? '#fde68a' : '#e0e7ff'} />
            <stop offset="100%" stopColor={dotColor} />
          </radialGradient>
          <filter id="sunDotGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="arcProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={progressColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={progressColor} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Background arc track */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--outline)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Animated progress fill */}
        <motion.path
          d={arcPath}
          fill="none"
          stroke="url(#arcProgressGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.15 }}
        />

        {/* Horizon line */}
        <line
          x1={startX - 4}
          y1={horizonY}
          x2={endX + 4}
          y2={horizonY}
          stroke="var(--outline)"
          strokeWidth="1"
          opacity="0.35"
        />

        {/* Sun / Moon dot with float animation */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.45 }}
          style={{ originX: `${dotX}px`, originY: `${dotY}px` }}
        >
          <motion.g
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: isDay ? 3 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Soft glow halo */}
            <circle cx={dotX} cy={dotY} r={13} fill={glowColor} />
            {/* Main dot */}
            <circle cx={dotX} cy={dotY} r={8} fill="url(#sunDotGrad)" filter="url(#sunDotGlow)" />
            {/* Emoji */}
            <text
              x={dotX}
              y={dotY + 4.5}
              textAnchor="middle"
              fontSize="10"
              style={{ userSelect: 'none' }}
            >
              {isDay ? '☀️' : '🌙'}
            </text>
          </motion.g>
        </motion.g>

        {/* Sunrise/sunset time labels on horizon */}
        <text x={startX} y={horizonY + 17} fontSize="9" fill="var(--text-muted)" textAnchor="start" opacity="0.65">
          {leftLabel}
        </text>
        <text x={endX} y={horizonY + 17} fontSize="9" fill="var(--text-muted)" textAnchor="end" opacity="0.65">
          {rightLabel}
        </text>
      </svg>
    </div>
  )
}
