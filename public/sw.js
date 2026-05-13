// Torqvia Service Worker
const STATIC_CACHE = 'torqvia-static-v1'
const STATIC_ASSETS = ['/', '/torqvia-logo.png', '/manifest.json']

// Install: cache static shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  )
})

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch: network-first, fall back to cache for navigation requests
self.addEventListener('fetch', e => {
  const { request } = e
  // Only handle GET, skip cross-origin API calls (Supabase)
  if (request.method !== 'GET') return
  if (request.url.includes('supabase.co')) return

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    )
    return
  }

  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  )
})

// Push notification received
self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Torqvia', {
      body: data.body || '',
      icon: '/torqvia-logo.png?v=2',
      badge: '/torqvia-logo.png?v=2',
      tag: data.tag || 'torqvia',
      renotify: true,
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
      actions: data.actions || [],
    })
  )
})

// Notification click: open or focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
