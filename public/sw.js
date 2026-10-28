// Somente recursos públicos explícitos. Dados privados, Auth, HTML e APIs nunca são armazenados.
const CACHE_NAME = 'gotres-km-v4'
const PUBLIC_ASSETS = ['/logo.png', '/manifest.json']
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PUBLIC_ASSETS)))
  // A atualização aguarda confirmação do usuário antes de substituir a versão ativa.
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('gotres-km-v') && name !== CACHE_NAME).map(name => caches.delete(name)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.search || !PUBLIC_ASSETS.includes(url.pathname)) return
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: 'no-store' })
      if (response.ok) {
        try { const cache = await caches.open(CACHE_NAME); await cache.put(event.request, response.clone()) } catch (_) {}
        return response
      }
      return (await caches.match(event.request, { cacheName: CACHE_NAME })) || response
    } catch (error) {
      const cached = await caches.match(event.request, { cacheName: CACHE_NAME })
      if (cached) return cached
      throw error
    }
  })())
})
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
