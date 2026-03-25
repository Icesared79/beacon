/** Pure helper functions for prospect data — no synthetic data */

export interface Prospect {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  owner_name: string;
  assessed_value: number;
  estimated_equity: number;
  last_sale_price: number;
  last_sale_date: string;
  years_held: number;
  compound_score: number;
  signal_count: number;
  has_tax_delinquency: boolean;
  has_lis_pendens: boolean;
  has_dissolved_llc: boolean;
  has_bankruptcy: boolean;
  has_probate: boolean;
  is_long_hold: boolean;
  is_high_equity: boolean;
  first_signal_date: string;
  most_recent_signal_date: string;
  status: string;
  atlas_parcel_id?: string;
  source?: string;
  owner_mailing_address?: string;
  owner_city?: string;
  owner_state?: string;
  owner_zip?: string;
  is_absentee_owner?: boolean;
  latitude?: number;
  longitude?: number;
  office_city?: string;
}

export function getSignalsForProspect(p: Prospect): string[] {
  const signals: string[] = [];
  if (p.has_lis_pendens) signals.push('lis_pendens');
  if (p.has_tax_delinquency) signals.push('tax_delinquency');
  if (p.has_dissolved_llc) signals.push('llc_dissolved');
  if (p.has_bankruptcy) signals.push('bankruptcy');
  if (p.has_probate) signals.push('probate');
  if (p.is_long_hold) signals.push('long_hold');
  if (p.is_high_equity) signals.push('high_equity');
  return signals;
}

export type SuggestedService = 'Foreclosure Prevention' | 'Bankruptcy Counseling' | 'Housing Counseling' | 'Debt Management';

export function getSuggestedService(p: Prospect): SuggestedService {
  if (p.has_lis_pendens) return 'Foreclosure Prevention';
  if (p.has_bankruptcy) return 'Bankruptcy Counseling';
  if (p.has_probate) return 'Housing Counseling';
  return 'Debt Management';
}

export type InterventionStage = 'Early' | 'Mid' | 'Late';

export function getInterventionStage(p: Prospect): InterventionStage {
  if (p.compound_score >= 80) return 'Late';
  if (p.compound_score >= 65) return 'Mid';
  return 'Early';
}
