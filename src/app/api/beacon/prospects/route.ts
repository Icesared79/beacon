import { NextRequest } from 'next/server';
import { DEMO_PROSPECTS, getSignalsForProspect } from '@/lib/prospect-data';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const office = searchParams.get('office');
  const signal = searchParams.get('signal');
  const minScore = Number(searchParams.get('minScore') || 0);
  const status = searchParams.get('status');
  const page = Number(searchParams.get('page') || 0);
  const pageSize = Number(searchParams.get('pageSize') || 25);

  const search = searchParams.get('search');

  // TODO: Replace with Supabase query to beacon_prospects
  let data = DEMO_PROSPECTS;
  if (search) {
    const q = search.toLowerCase();
    data = data.filter((p) =>
      p.owner_name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.zip.includes(q)
    );
  }
  if (office) data = data.filter((p) => p.office_city === office);
  if (status) data = data.filter((p) => p.status === status);
  if (minScore > 0) data = data.filter((p) => p.compound_score >= minScore);
  if (signal) {
    data = data.filter((p) => getSignalsForProspect(p).includes(signal));
  }

  data = data.sort((a, b) => b.compound_score - a.compound_score);
  const total = data.length;
  const paged = data.slice(page * pageSize, (page + 1) * pageSize);

  return Response.json({
    prospects: paged,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, assigned_to, note } = body;

  // TODO: Update in Supabase
  return Response.json({
    success: true,
    id,
    status,
    assigned_to,
    note,
    updated_at: new Date().toISOString(),
  });
}
