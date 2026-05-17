'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  isPushSupported,
  getPushPermission,
  subscribeWebPush,
  unsubscribeWebPush,
  type PushPermission,
} from '@/lib/push'

export function PushToggle() {
  const { user, disabled } = useAuth()
  const [permission, setPermission] = useState<PushPermission>('default')
  const [supported, setSupported] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const vapidConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

  useEffect(() => {
    isPushSupported().then(setSupported)
    getPushPermission().then(setPermission)
  }, [])

  // Hide entirely if anything fundamental is missing — settings noise is bad
  // and we don't want a teaser the user can't act on.
  if (disabled || !user || !supported || !vapidConfigured) return null

  const enabled = permission === 'granted'

  const onClick = async () => {
    setBusy(true)
    setError(null)
    try {
      if (enabled) {
        await unsubscribeWebPush()
        setPermission('default')
      } else {
        const ok = await subscribeWebPush()
        if (!ok) setError("Couldn't subscribe — permission denied or VAPID misconfigured.")
        setPermission(await getPushPermission())
      }
    } catch (e: any) {
      setError(e.message)
    }
    setBusy(false)
  }

  return (
    <div>
      <p
        className="text-[11px] font-label uppercase tracking-widest px-1 mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Notifications
      </p>
      <div
        className="flex items-center justify-between px-5 py-4 rounded-2xl"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-3">
          {enabled ? (
            <Bell className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          ) : (
            <BellOff className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Weather alerts
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {permission === 'denied'
                ? 'Blocked in browser settings'
                : enabled
                  ? 'You will be notified about severe weather'
                  : 'Enable to get severe-weather alerts'}
            </p>
            {error && (
              <p className="text-[11px] mt-1" style={{ color: '#ff7a85' }}>
                {error}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClick}
          disabled={busy || permission === 'denied'}
          className="px-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 disabled:opacity-50"
          style={{
            background: enabled ? 'var(--surface-mid)' : 'var(--primary)',
            color: enabled ? 'var(--text)' : 'var(--bg)',
          }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  )
}
