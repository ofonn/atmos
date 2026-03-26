'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number // ms
  format?: (n: number) => string
  className?: string
  style?: React.CSSProperties
}

export function AnimatedNumber({ value, duration = 800, format, className, style }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = prevRef.current
    const end = value
    if (start === end) return

    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const current = start + (end - start) * eased
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(end)
        prevRef.current = end
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const text = format ? format(display) : Math.round(display).toString()

  return (
    <span className={className} style={style}>
      {text}
    </span>
  )
}
