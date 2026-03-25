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
  office_city?: string;
}

export interface SignalEvent {
  id: string;
  prospect_id: string;
  signal_type: string;
  severity: string;
  detected_date: string;
  description: string;
  amount?: number;
}

// ─── Deterministic seeded PRNG ───
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260325);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// ─── Data pools ───
const MARKETS = [
  { city: 'Chicago', state: 'IL', county: 'Cook', zipPre: '606', count: 80 },
  { city: 'Atlanta', state: 'GA', county: 'Fulton', zipPre: '303', count: 65 },
  { city: 'Denver', state: 'CO', county: 'Denver', zipPre: '802', count: 60 },
  { city: 'Philadelphia', state: 'PA', county: 'Philadelphia', zipPre: '191', count: 55 },
  { city: 'Boston', state: 'MA', county: 'Middlesex', zipPre: '021', count: 50 },
  { city: 'Houston', state: 'TX', county: 'Harris', zipPre: '770', count: 45 },
  { city: 'Dallas', state: 'TX', county: 'Dallas', zipPre: '752', count: 40 },
  { city: 'Miami', state: 'FL', county: 'Miami-Dade', zipPre: '331', count: 35 },
  { city: 'Detroit', state: 'MI', county: 'Wayne', zipPre: '482', count: 30 },
  { city: 'Los Angeles', state: 'CA', county: 'Los Angeles', zipPre: '900', count: 30 },
  { city: 'Phoenix', state: 'AZ', county: 'Maricopa', zipPre: '850', count: 25 },
  { city: 'Seattle', state: 'WA', county: 'King', zipPre: '981', count: 20 },
  { city: 'Charlotte', state: 'NC', county: 'Mecklenburg', zipPre: '282', count: 20 },
  { city: 'Cleveland', state: 'OH', county: 'Cuyahoga', zipPre: '441', count: 15 },
  { city: 'Tampa', state: 'FL', county: 'Hillsborough', zipPre: '336', count: 15 },
  { city: 'Las Vegas', state: 'NV', county: 'Clark', zipPre: '891', count: 15 },
] as const;

const STREETS = [
  'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Walnut', 'Birch', 'Hickory',
  'Spruce', 'Willow', 'Ash', 'Chestnut', 'Dogwood', 'Sycamore', 'Magnolia',
  'Poplar', 'Laurel', 'Vine', 'Park', 'Lake', 'Hill', 'Ridge', 'Valley',
  'Brook', 'River', 'Forest', 'Meadow', 'Summit', 'Harbor', 'Canyon',
] as const;

const TYPES = [
  'Street', 'Avenue', 'Boulevard', 'Drive', 'Lane',
  'Court', 'Place', 'Road', 'Way', 'Circle',
] as const;

const FIRSTS = [
  'James', 'Robert', 'John', 'William', 'David', 'Michael', 'Mary', 'Patricia',
  'Jennifer', 'Linda', 'Barbara', 'Susan', 'Richard', 'Joseph', 'Thomas',
  'Charles', 'Sandra', 'Karen', 'Lisa', 'Margaret', 'Donald', 'Kenneth',
  'Steven', 'Edward', 'Dorothy', 'Helen', 'Sharon', 'Donna', 'Carol', 'Ruth',
  'Daniel', 'Paul', 'Mark', 'George', 'Frank', 'Anthony', 'Nancy', 'Betty',
  'Deborah', 'Angela', 'Cynthia', 'Virginia', 'Larry', 'Dennis', 'Jerry',
] as const;

const LASTS = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Taylor',
  'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Lewis', 'Robinson', 'Walker',
  'Hall', 'Green', 'Adams', 'Baker', 'Nelson', 'Hill', 'Ramirez', 'Campbell',
  'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner', 'Parker',
] as const;

const MIDDLES = 'ABCDEFGHJKLMNPRSTW';

type SignalKey = 'lis_pendens' | 'tax_delinquency' | 'llc_dissolved' | 'bankruptcy' | 'probate' | 'long_hold' | 'high_equity';

const SIGNAL_COMBOS: Array<{ signals: SignalKey[]; scoreMin: number; scoreMax: number }> = [
  { signals: ['lis_pendens', 'tax_delinquency', 'bankruptcy', 'long_hold', 'high_equity'], scoreMin: 88, scoreMax: 96 },
  { signals: ['lis_pendens', 'tax_delinquency', 'llc_dissolved', 'long_hold', 'high_equity'], scoreMin: 85, scoreMax: 93 },
  { signals: ['lis_pendens', 'tax_delinquency', 'probate', 'long_hold', 'high_equity'], scoreMin: 82, scoreMax: 90 },
  { signals: ['lis_pendens', 'tax_delinquency', 'long_hold', 'high_equity'], scoreMin: 78, scoreMax: 87 },
  { signals: ['tax_delinquency', 'llc_dissolved', 'probate', 'long_hold', 'high_equity'], scoreMin: 78, scoreMax: 86 },
  { signals: ['tax_delinquency', 'llc_dissolved', 'long_hold', 'high_equity'], scoreMin: 74, scoreMax: 82 },
  { signals: ['tax_delinquency', 'bankruptcy', 'long_hold', 'high_equity'], scoreMin: 73, scoreMax: 81 },
  { signals: ['lis_pendens', 'tax_delinquency', 'long_hold'], scoreMin: 70, scoreMax: 78 },
  { signals: ['tax_delinquency', 'long_hold', 'high_equity'], scoreMin: 65, scoreMax: 74 },
  { signals: ['llc_dissolved', 'long_hold', 'high_equity'], scoreMin: 63, scoreMax: 72 },
  { signals: ['tax_delinquency', 'long_hold'], scoreMin: 58, scoreMax: 68 },
  { signals: ['long_hold', 'high_equity'], scoreMin: 55, scoreMax: 65 },
];

