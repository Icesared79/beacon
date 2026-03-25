import { NextRequest } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { id } = await params;

  const { data: prospect, error } = await supabase
    .from('beacon_prospects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !prospect) {
    return Response.json({ error: 'Prospect not found' }, { status: 404 });
  }

  return Response.json({
    prospect,
    events: [],
    activity: [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) updates.status = body.status;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
  if (body.note !== undefined) updates.notes = body.note;

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
