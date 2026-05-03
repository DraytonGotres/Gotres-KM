'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, DollarSign, Fuel, Wrench, FileText, Printer, QrCode as QrCodeIcon } from 'lucide-react'
import { supabase, type Vehicle, type Refueling, type Maintenance } from '@/lib/supabase'
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement,
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement
)

interface ReportsProps {
  vehicles: Vehicle[]
}

type PeriodType = 'month' | 'year' | 'custom'

export default function Reports({ vehicles }: ReportsProps) {
  const [refuelings, setRefuelings] = useState<Refueling[]>([])
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showDossier, setShowDossier] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [refuelingsData, maintenancesData] = await Promise.all([
      supabase.from('refuelings').select('*').order('date', { ascending: true }),
      supabase.from('maintenances').select('*').order('date', { ascending: true })
    ])
    
    if (refuelingsData.data) setRefuelings(refuelingsData.data)
    if (maintenancesData.data) setMaintenances(maintenancesData.data)
    setLoading(false)
  }

  const filterDataByPeriod = <T extends { date: string }>(data: T[]) => {
    if (periodType === 'custom' && startDate && endDate) {
      return data.filter(item => {
        const itemDate = parseISO(item.date)
        return itemDate >= parseISO(startDate) && itemDate <= parseISO(endDate)
      })
    }

    const start = periodType === 'month' 
      ? startOfMonth(selectedDate) 
      : startOfYear(selectedDate)
    const end = periodType === 'month' 
      ? endOfMonth(selectedDate) 
      : endOfYear(selectedDate)

    return data.filter(item => {
      const itemDate = parseISO(item.date)
      return itemDate >= start && itemDate <= end
    })
  }

  let filteredRefuelings = filterDataByPeriod(refuelings)
  let filteredMaintenances = filterDataByPeriod(maintenances)

  // Filtrar por veículo se selecionado
  if (selectedVehicleId !== 'all') {
    filteredRefuelings = filteredRefuelings.filter(r => r.vehicle_id === selectedVehicleId)
    filteredMaintenances = filteredMaintenances.filter(m => m.vehicle_id === selectedVehicleId)
  }

  // Estatísticas gerais
  const totalRefuelingCost = filteredRefuelings.reduce((sum, r) => sum + r.cost, 0)
  const totalMaintenanceCost = filteredMaintenances.reduce((sum, m) => sum + m.cost, 0)
  const totalKmDriven = filteredRefuelings.reduce((sum, r) => sum + r.km_driven, 0)
  const totalLiters = filteredRefuelings.reduce((sum, r) => sum + r.liters, 0)
  const avgConsumption = totalLiters > 0 ? totalKmDriven / totalLiters : 0

  // Gráfico de Pizza - Custos por Veículo
  const costsByVehicle = vehicles.map(vehicle => {
    const refuelCost = filteredRefuelings
      .filter(r => r.vehicle_id === vehicle.id)
      .reduce((sum, r) => sum + r.cost, 0)
    const maintCost = filteredMaintenances
      .filter(m => m.vehicle_id === vehicle.id)
      .reduce((sum, m) => sum + m.cost, 0)
    return {
      vehicle: `${vehicle.manufacturer} ${vehicle.model}`,
      total: refuelCost + maintCost
    }
  }).filter(v => v.total > 0)

  const pieChartData = {
    labels: costsByVehicle.map(v => v.vehicle),
    datasets: [{
      label: 'Custos Totais (R$)',
      data: costsByVehicle.map(v => v.total),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(234, 179, 8, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(234, 179, 8, 1)',
      ],
      borderWidth: 2,
    }]
  }

  // Gráfico de Pizza - Tipos de Manutenção
  const maintenanceTypes = filteredMaintenances.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + m.cost
    return acc
  }, {} as Record<string, number>)

  const maintenancePieData = {
    labels: Object.keys(maintenanceTypes),
    datasets: [{
      label: 'Custos por Tipo (R$)',
      data: Object.values(maintenanceTypes),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(236, 72, 153, 1)',
      ],
      borderWidth: 2,
    }]
  }

  // Gráfico de Barras - Custos Mensais
  const monthlyData = filteredRefuelings.reduce((acc, r) => {
    const month = format(parseISO(r.date), 'MM-yyyy')
    if (!acc[month]) acc[month] = { refuel: 0, maintenance: 0 }
    acc[month].refuel += r.cost
    return acc
  }, {} as Record<string, { refuel: number, maintenance: number }>)

  filteredMaintenances.forEach(m => {
    const month = format(parseISO(m.date), 'MM-yyyy')
    if (!monthlyData[month]) monthlyData[month] = { refuel: 0, maintenance: 0 }
    monthlyData[month].maintenance += m.cost
  })

  const barChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Abastecimentos',
        data: Object.values(monthlyData).map(d => d.refuel),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Manutenções',
        data: Object.values(monthlyData).map(d => d.maintenance),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
      }
    ]
  }

  // Gráfico de Linha - Consumo ao longo do tempo
  const consumptionData = filteredRefuelings.map(r => ({
    date: format(parseISO(r.date), 'dd-MM-yyyy'),
    consumption: r.km_driven / r.liters,
    vehicle: vehicles.find(v => v.id === r.vehicle_id)?.plate || ''
  }))

  const lineChartData = {
    labels: consumptionData.map(d => d.date),
    datasets: [{
      label: 'Consumo (km/L)',
      data: consumptionData.map(d => d.consumption),
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb',
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e5e7eb',
          font: { size: 12 },
          padding: 15
        }
      }
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Carregando relatórios...</div>
  }

  // Obter dados do veículo selecionado
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)
  const systemUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gotres-km.vercel.app'

  // Função para obter ícone por tipo de manutenção
  const getMaintenanceIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'Troca de Óleo': '🛢️',
      'Revisão': '🔧',
      'Alinhamento e Balanceamento': '⚖️',
      'Troca de Pneus': '🛞',
      'Freios': '🛑',
      'Suspensão': '🔩',
      'Ar Condicionado': '❄️',
      'Sistema Elétrico': '⚡',
      'Bateria': '🔋',
      'Filtros': '🌀',
      'Velas': '✨',
      'Correia Dentada': '🔗',
      'Embreagem': '⚙️',
      'Funilaria e Pintura': '🎨',
      'Outros': '🔨',
    }
    return iconMap[type] || '🔧'
  }

  // Renderizar Dossiê Digital
  if (showDossier && selectedVehicleId !== 'all' && selectedVehicle) {
    return (
      <div className="print-container bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        {/* Botões de Ação - Não imprime */}
        <div className="no-print flex justify-between items-center mb-6">
          <button
            onClick={() => setShowDossier(false)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
          >
            ← Voltar aos Relatórios
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50"
          >
            <Printer className="w-5 h-5" />
            Imprimir Dossiê
          </button>
        </div>

        {/* Cabeçalho do Dossiê */}
        <div className="print-header border-b-2 border-blue-500/30 pb-6 mb-6">
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <img src="/logo.png" alt="GOTRES-KM" className="h-16 w-auto" />
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    DOSSIÊ DIGITAL DE MANUTENÇÕES
                  </h1>
                  <p className="text-blue-300 mt-1">
                    Sistema GOTRES-KM - Gestão de Frota
                  </p>
                </div>
              </div>

              <div className="vehicle-info-box grid grid-cols-2 gap-4 mt-6 bg-blue-500/10 p-4 rounded-lg">
                <div>
                  <p className="vehicle-info-label text-sm text-blue-300 mb-1">Veículo</p>
                  <p className="vehicle-info-value text-lg font-bold text-white">
                    {selectedVehicle.manufacturer} {selectedVehicle.model}
                  </p>
                </div>
                <div>
                  <p className="vehicle-info-label text-sm text-blue-300 mb-1">Placa</p>
                  <p className="vehicle-info-value text-lg font-bold text-white">
                    {selectedVehicle.plate}
                  </p>
                </div>
                <div>
                  <p className="vehicle-info-label text-sm text-blue-300 mb-1">Ano</p>
                  <p className="vehicle-info-value text-lg font-bold text-white">
                    {selectedVehicle.year}
                  </p>
                </div>
                <div>
                  <p className="vehicle-info-label text-sm text-blue-300 mb-1">Cor</p>
                  <p className="vehicle-info-value text-lg font-bold text-white">
                    {selectedVehicle.color}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code de Autenticidade */}
            <div className="print-qr bg-white p-4 rounded-xl border-2 border-blue-500/50">
              <QRCodeSVG 
                value={systemUrl}
                size={100}
                level="H"
                includeMargin={false}
              />
              <p className="text-xs text-center text-gray-600 mt-2 font-medium">
                Autenticidade Digital
              </p>
            </div>
          </div>

          {/* Período do Relatório */}
          <div className="period-info mt-6 bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Período:</strong>{' '}
              {periodType === 'custom' && startDate && endDate
                ? `${format(parseISO(startDate), 'dd/MM/yyyy')} até ${format(parseISO(endDate), 'dd/MM/yyyy')}`
                : periodType === 'month'
                ? format(selectedDate, 'MMMM/yyyy', { locale: ptBR })
                : format(selectedDate, 'yyyy')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Emitido em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Lista Cronológica de Manutenções */}
        <div>
          <h2 className="section-title text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Histórico de Manutenções
          </h2>

          {filteredMaintenances.length === 0 ? (
            <div className="bg-slate-700/50 rounded-xl p-8 text-center">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">
                Nenhuma manutenção registrada no período selecionado
              </p>
            </div>
          ) : (
            <>
              {filteredMaintenances.map((maintenance, index) => (
                <div
                  key={maintenance.id}
                  className="maintenance-item bg-slate-700/30 border border-white/10 rounded-xl p-6 mb-4 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Ícone da Categoria */}
                      <div className="maintenance-icon text-4xl">{getMaintenanceIcon(maintenance.type)}</div>

                      {/* Informações */}
                      <div className="flex-1">
                        <div className="maintenance-meta flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-blue-400">
                            #{String(filteredMaintenances.length - index).padStart(3, '0')}
                          </span>
                          <span className="text-sm text-gray-400">
                            {format(parseISO(maintenance.date + 'T12:00:00'), 'dd/MM/yyyy')}
                          </span>
                          <span className="text-sm text-gray-400">
                            • {maintenance.km_at_maintenance.toLocaleString('pt-BR')} km
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">
                          {maintenance.type}
                        </h3>

                        <p className="text-gray-300 text-sm leading-relaxed">
                          {maintenance.description}
                        </p>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="text-right">
                      <p className="maintenance-cost-label text-xs text-gray-400 mb-1">Custo</p>
                      <p className="maintenance-cost text-2xl font-bold text-green-400">
                        R$ {maintenance.cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total de Investimentos */}
              <div className="total-box bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-2 border-blue-500 rounded-xl p-6 mt-8">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="total-label text-sm text-blue-300 mb-1">
                      Total de Investimentos em Manutenções
                    </p>
                    <p className="total-count text-xs text-gray-400">
                      {filteredMaintenances.length} {filteredMaintenances.length === 1 ? 'manutenção realizada' : 'manutenções realizadas'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="total-amount text-4xl font-bold text-white">
                      R$ {totalMaintenanceCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="print-footer mt-12 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-gray-400">
            GOTRES - Sistema de KM Veicular • Todos direitos reservados © 2012-2025
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Documento gerado digitalmente pelo sistema GOTRES-KM
          </p>
        </div>
      </div>
    )
  }

  // Renderização normal dos relatórios
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">Relatórios e Análises</h2>
      </div>

      {/* Filtros de Período */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Veículo
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Veículos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.manufacturer} {v.model} - {v.plate}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Período
            </label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as PeriodType)}
              className="px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Mensal</option>
              <option value="year">Anual</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {periodType !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                {periodType === 'month' ? 'Mês/Ano' : 'Ano'}
              </label>
              <input
                type={periodType === 'month' ? 'month' : 'number'}
                value={periodType === 'month' 
                  ? format(selectedDate, 'yyyy-MM') 
                  : format(selectedDate, 'yyyy')}
                onChange={(e) => setSelectedDate(new Date(e.target.value + (periodType === 'year' ? '-01-01' : '-01')))}
                className="px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {periodType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Botão Dossiê Digital */}
          {selectedVehicleId !== 'all' && (
            <div className="ml-auto">
              <button
                onClick={() => setShowDossier(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/50 whitespace-nowrap"
              >
                <FileText className="w-5 h-5" />
                Dossiê Digital
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-blue-300">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">
            R$ {(totalRefuelingCost + totalMaintenanceCost).toFixed(2)}
          </p>
          <p className="text-sm text-blue-200 mt-1">Custos Totais</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <span className="text-xs text-green-300">KM</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {totalKmDriven.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-green-200 mt-1">KM Rodados</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <Fuel className="w-8 h-8 text-purple-400" />
            <span className="text-xs text-purple-300">Média</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {avgConsumption.toFixed(2)}
          </p>
          <p className="text-sm text-purple-200 mt-1">km/L</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <Wrench className="w-8 h-8 text-orange-400" />
            <span className="text-xs text-orange-300">Manutenções</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {filteredMaintenances.length}
          </p>
          <p className="text-sm text-orange-200 mt-1">Realizadas</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Custos por Veículo */}
        {costsByVehicle.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Custos por Veículo</h3>
            <div className="h-80">
              <Pie data={pieChartData} options={pieOptions} />
            </div>
          </div>
        )}

        {/* Gráfico de Pizza - Tipos de Manutenção */}
        {Object.keys(maintenanceTypes).length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Custos por Tipo de Manutenção</h3>
            <div className="h-80">
              <Pie data={maintenancePieData} options={pieOptions} />
            </div>
          </div>
        )}

        {/* Gráfico de Barras - Custos Mensais */}
        {Object.keys(monthlyData).length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">Custos Mensais</h3>
            <div className="h-80">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Gráfico de Linha - Consumo */}
        {consumptionData.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">Evolução do Consumo</h3>
            <div className="h-80">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {filteredRefuelings.length === 0 && filteredMaintenances.length === 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
          <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-xl text-gray-300">Nenhum dado encontrado para o período selecionado</p>
        </div>
      )}
    </div>
  )
}
