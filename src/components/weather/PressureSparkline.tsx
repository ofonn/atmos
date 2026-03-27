'use client'

import { motion } from 'framer-motion'

interface PressureSparklineProps {
  data: number[] // hPa values, recent → oldest (left = oldest, right = newest)
  height?: number
  width?: number
}

export function PressureSparkline({ data, height = 40, width = 120 }: PressureSparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polyline = points.join(' ')
  const trend = data[data.length - 1] - data[0]
  const trendColor = trend > 1 ? '#22c55e' : trend < -1 ? '#ef4444' : '#f59e0b'
  const trendLabel = trend > 1 ? '↑ Rising' : trend < -1 ? '↓ Falling' : '→ Steady'

  // Area fill path
  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${width},${height} L 0,${height} Z`

  return (
    <div className="flex items-end gap-3">
      <svg width={width} height={height + 4} viewBox={`0 0 ${width} ${height + 4}`} className="overflow-visible">
        <defs>
          <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c7bfff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c7bfff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#pressureGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        {/* Line */}
        <motion.polyline
          points={polyline}
          fill="none"
          stroke={trendColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{ pathLength: 1 }}
        />
        {/* End dot */}
        <circle
          cx={parseFloat(points[points.length - 1].split(',')[0])}
          cy={parseFloat(points[points.length - 1].split(',')[1])}
          r={2.5}
          fill={trendColor}
        />
      </svg>
      <span className="text-[10px] font-label font-bold" style={{ color: trendColor }}>
        {trendLabel}
      </span>
    </div>
  )
}
