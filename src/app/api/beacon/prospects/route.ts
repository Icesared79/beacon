import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search');
  const signal = searchParams.get('signal');
  const minScore = Number(searchParams.get('minScore') || 0);
  const status = searchParams.get('status');
  const state = searchParams.get('state');
  const minEquity = searchParams.get('minEquity');
  const maxEquity = searchParams.get('maxEquity');
  const page = Number(searchParams.get('page') || 0);
  const pageSize = Number(searchParams.get('pageSize') || 25);

  let query = supabase
    .from('beacon_prospects')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `owner_name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,zip.ilike.%${search}%`
    );
  }
  if (status) query = query.eq('status', status);
  if (state) query = query.eq('state', state);
  if (minScore > 0) query = query.gte('compound_score', minScore);
  if (signal) {
    const signalMap: Record<string, string> = {
      tax_delinquency: 'has_tax_delinquency',
      lis_pendens: 'has_lis_pendens',
      dissolved_llc: 'has_dissolved_llc',
      bankruptcy: 'has_bankruptcy',
      probate: 'has_probate',
      long_hold: 'is_long_hold',
      high_equity: 'is_high_equity',
    };
    const col = signalMap[signal];
    if (col) query = query.eq(col, true);
  }
  if (minEquity) query = query.gte('estimated_equity', Number(minEquity));
  if (maxEquity) query = query.lte('estimated_equity', Number(maxEquity));

  query = query
    .order('compound_score', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    prospects: data || [],
    total: count || 0,
    page,
    pageSize,
    pageCount: Math.ceil((count || 0) / pageSize),
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { id, status, assigned_to, note } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (note !== undefined) updates.notes = note;

  const { data, error } = await supabase
    .from('beacon_prospects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, prospect: data });
}
