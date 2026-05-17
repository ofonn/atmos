/**
 * Browser-side helpers for opting in to weather-alert push.
 * Backend dispatch (web-push lib) lives in a future edge function.
 *
 * Requires:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (generated via `npx web-push generate-vapid-keys`)
 *   A registered service worker  (already done by SWRegister.tsx)
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export async function getPushPermission(): Promise<PushPermission> {
  if (!(await isPushSupported())) return 'unsupported'
  return Notification.permission
}

/**
 * Subscribe (and register on the server). Returns true on success.
 */
export async function subscribeWebPush(): Promise<boolean> {
  if (!(await isPushSupported())) return false
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid) {
    console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')
    return false
  }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast to BufferSource — TS lib types are stricter than the runtime.
      applicationServerKey: urlBase64ToUint8Array(vapid) as unknown as BufferSource,
    }))

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  if (!json.endpoint || !json.keys) return false

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: 'web',
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  })
  return res.ok
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!(await isPushSupported())) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })
  await sub.unsubscribe()
}
