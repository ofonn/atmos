'use client'

import { useEffect } from 'react'
import { useWeatherContext } from '@/contexts/WeatherContext'
import { useTheme } from 'next-themes'

export function WeatherMoodProvider() {
  const { current } = useWeatherContext()
  const { resolvedTheme } = useTheme()


  useEffect(() => {
    let glowTop = ''
    let glowBl = ''
    let glowBr = ''
    let primary = ''
    let gradFrom = ''
    let gradTo = ''
    
    if (current) {
      const { conditionCode, temp } = current
      const isDark = resolvedTheme === 'dark'
      
      if (conditionCode >= 200 && conditionCode < 300) {
        // Thunderstorm -> Deep purple / Red tint
        glowTop = isDark ? 'rgba(107, 33, 168, 0.75)' : 'rgba(168, 85, 247, 0.25)'
        glowBl = isDark ? 'rgba(153, 27, 27, 0.15)' : 'rgba(239, 68, 68, 0.08)'
        glowBr = isDark ? 'rgba(88, 28, 135, 0.15)' : 'rgba(147, 51, 234, 0.08)'
        primary = '#9333ea' // purple-600
        gradFrom = '#9333ea'
        gradTo = '#ef4444' // red-500
      } else if ((conditionCode >= 300 && conditionCode < 600) || conditionCode === 701) {
        // Rain/Drizzle -> Deep Blue / Slate
        glowTop = isDark ? 'rgba(30, 58, 138, 0.75)' : 'rgba(59, 130, 246, 0.25)'
        glowBl = isDark ? 'rgba(71, 85, 105, 0.15)' : 'rgba(100, 116, 139, 0.08)'
        glowBr = isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.08)'
        primary = '#2563eb' // blue-600
        gradFrom = '#2563eb'
        gradTo = '#38bdf8' // sky-400
      } else if (conditionCode >= 600 && conditionCode < 700) {
        // Snow -> Cyan / White
        glowTop = isDark ? 'rgba(8, 145, 178, 0.75)' : 'rgba(6, 182, 212, 0.25)'
        glowBl = isDark ? 'rgba(224, 242, 254, 0.15)' : 'rgba(186, 230, 253, 0.15)'
        glowBr = isDark ? 'rgba(14, 165, 233, 0.1)' : 'rgba(56, 189, 248, 0.1)'
        primary = '#0891b2' // cyan-600
        gradFrom = '#0891b2'
        gradTo = '#7dd3fc' // sky-300
      } else if (conditionCode === 800 || conditionCode === 801) {
        // Clear/Mostly Clear
        if (temp > 30) {
          // Hot -> Orange / Red
          glowTop = isDark ? 'rgba(194, 65, 12, 0.75)' : 'rgba(249, 115, 22, 0.25)'
          glowBl = isDark ? 'rgba(220, 38, 38, 0.12)' : 'rgba(239, 68, 68, 0.08)'
          glowBr = isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(250, 204, 21, 0.08)'
          primary = '#ea580c' // orange-600
          gradFrom = '#ea580c'
          gradTo = '#ef4444' // red-500
        } else if (temp < 5) {
          // Cold -> Light blue
          glowTop = isDark ? 'rgba(2, 132, 199, 0.75)' : 'rgba(14, 165, 233, 0.25)'
          glowBl = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(125, 211, 252, 0.08)' 
          primary = '#0284c7'
          gradFrom = '#0284c7'
          gradTo = '#38bdf8'
        }
      }
      // Else (Clouds > 801 or moderate temp clear) default to the Atmos purple
    }
    
    // Apply to document.documentElement style
    const root = document.documentElement
    
    if (glowTop) root.style.setProperty('--glow-top', glowTop)
    else root.style.removeProperty('--glow-top')
    
    if (glowBl) root.style.setProperty('--glow-bl', glowBl)
    else root.style.removeProperty('--glow-bl')

    if (glowBr) root.style.setProperty('--glow-br', glowBr)
    else root.style.removeProperty('--glow-br')
    
    if (primary) root.style.setProperty('--primary', primary)
    else root.style.removeProperty('--primary')

    if (gradFrom) root.style.setProperty('--gradient-text-from', gradFrom)
    else root.style.removeProperty('--gradient-text-from')

    if (gradTo) root.style.setProperty('--gradient-text-to', gradTo)
    else root.style.removeProperty('--gradient-text-to')

  }, [current, resolvedTheme])

  return null
}
