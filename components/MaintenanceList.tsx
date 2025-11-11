'use client'

import { useState, useEffect } from 'react'
import { Plus, Wrench } from 'lucide-react'
import { supabase, type Vehicle, type Maintenance } from '@/lib/supabase'
import MaintenanceForm from './MaintenanceForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MaintenanceListProps {
  vehicles: Vehicle[]
}

export default function MaintenanceList({ vehicles }: MaintenanceListProps) {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaintenances()
  }, [])

  const loadMaintenances = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('maintenances')
      .select('*')
      .order('date', { ascending: false })
    
    if (data) setMaintenances(data)
    setLoading(false)
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.manufacturer} ${vehicle.model} - ${vehicle.plate}` : 'Veículo não encontrado'
  }

  const handleSuccess = () => {
    setShowForm(false)
    loadMaintenances()
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
        <Wrench className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <p className="text-xl text-gray-300">Cadastre um veículo primeiro</p>
        <p className="text-gray-400 mt-2">Você precisa ter veículos cadastrados para registrar manutenções</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Manutenções</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50"
        >
          <Plus className="w-5 h-5" />
          Registrar Manutenção
        </button>
      </div>

      {showForm && (
        <MaintenanceForm
          vehicles={vehicles}
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : maintenances.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
          <Wrench className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-xl text-gray-300">Nenhuma manutenção registrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {maintenances.map((maintenance) => (
            <div
              key={maintenance.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {getVehicleInfo(maintenance.vehicle_id)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {format(new Date(maintenance.date + 'T12:00:00'), 'dd-MM-yyyy')}
                  </p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-xl">
                  <Wrench className="w-6 h-6 text-orange-400" />
                </div>
              </div>

              <div className="mb-4">
                <span className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                  {maintenance.type}
                </span>
              </div>

              <p className="text-gray-300 mb-4">{maintenance.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-400 mb-1">KM na Manutenção</p>
                  <p className="text-lg font-bold text-white">
                    {maintenance.km_at_maintenance.toLocaleString('pt-BR')} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Custo</p>
                  <p className="text-lg font-bold text-white">
                    R$ {maintenance.cost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
