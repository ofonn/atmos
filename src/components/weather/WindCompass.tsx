'use client'

import { motion } from 'framer-motion'

interface WindCompassProps {
  degrees: number
  speed: number
  unit: string
}

const DIR_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export function WindCompass({ degrees, speed, unit }: WindCompassProps) {
  const cardinals = ['N', 'E', 'S', 'W']
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8

  // Direction label
  const idx = Math.round(degrees / 45) % 8
  const dirLabel = DIR_LABELS[idx]

  // Arrow endpoint (FROM which direction the wind blows, pointing toward)
  const rad = ((degrees - 90) * Math.PI) / 180
  const arrowLen = r * 0.6
  const ax = cx + Math.cos(rad) * arrowLen
  const ay = cy + Math.sin(rad) * arrowLen

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--outline)" strokeWidth="1.5" />
        {/* Inner rings */}
        <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="var(--outline)" strokeWidth="0.5" opacity="0.4" />

        {/* Cardinal ticks + labels */}
        {[0, 90, 180, 270].map((angle, i) => {
          const a = ((angle - 90) * Math.PI) / 180
          const x1 = cx + Math.cos(a) * (r - 2)
          const y1 = cy + Math.sin(a) * (r - 2)
          const x2 = cx + Math.cos(a) * (r + 4)
          const y2 = cy + Math.sin(a) * (r + 4)
          const tx = cx + Math.cos(a) * (r + 12)
          const ty = cy + Math.sin(a) * (r + 12)
          return (
            <g key={angle}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth="1.5" />
              <text x={tx} y={ty + 3} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="600">
                {cardinals[i]}
              </text>
            </g>
          )
        })}

        {/* Intercardinal ticks (smaller) */}
        {[45, 135, 225, 315].map(angle => {
          const a = ((angle - 90) * Math.PI) / 180
          const x1 = cx + Math.cos(a) * (r - 2)
          const y1 = cy + Math.sin(a) * (r - 2)
          const x2 = cx + Math.cos(a) * r
          const y2 = cy + Math.sin(a) * r
          return (
            <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--outline)" strokeWidth="1" />
          )
        })}

        {/* Animated wind arrow */}
        <motion.g
          animate={{ rotate: degrees }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Arrow shaft */}
          <line
            x1={cx}
            y1={cy + arrowLen * 0.3}
            x2={cx}
            y2={cy - arrowLen}
            stroke="#c7bfff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Arrowhead */}
          <polygon
            points={`${cx},${cy - arrowLen - 6} ${cx - 5},${cy - arrowLen + 4} ${cx + 5},${cy - arrowLen + 4}`}
            fill="#c7bfff"
          />
          {/* Tail feathers */}
          <line
            x1={cx}
            y1={cy + arrowLen * 0.3}
            x2={cx - 5}
            y2={cy + arrowLen * 0.5}
            stroke="#c7bfff"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1={cx}
            y1={cy + arrowLen * 0.3}
            x2={cx + 5}
            y2={cy + arrowLen * 0.5}
            stroke="#c7bfff"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </motion.g>

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3.5} fill="var(--primary)" />
      </svg>
      <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>
        {speed} {unit} {dirLabel}
      </p>
    </div>
  )
}
