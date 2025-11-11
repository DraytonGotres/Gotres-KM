'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { brazilianManufacturers, carColors } from '@/lib/manufacturers'

interface VehicleFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function VehicleForm({ onClose, onSuccess }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    plate: '',
    color: '',
    year: new Date().getFullYear(),
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('vehicles').insert([formData])

    if (error) {
      alert('Erro ao cadastrar veículo: ' + error.message)
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
            <h3 className="text-lg md:text-2xl font-bold text-white">Cadastrar Veículo</h3>
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
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Fabricante
              </label>
              <select
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {brazilianManufacturers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Modelo
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Onix, Civic, Gol..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Placa
              </label>
              <input
                type="text"
                required
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="ABC-1234"
                maxLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Cor
              </label>
              <select
                required
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {carColors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Ano
              </label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

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
                {loading ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
