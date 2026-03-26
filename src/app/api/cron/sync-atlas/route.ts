import { NextRequest } from 'next/server';

const PROJECT_REF = 'urxfibjfbzkcnxhyynpb';
const MAX_PER_STATE = 500;
const BATCH_SIZE = 25;

async function atlasQuery(sql: string, accessToken: string): Promise<unknown[]> {
  const resp = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: AbortSignal.timeout(120_000),
    }
  );
  const data = await resp.json();
  if (!resp.ok || (typeof data === 'object' && data !== null && 'message' in data)) {
    throw new Error(`Atlas query failed: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data as unknown[];
}

function sqlVal(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

interface RawSignalRow {
  parcel_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  owner_name: string;
  owner_mailing_address: string | null;
  owner_city: string | null;
  owner_state: string | null;
  owner_zip: string | null;
  is_absentee_owner: boolean;
  total_assessed_value: number | null;
  market_value: number | null;
  last_sale_price: number | null;
  last_sale_date: string | null;
  signal_type: string;
  base_weight: number;
  detected_at: string;
  event_date: string | null;
}

interface ProspectRecord {
  [key: string]: unknown;
}

// ── Residential-only filtering: ACCC serves consumers only ──
const BUSINESS_KEYWORDS = [
  'LLC', ' LP ', ' LP,', ' INC', ' CORP', 'PROPERTIES', 'APARTMENTS',
  'INVESTMENTS', 'MANAGEMENT', 'REALTY', 'ASSOCIATES', ' GROUP',
  'HOLDINGS', 'VENTURES', ' LTD', 'PARTNERS', 'PARTNERSHIP',
  'COMPANY', 'ENTERPRISES', 'DEVELOPMENT', 'SERVICES',
  'CAPITAL', 'FUNDING', 'ACQUISITIONS', 'ASSET',
  'COMMERCIAL', 'REAL ESTATE', 'BORROWER', 'INTERMEDIARY',
  'HOA ', 'LLLP', 'REIT', 'LEASING',
];

const INSTITUTIONAL_KEYWORDS = [
  'CENTER', 'CENTRE', 'CHURCH', 'BIBLE', 'MINISTRY', 'MINISTRIES',
  'TEMPLE', 'MOSQUE', 'SYNAGOGUE', 'CONGREGATION', 'PARISH',
  'TRANSIT', 'AUTHORITY', 'TRANSPORTATION', 'DISTRICT',
  'COUNTY', 'CITY OF ', 'STATE OF ', 'FEDERAL',
  'DEPARTMENT', 'SCHOOL', 'UNIVERSITY', 'COLLEGE', 'ACADEMY',
  'FOUNDATION', 'HOSPITAL', 'CLINIC', 'MUSEUM',
  'COMMUNITY', 'ASSOCIATION', 'SOCIETY', 'COMMISSION',
  'KOLLEL', 'YESHIVA',
];

const PERSONAL_TRUST_WORDS = [
  'FAMILY TRUST', 'REVOCABLE TRUST', 'LIVING TRUST',
  'SURVIVOR TRUST', 'IRREVOCABLE TRUST',
];

function isNonResidential(name: string): boolean {
  if (!name || name.trim().length < 4) return true;
  const upper = (name || '').toUpperCase();

  // Address-style names (starts with digits, no comma)
  if (/^\d+\s/.test(upper) && !name.includes(',')) return true;

  // All digits
  if (/^[\d\s]+$/.test(upper)) return true;

  // Personal trusts are OK
  if (PERSONAL_TRUST_WORDS.some(w => upper.includes(w))) return false;

  // Business entities
  if (BUSINESS_KEYWORDS.some(kw => upper.includes(kw))) return true;

  // Institutional
  if (INSTITUTIONAL_KEYWORDS.some(kw => upper.includes(kw))) return true;

  // Generic "TRUST" without personal indicators
  if (upper.includes('TRUST')) return true;

  return false;
}

/** Check if prospect has at least one hard distress signal */
function hasHardDistress(rec: ProspectRecord): boolean {
  return Boolean(
    rec.has_tax_delinquency || rec.has_lis_pendens ||
    rec.has_dissolved_llc || rec.has_bankruptcy || rec.has_probate
  );
}

function buildProspects(rows: RawSignalRow[], state: string, limit: number): ProspectRecord[] {
  const parcelSignals: Record<string, string[]> = {};
  const parcelData: Record<string, RawSignalRow> = {};
  const parcelDates: Record<string, string[]> = {};

  for (const row of rows) {
    const pid = row.parcel_id;
    if (!parcelSignals[pid]) parcelSignals[pid] = [];
    parcelSignals[pid].push(row.signal_type);
    const d = row.detected_at || row.event_date || '';
    if (d) {
      if (!parcelDates[pid]) parcelDates[pid] = [];
      parcelDates[pid].push(String(d));
    }
    if (!parcelData[pid]) parcelData[pid] = row;
  }

  const prospects: ProspectRecord[] = [];
  // Filter: residential only, valid owner names
  const residentialIds = Object.keys(parcelData)
    .filter(pid => !isNonResidential(parcelData[pid].owner_name))
    .slice(0, limit * 2); // Over-fetch since we'll filter by distress below

  for (const pid of residentialIds) {
    const data = parcelData[pid];
    const signals = [...new Set(parcelSignals[pid])];
    const assessed = Number(data.total_assessed_value || data.market_value || 0);
    const salePrice = Number(data.last_sale_price || 0);
    const equity = Math.max(0, assessed - salePrice);

    const isLongHold = signals.some(s => ['long_hold_confirmed', 'absentee_long_hold', 'long_hold_high_equity'].includes(s));
    const isHighEquity = signals.some(s => ['high_equity_confirmed', 'high_equity', 'long_hold_high_equity'].includes(s));
    const hasDistress = signals.some(s => ['distress_flagged', 'tax_delinquency'].includes(s));
    const hasLisPendens = signals.includes('lis_pendens');
    const hasDissolvedLlc = signals.some(s => ['entity_dissolution', 'unresolved_llc'].includes(s));
    const hasProbate = signals.some(s => ['probate_filing', 'probate_free_clear'].includes(s));

    let score = 0;
    if (isLongHold) score += 30;
    if (isHighEquity) score += 25;
    if (hasDistress) score += 35;
    if (hasLisPendens) score += 15;
    if (hasDissolvedLlc) score += 10;
    if (hasProbate) score += 12;
    score += Math.min(10, signals.length * 3);
    score = Math.min(99, Math.max(40, score));

    let yearsHeld: number | null = null;
    if (data.last_sale_date) {
      const saleDate = new Date(String(data.last_sale_date).slice(0, 10));
      if (!isNaN(saleDate.getTime())) {
        yearsHeld = Math.round(((Date.now() - saleDate.getTime()) / (365.25 * 86400000)) * 10) / 10;
      }
    }
    // Cap at 35 years max
    if (yearsHeld !== null && yearsHeld > 35) yearsHeld = 35;

    const dates = (parcelDates[pid] || []).sort().reverse();

    const rec: ProspectRecord = {
      address: (data.address || '').trim(),
      city: (data.city || '').trim(),
      state,
      zip: (data.zip || '').trim(),
      county: (data.county || '').trim(),
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      owner_name: (data.owner_name || '').trim(),
      owner_mailing_address: (data.owner_mailing_address || '').trim() || null,
      owner_city: (data.owner_city || '').trim() || null,
      owner_state: (data.owner_state || '').trim() || null,
      owner_zip: (data.owner_zip || '').trim() || null,
      is_absentee_owner: Boolean(data.is_absentee_owner),
      assessed_value: assessed > 0 ? assessed : null,
      last_sale_price: salePrice > 0 ? salePrice : null,
      estimated_equity: equity > 0 ? equity : null,
      last_sale_date: data.last_sale_date ? String(data.last_sale_date).slice(0, 10) : null,
      years_held: yearsHeld,
      compound_score: score,
      signal_count: signals.length,
      is_long_hold: isLongHold,
      is_high_equity: isHighEquity,
      has_tax_delinquency: hasDistress,
      has_lis_pendens: hasLisPendens,
      has_dissolved_llc: hasDissolvedLlc,
      has_bankruptcy: false,
      has_probate: hasProbate,
      first_signal_date: dates.length > 0 ? dates[dates.length - 1].slice(0, 10) : null,
      most_recent_signal_date: dates.length > 0 ? dates[0].slice(0, 10) : null,
      distress_months: yearsHeld ? Math.floor(yearsHeld * 0.15) : null,
      status: 'new',
      atlas_parcel_id: pid,
      source: 'atlas',
    };

    // Only include records with at least one hard distress signal
    if (hasHardDistress(rec)) {
      prospects.push(rec);
      if (prospects.length >= limit) break;
    }
  }

  return prospects;
}

const COLS = [
  'address', 'city', 'state', 'zip', 'county',
  'latitude', 'longitude', 'owner_name',
  'owner_mailing_address', 'owner_city', 'owner_state', 'owner_zip',
  'is_absentee_owner',
  'assessed_value', 'last_sale_price', 'estimated_equity',
  'last_sale_date', 'years_held',
  'compound_score', 'signal_count',
  'is_long_hold', 'is_high_equity', 'has_tax_delinquency',
  'has_lis_pendens', 'has_dissolved_llc', 'has_bankruptcy', 'has_probate',
  'first_signal_date', 'most_recent_signal_date', 'distress_months',
  'status', 'atlas_parcel_id', 'source',
];

const UPDATE_COLS = COLS.filter(c => c !== 'atlas_parcel_id' && c !== 'status');

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Vercel crons send Authorization: Bearer <CRON_SECRET>
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    return Response.json({ error: 'SUPABASE_ACCESS_TOKEN not set' }, { status: 500 });
  }

  const log: string[] = [];
  const stateCounts: Record<string, number> = {};

  try {
    // Discover states with real signals
    const statesRaw = await atlasQuery(`
      SELECT ps.raw_data->>'state' as state, COUNT(DISTINCT ps.property_id) as cnt
      FROM atlas_property_signals ps
      WHERE ps.raw_data->>'state' IS NOT NULL
      AND ps.source = 'signal_engine'
      GROUP BY ps.raw_data->>'state'
      HAVING COUNT(DISTINCT ps.property_id) >= 10
      ORDER BY cnt DESC
    `, accessToken) as Array<{ state: string; cnt: number }>;

    const states = statesRaw.map(s => s.state);
    log.push(`States with signals: ${states.join(', ')}`);

    // Ensure upsert index
    await atlasQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_beacon_prospects_atlas_parcel_id
      ON beacon_prospects (atlas_parcel_id) WHERE atlas_parcel_id IS NOT NULL
    `, accessToken);

    for (const state of states) {
      try {
        const raw = await atlasQuery(`
          SELECT ap.parcel_id, ap.address, ap.city, ap.state, ap.zip, ap.county,
                 ap.latitude, ap.longitude, ap.owner_name,
                 ap.owner_mailing_address, ap.owner_city, ap.owner_state, ap.owner_zip,
                 ap.is_absentee_owner,
                 ap.total_assessed_value, ap.market_value,
                 ap.last_sale_price, ap.last_sale_date,
                 st.code AS signal_type, st.base_weight, ps.detected_at, ps.event_date
          FROM atlas_property_signals ps
          JOIN atlas_properties ap ON ps.property_id = ap.id
          JOIN atlas_signal_types st ON ps.signal_type_id = st.id
          WHERE ap.state = '${state}'
          AND ap.owner_name IS NOT NULL
          AND ap.owner_name NOT IN ('', 'UNKNOWN', 'N/A', 'NA', 'NULL')
          AND ap.address IS NOT NULL AND LENGTH(ap.address) > 5
          AND (ap.total_assessed_value > 0 OR ap.market_value > 0)
          ORDER BY st.base_weight DESC
          LIMIT ${MAX_PER_STATE * 3}
        `, accessToken) as RawSignalRow[];

        if (!raw || raw.length === 0) {
          log.push(`${state}: no records`);
          stateCounts[state] = 0;
          continue;
        }

        const prospects = buildProspects(raw, state, MAX_PER_STATE);

        let upserted = 0;
        for (let i = 0; i < prospects.length; i += BATCH_SIZE) {
          const batch = prospects.slice(i, i + BATCH_SIZE);
          const valuesList = batch.map(rec =>
            `(${COLS.map(c => sqlVal(rec[c])).join(', ')})`
          );
          const updateSet = UPDATE_COLS.map(c => `${c} = EXCLUDED.${c}`).join(', ');

          await atlasQuery(`
            INSERT INTO beacon_prospects (${COLS.join(', ')})
            VALUES ${valuesList.join(', ')}
            ON CONFLICT (atlas_parcel_id) WHERE atlas_parcel_id IS NOT NULL
            DO UPDATE SET ${updateSet}, updated_at = NOW()
          `, accessToken);
          upserted += batch.length;
        }

        log.push(`${state}: ${upserted} upserted`);
        stateCounts[state] = upserted;
      } catch (err) {
        log.push(`${state}: error - ${String(err).slice(0, 100)}`);
        stateCounts[state] = 0;
      }
    }

    const total = Object.values(stateCounts).reduce((a, b) => a + b, 0);
    log.push(`Total upserted: ${total}`);

    return Response.json({
      success: true,
      total,
      states: stateCounts,
      log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({
      error: String(err).slice(0, 300),
      log,
    }, { status: 500 });
  }
}
