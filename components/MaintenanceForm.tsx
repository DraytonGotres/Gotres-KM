'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase, type Vehicle } from '@/lib/supabase'

interface MaintenanceFormProps {
  vehicles: Vehicle[]
  onClose: () => void
  onSuccess: () => void
}

const maintenanceTypes = [
  'Troca de Óleo',
  'Revisão',
  'Alinhamento e Balanceamento',
  'Troca de Pneus',
  'Freios',
  'Suspensão',
  'Ar Condicionado',
  'Sistema Elétrico',
  'Bateria',
  'Filtros',
  'Velas',
  'Correia Dentada',
  'Embreagem',
  'Funilaria e Pintura',
  'Outros',
]

export default function MaintenanceForm({ vehicles, onClose, onSuccess }: MaintenanceFormProps) {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    date: new Date().toISOString().split('T')[0],
    type: '',
    description: '',
    cost: 0,
    km_at_maintenance: 0,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('maintenances').insert([formData])

    if (error) {
      alert('Erro ao registrar manutenção: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10 my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg md:text-2xl font-bold text-white">Registrar Manutenção</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Veículo
              </label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
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
                Tipo de Manutenção
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {maintenanceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                KM do Veículo
              </label>
              <input
                type="number"
                required
                value={formData.km_at_maintenance}
                onChange={(e) => setFormData({ ...formData, km_at_maintenance: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Custo (R$)
              </label>
              <input
                type="number"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Descrição
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Descreva os serviços realizados..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-slate-800 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 md:pb-6 border-t border-white/10 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-lg font-medium transition-all touch-manipulation min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 touch-manipulation min-h-[44px]"
            >
              {loading ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
