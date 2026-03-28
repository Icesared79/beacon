import { NextRequest } from 'next/server';
import { fetchHousehold } from '@/lib/atlas-api';

interface AtlasSignal {
  id: string;
  code: string;
  label: string;
  category: string;
  base_weight: number;
  source: string | null;
  event_date: string | null;
  detected_at: string | null;
}

const SEVERITY_MAP: Record<string, string> = {
  lis_pendens: 'critical',
  foreclosure_risk: 'critical',
  lis_pendens_active: 'critical',
  lis_pendens_compound: 'critical',
  bankruptcy: 'critical',
  tax_delinquency_active: 'high',
  tax_delinquency: 'warning',
  distress_flagged: 'high',
  probate_filing_active: 'high',
  probate_filing: 'high',
  llc_dissolved: 'high',
  high_equity_confirmed: 'info',
  long_hold_confirmed: 'info',
  absentee_long_hold: 'info',
  high_vacancy: 'warning',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const h = await fetchHousehold(id);

    if (!h || !h.parcel_id) {
      return Response.json({ error: 'Household not found' }, { status: 404 });
    }

    // The enriched Atlas detail endpoint now returns signals[], transactions[], distress_filings[]
    const signals: AtlasSignal[] = (h as Record<string, unknown>).signals as AtlasSignal[] || [];
    const distressFilings = (h as Record<string, unknown>).distress_filings || [];

    // Compute most_recent_signal_date from actual signal data
    const signalDates = signals
      .map(s => s.detected_at || s.event_date)
      .filter(Boolean)
      .map(d => new Date(d!).getTime())
      .filter(t => !isNaN(t));
    const mostRecentSignalDate = signalDates.length
      ? new Date(Math.max(...signalDates)).toISOString().slice(0, 10)
      : h.first_signal_date;

    // Map Atlas response to the shape the frontend expects
    const prospect = {
      id: h.parcel_id,
      address: h.address,
      city: h.city,
      state: h.state,
      zip: h.zip,
      county: h.county,
      owner_name: h.owner_name,
      assessed_value: h.assessed_value,
      estimated_equity: h.estimated_equity,
      last_sale_price: h.last_sale_price,
      last_sale_date: h.last_sale_date,
      years_held: h.years_held,
      compound_score: h.compound_score,
      signal_count: h.signal_count,
      has_tax_delinquency: h.has_distress || false,
      has_lis_pendens: signals.some(s =>
        ['lis_pendens_active', 'lis_pendens_compound', 'foreclosure_risk'].includes(s.code)
      ) || (h.signal_codes || []).some((s: string) =>
        ['lis_pendens_active', 'lis_pendens_compound', 'foreclosure_risk'].includes(s)
      ),
      has_dissolved_llc: signals.some(s => s.code === 'llc_dissolved') ||
        (h.signal_codes || []).some((s: string) => s === 'llc_dissolved'),
      has_bankruptcy: signals.some(s => s.code === 'bankruptcy') ||
        (h.signal_codes || []).some((s: string) => s === 'bankruptcy'),
      has_probate: signals.some(s =>
        ['probate_filing_active', 'probate_filing'].includes(s.code)
      ) || (h.signal_codes || []).some((s: string) => s === 'probate_filing_active'),
      is_long_hold: h.is_long_hold,
      is_high_equity: h.is_high_equity,
      first_signal_date: h.first_signal_date,
      most_recent_signal_date: mostRecentSignalDate,
      status: 'new',
      latitude: h.latitude,
      longitude: h.longitude,
      owner_mailing_address: h.owner_mailing_address,
      owner_city: h.owner_city,
      owner_state: h.owner_state,
      owner_zip: h.owner_zip,
      is_absentee_owner: h.is_absentee_owner,
      suggested_service: h.suggested_service,
      atlas_parcel_id: h.parcel_id,
    };

    // Build real timeline events from signal data
    const events = signals.map(s => ({
      id: s.id,
      prospect_id: h.parcel_id,
      signal_type: s.code,
      severity: SEVERITY_MAP[s.code] || 'info',
      detected_date: s.event_date || s.detected_at || h.first_signal_date || '',
      description: s.label || s.code.replace(/_/g, ' '),
      amount: undefined,
    }));

    // Also include distress filings as events
    const filingEvents = (distressFilings as Array<Record<string, unknown>>).map(
      (f, i) => ({
        id: `filing-${i}`,
        prospect_id: h.parcel_id,
        signal_type: (f.filing_type as string) || 'filing',
        severity: 'critical',
        detected_date: (f.filing_date as string) || '',
        description: [
          f.filing_type,
          f.court ? `at ${f.court}` : null,
          f.case_number ? `(Case ${f.case_number})` : null,
        ]
          .filter(Boolean)
          .join(' '),
        amount: f.amount as number | undefined,
      })
    );

    return Response.json({
      prospect,
      events: [...events, ...filingEvents].sort(
        (a, b) => new Date(a.detected_date).getTime() - new Date(b.detected_date).getTime()
      ),
      activity: [],
    });
  } catch (err) {
    console.error(`[prospect/${id}] Atlas API error:`, err);
    return Response.json(
      { error: 'Failed to load household from Atlas' },
      { status: 502 }
    );
  }
}
