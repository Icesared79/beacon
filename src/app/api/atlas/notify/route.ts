import { NextRequest } from 'next/server';

/**
 * POST /api/atlas/notify — Webhook receiver for Atlas notifications.
 * GET  /api/atlas/notify — Returns the last received notification (for UI polling).
 *
 * Uses module-level state for the current serverless instance.
 * In production, consider Vercel KV or Edge Config for cross-instance persistence.
 */

interface AtlasNotification {
  timestamp: string;
  total_households: number;
  message: string;
  notification_type: string;
  received_at: string;
}

// Module-level store — persists for the lifetime of the serverless instance
let lastNotification: AtlasNotification | null = null;

export async function POST(request: NextRequest) {
  // Verify this is from Atlas
  const secret = request.headers.get('x-atlas-secret');
  if (secret !== process.env.ATLAS_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();

    lastNotification = {
      timestamp: payload.timestamp || new Date().toISOString(),
      total_households: payload.total_households || 0,
      message: payload.message || 'Atlas data refreshed',
      notification_type: payload.notification_type || 'unknown',
      received_at: new Date().toISOString(),
    };

    return Response.json({ received: true });
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function GET() {
  if (!lastNotification) {
    return Response.json({
      status: 'no_notifications',
      message: 'No Atlas notifications received yet',
    });
  }

  return Response.json({
    status: 'ok',
    ...lastNotification,
  });
}
