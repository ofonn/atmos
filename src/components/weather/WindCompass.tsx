'use client'

import { useEffect } from 'react'
import { motion, useSpring } from 'framer-motion'

interface WindCompassProps {
  degrees: number
  speed: number
  unit: string
}

const DIR_LABELS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

export function WindCompass({ degrees, speed, unit }: WindCompassProps) {
  const size = 120
  const pad = 14           // extra space around the ring so labels aren't clipped
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8
  const arrowLen = r * 0.65

  // 16-point direction label
  const idx = Math.round(degrees / 22.5) % 16
  const dirLabel = DIR_LABELS[idx]

  // Spring-animated rotation
  const springDeg = useSpring(degrees, { stiffness: 60, damping: 20 })
  useEffect(() => { springDeg.set(degrees) }, [degrees, springDeg])

  return (
    <div className="flex flex-col items-center gap-1">
      {/*
        viewBox is expanded by `pad` on all sides so the cardinal labels
        (which sit `r + 12` from center) don't get cropped.
        The rendered width/height stays 120px — only the visible area grows.
      */}
      <svg
        width={size}
        height={size}
        viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
        aria-hidden="true"
      >
        {/* Rings */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--outline)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="var(--outline)" strokeWidth="0.5" opacity="0.35" />

        {/* Cardinal ticks + labels — static, outside the rotating group */}
        {(['N', 'E', 'S', 'W'] as const).map((label, i) => {
          const rad = ((i * 90 - 90) * Math.PI) / 180
          const x1 = cx + Math.cos(rad) * (r - 6)
          const y1 = cy + Math.sin(rad) * (r - 6)
          const x2 = cx + Math.cos(rad) * r
          const y2 = cy + Math.sin(rad) * r
          const tx = cx + Math.cos(rad) * (r + 12)
          const ty = cy + Math.sin(rad) * (r + 12)
          return (
            <g key={label}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth="1.5" />
              <text x={tx} y={ty + 3} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="600">
                {label}
              </text>
            </g>
          )
        })}

        {/* Intercardinal ticks */}
        {[45, 135, 225, 315].map(angle => {
          const rad = ((angle - 90) * Math.PI) / 180
          return (
            <line
              key={angle}
              x1={cx + Math.cos(rad) * (r - 3)}
              y1={cy + Math.sin(rad) * (r - 3)}
              x2={cx + Math.cos(rad) * r}
              y2={cy + Math.sin(rad) * r}
              stroke="var(--outline)"
              strokeWidth="1"
            />
          )
        })}

        {/*
          Arrow drawn pointing UP (north = 0°).
          CSS rotate via style prop — the only way framer-motion reliably
          animates SVG element rotation. transformOrigin anchors it at center.
          Wind direction = where wind comes FROM, so arrow points toward source bearing.
        */}
        <motion.g
          style={{
            rotate: springDeg,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          {/* Shaft */}
          <line
            x1={cx} y1={cy + arrowLen * 0.3}
            x2={cx} y2={cy - arrowLen + 6}
            stroke="#c7bfff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Arrowhead */}
          <polygon
            points={`${cx},${cy - arrowLen - 2} ${cx - 5},${cy - arrowLen + 7} ${cx + 5},${cy - arrowLen + 7}`}
            fill="#c7bfff"
          />
          {/* Tail feathers */}
          <line x1={cx} y1={cy + arrowLen * 0.3} x2={cx - 5} y2={cy + arrowLen * 0.55} stroke="#c7bfff" strokeWidth="1.5" opacity="0.5" />
          <line x1={cx} y1={cy + arrowLen * 0.3} x2={cx + 5} y2={cy + arrowLen * 0.55} stroke="#c7bfff" strokeWidth="1.5" opacity="0.5" />
        </motion.g>

        {/* Center pivot dot — drawn last so it's always on top */}
        <circle cx={cx} cy={cy} r={3.5} fill="var(--primary)" />
      </svg>

      <p className="text-xs font-bold font-headline" style={{ color: 'var(--text)' }}>
        {speed} {unit} {dirLabel}
      </p>
    </div>
  )
}
