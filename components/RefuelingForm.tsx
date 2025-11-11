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
    
    if (vehicleId && !editingRefueling) {
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
      date: formData.date,
    }

    let error
    if (editingRefueling) {
      const result = await supabase
        .from('refuelings')
        .update(dataToSave)
        .eq('id', editingRefueling.id)
      error = result.error
    } else {
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

  const kmDriven = formData.km_current - formData.km_previous
  const avgConsumption = formData.liters > 0 ? kmDriven / formData.liters : 0
  const costPerKm = kmDriven > 0 ? formData.cost / kmDriven : 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="min-h-screen flex items-start sm:items-center justify-center p-4 py-8">
        <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10 mb-8">
          {/* Header */}
          <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 bg-slate-800 rounded-t-2xl">
            <h3 className="text-base md:text-2xl font-bold text-white">
              {editingRefueling ? 'Editar' : 'Registrar'} Abastecimento
            </h3>
            <button 
              onClick={onClose} 
              type="button"
              className="text-gray-400 hover:text-white active:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4" autoComplete="off">
            {/* Veículo */}
            <div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data */}
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

              {/* Tipo de Combustível */}
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

              {/* KM Anterior */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  KM Anterior {formData.km_previous > 0 && !editingRefueling && <span className="text-green-400 text-xs">(Auto)</span>}
                </label>
                <input
                  type="number"
                  required
                  value={formData.km_previous || ''}
                  onChange={(e) => setFormData({ ...formData, km_previous: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
              </div>

              {/* KM Atual */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  KM Atual
                </label>
                <input
                  type="number"
                  required
                  value={formData.km_current || ''}
                  onChange={(e) => setFormData({ ...formData, km_current: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
              </div>

              {/* Preço por Litro */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Preço por Litro (R$)
                </label>
                <input
                  type="number"
                  required
                  value={formData.price_per_liter || ''}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0
                    const totalCost = calculateTotalCost(formData.liters, price)
                    setFormData({ ...formData, price_per_liter: price, cost: totalCost })
                  }}
                  className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="5.89"
                />
              </div>

              {/* Litros */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Litros
                </label>
                <input
                  type="number"
                  required
                  value={formData.liters || ''}
                  onChange={(e) => {
                    const liters = parseFloat(e.target.value) || 0
                    const totalCost = calculateTotalCost(liters, formData.price_per_liter)
                    setFormData({ ...formData, liters, cost: totalCost })
                  }}
                  className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Custo Total */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Custo Total (R$) <span className="text-green-400 text-xs">(Calculado automaticamente)</span>
              </label>
              <input
                type="text"
                value={`R$ ${formData.cost.toFixed(2)}`}
                readOnly
                className="w-full px-4 py-3 bg-slate-600 border border-white/10 rounded-lg text-white font-bold text-lg cursor-not-allowed"
              />
            </div>

            {/* Resumo */}
            {kmDriven > 0 && formData.liters > 0 && (
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-200">KM Rodados:</p>
                    <p className="text-white font-bold text-lg">{kmDriven.toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-blue-200">Consumo Médio:</p>
                    <p className="text-white font-bold text-lg">{avgConsumption.toFixed(2)} km/L</p>
                  </div>
                  {formData.cost > 0 && (
                    <>
                      <div>
                        <p className="text-blue-200">Custo Total:</p>
                        <p className="text-white font-bold text-lg">R$ {formData.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-blue-200">Custo por KM:</p>
                        <p className="text-white font-bold text-lg">R$ {costPerKm.toFixed(2)}/km</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10 mt-6 pb-safe">
              <button
                type="button"
                onClick={onClose}
                className="order-2 sm:order-1 flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-lg font-medium transition-all touch-manipulation min-h-[52px] text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="order-1 sm:order-2 flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[52px] text-base"
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
