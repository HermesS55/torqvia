// Torqvia Service Worker — sadece push notification için
// Fetch interception yok, cache yok → sayfa kendini yenilemez

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => {
  // Eski cache'leri temizle
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  )
  self.clients.claim()
})
