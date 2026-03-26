import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  // All queries run in parallel against beacon_prospects
  const [
    totalRes,
    foreclosureRes,
    statesRes,
    avgScoreRes,
    taxRes,
    lisRes,
    llcRes,
    bankruptcyRes,
    probateRes,
    highEquityRes,
  ] = await Promise.all([
    // Total households identified
    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true }),

    // Families at risk of foreclosure (lis pendens)
    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true })
      .eq('has_lis_pendens', true),

    // Distinct states with coverage
    supabase
      .from('beacon_prospects')
      .select('state'),

    // Average compound score
    supabase
      .from('beacon_prospects')
      .select('compound_score'),

    // Signal counts for distress indicators
    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true })
      .eq('has_tax_delinquency', true),

    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true })
      .eq('has_lis_pendens', true),

    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true })
      .eq('has_dissolved_llc', true),

    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true })
      .eq('has_bankruptcy', true),

    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true })
      .eq('has_probate', true),

    supabase
      .from('beacon_prospects')
      .select('*', { count: 'exact', head: true })
      .eq('is_high_equity', true),
  ]);

  const total = totalRes.count ?? 0;
  const foreclosureCount = foreclosureRes.count ?? 0;

  // Distinct state count
  const stateSet = new Set(
    (statesRes.data || []).map((r: { state: string }) => r.state).filter(Boolean)
  );
  const statesWithCoverage = stateSet.size;

  // Average compound score
  const scores = (avgScoreRes.data || []).map(
    (r: { compound_score: number }) => r.compound_score
  );
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

  // Distress indicator counts
  const taxCount = taxRes.count ?? 0;
  const lisCount = lisRes.count ?? 0;
  const llcCount = llcRes.count ?? 0;
  const bankruptcyCount = bankruptcyRes.count ?? 0;
  const probateCount = probateRes.count ?? 0;
  const highEquityCount = highEquityRes.count ?? 0;

  const signalTotal =
    taxCount + lisCount + llcCount + bankruptcyCount + probateCount + highEquityCount;

  function pct(n: number) {
    return signalTotal > 0 ? Math.round((n / signalTotal) * 100) : 0;
  }

  return Response.json({
    stats: {
      total,
      foreclosureCount,
      statesWithCoverage,
      avgScore,
    },
    distressIndicators: [
      { label: 'Tax Delinquency', count: taxCount, pct: pct(taxCount), color: '#D97706' },
      { label: 'Foreclosure Risk', count: lisCount, pct: pct(lisCount), color: '#DC2626' },
      { label: 'LLC Dissolved', count: llcCount, pct: pct(llcCount), color: '#EA580C' },
      { label: 'Bankruptcy', count: bankruptcyCount, pct: pct(bankruptcyCount), color: '#7C3AED' },
      { label: 'Probate', count: probateCount, pct: pct(probateCount), color: '#0891B2' },
      { label: 'Equity at Risk', count: highEquityCount, pct: pct(highEquityCount), color: '#16A34A' },
    ],
  });
}
