import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from './gemini'

describe('gemini.buildSystemPrompt', () => {
  it('includes core Atmos identity', () => {
    const p = buildSystemPrompt({} as any, 10, 0)
    expect(p).toMatch(/Atmos/)
    expect(p).toMatch(/weather/i)
  })

  it('honors emojiUse=none', () => {
    const p = buildSystemPrompt({} as any, 10, 0, { emojiUse: 'none' })
    expect(p).toMatch(/ABSOLUTELY NO EMOJI/i)
  })

  it('honors emojiUse=heavy', () => {
    const p = buildSystemPrompt({} as any, 10, 0, { emojiUse: 'heavy' })
    expect(p).toMatch(/liberally/i)
  })

  it('honors verbosity=short with 50-word cap', () => {
    const p = buildSystemPrompt({} as any, 10, 0, { verbosity: 'short' })
    expect(p).toMatch(/50 words/i)
  })

  it('omits personality block when no options', () => {
    const p = buildSystemPrompt({} as any, 10, 0)
    expect(p).not.toMatch(/USER PERSONALITY PREFERENCES/i)
  })

  it('labels time-of-day correctly', () => {
    expect(buildSystemPrompt({} as any, 2, 0)).toMatch(/night/i)
    expect(buildSystemPrompt({} as any, 9, 0)).toMatch(/morning/i)
    expect(buildSystemPrompt({} as any, 14, 0)).toMatch(/afternoon/i)
    expect(buildSystemPrompt({} as any, 19, 0)).toMatch(/evening/i)
  })

  it('inlines current weather when provided', () => {
    const p = buildSystemPrompt(
      {
        current: {
          temp: 21,
          feelsLike: 22,
          description: 'partly cloudy',
          humidity: 60,
          windSpeed: 12,
          tempMax: 25,
          tempMin: 16,
        },
      } as any,
      14,
      0,
    )
    expect(p).toMatch(/21°C/)
    expect(p).toMatch(/partly cloudy/)
    expect(p).toMatch(/60%/)
  })
})
