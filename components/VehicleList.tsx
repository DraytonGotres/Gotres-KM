'use client'

import { Car, Archive } from 'lucide-react'
import { dataError } from '@/lib/data'
import { supabase, type Vehicle } from '@/lib/supabase'

interface VehicleListProps {
  vehicles: Vehicle[]
  onVehicleUpdated: () => void
}

export default function VehicleList({ vehicles, onVehicleUpdated }: VehicleListProps) {
  const handleDelete = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id)
    if (!confirm(vehicle?.active ? 'Inativar este veículo? Todos os históricos serão preservados.' : 'Reativar este veículo?')) return

    const { error } = await supabase.from('vehicles').update({ active: !vehicle?.active }).eq('id', id).select('id').single()
    
    if (error) {
      alert(dataError(error))
    } else {
      onVehicleUpdated()
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
        <Car className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <p className="text-xl text-gray-300">Nenhum veículo cadastrado</p>
        <p className="text-gray-400 mt-2">Clique em "Cadastrar Veículo" para começar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Car className="w-8 h-8 text-blue-400" />
            </div>
            <button
              onClick={() => handleDelete(vehicle.id)}
              aria-label={vehicle.active ? 'Inativar veículo' : 'Reativar veículo'}
              title={vehicle.active ? 'Inativar veículo' : 'Reativar veículo'}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <Archive className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {vehicle.manufacturer} {vehicle.model}
          </h3>
          {!vehicle.active && <p className="text-amber-200 text-sm mb-2">Inativo • Histórico preservado</p>}
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Placa:</span>
              <span className="text-white font-medium">{vehicle.plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cor:</span>
              <span className="text-white">{vehicle.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ano:</span>
              <span className="text-white">{vehicle.year}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
