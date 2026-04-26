const CACHE = 'torqvia-v2'

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

  // Supabase API — tarayıcının kendi fetch'ine bırak, SW karışmasın
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.in')) {
    return
  }

  // Sadece GET isteklerini yakala
  if (e.request.method !== 'GET') return

  // SPA navigasyon — önce ağ, offline ise cache'den index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(async () => {
        const cached = await caches.match('/index.html')
        return cached ?? new Response('Çevrimdışısın', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      })
    )
    return
  }

  // Statik dosyalar — önce cache, sonra ağ
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      }).catch(() => cached ?? new Response('', { status: 408 }))
    })
  )
})
