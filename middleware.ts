import { NextRequest, NextResponse } from "next/server";

// Standalone Beacon V2 was retired on 2026-05-01 and migrated into the
// Atlas dashboard. Permanent-redirect every incoming request to the new
// home so old bookmarks, demo links, and direct deep-links still land
// somewhere useful.
const TARGET_BASE = "https://atlas.redplanetdata.com/beacon";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  // Map /dashboard, /dashboard/households/X, /dashboard/coverage, etc.
  // onto the new /beacon namespace. Everything else just goes to the
  // Beacon landing page.
  let dest = TARGET_BASE;
  if (url.pathname.startsWith("/dashboard")) {
    dest = TARGET_BASE + url.pathname.replace(/^\/dashboard/, "");
  } else if (url.pathname !== "/") {
    dest = TARGET_BASE + url.pathname;
  }
  if (url.search) dest += url.search;
  return NextResponse.redirect(dest, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"],
};
