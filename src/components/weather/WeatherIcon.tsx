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
  size?: number
  className?: string
}

export function WeatherIcon({
  conditionCode,
  iconCode,
  size = 48,
  className = '',
}: WeatherIconProps) {
  const isNight = iconCode?.includes('n')

  const getIcon = () => {
    if (conditionCode >= 200 && conditionCode < 300)
      return <CloudLightning size={size} className={`text-violet-400 ${className}`} />
    if (conditionCode >= 300 && conditionCode < 400)
      return <CloudDrizzle size={size} className={`text-blue-300 ${className}`} />
    if (conditionCode >= 500 && conditionCode < 600)
      return <CloudRain size={size} className={`text-blue-400 ${className}`} />
    if (conditionCode >= 600 && conditionCode < 700)
      return <CloudSnow size={size} className={`text-indigo-200 ${className}`} />
    if (conditionCode >= 700 && conditionCode < 800)
      return <CloudFog size={size} className={`text-slate-400 ${className}`} />
    if (conditionCode === 800) {
      return isNight
        ? <Moon size={size} className={`text-amber-200 ${className}`} />
        : <Sun size={size} className={`text-amber-300 ${className}`} />
    }
    if (conditionCode === 801) {
      return isNight
        ? <CloudMoon size={size} className={`text-slate-300 ${className}`} />
        : <CloudSun size={size} className={`text-blue-200 ${className}`} />
    }
    return <Cloud size={size} className={`text-slate-400 ${className}`} />
  }

  return <>{getIcon()}</>
}
