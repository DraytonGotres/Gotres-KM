export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function calendarSelection(value: string, yearly = false): Date | null {
  if (!(yearly ? /^\d{4}$/ : /^\d{4}-\d{2}$/).test(value)) return null
  const [year, month = 1] = value.split('-').map(Number)
  if (year < 1900 || year > 9999 || month < 1 || month > 12) return null
  return new Date(year, month - 1, 1, 12)
}

export function ratio(numerator: number, denominator: number): number | null {
  const result = numerator / denominator
  return Number.isFinite(numerator) && Number.isFinite(denominator) && numerator >= 0 && denominator > 0 && Number.isFinite(result)
    ? result : null
}

export function numericLabel(value: number | null, digits = 2): string {
  return value === null ? 'Não calculável' : value.toFixed(digits)
}

export type OdometerRecord = { id: string; date: string; km_previous: number; km_current: number; km_driven: number }

// Não altera históricos: sinaliza diferenças e exige revisão explícita.
export function historyIssues(records: OdometerRecord[]): string[] {
  return Array.from(historyIssueDetails(records).keys())
}

export function historyIssueDetails(records: OdometerRecord[]): Map<string, string[]> {
  const ordered = [...records].sort((a, b) => a.date.localeCompare(b.date) || a.km_current - b.km_current)
  const issues = new Map<string, string[]>()
  const km = (value: number) => Number.isFinite(value) ? `${value.toLocaleString('pt-BR')} km` : 'valor inválido'
  ordered.forEach((row, index) => {
    const details: string[] = []
    if (![row.km_previous, row.km_current, row.km_driven].every(Number.isFinite)) {
      details.push(`Hodômetro ou distância inválidos: KM anterior ${km(row.km_previous)}, KM atual ${km(row.km_current)} e KM rodados ${km(row.km_driven)}. Os três valores devem ser números válidos.`)
    }
    if (row.km_previous < 0) details.push(`KM anterior negativo: ${km(row.km_previous)}. O hodômetro anterior não pode ser negativo.`)
    if (row.km_current <= row.km_previous) details.push(`Hodômetro sem avanço: KM atual ${km(row.km_current)} e KM anterior ${km(row.km_previous)}. O atual deve ser maior que o anterior.`)
    if (Math.abs(row.km_current - row.km_previous - row.km_driven) > 0.011) {
      details.push(`Distância divergente: ${km(row.km_current)} − ${km(row.km_previous)} = ${km(row.km_current - row.km_previous)}, mas KM rodados registra ${km(row.km_driven)}. A distância deve corresponder à diferença dos hodômetros.`)
    }
    const previous = ordered[index - 1]
    if (previous && Math.abs(row.km_previous - previous.km_current) > 0.011) {
      const date = previous.date.split('-').reverse().join('/')
      details.push(`Quebra na sequência: KM anterior deste abastecimento (${km(row.km_previous)}) difere do KM atual do abastecimento precedente, de ${date} (${km(previous.km_current)}). Esses valores devem corresponder; a diferença é de ${km(Math.abs(row.km_previous - previous.km_current))}.`)
    }
    if (details.length) issues.set(row.id, details)
  })
  return issues
}

export function validateRefueling(input: { date: string; km_previous: number; km_current: number; liters: number; price_per_liter: number }, records: OdometerRecord[], editingId?: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(Date.parse(input.date)) || new Date(input.date).toISOString().slice(0, 10) !== input.date) return 'Informe uma data válida.'
  if (![input.km_previous, input.km_current, input.liters, input.price_per_liter].every(Number.isFinite) ||
      input.km_previous < 0 || input.km_current <= input.km_previous || input.liters <= 0 || input.price_per_liter < 0) return 'Confira os hodômetros, litros positivos e preço não negativo.'
  const original = records.find(row => row.id === editingId)
  const others = records.filter(row => row.id !== editingId)
  // Sem horário do abastecimento, a ordem do mesmo dia usa o hodômetro.
  const previous = others.filter(row => row.date < input.date || (row.date === input.date && row.km_current <= input.km_previous))
    .sort((a, b) => b.date.localeCompare(a.date) || b.km_current - a.km_current)[0]
  const next = others.filter(row => row.date > input.date || (row.date === input.date && row.km_current > input.km_previous))
    .sort((a, b) => a.date.localeCompare(b.date) || a.km_current - b.km_current)[0]
  const unchanged = original && original.date === input.date && original.km_previous === input.km_previous && original.km_current === input.km_current
  if (unchanged) return null
  if (previous && Math.abs(previous.km_current - input.km_previous) > 0.011) return 'KM anterior deve corresponder ao abastecimento precedente. O histórico não será recalculado automaticamente.'
  if (next && Math.abs(next.km_previous - input.km_current) > 0.011) return 'Este lançamento afetaria o próximo abastecimento. Revise a sequência antes de salvar; os registros existentes serão preservados.'
  return null
}
