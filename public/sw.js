// Service Worker para PWA com auto-update
const CACHE_NAME = 'gotres-km-v2' // Incrementar versão para forçar atualização
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo.png',
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  // Força o service worker a ativar imediatamente
  self.skipWaiting()
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Toma controle de todas as páginas imediatamente
      return self.clients.claim()
    })
  )
})

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se disponível, senão busca da rede
        return response || fetch(event.request)
      })
  )
})

// Escutar mensagem para pular espera
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
