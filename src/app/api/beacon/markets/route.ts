import { ACCC_MARKETS, ACCC_OFFICES, MONTHLY_TREND, SIGNAL_BREAKDOWN } from '@/lib/market-data';

export async function GET() {
  // TODO: Replace with Supabase query to beacon_market_snapshots
  return Response.json({
    markets: ACCC_MARKETS,
    offices: ACCC_OFFICES,
    trend: MONTHLY_TREND,
    signals: SIGNAL_BREAKDOWN,
    totals: {
      prospects: ACCC_MARKETS.reduce((s, m) => s + m.prospects, 0),
      critical: ACCC_MARKETS.reduce((s, m) => s + m.critical, 0),
      avgScore: Math.round(ACCC_MARKETS.reduce((s, m) => s + m.score, 0) / ACCC_MARKETS.length),
    },
  });
}
