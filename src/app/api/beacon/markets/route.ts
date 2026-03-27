import { fetchMarkets } from '@/lib/atlas-api';
import { ACCC_OFFICES } from '@/lib/market-data';

export async function GET() {
  try {
    const data = await fetchMarkets();
    const markets = data.markets || [];

    // Map Atlas market_summary to the shape the coverage page expects
    const mapped = markets.map(m => ({
      city: m.city,
      state: m.state,
      prospects: Number(m.total_households ?? 0),
      critical: Number(m.urgent_count ?? 0),
      high: Number(m.high_count ?? 0),
      warning: Math.max(0, Number(m.total_households ?? 0) - Number(m.urgent_count ?? 0) - Number(m.high_count ?? 0)),
      score: Math.round(Number(m.avg_score ?? 0)),
    }));

    const totals = {
      prospects: mapped.reduce((s, m) => s + m.prospects, 0),
      critical: mapped.reduce((s, m) => s + m.critical, 0),
      avgScore: mapped.length > 0
        ? Math.round(mapped.reduce((s, m) => s + m.score, 0) / mapped.length)
        : 0,
    };

    return Response.json({
      markets: mapped,
      offices: ACCC_OFFICES,
      totals,
    });
  } catch (err) {
    console.error('[markets] Atlas API error:', err);
    return Response.json(
      { error: 'Failed to load market data from Atlas' },
      { status: 502 }
    );
  }
}
