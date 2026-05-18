import { describe, it, expect } from 'vitest'
import robots from './robots'

describe('robots.ts', () => {
  it('returns a single rules group + sitemap', () => {
    const r = robots()
    expect(r.rules).toBeDefined()
    expect(r.sitemap).toMatch(/sitemap\.xml$/)
  })

  it('disallows auth + API endpoints', () => {
    const r = robots()
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules
    const disallow = rules.disallow as string[]
    expect(disallow).toContain('/api/')
    expect(disallow).toContain('/sign-in')
    expect(disallow).toContain('/sign-up')
    expect(disallow).toContain('/reset')
    expect(disallow).toContain('/settings')
    expect(disallow).toContain('/auth/')
  })

  it('allows root', () => {
    const r = robots()
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules
    expect(rules.allow).toBe('/')
  })
})
