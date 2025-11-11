'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase, type Vehicle, type Refueling } from '@/lib/supabase'

interface RefuelingFormProps {
  vehicles: Vehicle[]
  editingRefueling?: Refueling | null
  onClose: () => void
  onSuccess: () => void
}

export default function RefuelingForm({ vehicles, editingRefueling, onClose, onSuccess }: RefuelingFormProps) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    date: new Date().toISOString().split('T')[0],
    km_current: 0,
    km_previous: 0,
    liters: 0,
    price_per_liter: 0,
    cost: 0,
    fuel_type: 'Gasolina',
  })
  const [loading, setLoading] = useState(false)

  // Preencher formulário ao editar
  useEffect(() => {
    if (editingRefueling) {
      setFormData({
        vehicle_id: editingRefueling.vehicle_id,
        date: editingRefueling.date,
        km_current: editingRefueling.km_current,
        km_previous: editingRefueling.km_previous,
        liters: editingRefueling.liters,
        price_per_liter: editingRefueling.price_per_liter,
        cost: editingRefueling.cost,
        fuel_type: editingRefueling.fuel_type,
      })
    }
  }, [editingRefueling])

  // Calcular custo total automaticamente
  const calculateTotalCost = (liters: number, pricePerLiter: number) => {
    return liters * pricePerLiter
  }

  const handleVehicleChange = async (vehicleId: string) => {
    setFormData({ ...formData, vehicle_id: vehicleId })
    
    if (vehicleId) {
      // Buscar o último abastecimento deste veículo
      const { data } = await supabase
        .from('refuelings')
        .select('km_current')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })
        .limit(1)
      
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, vehicle_id: vehicleId, km_previous: data[0].km_current }))
      } else {
        setFormData(prev => ({ ...prev, vehicle_id: vehicleId, km_previous: 0 }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const km_driven = formData.km_current - formData.km_previous

    if (km_driven <= 0) {
      alert('KM atual deve ser maior que KM anterior')
      setLoading(false)
      return
    }

    // Garantir que a data seja salva corretamente sem conversão de timezone
    const dataToSave = {
      ...formData,
      km_driven,
      date: formData.date, // Mantém o formato YYYY-MM-DD
    }

    let error
    if (editingRefueling) {
      // Atualizar registro existente
      const result = await supabase
        .from('refuelings')
        .update(dataToSave)
        .eq('id', editingRefueling.id)
      error = result.error
    } else {
      // Inserir novo registro
      const result = await supabase.from('refuelings').insert([dataToSave])
      error = result.error
    }

    if (error) {
      alert(`Erro ao ${editingRefueling ? 'atualizar' : 'registrar'} abastecimento: ` + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10">
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 sticky top-0 bg-slate-800 z-10 rounded-t-2xl">
            <h3 className="text-lg md:text-2xl font-bold text-white">
              {editingRefueling ? 'Editar Abastecimento' : 'Registrar Abastecimento'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Veículo
              </label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o veículo...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.manufacturer} {v.model} - {v.plate}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Data
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Tipo de Combustível
              </label>
              <select
                required
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="Diesel">Diesel</option>
                <option value="GNV">GNV</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                KM Anterior {formData.km_previous > 0 && <span className="text-green-400">(Preenchido automaticamente)</span>}
              </label>
              <input
                type="number"
                required
                value={formData.km_previous}
                onChange={(e) => setFormData({ ...formData, km_previous: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                KM Atual
              </label>
              <input
                type="number"
                required
                value={formData.km_current}
                onChange={(e) => setFormData({ ...formData, km_current: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Preço por Litro (R$)
              </label>
              <input
                type="number"
                required
                value={formData.price_per_liter}
                onChange={(e) => {
                  const price = parseFloat(e.target.value) || 0
                  const totalCost = calculateTotalCost(formData.liters, price)
                  setFormData({ ...formData, price_per_liter: price, cost: totalCost })
                }}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                placeholder="Ex: 5.89"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Litros
              </label>
              <input
                type="number"
                required
                value={formData.liters}
                onChange={(e) => {
                  const liters = parseFloat(e.target.value) || 0
                  const totalCost = calculateTotalCost(liters, formData.price_per_liter)
                  setFormData({ ...formData, liters, cost: totalCost })
                }}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Custo Total (R$) <span className="text-green-400">(Calculado automaticamente)</span>
              </label>
              <input
                type="number"
                value={formData.cost.toFixed(2)}
                readOnly
                className="w-full px-4 py-3 bg-slate-600 border border-white/10 rounded-lg text-white font-bold text-lg cursor-not-allowed"
              />
            </div>
          </div>

          {formData.km_current > formData.km_previous && formData.liters > 0 && (
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-200 text-sm">
                    KM Rodados: <span className="font-bold">{(formData.km_current - formData.km_previous).toFixed(1)} km</span>
                  </p>
                  <p className="text-blue-200 text-sm mt-1">
                    Consumo Médio: <span className="font-bold">{((formData.km_current - formData.km_previous) / formData.liters).toFixed(2)} km/L</span>
                  </p>
                </div>
                {formData.cost > 0 && (
                  <div>
                    <p className="text-blue-200 text-sm">
                      Custo Total: <span className="font-bold">R$ {formData.cost.toFixed(2)}</span>
                    </p>
                    <p className="text-blue-200 text-sm mt-1">
                      Custo por KM: <span className="font-bold">R$ {(formData.cost / (formData.km_current - formData.km_previous)).toFixed(2)}/km</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-lg font-medium transition-all touch-manipulation min-h-[48px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 touch-manipulation min-h-[48px]"
              >
                {loading ? 'Salvando...' : (editingRefueling ? 'Atualizar' : 'Registrar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
