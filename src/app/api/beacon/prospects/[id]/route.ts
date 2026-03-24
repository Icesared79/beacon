import { NextRequest } from 'next/server';
import { DEMO_PROSPECTS, getDemoSignalEvents } from '@/lib/prospect-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prospect = DEMO_PROSPECTS.find((p) => p.id === id);

  if (!prospect) {
    return Response.json({ error: 'Prospect not found' }, { status: 404 });
  }

  const events = getDemoSignalEvents(id);

  return Response.json({
    prospect,
    events,
    activity: [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // TODO: Update in Supabase
  return Response.json({
    success: true,
    id,
    ...body,
    updated_at: new Date().toISOString(),
  });
}
