const CACHE = 'torqvia-v4'

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add('/index.html')))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // Eski cache'leri temizle ama açık sekmeleri zorla devralma
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  // clients.claim() kaldırıldı — sekme geçişlerinde zorla reload'u önler
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.hostname.includes('supabase')) return
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')))
  }
})
