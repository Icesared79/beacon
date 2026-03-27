// Sync cron removed — Beacon no longer has its own database.
// All data comes from Atlas API calls. This route is intentionally empty.

export async function GET() {
  return Response.json({
    message: 'Sync disabled — Beacon reads directly from Atlas API',
    timestamp: new Date().toISOString(),
  });
}
