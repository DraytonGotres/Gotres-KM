'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
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

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstallable(false)
    }

    setDeferredPrompt(null)
  }

  // Sempre mostra o botão, mesmo que não seja instalável (para iOS)
  return (
    <button
      onClick={handleInstallClick}
      className="hidden md:flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50"
      title="Instalar App"
    >
      <Download className="w-5 h-5" />
      <span>Instalar App</span>
    </button>
  )
}
