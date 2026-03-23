'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="w-14 h-7" />

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0"
      style={{
        background: isDark
          ? 'rgba(199,191,255,0.15)'
          : 'rgba(255,184,0,0.2)',
        border: isDark
          ? '1px solid rgba(199,191,255,0.2)'
          : '1px solid rgba(255,184,0,0.3)',
      }}
      aria-label="Toggle theme"
    >
      {/* Track icons */}
      <Moon className="absolute left-1.5 w-3.5 h-3.5 text-[#c7bfff]" />
      <Sun className="absolute right-1.5 w-3.5 h-3.5 text-amber-400" />

      {/* Thumb */}
      <span
        className="absolute w-5 h-5 rounded-full shadow-sm transition-all duration-300"
        style={{
          left: isDark ? '2px' : 'calc(100% - 22px)',
          background: isDark
            ? 'linear-gradient(135deg, #c7bfff, #806EF8)'
            : 'linear-gradient(135deg, #FFB800, #FF8C00)',
        }}
      />
    </button>
  )
}
