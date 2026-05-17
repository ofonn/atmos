import { describe, it, expect } from 'vitest'
import {
  kelvinToCelsius,
  kelvinToFahrenheit,
  celsiusToFahrenheit,
  mpsToKmh,
  kmhToMph,
  displayTemp,
  displayTempShort,
  convertTemp,
  tempSuffix,
  displayWind,
} from './utils'

describe('utils — unit conversion', () => {
  it('kelvinToCelsius', () => {
    expect(kelvinToCelsius(273.15)).toBeCloseTo(0, 2)
    expect(kelvinToCelsius(373.15)).toBeCloseTo(100, 2)
  })

  it('kelvinToFahrenheit', () => {
    expect(kelvinToFahrenheit(273.15)).toBeCloseTo(32, 2)
  })

  it('celsiusToFahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32, 2)
    expect(celsiusToFahrenheit(100)).toBeCloseTo(212, 2)
  })

  it('mpsToKmh', () => {
    expect(mpsToKmh(10)).toBeCloseTo(36, 2)
  })

  it('kmhToMph', () => {
    expect(kmhToMph(100)).toBeCloseTo(62.137, 0)
  })
})

describe('utils — display', () => {
  it('displayTemp produces a string ending in ° + unit', () => {
    const s = displayTemp(20, 'C')
    expect(s).toMatch(/°/)
    expect(s.toUpperCase()).toMatch(/C|F/)
  })

  it('displayTempShort uses degree symbol', () => {
    expect(displayTempShort(20, 'C')).toMatch(/°/)
    // F mode rounds to integer before display
    expect(displayTempShort(20, 'F')).not.toMatch(/\./)
  })

  it('convertTemp respects unit', () => {
    expect(convertTemp(0, 'C')).toBe(0)
    expect(convertTemp(0, 'F')).toBeCloseTo(32, 0)
  })

  it('tempSuffix matches unit', () => {
    expect(tempSuffix('C')).toMatch(/C/)
    expect(tempSuffix('F')).toMatch(/F/)
  })

  it('displayWind formats with unit', () => {
    const s = displayWind(36, 'kmh')
    expect(s).toMatch(/km\/h/i)
    const s2 = displayWind(36, 'mph')
    expect(s2).toMatch(/mph/i)
  })
})
