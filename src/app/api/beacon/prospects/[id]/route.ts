import { NextRequest } from 'next/server';
import { fetchHousehold } from '@/lib/atlas-api';

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
      most_recent_signal_date: h.first_signal_date,
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

    return Response.json({
      prospect,
      events: [],
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
