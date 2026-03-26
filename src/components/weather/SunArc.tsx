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

  const W = 320
  const H = 72
  const cx = W / 2
  const cy = H + 16
  const r = H + 16

  const startX = cx - r
  const startY = cy
  const endX = cx + r
  const endY = cy

  const angle = Math.PI - progress * Math.PI
  const sunX = cx + r * Math.cos(angle)
  const sunY = cy - r * Math.sin(angle)

  const arcPath = `M ${startX},${startY} A ${r},${r} 0 0,1 ${endX},${endY}`
  const progressPath = `M ${startX},${startY} A ${r},${r} 0 0,1 ${sunX},${sunY}`

  const fmtTime = (unix: number) => {
    const d = new Date(unix * 1000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div className="w-full">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H + 28}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
        aria-label={`Sun arc: sunrise ${fmtTime(sunrise)}, sunset ${fmtTime(sunset)}`}
        role="img"
      >
        {/* Background track */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(199,191,255,0.12)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Animated progress arc */}
        {isDay && (
          <motion.path
            d={progressPath}
            fill="none"
            stroke="url(#sunGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.1 }}
          />
        )}

        <defs>
          <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="sunFill">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <filter id="sunGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizon line */}
        <line
          x1={startX - 6}
          y1={cy}
          x2={endX + 6}
          y2={cy}
          stroke="rgba(199,191,255,0.15)"
          strokeWidth="1"
        />

        {/* Animated sun/moon marker */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.5 }}
          style={{ originX: `${sunX}px`, originY: `${sunY}px` }}
        >
          <motion.g
            animate={{ y: isDay ? [-2, 2, -2] : [0, 0, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Glow ring */}
            <circle
              cx={sunX}
              cy={sunY}
              r={14}
              fill={isDay ? 'rgba(251,191,36,0.15)' : 'rgba(199,191,255,0.1)'}
            />
            {/* Sun circle */}
            <circle
              cx={sunX}
              cy={sunY}
              r={9}
              fill={isDay ? 'url(#sunFill)' : 'rgba(199,191,255,0.5)'}
              filter="url(#sunGlow)"
            />
            <text
              x={sunX}
              y={sunY + 4.5}
              textAnchor="middle"
              fontSize="11"
              style={{ userSelect: 'none' }}
            >
              {isDay ? '☀️' : '🌙'}
            </text>
          </motion.g>
        </motion.g>

        {/* Sunrise label */}
        <text x={startX} y={cy + 18} fontSize="9" fill="rgba(199,191,255,0.5)" textAnchor="start">
          {fmtTime(sunrise)}
        </text>
        {/* Sunset label */}
        <text x={endX} y={cy + 18} fontSize="9" fill="rgba(199,191,255,0.5)" textAnchor="end">
          {fmtTime(sunset)}
        </text>
      </svg>

      {isDay && (
        <p className="text-[10px] font-label text-center -mt-1" style={{ color: 'rgba(199,191,255,0.4)' }}>
          {Math.round((sunset - now) / 3600 * 10) / 10}h daylight remaining
        </p>
      )}
    </div>
  )
}
