import { NextRequest } from 'next/server';
import { fetchHouseholds } from '@/lib/atlas-api';
import { isEntityOwner } from '@/lib/prospect-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state') || '';
  const signal = searchParams.get('signal') || '';
  const minScore = searchParams.get('minScore') || '';
  const page = Number(searchParams.get('page') || 0);
  const pageSize = Number(searchParams.get('pageSize') || 25);

  try {
    const data = await fetchHouseholds({
      state,
      signal_type: signal,
      min_score: minScore || undefined,
      limit: String(pageSize),
      offset: String(page * pageSize),
    });

    // Map Atlas households to the shape the frontend expects
    const prospects = (data.households || []).map((h) => ({
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
      // Map has_distress + signal_codes into individual boolean flags
      has_tax_delinquency: h.has_distress || false,
      has_lis_pendens: (h.signal_codes || []).some((s: string) =>
        ['lis_pendens_active', 'lis_pendens_compound', 'foreclosure_risk'].includes(s)
      ),
      has_dissolved_llc: (h.signal_codes || []).some((s: string) =>
        ['llc_dissolved'].includes(s)
      ),
      has_bankruptcy: (h.signal_codes || []).some((s: string) =>
        ['bankruptcy'].includes(s)
      ),
      has_probate: (h.signal_codes || []).some((s: string) =>
        ['probate_filing_active'].includes(s)
      ),
      is_long_hold: h.is_long_hold,
      is_high_equity: h.is_high_equity,
      first_signal_date: h.first_signal_date,
      most_recent_signal_date: h.first_signal_date, // Atlas only provides first
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
    }));

    // Server-side entity + quality filter — belt and suspenders with client-side filter
    const clean = prospects.filter(p => {
      if (isEntityOwner(p.owner_name)) return false;
      if (!p.assessed_value || p.assessed_value < 5000) return false;
      return true;
    });

    return Response.json({
      prospects: clean,
      total: clean.length,
      page,
      pageSize,
      pageCount: Math.ceil(clean.length / pageSize),
    });
  } catch (err) {
    console.error('[prospects] Atlas API error:', err);
    return Response.json(
      { error: 'Failed to load households from Atlas' },
      { status: 502 }
    );
  }
}
