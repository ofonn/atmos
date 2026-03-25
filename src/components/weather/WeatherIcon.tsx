'use client'

import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  Moon,
  CloudMoon,
} from 'lucide-react'

interface WeatherIconProps {
  conditionCode: number
  iconCode?: string
  isDay?: boolean
  size?: number
  className?: string
}

export function WeatherIcon({
  conditionCode,
  iconCode,
  isDay = true,
  size = 48,
  className = '',
}: WeatherIconProps) {
  // Support both: explicit isDay prop, or legacy iconCode 'n' check
  const night = isDay === false || iconCode?.includes('n')

  const getIcon = () => {
    // WMO codes (0-99) — used by Open-Meteo
    if (conditionCode >= 0 && conditionCode < 100) {
      if (conditionCode === 0 || conditionCode === 1) {
        return night
          ? <Moon size={size} className={`text-amber-500 dark:text-amber-200 ${className}`} />
          : <Sun size={size} className={`text-amber-500 dark:text-amber-300 ${className}`} />
      }
      if (conditionCode === 2) {
        return night
          ? <CloudMoon size={size} className={`text-slate-600 dark:text-slate-300 ${className}`} />
          : <CloudSun size={size} className={`text-blue-500 dark:text-blue-200 ${className}`} />
      }
      if (conditionCode === 3)
        return <Cloud size={size} className={`text-slate-500 dark:text-slate-400 ${className}`} />
      if (conditionCode >= 45 && conditionCode <= 48)
        return <CloudFog size={size} className={`text-slate-500 dark:text-slate-400 ${className}`} />
      if (conditionCode >= 51 && conditionCode <= 57)
        return <CloudDrizzle size={size} className={`text-blue-500 dark:text-blue-300 ${className}`} />
      if (conditionCode >= 61 && conditionCode <= 67)
        return <CloudRain size={size} className={`text-blue-600 dark:text-blue-400 ${className}`} />
      if (conditionCode >= 71 && conditionCode <= 77)
        return <CloudSnow size={size} className={`text-indigo-500 dark:text-indigo-200 ${className}`} />
      if (conditionCode >= 80 && conditionCode <= 82)
        return <CloudRain size={size} className={`text-blue-600 dark:text-blue-400 ${className}`} />
      if (conditionCode >= 85 && conditionCode <= 86)
        return <CloudSnow size={size} className={`text-indigo-500 dark:text-indigo-200 ${className}`} />
      if (conditionCode >= 95)
        return <CloudLightning size={size} className={`text-violet-600 dark:text-violet-400 ${className}`} />
      // Fallback for unknown WMO codes
      return <Cloud size={size} className={`text-slate-500 dark:text-slate-400 ${className}`} />
    }

    // Legacy OWM codes (200-999) — kept for backward compatibility
    if (conditionCode >= 200 && conditionCode < 300)
      return <CloudLightning size={size} className={`text-violet-600 dark:text-violet-400 ${className}`} />
    if (conditionCode >= 300 && conditionCode < 400)
      return <CloudDrizzle size={size} className={`text-blue-500 dark:text-blue-300 ${className}`} />
    if (conditionCode >= 500 && conditionCode < 600)
      return <CloudRain size={size} className={`text-blue-600 dark:text-blue-400 ${className}`} />
    if (conditionCode >= 600 && conditionCode < 700)
      return <CloudSnow size={size} className={`text-indigo-500 dark:text-indigo-200 ${className}`} />
    if (conditionCode >= 700 && conditionCode < 800)
      return <CloudFog size={size} className={`text-slate-500 dark:text-slate-400 ${className}`} />
    if (conditionCode === 800) {
      return night
        ? <Moon size={size} className={`text-amber-500 dark:text-amber-200 ${className}`} />
        : <Sun size={size} className={`text-amber-500 dark:text-amber-300 ${className}`} />
    }
    if (conditionCode === 801) {
      return night
        ? <CloudMoon size={size} className={`text-slate-600 dark:text-slate-300 ${className}`} />
        : <CloudSun size={size} className={`text-blue-500 dark:text-blue-200 ${className}`} />
    }
    return <Cloud size={size} className={`text-slate-500 dark:text-slate-400 ${className}`} />
  }

  return <>{getIcon()}</>
}
