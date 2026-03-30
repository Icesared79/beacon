import { fetchMarkets } from '@/lib/atlas-api';
import { ACCC_OFFICES } from '@/lib/market-data';

// US state codes — filter these out when they appear as city names
const STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

function normalizeCity(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function isStateCode(city: string): boolean {
  const trimmed = city.trim().toUpperCase();
  return trimmed.length <= 2 && STATE_CODES.has(trimmed);
}

export async function GET() {
  try {
    const data = await fetchMarkets();
    const rawMarkets = data.markets || [];

    // Fix 2: Deduplicate markets by normalized city + state, filter state codes as cities
    const deduped = new Map<string, {
      city: string;
      state: string;
      prospects: number;
      critical: number;
      high: number;
      warning: number;
      score: number;
      scoreSum: number;
      count: number;
    }>();

    for (const m of rawMarkets) {
      const city = normalizeCity(m.city);
      const state = (m.state || '').trim().toUpperCase();

      // Skip state codes appearing as city names (e.g. "CO", "NY")
      if (!city || isStateCode(city)) continue;

      const key = `${city}|${state}`;
      const existing = deduped.get(key);

      if (existing) {
        existing.prospects += Number(m.total_households ?? 0);
        existing.critical += Number(m.urgent_count ?? 0);
        existing.high += Number(m.high_count ?? 0);
        existing.warning += Math.max(0,
          Number(m.total_households ?? 0) - Number(m.urgent_count ?? 0) - Number(m.high_count ?? 0)
        );
        existing.scoreSum += Number(m.avg_score ?? 0);
        existing.count += 1;
      } else {
        const total = Number(m.total_households ?? 0);
        const urgent = Number(m.urgent_count ?? 0);
        const high = Number(m.high_count ?? 0);
        deduped.set(key, {
          city,
          state,
          prospects: total,
          critical: urgent,
          high,
          warning: Math.max(0, total - urgent - high),
          score: Math.round(Number(m.avg_score ?? 0)),
          scoreSum: Number(m.avg_score ?? 0),
          count: 1,
        });
      }
    }

    const mapped = Array.from(deduped.values()).map(m => ({
      city: m.city,
      state: m.state,
      prospects: m.prospects,
      critical: m.critical,
      high: m.high,
      warning: m.warning,
      score: m.count > 1 ? Math.round(m.scoreSum / m.count) : m.score,
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
