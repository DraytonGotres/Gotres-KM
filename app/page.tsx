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
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="GOTRES-KM" className="h-20 w-auto object-contain" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  GOTRES-KM
                </h1>
                <p className="text-blue-200 mt-1">Sistema de Gestão de Frota</p>
              </div>
            </div>
            <InstallButton />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-black/20 backdrop-blur-sm p-2 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'vehicles'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <Car className="w-5 h-5" />
            Veículos
          </button>
          <button
            onClick={() => setActiveTab('refueling')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'refueling'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <Fuel className="w-5 h-5" />
            Abastecimentos
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'maintenance'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <Wrench className="w-5 h-5" />
            Manutenções
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Relatórios
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'vehicles' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Meus Veículos</h2>
              <button
                onClick={() => setShowVehicleForm(true)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50"
              >
                <Plus className="w-5 h-5" />
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
      <footer className="bg-black/30 backdrop-blur-md border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-1">
            <p className="text-white font-semibold text-lg">GOTRES</p>
            <p className="text-blue-200 text-sm">Todos direitos reservados © 2012-2025.</p>
            <p className="text-blue-300 text-sm">Sistema de KM Veicular</p>
            <p className="text-gray-400 text-xs">by Drayton Sousa</p>
          </div>
        </div>
      </footer>

      {/* Prompt de Instalação PWA */}
      <InstallPWA />
    </div>
  )
}
