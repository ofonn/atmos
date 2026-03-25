'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Initial check
    setIsOffline(!navigator.onLine)

    // Listeners for changes
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
    <div className="fixed top-0 left-0 w-full z-50 flex justify-center mt-2 px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
      <div 
        className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg pointer-events-auto"
        style={{ 
          background: 'rgba(255, 184, 0, 0.15)', 
          border: '1px solid rgba(255, 184, 0, 0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
        role="alert"
        aria-live="assertive"
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
        <span className="font-label text-[11px] font-bold tracking-wide text-amber-500">
          You&apos;re offline — showing cached data
        </span>
      </div>
    </div>
  )
}
