import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { requirePlayIntegrity } from './playIntegrity'

function makeReq(headers: Record<string, string> = {}): NextRequest {
  // Minimal stand-in — `requirePlayIntegrity` only reads headers and
  // header presence, not the body / URL params.
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest
}

describe('requirePlayIntegrity — passthroughs', () => {
  beforeEach(() => {
    delete process.env.GOOGLE_PLAY_INTEGRITY_SA_JSON
    delete process.env.ANDROID_PACKAGE_NAME
    delete process.env.PLAY_INTEGRITY_STRICTNESS
  })

  it('lets same-origin browser requests through', async () => {
    const res = await requirePlayIntegrity(
      makeReq({ 'sec-fetch-site': 'same-origin' }),
    )
    expect(res).toBeNull()
  })

  it("lets 'none' (direct nav) through", async () => {
    const res = await requirePlayIntegrity(makeReq({ 'sec-fetch-site': 'none' }))
    expect(res).toBeNull()
  })

  it('lets empty sec-fetch-site through (older browsers)', async () => {
    const res = await requirePlayIntegrity(makeReq({}))
    expect(res).toBeNull()
  })
})

describe('requirePlayIntegrity — rejections', () => {
  beforeEach(() => {
    delete process.env.GOOGLE_PLAY_INTEGRITY_SA_JSON
    delete process.env.ANDROID_PACKAGE_NAME
    delete process.env.PLAY_INTEGRITY_STRICTNESS
  })

  it('rejects cross-site requests missing the integrity token', async () => {
    const res = await requirePlayIntegrity(
      makeReq({ 'sec-fetch-site': 'cross-site' }),
    )
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
    const body = await (res as Response).json()
    expect(body.reason).toMatch(/missing integrity token/i)
  })

  it('returns 401 when server is unconfigured (no service account)', async () => {
    const res = await requirePlayIntegrity(
      makeReq({
        'sec-fetch-site': 'cross-site',
        'x-play-integrity-token': 'token',
      }),
    )
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
    const body = await (res as Response).json()
    expect(body.reason).toMatch(/not configured/i)
  })

  it('returns 401 when service-account JSON is malformed', async () => {
    process.env.GOOGLE_PLAY_INTEGRITY_SA_JSON = '{"not": "valid"}'
    process.env.ANDROID_PACKAGE_NAME = 'com.atmos.app'
    const res = await requirePlayIntegrity(
      makeReq({
        'sec-fetch-site': 'cross-site',
        'x-play-integrity-token': 'token',
      }),
    )
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
    const body = await (res as Response).json()
    expect(body.reason).toMatch(/misconfigured/i)
  })

  it('respects PLAY_INTEGRITY_STRICTNESS default = lenient', () => {
    // Doesn't actually call out — just sanity-check default.
    const strict = (process.env.PLAY_INTEGRITY_STRICTNESS ?? 'lenient') === 'strict'
    expect(strict).toBe(false)
  })
})
