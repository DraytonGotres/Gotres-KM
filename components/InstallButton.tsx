'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verifica se já está instalado (modo standalone)
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true)
        setIsInstallable(false)
        return true
      }
      return false
    }

    // Verifica imediatamente
    if (checkIfInstalled()) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Verifica periodicamente se foi instalado
    const interval = setInterval(() => {
      checkIfInstalled()
    }, 1000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearInterval(interval)
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
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }

  // Não mostra o botão se já estiver instalado
  if (isInstalled) {
    return null
  }

  // Mostra o botão se for instalável OU se for iOS (que não dispara beforeinstallprompt)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  
  if (!isInstallable && !isIOS) {
    return null
  }

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
