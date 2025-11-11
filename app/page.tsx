'use client'

import { useState, useEffect } from 'react'
import { Car, Fuel, Wrench, Plus, BarChart3 } from 'lucide-react'
import VehicleList from '@/components/VehicleList'
import VehicleForm from '@/components/VehicleForm'
import RefuelingList from '@/components/RefuelingList'
import MaintenanceList from '@/components/MaintenanceList'
import Reports from '@/components/Reports'
import InstallPWA from '@/components/InstallPWA'
import InstallButton from '@/components/InstallButton'
import UpdateNotification from '@/components/UpdateNotification'
import { supabase, type Vehicle } from '@/lib/supabase'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'refueling' | 'maintenance' | 'reports'>('vehicles')
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setVehicles(data)
  }

  const handleVehicleAdded = () => {
    setShowVehicleForm(false)
    loadVehicles()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <img src="/logo.png" alt="GOTRES-KM" className="h-12 md:h-16 lg:h-20 w-auto object-contain" />
              <div>
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-white">
                  GOTRES-KM
                </h1>
                <p className="text-xs md:text-sm text-blue-200 mt-0.5 md:mt-1 hidden sm:block">Sistema de Gestão de Frota</p>
              </div>
            </div>
            <InstallButton />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 mt-4 md:mt-6">
        <div className="flex gap-1 md:gap-2 bg-black/20 backdrop-blur-sm p-1.5 md:p-2 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
              activeTab === 'vehicles'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <Car className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Veículos</span>
          </button>
          <button
            onClick={() => setActiveTab('refueling')}
            className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
              activeTab === 'refueling'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <Fuel className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Abastecimentos</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
              activeTab === 'maintenance'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <Wrench className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Manutenções</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
              activeTab === 'reports'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Relatórios</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'vehicles' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">Meus Veículos</h2>
              <button
                onClick={() => setShowVehicleForm(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 md:px-6 py-3 md:py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50 text-sm md:text-base w-full sm:w-auto justify-center touch-manipulation min-h-[44px]"
              >
                <Plus className="w-5 h-5 md:w-5 md:h-5" />
                Cadastrar Veículo
              </button>
            </div>
            
            {showVehicleForm && (
              <VehicleForm
                onClose={() => setShowVehicleForm(false)}
                onSuccess={handleVehicleAdded}
              />
            )}
            
            <VehicleList vehicles={vehicles} onVehicleUpdated={loadVehicles} />
          </div>
        )}

        {activeTab === 'refueling' && (
          <RefuelingList vehicles={vehicles} />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceList vehicles={vehicles} />
        )}

        {activeTab === 'reports' && (
          <Reports vehicles={vehicles} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-md border-t border-white/10 mt-8 md:mt-12 pb-20 md:pb-6">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="text-center space-y-0.5 md:space-y-1">
            <p className="text-white font-semibold text-base md:text-lg">GOTRES</p>
            <p className="text-blue-200 text-xs md:text-sm">Todos direitos reservados © 2012-2025.</p>
            <p className="text-blue-300 text-xs md:text-sm">Sistema de KM Veicular</p>
            <p className="text-gray-400 text-xs">by Drayton Sousa</p>
          </div>
        </div>
      </footer>

      {/* Prompt de Instalação PWA */}
      <InstallPWA />
      
      {/* Notificação de Atualização */}
      <UpdateNotification />
    </div>
  )
}
