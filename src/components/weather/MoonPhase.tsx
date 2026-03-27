'use client'

interface MoonPhaseProps {
  date?: Date
  size?: number
}

// Returns 0-1 representing lunar cycle (0=new moon, 0.5=full moon)
function getMoonPhase(date: Date = new Date()): number {
  // Known new moon: Jan 6 2000 18:14 UTC (J2000 epoch)
  const knownNew = new Date('2000-01-06T18:14:00Z').getTime()
  const lunarCycle = 29.53058867 * 24 * 60 * 60 * 1000 // ms
  const diff = date.getTime() - knownNew
  return ((diff % lunarCycle) / lunarCycle + 1) % 1
}

const MOON_NAMES = [
  { max: 0.03, name: 'New Moon', emoji: '🌑' },
  { max: 0.22, name: 'Waxing Crescent', emoji: '🌒' },
  { max: 0.28, name: 'First Quarter', emoji: '🌓' },
  { max: 0.47, name: 'Waxing Gibbous', emoji: '🌔' },
  { max: 0.53, name: 'Full Moon', emoji: '🌕' },
  { max: 0.72, name: 'Waning Gibbous', emoji: '🌖' },
  { max: 0.78, name: 'Last Quarter', emoji: '🌗' },
  { max: 0.97, name: 'Waning Crescent', emoji: '🌘' },
  { max: 1.00, name: 'New Moon', emoji: '🌑' },
]

export function getMoonInfo(date?: Date): { name: string; emoji: string; phase: number; illumination: number } {
  const phase = getMoonPhase(date)
  const info = MOON_NAMES.find(m => phase <= m.max) ?? MOON_NAMES[MOON_NAMES.length - 1]
  // Illumination: peaks at 0.5 (full), 0 at new moon
  const illumination = Math.round(Math.sin(phase * Math.PI) * 100)
  return { name: info.name, emoji: info.emoji, phase, illumination }
}

export function MoonPhase({ date, size = 48 }: MoonPhaseProps) {
  const { name, emoji, illumination } = getMoonInfo(date)

  return (
    <div className="flex items-center gap-3">
      <span className="leading-none" style={{ fontSize: size }}>{emoji}</span>
      <div>
        <p className="font-headline font-bold text-sm" style={{ color: 'var(--text)' }}>{name}</p>
        <p className="font-label text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {illumination}% illuminated
        </p>
      </div>
    </div>
  )
}
