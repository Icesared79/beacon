import type { NextConfig } from "next";

// Standalone Beacon V2 retired 2026-05-01 — every route now redirects
// (308) to the integrated Beacon under atlas.redplanetdata.com/beacon.
// Using next.config redirects (instead of middleware alone) so build-
// time prerender doesn't try to fetch the dead atlas-ui-three.vercel.app.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "https://atlas.redplanetdata.com/beacon",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "https://atlas.redplanetdata.com/beacon/:path*",
        permanent: true,
      },
      {
        source: "/login",
        destination: "https://atlas.redplanetdata.com/login?from=/beacon",
        permanent: true,
      },
      {
        source: "/api/:path*",
        destination: "https://atlas.redplanetdata.com/api/beacon/:path*",
        permanent: true,
      },
      {
        source: "/",
        destination: "https://atlas.redplanetdata.com/beacon",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
