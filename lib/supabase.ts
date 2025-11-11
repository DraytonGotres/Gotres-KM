import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Vehicle = {
  id: string
  manufacturer: string
  model: string
  plate: string
  color: string
  year: number
  created_at: string
}

export type Refueling = {
  id: string
  vehicle_id: string
  date: string
  km_current: number
  km_previous: number
  km_driven: number
  liters: number
  price_per_liter: number
  cost: number
  fuel_type: string
  created_at: string
}

export type Maintenance = {
  id: string
  vehicle_id: string
  date: string
  type: string
  description: string
  cost: number
  km_at_maintenance: number
  created_at: string
}
