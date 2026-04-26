const CACHE = 'torqvia-v3'

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add('/index.html')))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Supabase API — hiç karışma
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    return
  }

  // Sadece sayfa navigasyonlarında offline fallback yap
  // JS, CSS, resim gibi statik dosyalara dokunma — tarayıcı kendi cache'iyle halleder
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    )
  }
})
