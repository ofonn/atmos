import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'

describe('sitemap.ts', () => {
  it('lists every public page', () => {
    const s = sitemap()
    const paths = s.map((e) => new URL(e.url).pathname)
    for (const p of ['/', '/technical', '/overview', '/chat', '/insight', '/locations', '/trip', '/pricing', '/privacy']) {
      expect(paths).toContain(p)
    }
  })

  it('home has priority 1.0', () => {
    const s = sitemap()
    const home = s.find((e) => e.url.endsWith('/'))
    expect(home?.priority).toBe(1.0)
  })

  it('home has daily changeFrequency', () => {
    const s = sitemap()
    const home = s.find((e) => e.url.endsWith('/'))
    expect(home?.changeFrequency).toBe('daily')
  })
})
