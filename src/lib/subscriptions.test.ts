import { describe, it, expect } from 'vitest'
import { TIER_LIMITS, limitFor, TIER_LABEL } from './subscriptions'

describe('subscriptions', () => {
  it('pro tier > free tier for every limited endpoint', () => {
    for (const endpoint of ['chat', 'headline', 'insight', 'outfit', 'activity', 'trip'] as const) {
      const free = limitFor(endpoint, 'free')
      const pro = limitFor(endpoint, 'pro')
      expect(pro).toBeGreaterThan(free)
    }
  })

  it('free tier has finite caps everywhere except saved_locations test', () => {
    expect(Number.isFinite(TIER_LIMITS.free.chatMessagesPerDay)).toBe(true)
    expect(Number.isFinite(TIER_LIMITS.free.savedLocations)).toBe(true)
  })

  it('pro tier has unlimited saved locations', () => {
    expect(Number.isFinite(TIER_LIMITS.pro.savedLocations)).toBe(false)
  })

  it('tier labels are capitalized', () => {
    expect(TIER_LABEL.free).toBe('Free')
    expect(TIER_LABEL.pro).toBe('Pro')
  })
})
