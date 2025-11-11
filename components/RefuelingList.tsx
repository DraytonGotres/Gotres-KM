'use client'

import { useState, useEffect } from 'react'
import { Plus, Fuel, TrendingUp, Edit2, Trash2 } from 'lucide-react'
import { supabase, type Vehicle, type Refueling } from '@/lib/supabase'
import RefuelingForm from './RefuelingForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RefuelingListProps {
  vehicles: Vehicle[]
}

export default function RefuelingList({ vehicles }: RefuelingListProps) {
  const [refuelings, setRefuelings] = useState<Refueling[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingRefueling, setEditingRefueling] = useState<Refueling | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRefuelings()
  }, [])

  const loadRefuelings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('refuelings')
      .select('*')
      .order('date', { ascending: false })
    
    if (data) setRefuelings(data)
    setLoading(false)
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.manufacturer} ${vehicle.model} - ${vehicle.plate}` : 'Veículo não encontrado'
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingRefueling(null)
    loadRefuelings()
  }

  const handleEdit = (refueling: Refueling) => {
    setEditingRefueling(refueling)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return

    const { error } = await supabase.from('refuelings').delete().eq('id', id)
    
    if (error) {
      alert('Erro ao excluir abastecimento: ' + error.message)
    } else {
      loadRefuelings()
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRefueling(null)
  }

  if (vehicles.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
        <Fuel className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <p className="text-xl text-gray-300">Cadastre um veículo primeiro</p>
        <p className="text-gray-400 mt-2">Você precisa ter veículos cadastrados para registrar abastecimentos</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Abastecimentos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50 text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden xs:inline">Registrar</span> Abastecimento
        </button>
      </div>

      {showForm && (
        <RefuelingForm
          vehicles={vehicles}
          editingRefueling={editingRefueling}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12">Carregando...</div>
      ) : refuelings.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
          <Fuel className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-xl text-gray-300">Nenhum abastecimento registrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refuelings.map((refueling) => (
            <div
              key={refueling.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {getVehicleInfo(refueling.vehicle_id)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {format(new Date(refueling.date + 'T12:00:00'), 'dd-MM-yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(refueling)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 p-3 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(refueling.id)}
                    className="bg-red-500/20 hover:bg-red-500/30 p-3 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">KM Rodados</p>
                  <p className="text-lg font-bold text-white flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    {refueling.km_driven.toLocaleString('pt-BR')} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Litros</p>
                  <p className="text-lg font-bold text-white">
                    {refueling.liters.toFixed(2)} L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Preço/Litro</p>
                  <p className="text-lg font-bold text-yellow-400">
                    R$ {refueling.price_per_liter.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Custo Total</p>
                  <p className="text-lg font-bold text-white">
                    R$ {refueling.cost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Consumo</p>
                  <p className="text-lg font-bold text-blue-400">
                    {(refueling.km_driven / refueling.liters).toFixed(2)} km/L
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">KM Anterior: {refueling.km_previous.toLocaleString('pt-BR')}</span>
                  <span className="text-gray-400">KM Atual: {refueling.km_current.toLocaleString('pt-BR')}</span>
                  <span className="text-gray-400">Combustível: {refueling.fuel_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
