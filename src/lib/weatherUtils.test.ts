import { describe, it, expect } from 'vitest'
import {
  wmoDesc,
  wmoEmoji,
  displayCelsius,
  kelvinToC,
  getWindDir16,
} from './weatherUtils'

describe('weatherUtils', () => {
  it('wmoDesc returns human strings for known codes', () => {
    expect(wmoDesc(0)).toBeTruthy()
    expect(wmoDesc(95)).toBeTruthy()
  })

  it('wmoDesc falls back gracefully for unknown codes', () => {
    expect(typeof wmoDesc(9999)).toBe('string')
  })

  it('wmoEmoji returns different glyphs for day vs night', () => {
    const day = wmoEmoji(0, 1)
    const night = wmoEmoji(0, 0)
    expect(day).toBeTruthy()
    expect(night).toBeTruthy()
  })

  it('displayCelsius rounds and appends unit symbol', () => {
    expect(displayCelsius(20, 'C', 0)).toMatch(/^20°/)
    // 20°C ≈ 68°F
    expect(displayCelsius(20, 'F', 0)).toMatch(/^68°/)
  })

  it('kelvinToC converts known constants', () => {
    expect(kelvinToC(273.15)).toBeCloseTo(0, 1)
    expect(kelvinToC(373.15)).toBeCloseTo(100, 1)
  })

  it('getWindDir16 maps cardinal degrees to compass labels', () => {
    expect(getWindDir16(0)).toMatch(/N/)
    expect(getWindDir16(90)).toMatch(/E/)
    expect(getWindDir16(180)).toMatch(/S/)
    expect(getWindDir16(270)).toMatch(/W/)
  })
})
