'use client'

import type { CurrentWeatherData } from '@/types/weather'

interface CurrentWeatherProps {
  data: CurrentWeatherData
}

function getProactiveHeadline(data: CurrentWeatherData): { headline: string; advice: string } {
  const temp = data.temp
  const code = data.conditionCode

  // WMO codes (0-99)
  if (code >= 95) {
    return {
      headline: "Thunderstorms are rolling in.",
      advice: "Stay indoors and avoid open areas until the storm passes.",
    }
  }
  if (code >= 51 && code <= 57) {
    return {
      headline: "A light drizzle is falling.",
      advice: "Carry a light jacket or umbrella if you're heading out.",
    }
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      headline: "It's raining outside.",
      advice: "Bring an umbrella and wear waterproof shoes today.",
    }
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      headline: "Snow is expected today.",
      advice: "Bundle up and watch for icy patches on roads.",
    }
  }
  if (code >= 45 && code <= 48) {
    return {
      headline: "Visibility is low today.",
      advice: "Drive carefully and use fog lights if needed.",
    }
  }
  if (temp >= 35) {
    return {
      headline: "It's going to be hot today.",
      advice: "Stay hydrated and seek shade during peak hours.",
    }
  }
  if (temp >= 25) {
    return {
      headline: "Warm and pleasant today.",
      advice: "Great weather for outdoor activities. Wear sunscreen.",
    }
  }
  if (temp >= 15) {
    return {
      headline: "It's a mild day ahead.",
      advice: "A light layer should keep you comfortable.",
    }
  }
  if (temp >= 5) {
    return {
      headline: "It's getting chilly out.",
      advice: "Wear a warm jacket and consider layers.",
    }
  }
  return {
    headline: "It's freezing cold today.",
    advice: "Dress in heavy layers and limit time outdoors.",
  }
}

function getWeatherGradient(code: number): string {
  // WMO codes
  if (code >= 95) return 'from-[#2D1B69] via-[#1a1040] to-[#10131c]'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'from-[#1B3A5C] via-[#152238] to-[#10131c]'
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'from-[#3A4A6B] via-[#1e2a40] to-[#10131c]'
  if (code === 0 || code === 1) return 'from-[#4329b8] via-[#1a1040] to-[#10131c]'
  return 'from-[#4329b8] via-[#1a1040] to-[#10131c]'
}

function get3DIconStyle(code: number): { bg: string; glow: string } {
  // WMO codes
  if (code >= 95) return {
    bg: 'from-[#8B5CF6] via-[#6D28D9] to-[#4C1D95]',
    glow: 'rgba(139, 92, 246, 0.4)',
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return {
    bg: 'from-[#60A5FA] via-[#3B82F6] to-[#2563EB]',
    glow: 'rgba(96, 165, 250, 0.4)',
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return {
    bg: 'from-[#E0E7FF] via-[#C7D2FE] to-[#A5B4FC]',
    glow: 'rgba(165, 180, 252, 0.4)',
  }
  if (code === 0 || code === 1) return {
    bg: 'from-[#FFF7CC] via-[#FFA500] to-[#FF8C00]',
    glow: 'rgba(255, 165, 0, 0.4)',
  }
  if (code === 2 || code === 3) return {
    bg: 'from-[#94A3B8] via-[#64748B] to-[#475569]',
    glow: 'rgba(148, 163, 184, 0.3)',
  }
  return {
    bg: 'from-[#FFF7CC] via-[#FFA500] to-[#FF8C00]',
    glow: 'rgba(255, 165, 0, 0.4)',
  }
}

export function CurrentWeather({ data }: CurrentWeatherProps) {
  const { headline, advice } = getProactiveHeadline(data)
  const iconStyle = get3DIconStyle(data.conditionCode)

  // Split headline to apply gradient to last two words
  const words = headline.replace('.', '').split(' ')
  const gradientWords = words.slice(-2).join(' ') + '.'
  const plainWords = words.slice(0, -2).join(' ') + ' '

  return (
    <section className="flex-1 flex flex-col justify-center relative bg-atmospheric-glow px-6">
      {/* 3D Weather Icon + Temperature */}
      <div className="flex items-center gap-6 mb-10 -translate-y-4">
        {/* 3D Icon Placeholder */}
        <div className="relative w-36 h-36 flex items-center justify-center icon-glow flex-shrink-0">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${iconStyle.bg} rounded-full opacity-80 blur-xl`}
          />
          <div
            className={`relative w-28 h-28 bg-gradient-to-tr ${iconStyle.bg} rounded-full`}
            style={{
              boxShadow: `inset -10px -10px 30px rgba(0,0,0,0.2), 0 10px 40px ${iconStyle.glow}`,
            }}
          >
            {/* Specular highlight */}
            <div className="absolute top-4 left-5 w-10 h-5 bg-white/40 blur-md rounded-full -rotate-[30deg]" />
          </div>
        </div>

        {/* Temperature */}
        <div className="flex flex-col">
          <span className="font-headline text-[5rem] font-bold leading-none tracking-tighter text-on-surface">
            {data.temp}°C
          </span>
          <span className="font-label text-on-surface-variant text-lg tracking-tight mt-2 opacity-80">
            Feels like {data.feelsLike}°C
          </span>
        </div>
      </div>

      {/* Editorial Headline */}
      <div className="max-w-lg mb-16">
        <h1 className="font-headline text-[3.5rem] sm:text-[4.5rem] font-extrabold leading-[0.9] tracking-tighter text-on-surface mb-6">
          {plainWords}
          <span className="gradient-text">{gradientWords}</span>
        </h1>
        <p className="font-body text-lg text-on-surface-variant max-w-sm leading-relaxed opacity-70">
          {advice}
        </p>
      </div>
    </section>
  )
}
