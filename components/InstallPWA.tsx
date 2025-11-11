'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      // Previne o mini-infobar do Chrome em mobile
      e.preventDefault()
      // Guarda o evento para usar depois
      setDeferredPrompt(e)
      // Mostra o botão de instalação
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback para iOS/Safari
      alert(
        'Para instalar no iPhone:\n\n' +
        '1. Toque no ícone de compartilhar (quadrado com seta)\n' +
        '2. Role para baixo e toque em "Adicionar à Tela de Início"\n' +
        '3. Toque em "Adicionar"'
      )
      return
    }

    // Mostra o prompt de instalação
    deferredPrompt.prompt()

    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso')
    }

    // Limpa o prompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Salva no localStorage para não mostrar novamente nesta sessão
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Não mostra se foi dispensado nesta sessão
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setShowInstallPrompt(false)
    }
  }, [])

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-2xl p-6 border border-blue-400">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Download className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              Instalar GOTRES-KM
            </h3>
            <p className="text-blue-100 text-sm mb-4">
              Instale o app para acesso rápido e use offline!
            </p>
            
            <button
              onClick={handleInstallClick}
              className="w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-all shadow-lg"
            >
              Instalar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