const COMBO_WEIGHTS = [3, 3, 3, 4, 3, 4, 3, 4, 5, 5, 6, 7];
const STATUS_POOL = [
  ...Array(12).fill('new'),
  ...Array(3).fill('reviewed'),
  ...Array(2).fill('contacted'),
  'in_counseling',
];

function pickWeightedCombo(): typeof SIGNAL_COMBOS[number] {
  const total = COMBO_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < SIGNAL_COMBOS.length; i++) {
    r -= COMBO_WEIGHTS[i];
    if (r <= 0) return SIGNAL_COMBOS[i];
  }
  return SIGNAL_COMBOS[SIGNAL_COMBOS.length - 1];
}

// ─── Generate 600 prospects ───
function generateProspects(): Prospect[] {
  const prospects: Prospect[] = [];
  let id = 1;

  for (const market of MARKETS) {
    for (let i = 0; i < market.count; i++) {
      const combo = pickWeightedCombo();
      const score = randInt(combo.scoreMin, combo.scoreMax);
      const yearsHeld = randInt(10, 22);
      const assessedValue = randInt(120, 650) * 1000;
      const ratio = 0.15 + rand() * 0.30;
      const lastSalePrice = Math.round(assessedValue * ratio);
      const equity = assessedValue - lastSalePrice;
      const saleYear = 2026 - yearsHeld;
      const saleMonth = String(randInt(1, 12)).padStart(2, '0');
      const saleDay = String(randInt(1, 28)).padStart(2, '0');
      const firstSigDaysAgo = randInt(90, 540);
      const firstSigDate = new Date(2026, 2, 25);
      firstSigDate.setDate(firstSigDate.getDate() - firstSigDaysAgo);

      const first = pick(FIRSTS);
      const mid = MIDDLES[Math.floor(rand() * MIDDLES.length)];
      const last = pick(LASTS);

      prospects.push({
        id: String(id++),
        address: `${randInt(100, 9999)} ${pick(STREETS)} ${pick(TYPES)}`,
        city: market.city,
        state: market.state,
        zip: `${market.zipPre}${randInt(10, 99)}`,
        county: market.county,
        owner_name: `${first} ${mid}. ${last}`,
        assessed_value: assessedValue,
        estimated_equity: equity,
        last_sale_price: lastSalePrice,
        last_sale_date: `${saleYear}-${saleMonth}-${saleDay}`,
        years_held: yearsHeld,
        compound_score: score,
        signal_count: combo.signals.length,
        has_tax_delinquency: combo.signals.includes('tax_delinquency'),
        has_lis_pendens: combo.signals.includes('lis_pendens'),
        has_dissolved_llc: combo.signals.includes('llc_dissolved'),
        has_bankruptcy: combo.signals.includes('bankruptcy'),
        has_probate: combo.signals.includes('probate'),
        is_long_hold: combo.signals.includes('long_hold'),
        is_high_equity: combo.signals.includes('high_equity'),
        first_signal_date: firstSigDate.toISOString().slice(0, 10),
        most_recent_signal_date: '2026-03-25',
        status: pick(STATUS_POOL),
        office_city: market.city,
      });
    }
  }

  return prospects.sort((a, b) => b.compound_score - a.compound_score);
}

export const DEMO_PROSPECTS = generateProspects();

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

export function getDemoSignalEvents(prospectId: string): SignalEvent[] {
  const prospect = DEMO_PROSPECTS.find((p) => p.id === prospectId);
  if (!prospect) return [];

  const events: SignalEvent[] = [];
  let idx = 0;

  if (prospect.has_tax_delinquency) {
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'tax_delinquency', severity: 'high',
      detected_date: '2024-01-12',
      description: 'Property tax delinquency first recorded — unpaid balance detected.',
      amount: 4821,
    });
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'tax_delinquency', severity: 'high',
      detected_date: '2025-01-15',
      description: 'Second consecutive tax year delinquent. Balance increasing.',
      amount: 9642,
    });
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'tax_delinquency', severity: 'critical',
      detected_date: '2026-01-20',
      description: 'Third consecutive tax year delinquent. County lien likely.',
      amount: 14463,
    });
  }
  if (prospect.has_dissolved_llc) {
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'llc_dissolved', severity: 'high',
      detected_date: '2024-03-15',
      description: `LLC "${prospect.owner_name.split(' ')[1]} Holdings LLC" dissolved by state.`,
    });
  }
  if (prospect.has_lis_pendens) {
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'lis_pendens', severity: 'critical',
      detected_date: '2025-11-08',
      description: 'Lis pendens filed — lender initiated foreclosure proceedings.',
      amount: 142000,
    });
  }
  if (prospect.has_bankruptcy) {
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'bankruptcy', severity: 'critical',
      detected_date: '2025-06-20',
      description: 'Chapter 7 bankruptcy filing detected.',
    });
  }
  if (prospect.has_probate) {
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'probate', severity: 'warning',
      detected_date: '2025-04-12',
      description: 'Probate case opened. Property in estate.',
    });
  }
  if (prospect.is_long_hold) {
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'long_hold', severity: 'info',
      detected_date: prospect.first_signal_date,
      description: `Property held for ${prospect.years_held} years since purchase in ${prospect.last_sale_date.slice(0, 4)}.`,
    });
  }
  if (prospect.is_high_equity) {
    events.push({
      id: `${prospectId}-${idx++}`, prospect_id: prospectId,
      signal_type: 'high_equity', severity: 'info',
      detected_date: prospect.first_signal_date,
      description: `Estimated equity of $${prospect.estimated_equity.toLocaleString()} — significant asset to protect.`,
    });
  }

  return events.sort((a, b) => a.detected_date.localeCompare(b.detected_date));
}
