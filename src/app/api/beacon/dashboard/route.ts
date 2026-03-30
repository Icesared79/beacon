import { fetchStats } from '@/lib/atlas-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchStats();

    // Atlas get_beacon_stats returns:
    //   total_households, urgent_households, high_households,
    //   total_equity_at_risk, states_covered, avg_compound_score, last_updated
    const total = Number(data.total_households ?? 0);
    const foreclosureCount = Number(data.urgent_households ?? 0);
    const statesWithCoverage = Number(data.states_covered ?? 0);
    const avgScore = Math.round(Number(data.avg_compound_score ?? 0));

    return Response.json({
      stats: {
        total,
        foreclosureCount,
        statesWithCoverage,
        avgScore,
      },
      // Distress indicators require per-signal counts which the stats
      // endpoint doesn't provide. Use the schema endpoint on the frontend
      // for detailed breakdowns. For now, show aggregate groupings.
      distressIndicators: [
        { label: 'Critical (70+)', count: Number(data.urgent_households ?? 0), pct: total > 0 ? Math.round((Number(data.urgent_households ?? 0) / total) * 100) : 0, color: '#DC2626' },
        { label: 'High Need (50–69)', count: Number(data.high_households ?? 0), pct: total > 0 ? Math.round((Number(data.high_households ?? 0) / total) * 100) : 0, color: '#D97706' },
        { label: 'Monitor (<50)', count: Math.max(0, total - Number(data.urgent_households ?? 0) - Number(data.high_households ?? 0)), pct: total > 0 ? Math.round((Math.max(0, total - Number(data.urgent_households ?? 0) - Number(data.high_households ?? 0)) / total) * 100) : 0, color: '#2563EB' },
      ],
    });
  } catch (err) {
    console.error('[dashboard] Atlas API error:', err);
    return Response.json(
      { error: 'Failed to load dashboard stats from Atlas' },
      { status: 502 }
    );
  }
}
