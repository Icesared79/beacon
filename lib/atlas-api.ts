const BASE = 'https://atlas-ui-three.vercel.app/api/atlas/beacon'

// ── Types ──────────────────────────────────────────────

export interface Stats {
  total_households: number
  urgent_households: number
  high_households: number
  total_equity_at_risk: number
  states_covered: number
  avg_compound_score: number
  last_updated: string
}

export interface Household {
  parcel_id: string
  property_id: string
  address: string
  city: string
  state: string
  zip: string
  county: string
  latitude: number | null
  longitude: number | null
  owner_name: string | null
  owner_mailing_address: string | null
  owner_city: string | null
  owner_state: string | null
  owner_zip: string | null
  is_absentee_owner: boolean | null
  assessed_value: number | null
  last_sale_price: number | null
  last_sale_date: string | null
  years_held: number | null
  estimated_equity: number | null
  compound_score: number
  signal_count: number
  signal_codes: string[]
  is_long_hold: boolean
  is_high_equity: boolean
  has_distress: boolean
  first_signal_date: string | null
  suggested_service: string | null
}

export interface Market {
  state: string
  city: string | null
  total_households: number
  urgent_count: number
  high_count: number
  avg_score: number
  total_equity_at_risk: number
}

export interface SignalType {
  code: string
  signal_count: number
}

export interface StateCoverage {
  state: string
  households: number
  last_updated: string
}

export interface Schema {
  last_updated: string
  signal_types: SignalType[]
  states_covered: StateCoverage[]
  total_households: number
  new_since_last_visit: number
}

export interface Signal {
  id: string
  code: string
  label: string
  category: string
  base_weight: number
  source: string
  event_date: string | null
  detected_at: string
}

export interface HouseholdDetail extends Household {
  signals?: Signal[]
}

// ── Fetchers ───────────────────────────────────────────

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Atlas API error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function fetchStats(): Promise<Stats> {
  return api<Stats>('/stats')
}

export async function fetchHouseholds(params?: {
  limit?: number
  offset?: number
  state?: string
  signal?: string
  min_score?: number
  max_score?: number
}): Promise<{ households: Household[] }> {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  if (params?.state) query.set('state', params.state)
  if (params?.signal) query.set('signal', params.signal)
  if (params?.min_score) query.set('min_score', String(params.min_score))
  if (params?.max_score) query.set('max_score', String(params.max_score))
  const qs = query.toString()
  return api<{ households: Household[] }>(`/households${qs ? '?' + qs : ''}`)
}

export async function fetchHousehold(parcelId: string): Promise<HouseholdDetail> {
  return api<HouseholdDetail>(`/household/${encodeURIComponent(parcelId)}`)
}

export async function fetchMarkets(): Promise<{ markets: Market[] }> {
  return api<{ markets: Market[] }>('/markets')
}

export async function fetchSchema(): Promise<Schema> {
  return api<Schema>('/schema')
}
