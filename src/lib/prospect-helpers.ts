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
  distress_months?: number;
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

/** True if the prospect has at least one hard distress signal (foreclosure, tax, bankruptcy, lis pendens, probate). */
export function hasHardDistress(p: Prospect): boolean {
  return !!(p.has_lis_pendens || p.has_tax_delinquency || p.has_bankruptcy || p.has_probate);
}

export function getInterventionStage(p: Prospect): InterventionStage {
  if (!hasHardDistress(p)) return 'Early';
  if (p.compound_score >= 70) return 'Late';
  if (p.compound_score >= 50) return 'Mid';
  return 'Early';
}

// ── Priority queue helpers ──

export type PriorityGroup = 'critical' | 'high_need' | 'monitor';

export function getPriorityGroup(p: Prospect): PriorityGroup {
  if (p.compound_score >= 70 && hasHardDistress(p)) return 'critical';
  if (p.compound_score >= 50 && hasHardDistress(p)) return 'high_need';
  return 'monitor';
}

/** Signal severity order — first match is the "primary" signal shown on the row. */
const SIGNAL_SEVERITY: { key: string; flag: keyof Prospect }[] = [
  { key: 'lis_pendens', flag: 'has_lis_pendens' },
  { key: 'bankruptcy', flag: 'has_bankruptcy' },
  { key: 'tax_delinquency', flag: 'has_tax_delinquency' },
  { key: 'probate', flag: 'has_probate' },
  { key: 'llc_dissolved', flag: 'has_dissolved_llc' },
  { key: 'high_equity', flag: 'is_high_equity' },
  { key: 'long_hold', flag: 'is_long_hold' },
];

/** Returns the single most severe signal key, or null. */
export function getPrimarySignal(p: Prospect): string | null {
  for (const s of SIGNAL_SEVERITY) {
    if (p[s.flag]) return s.key;
  }
  return null;
}

/** Days since first signal was detected. Falls back to last_sale_date + years_held if no signal date. */
export function getDaysInDistress(p: Prospect): number | null {
  // Primary: use first_signal_date
  const dateStr = p.first_signal_date || p.most_recent_signal_date;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 ? diff : null;
    }
  }
  // Fallback: estimate from years_held (distress typically starts in last 10-20% of hold)
  if (p.years_held && p.years_held > 0) {
    const estimatedMonths = Math.max(3, Math.round(p.years_held * 0.15 * 12));
    return estimatedMonths * 30;
  }
  return null;
}

// ── Entity name filter ──

const ENTITY_KEYWORDS = [
  'LLC', ' LP ', ' LP,', ' INC', ' CORP', 'HOLDINGS', 'RENTALS',
  'GROUP', 'PROPERTIES', 'ASSOCIATES', 'INVESTMENTS', 'MANAGEMENT',
  'REALTY', 'VENTURES', ' LTD', 'PARTNERS', 'PARTNERSHIP',
  'COMPANY', 'ENTERPRISES', 'DEVELOPMENT', 'SERVICES',
  'CAPITAL', 'FUNDING', 'ACQUISITIONS', 'COMMERCIAL',
  'LLLP', 'REIT', 'LEASING',
  // Fix 3: additional institutional patterns
  'AUTHORITY', 'HOUSING AUTH', 'ASSOCIATION', 'FOUNDATION',
  'PARISH', 'CHURCH', 'SCHOOL DISTRICT', 'CITY OF', 'STATE OF',
  'COUNTY OF', 'GOVERNMENT', 'MUNICIPAL', 'TOWNSHIP', 'TRANSIT',
  'DISTRICT', 'KOLLEL', 'BIBLE', 'MINISTRY',
];

/** Returns true if the owner name looks like a business entity, not an individual.
 *  TRUST is only flagged if not preceded by a personal name (2+ words before it). */
export function isEntityOwner(ownerName: string): boolean {
  if (!ownerName) return false;
  const upper = ownerName.toUpperCase();
  if (ENTITY_KEYWORDS.some(kw => upper.includes(kw))) return true;
  // TRUST check — allow "John Smith Trust" but reject "Family Trust", "The Trust"
  if (upper.includes('TRUST')) {
    const parts = ownerName.trim().split(/\s+/);
    const trustIdx = parts.findIndex(p => /^trust$/i.test(p));
    if (trustIdx < 2) return true; // fewer than 2 words before TRUST → entity
  }
  return false;
}
