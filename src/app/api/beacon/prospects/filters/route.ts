import { fetchSchema } from '@/lib/atlas-api';

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

// Map Atlas signal codes to user-friendly filter labels
const SIGNAL_LABEL_MAP: Record<string, string> = {
  tax_delinquency_active: 'Tax Delinquency',
  foreclosure_risk: 'Foreclosure Risk',
  lis_pendens_active: 'Foreclosure Risk',
  lis_pendens_compound: 'Foreclosure Risk',
  pre_foreclosure_long_hold: 'Pre-Foreclosure',
  bankruptcy: 'Bankruptcy',
  probate_filing_active: 'Probate',
  distress_flagged: 'Distress Flagged',
  hmda_loan_denial: 'Loan Denial',
  llc_dissolved: 'LLC Dissolved',
  high_equity_confirmed: 'Equity at Risk',
  long_hold_confirmed: 'Long-term Homeowner',
  high_vacancy: 'High Vacancy',
};

export async function GET() {
  try {
    const schema = await fetchSchema();

    // States — derived from schema.states_covered (only states with real data)
    const states = (schema.states_covered || [])
      .map(s => s.state)
      .filter(Boolean)
      .sort()
      .map(abbr => ({ value: abbr, label: STATE_NAMES[abbr] || abbr }));

    // Signal types — derived from schema.signal_types (only types that exist)
    // Group related codes under single labels (e.g. lis_pendens_active + lis_pendens_compound → "Foreclosure Risk")
    const seenLabels = new Set<string>();
    const indicators: { key: string; label: string }[] = [];

    for (const sig of (schema.signal_types || [])) {
      const label = SIGNAL_LABEL_MAP[sig.code] || sig.label || sig.code;
      if (!seenLabels.has(label)) {
        seenLabels.add(label);
        indicators.push({ key: sig.code, label });
      }
    }

    return Response.json({ states, indicators });
  } catch (err) {
    console.error('[filters] Atlas schema error:', err);
    return Response.json({ states: [], indicators: [] });
  }
}
