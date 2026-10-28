import { supabase } from './supabase'

export function dataError(error: unknown): string {
  const code = (error as { code?: string })?.code
  if (code === '42501' || code === 'PGRST301') return 'Acesso negado ou sessão expirada. Entre novamente. Se persistir, confira a configuração de segurança.'
  if (code === '23505') return 'Já existe um registro com estes dados.'
  if (code === 'PGRST116') return 'O registro não está mais disponível ou você não tem permissão para alterá-lo. Atualize a listagem.'
  if (code === 'P0001') return 'Operação bloqueada para preservar a integridade. Confira a sequência dos hodômetros, datas e valores. Não é permitido mover históricos ou excluir abastecimentos com sucessores.'
  return 'Não foi possível concluir a operação. Confira a conexão e tente novamente. Os dados não foram considerados vazios.'
}

// Filtros adicionais no cliente não substituem as políticas RLS do banco.
export async function readAll<T>(table: 'vehicles' | 'refuelings' | 'maintenances', vehicleId?: string): Promise<T[]> {
  const rows: T[] = []
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user?.email_confirmed_at) throw error || new Error('Sessão inválida')
  for (let offset = 0; ;) {
    let query = supabase.from(table).select('*').order('id').range(offset, offset + 499)
    if (table === 'vehicles') query = query.eq('owner_id', user.id)
    else if (vehicleId) query = query.eq('vehicle_id', vehicleId)
    const result = await query
    if (result.error) throw result.error
    rows.push(...(result.data as T[]))
    if (result.data.length === 0) return rows
    offset += result.data.length
  }
}
