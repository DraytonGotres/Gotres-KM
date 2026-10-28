// Service Worker para PWA com auto-update
const CACHE_NAME = 'gotres-km-v3' // Incrementar versão para forçar atualização
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
          if (cacheName.startsWith('gotres-km-v') && cacheName !== CACHE_NAME) {
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
  const url = new URL(event.request.url)

  if (event.request.method === 'GET' &&
      url.origin === self.location.origin && url.pathname === '/logo.png') {
    // Consulta a rede sem reutilizar o cache HTTP; mantém a última imagem para offline.
    const logoResponse = (async () => {
      let response
      try {
        response = await fetch(event.request, { cache: 'no-store' })
      } catch (error) {
        const cached = await caches.match(event.request, { cacheName: CACHE_NAME })
        if (cached) return cached
        throw error
      }

      if (response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(event.request, response.clone())
        } catch (error) {
          // Uma falha ao gravar o cache não impede exibir a imagem da rede.
        }
        return response
      }

      return (await caches.match(event.request, { cacheName: CACHE_NAME })) || response
    })()

    event.respondWith(logoResponse)
    return
  }

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
