'use client'

export function useHaptic() {
  const vibrate = (pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern) } catch {}
    }
  }

  return {
    tap: () => vibrate(30),
    success: () => vibrate([40, 20, 40]),
    error: () => vibrate([60, 30, 60, 30, 60]),
    light: () => vibrate(15),
    medium: () => vibrate(50),
    heavy: () => vibrate(100),
  }
}
