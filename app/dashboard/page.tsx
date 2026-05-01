// Standalone Beacon V2 retired 2026-05-01.
// Middleware + next.config.ts redirects send all traffic to
// atlas.redplanetdata.com/beacon. This stub exists only so the
// build doesn't try to prerender the original page (which fetched
// the now-dead atlas-ui-three.vercel.app endpoints).
export const dynamic = "force-static";

export default function DashboardStub() {
  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Beacon has moved</h1>
      <p>
        <a href="https://atlas.redplanetdata.com/beacon">
          atlas.redplanetdata.com/beacon
        </a>
      </p>
    </div>
  );
}
