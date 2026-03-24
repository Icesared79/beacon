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

// Demo prospect data seeded from Atlas-style signals
export const DEMO_PROSPECTS: Prospect[] = [
  {
    id: '1', address: '1847 Elm Street', city: 'Denver', state: 'CO', zip: '80202', county: 'Denver',
    owner_name: 'Robert M. Fischer', assessed_value: 387000, estimated_equity: 284000,
    last_sale_price: 103000, last_sale_date: '2008-06-15', years_held: 17,
    compound_score: 87, signal_count: 5,
    has_tax_delinquency: true, has_lis_pendens: true, has_dissolved_llc: true,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-01-12', most_recent_signal_date: '2026-03-21',
    status: 'new', office_city: 'Denver',
  },
  {
    id: '2', address: '456 Oak Avenue', city: 'Atlanta', state: 'GA', zip: '30303', county: 'Fulton',
    owner_name: 'Mary L. Johnson', assessed_value: 312000, estimated_equity: 198000,
    last_sale_price: 114000, last_sale_date: '2012-03-22', years_held: 14,
    compound_score: 72, signal_count: 3,
    has_tax_delinquency: true, has_lis_pendens: false, has_dissolved_llc: false,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-08-05', most_recent_signal_date: '2026-02-14',
    status: 'reviewed', office_city: 'Atlanta',
  },
  {
    id: '3', address: '2201 Walnut Boulevard', city: 'Philadelphia', state: 'PA', zip: '19103', county: 'Philadelphia',
    owner_name: 'Thomas J. Reeves', assessed_value: 265000, estimated_equity: 201000,
    last_sale_price: 64000, last_sale_date: '2005-11-30', years_held: 20,
    compound_score: 91, signal_count: 4,
    has_tax_delinquency: true, has_lis_pendens: true, has_dissolved_llc: false,
    has_bankruptcy: true, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2023-06-18', most_recent_signal_date: '2026-03-10',
    status: 'new', office_city: 'Philadelphia',
  },
  {
    id: '4', address: '889 Maple Drive', city: 'Chicago', state: 'IL', zip: '60611', county: 'Cook',
    owner_name: 'Sandra K. Williams', assessed_value: 421000, estimated_equity: 310000,
    last_sale_price: 111000, last_sale_date: '2009-04-17', years_held: 17,
    compound_score: 84, signal_count: 4,
    has_tax_delinquency: true, has_lis_pendens: true, has_dissolved_llc: true,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-03-01', most_recent_signal_date: '2026-03-18',
    status: 'contacted', office_city: 'Chicago',
  },
  {
    id: '5', address: '3312 Cedar Lane', city: 'Boston', state: 'MA', zip: '02466', county: 'Middlesex',
    owner_name: 'David A. Morrison', assessed_value: 542000, estimated_equity: 412000,
    last_sale_price: 130000, last_sale_date: '2006-09-28', years_held: 19,
    compound_score: 68, signal_count: 2,
    has_tax_delinquency: true, has_lis_pendens: false, has_dissolved_llc: false,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2025-01-15', most_recent_signal_date: '2026-01-20',
    status: 'new', office_city: 'Boston',
  },
  {
    id: '6', address: '701 Pine Street', city: 'Detroit', state: 'MI', zip: '48243', county: 'Wayne',
    owner_name: 'Patricia N. Carter', assessed_value: 178000, estimated_equity: 134000,
    last_sale_price: 44000, last_sale_date: '2010-02-14', years_held: 16,
    compound_score: 79, signal_count: 3,
    has_tax_delinquency: true, has_lis_pendens: false, has_dissolved_llc: true,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-05-20', most_recent_signal_date: '2026-02-28',
    status: 'reviewed', office_city: 'Detroit',
  },
  {
    id: '7', address: '1520 Birch Court', city: 'Dallas', state: 'TX', zip: '75201', county: 'Dallas',
    owner_name: 'James W. Thompson', assessed_value: 298000, estimated_equity: 221000,
    last_sale_price: 77000, last_sale_date: '2011-07-09', years_held: 15,
    compound_score: 75, signal_count: 3,
    has_tax_delinquency: true, has_lis_pendens: true, has_dissolved_llc: false,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: false,
    first_signal_date: '2024-11-03', most_recent_signal_date: '2026-03-05',
    status: 'new', office_city: 'Dallas',
  },
  {
    id: '8', address: '2945 Spruce Avenue', city: 'Houston', state: 'TX', zip: '77002', county: 'Harris',
    owner_name: 'Linda R. Gonzales', assessed_value: 256000, estimated_equity: 189000,
    last_sale_price: 67000, last_sale_date: '2007-12-01', years_held: 18,
    compound_score: 82, signal_count: 4,
    has_tax_delinquency: true, has_lis_pendens: false, has_dissolved_llc: true,
    has_bankruptcy: false, has_probate: true, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-02-18', most_recent_signal_date: '2026-03-12',
    status: 'in_counseling', office_city: 'Houston',
  },
  {
    id: '9', address: '478 Willow Way', city: 'Miami', state: 'FL', zip: '33139', county: 'Miami-Dade',
    owner_name: 'Carlos J. Perez', assessed_value: 389000, estimated_equity: 267000,
    last_sale_price: 122000, last_sale_date: '2010-08-22', years_held: 15,
    compound_score: 77, signal_count: 3,
    has_tax_delinquency: true, has_lis_pendens: true, has_dissolved_llc: false,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-09-14', most_recent_signal_date: '2026-03-01',
    status: 'new', office_city: 'Miami',
  },
  {
    id: '10', address: '612 Ash Street', city: 'Los Angeles', state: 'CA', zip: '90071', county: 'Los Angeles',
    owner_name: 'Jennifer M. Park', assessed_value: 687000, estimated_equity: 498000,
    last_sale_price: 189000, last_sale_date: '2008-01-15', years_held: 18,
    compound_score: 69, signal_count: 2,
    has_tax_delinquency: false, has_lis_pendens: false, has_dissolved_llc: false,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2025-06-10', most_recent_signal_date: '2026-01-28',
    status: 'new', office_city: 'Los Angeles',
  },
  {
    id: '11', address: '1033 Hickory Place', city: 'Tampa', state: 'FL', zip: '33602', county: 'Hillsborough',
    owner_name: 'William D. Burke', assessed_value: 231000, estimated_equity: 172000,
    last_sale_price: 59000, last_sale_date: '2009-05-11', years_held: 17,
    compound_score: 85, signal_count: 4,
    has_tax_delinquency: true, has_lis_pendens: true, has_dissolved_llc: false,
    has_bankruptcy: false, has_probate: true, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-04-22', most_recent_signal_date: '2026-03-15',
    status: 'contacted', office_city: 'Tampa',
  },
  {
    id: '12', address: '5507 Poplar Road', city: 'Charlotte', state: 'NC', zip: '28202', county: 'Mecklenburg',
    owner_name: 'Angela F. Mason', assessed_value: 345000, estimated_equity: 248000,
    last_sale_price: 97000, last_sale_date: '2011-10-03', years_held: 14,
    compound_score: 71, signal_count: 3,
    has_tax_delinquency: true, has_lis_pendens: false, has_dissolved_llc: true,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2025-02-01', most_recent_signal_date: '2026-02-20',
    status: 'new', office_city: 'Charlotte',
  },
  {
    id: '13', address: '827 Chestnut Way', city: 'Phoenix', state: 'AZ', zip: '85012', county: 'Maricopa',
    owner_name: 'Richard H. Olsen', assessed_value: 274000, estimated_equity: 195000,
    last_sale_price: 79000, last_sale_date: '2010-03-19', years_held: 16,
    compound_score: 88, signal_count: 5,
    has_tax_delinquency: true, has_lis_pendens: true, has_dissolved_llc: true,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2023-11-05', most_recent_signal_date: '2026-03-22',
    status: 'new', office_city: 'Phoenix',
  },
  {
    id: '14', address: '1440 Sycamore Lane', city: 'Cleveland', state: 'OH', zip: '44114', county: 'Cuyahoga',
    owner_name: 'Barbara E. Walsh', assessed_value: 198000, estimated_equity: 152000,
    last_sale_price: 46000, last_sale_date: '2007-06-28', years_held: 18,
    compound_score: 76, signal_count: 3,
    has_tax_delinquency: true, has_lis_pendens: false, has_dissolved_llc: false,
    has_bankruptcy: true, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2024-07-12', most_recent_signal_date: '2026-01-30',
    status: 'reviewed', office_city: 'Cleveland',
  },
  {
    id: '15', address: '2688 Dogwood Circle', city: 'Seattle', state: 'WA', zip: '98104', county: 'King',
    owner_name: 'Steven C. Yamamoto', assessed_value: 612000, estimated_equity: 445000,
    last_sale_price: 167000, last_sale_date: '2009-11-20', years_held: 16,
    compound_score: 63, signal_count: 2,
    has_tax_delinquency: true, has_lis_pendens: false, has_dissolved_llc: false,
    has_bankruptcy: false, has_probate: false, is_long_hold: true, is_high_equity: true,
    first_signal_date: '2025-08-01', most_recent_signal_date: '2026-02-10',
    status: 'new', office_city: 'Seattle',
  },
];

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
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'tax_delinquency',
      severity: 'high',
      detected_date: '2024-01-12',
      description: 'Property tax delinquency first recorded — unpaid balance detected.',
      amount: 4821,
    });
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'tax_delinquency',
      severity: 'high',
      detected_date: '2025-01-15',
      description: 'Second consecutive tax year delinquent. Balance increasing.',
      amount: 9642,
    });
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'tax_delinquency',
      severity: 'critical',
      detected_date: '2026-01-20',
      description: 'Third consecutive tax year delinquent. County lien likely.',
      amount: 14463,
    });
  }
  if (prospect.has_dissolved_llc) {
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'llc_dissolved',
      severity: 'high',
      detected_date: '2024-03-15',
      description: `LLC "${prospect.owner_name.split(' ')[1]} Holdings LLC" dissolved by state.`,
    });
  }
  if (prospect.has_lis_pendens) {
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'lis_pendens',
      severity: 'critical',
      detected_date: '2025-11-08',
      description: 'Lis pendens filed — lender initiated foreclosure proceedings.',
      amount: 142000,
    });
  }
  if (prospect.has_bankruptcy) {
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'bankruptcy',
      severity: 'critical',
      detected_date: '2025-06-20',
      description: 'Chapter 7 bankruptcy filing detected.',
    });
  }
  if (prospect.has_probate) {
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'probate',
      severity: 'warning',
      detected_date: '2025-04-12',
      description: 'Probate case opened. Property in estate.',
    });
  }
  if (prospect.is_long_hold) {
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'long_hold',
      severity: 'info',
      detected_date: prospect.first_signal_date,
      description: `Property held for ${prospect.years_held} years since purchase in ${prospect.last_sale_date.slice(0, 4)}.`,
    });
  }
  if (prospect.is_high_equity) {
    events.push({
      id: `${prospectId}-${idx++}`,
      prospect_id: prospectId,
      signal_type: 'high_equity',
      severity: 'info',
      detected_date: prospect.first_signal_date,
      description: `Estimated equity of $${prospect.estimated_equity.toLocaleString()} — significant asset to protect.`,
    });
  }

  return events.sort((a, b) => a.detected_date.localeCompare(b.detected_date));
}
