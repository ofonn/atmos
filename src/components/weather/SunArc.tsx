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
  const progress = isDay
    ? Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)))
    : now < sunrise ? 0 : 1

  const W = 280
  const H = 80
  const cx = W / 2
  const cy = H + 10
  const r = H + 10

  // Semicircle arc: from left to right, arching up
  // Start point (sunrise): left side
  // End point (sunset): right side
  const startX = cx - r
  const startY = cy
  const endX = cx + r
  const endY = cy

  // Sun position on the arc
  const angle = Math.PI - progress * Math.PI // π (left) → 0 (right)
  const sunX = cx + r * Math.cos(angle)
  const sunY = cy - r * Math.sin(angle)

  const arcPath = `M ${startX},${startY} A ${r},${r} 0 0,1 ${endX},${endY}`
  const progressPath = `M ${startX},${startY} A ${r},${r} 0 0,1 ${sunX},${sunY}`

  const fmtTime = (unix: number) => {
    const d = new Date(unix * 1000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div className="flex flex-col items-center w-full">
      <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} className="overflow-visible">
        {/* Background track */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--outline)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Progress glow */}
        {isDay && (
          <path
            d={progressPath}
            fill="none"
            stroke="url(#sunGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        <defs>
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Horizon line */}
        <line
          x1={startX - 8}
          y1={cy}
          x2={endX + 8}
          y2={cy}
          stroke="var(--outline)"
          strokeWidth="1"
          opacity="0.4"
        />
        {/* Sun/Moon marker */}
        {isDay && (
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <circle
              cx={sunX}
              cy={sunY}
              r={10}
              fill="url(#sunFill)"
              filter="url(#sunGlow)"
            />
            <text
              x={sunX}
              y={sunY + 4}
              textAnchor="middle"
              fontSize="10"
              style={{ userSelect: 'none' }}
            >
              ☀️
            </text>
          </motion.g>
        )}
        <defs>
          <radialGradient id="sunFill">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <filter id="sunGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Sunrise label */}
        <text x={startX - 2} y={cy + 16} fontSize="9" fill="var(--text-muted)" textAnchor="middle">
          {fmtTime(sunrise)}
        </text>
        {/* Sunset label */}
        <text x={endX + 2} y={cy + 16} fontSize="9" fill="var(--text-muted)" textAnchor="middle">
          {fmtTime(sunset)}
        </text>
      </svg>
      {isDay && (
        <p className="text-[10px] font-label mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {Math.round((sunset - now) / 3600 * 10) / 10}h of daylight remaining
        </p>
      )}
    </div>
  )
}
