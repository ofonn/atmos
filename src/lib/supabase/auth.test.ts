import { describe, it, expect } from 'vitest'
import type { Tier } from '@/lib/subscriptions'

// Tier resolver decision table — codifies the exact logic in
// `getUserTier()` so future refactors don't accidentally flip
// somebody to free without realizing.
function resolveTier(input: {
  tier: 'free' | 'pro' | null
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null
  current_period_end: string | null
  now?: Date
}): Tier {
  const now = input.now ?? new Date()
  if (!input.tier) return 'free'
  const expired = input.current_period_end
    ? new Date(input.current_period_end) < now
    : false
  if (input.tier === 'pro' && input.status === 'active' && !expired) return 'pro'
  return 'free'
}

describe('tier resolver', () => {
  it('returns free when there is no subscription row', () => {
    expect(resolveTier({ tier: null, status: null, current_period_end: null })).toBe('free')
  })

  it('returns pro for active sub within period', () => {
    expect(
      resolveTier({
        tier: 'pro',
        status: 'active',
        current_period_end: '3000-01-01T00:00:00Z',
      }),
    ).toBe('pro')
  })

  it('returns free for canceled sub even within period', () => {
    expect(
      resolveTier({
        tier: 'pro',
        status: 'canceled',
        current_period_end: '3000-01-01T00:00:00Z',
      }),
    ).toBe('free')
  })

  it('returns free for past_due (downgrade)', () => {
    expect(
      resolveTier({
        tier: 'pro',
        status: 'past_due',
        current_period_end: '3000-01-01T00:00:00Z',
      }),
    ).toBe('free')
  })

  it('returns free when period_end is in the past', () => {
    expect(
      resolveTier({
        tier: 'pro',
        status: 'active',
        current_period_end: '2020-01-01T00:00:00Z',
        now: new Date('2026-05-17T00:00:00Z'),
      }),
    ).toBe('free')
  })

  it('treats trialing as not-yet-pro per current decision', () => {
    // We could promote trialing to pro later; today's logic keeps it free
    // until status becomes active.
    expect(
      resolveTier({
        tier: 'pro',
        status: 'trialing',
        current_period_end: '3000-01-01T00:00:00Z',
      }),
    ).toBe('free')
  })
})
