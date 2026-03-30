/**
 * Atlas API client — all Beacon data comes from here.
 * Beacon has no database of its own.
 */

const ATLAS_BASE = 'https://atlas-ui-three.vercel.app';

async function atlasGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, ATLAS_BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Atlas API ${path} returned ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Response types ──

export interface AtlasStats {
  total_households: number;
  urgent_households: number;
  high_households: number;
  total_equity_at_risk: number;
  states_covered: number;
  avg_compound_score: number;
  last_updated: string;
  [key: string]: unknown;
}

export interface AtlasHousehold {
  parcel_id: string;
  property_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  owner_name: string;
  assessed_value: number | null;
  estimated_equity: number | null;
  last_sale_price: number | null;
  last_sale_date: string | null;
  years_held: number | null;
  compound_score: number;
  signal_count: number;
  signal_codes: string[];
  is_long_hold: boolean;
  is_high_equity: boolean;
  has_distress: boolean;
  first_signal_date: string | null;
  suggested_service: string;
  latitude?: number | null;
  longitude?: number | null;
  owner_mailing_address?: string | null;
  owner_city?: string | null;
  owner_state?: string | null;
  owner_zip?: string | null;
  is_absentee_owner?: boolean;
  [key: string]: unknown;
}

export interface AtlasHouseholdsResponse {
  households: AtlasHousehold[];
  count: number;
  offset: number;
  limit: number;
}

export interface AtlasHouseholdDetail extends AtlasHousehold {
  [key: string]: unknown;
}

export interface AtlasMarket {
  state: string;
  city: string;
  total_households: number;
  urgent_count: number;
  high_count: number;
  avg_score: number;
  total_equity_at_risk: number;
  [key: string]: unknown;
}

export interface AtlasMarketsResponse {
  markets: AtlasMarket[];
  [key: string]: unknown;
}

// ── Schema types ──

export interface AtlasSchemaSignalType {
  code: string;
  label: string;
  signal_count: number;
  states: string[];
}

export interface AtlasSchemaState {
  state: string;
  households: number;
  signal_types: string[];
  last_updated: string;
}

export interface AtlasSchema {
  signal_types: AtlasSchemaSignalType[];
  states_covered: AtlasSchemaState[];
  total_households: number;
  last_updated: string;
  new_since_last_visit: number;
}

// ── API calls ──

export function fetchStats(state?: string): Promise<AtlasStats> {
  const params: Record<string, string> = {};
  if (state) params.state = state;
  return atlasGet('/api/atlas/beacon/stats', params);
}

export function fetchHouseholds(params: {
  state?: string;
  min_score?: string;
  limit?: string;
  offset?: string;
  signal_type?: string;
}): Promise<AtlasHouseholdsResponse> {
  const query: Record<string, string> = {};
  if (params.state) query.state = params.state;
  if (params.min_score) query.min_score = params.min_score;
  if (params.limit) query.limit = params.limit;
  if (params.offset) query.offset = params.offset;
  if (params.signal_type) query.signal_type = params.signal_type;
  return atlasGet('/api/atlas/beacon/households', query);
}

export function fetchHousehold(parcelId: string): Promise<AtlasHouseholdDetail> {
  return atlasGet(`/api/atlas/beacon/household/${encodeURIComponent(parcelId)}`);
}

export function fetchMarkets(): Promise<AtlasMarketsResponse> {
  return atlasGet('/api/atlas/beacon/markets');
}

export function fetchSchema(): Promise<AtlasSchema> {
  return atlasGet('/api/atlas/beacon/schema');
}
