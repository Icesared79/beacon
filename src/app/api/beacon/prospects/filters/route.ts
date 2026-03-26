import { getServiceClient } from '@/lib/supabase';

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

export async function GET() {
  const supabase = getServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  // Get distinct states
  const { data: stateRows, error: stateErr } = await supabase
    .from('beacon_prospects')
    .select('state')
    .not('state', 'is', null)
    .limit(1000);

  if (stateErr) {
    return Response.json({ error: stateErr.message }, { status: 500 });
  }

  const uniqueStates = [...new Set((stateRows || []).map((r: { state: string }) => r.state))]
    .filter(Boolean)
    .sort();

  const states = uniqueStates.map((abbr) => ({
    value: abbr,
    label: STATE_NAMES[abbr] || abbr,
  }));

  // Determine which signal types actually exist by checking boolean columns
  const signalChecks = [
    { key: 'tax_delinquency', col: 'has_tax_delinquency', label: 'Tax Delinquency' },
    { key: 'lis_pendens', col: 'has_lis_pendens', label: 'Foreclosure Risk' },
    { key: 'bankruptcy', col: 'has_bankruptcy', label: 'Bankruptcy' },
    { key: 'dissolved_llc', col: 'has_dissolved_llc', label: 'LLC Dissolved' },
    { key: 'probate', col: 'has_probate', label: 'Probate' },
    { key: 'high_equity', col: 'is_high_equity', label: 'Equity at Risk' },
  ];

  const indicators: { key: string; label: string }[] = [];
  for (const check of signalChecks) {
    const { count } = await supabase
      .from('beacon_prospects')
      .select('id', { count: 'exact', head: true })
      .eq(check.col, true);
    if (count && count > 0) {
      indicators.push({ key: check.key, label: check.label });
    }
  }

  return Response.json({ states, indicators });
}
