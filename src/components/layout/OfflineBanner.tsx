'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center pointer-events-none">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.35)' }} />

      <div
        className="relative flex flex-col items-center gap-5 px-8 py-8 rounded-3xl shadow-2xl pointer-events-auto"
        style={{
          background: 'rgba(16,19,28,0.85)',
          border: '1px solid rgba(199,191,255,0.15)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
        role="alert"
        aria-live="assertive"
      >
        <Image
          src="/icon.png"
          alt="Atmos"
          width={72}
          height={72}
          className="rounded-2xl opacity-80"
          priority
        />
        <div className="text-center">
          <p className="font-headline font-bold text-base" style={{ color: 'var(--text)' }}>
            You&apos;re offline
          </p>
          <p className="font-label text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Showing cached data — reconnect for live weather
          </p>
        </div>
      </div>
    </div>
  )
}
