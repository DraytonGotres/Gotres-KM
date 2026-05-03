'use client'

import { useEffect } from 'react'

export default function RegisterServiceWorker() {
  useEffect(() => {
    // Proteção para SSR
    if (typeof window === 'undefined') return
    
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registrado com sucesso')
            
            // Verifica atualizações
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              console.log('🔄 Nova versão do Service Worker encontrada')
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('✨ Service Worker atualizado! Nova versão disponível.')
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('❌ Falha ao registrar Service Worker:', error)
          })
      })
    } else {
      console.warn('⚠️ Service Worker não suportado neste navegador')
    }
  }, [])

  return null
}
