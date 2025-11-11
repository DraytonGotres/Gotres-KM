'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Verificar atualizações a cada 30 segundos
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.update()
          }
        })
      }, 30000)

      // Detectar quando há uma nova versão disponível
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        // Detectar novo service worker esperando
        if (reg.waiting) {
          setShowUpdate(true)
        }

        // Detectar quando um novo service worker é instalado
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                setShowUpdate(true)
              }
            })
          }
        })
      })

      // Detectar quando o service worker é atualizado
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })

      return () => clearInterval(interval)
    }
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Envia mensagem para o service worker ativar a nova versão
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl shadow-2xl p-4 border border-green-400 max-w-md mx-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Nova Versão Disponível!</h3>
              <p className="text-green-100 text-xs">Clique para atualizar agora</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleUpdate}
          className="w-full mt-3 bg-white text-green-600 font-bold py-2 px-4 rounded-lg hover:bg-green-50 transition-all"
        >
          Atualizar Agora
        </button>
      </div>
    </div>
  )
}
