// Atmos Service Worker
const CACHE_NAME = 'atmos-v2'
const WEATHER_CACHE = 'atmos-weather-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((k) => k !== CACHE_NAME && k !== WEATHER_CACHE)
        .map((k) => caches.delete(k))
    )
    await clients.claim()
  })())
})

// Offline cache: stale-while-revalidate for the weather endpoint so the
// app still renders the last-known forecast on a flaky connection.
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname === '/api/openmeteo') {
    event.respondWith(staleWhileRevalidate(req, WEATHER_CACHE))
  }
})

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || fetchPromise
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'Atmos Weather'
  const options = {
    body: data.body || 'Weather update available',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open Atmos' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(event.notification.data || '/')
    })
  )
})
