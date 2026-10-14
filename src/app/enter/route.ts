import type { NextRequest } from "next/server";
import { enterOpenAccess } from "@/lib/auth/session";
import { openAccessEnabled } from "@/lib/config";

const BASE = "http://site.invalid";

/** A path on this site, percent-encoded: one leading slash, never "//host" or "/\host" (which browsers read as another site). */
function safePath(value: string | null): string | null {
  if (!value || !/^\/(?![/\\])/.test(value)) return null;
  const url = new URL(value, BASE);
  return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : null;
}

/** A relative Location: right behind any proxy, whatever host the request says it came to. */
const see = (location: string) => new Response(null, { status: 303, headers: { Location: location } });

/**
 * Open access: lets a visitor who followed a link to an inner page straight in
 * as the demo teacher or demo student, then sends them to that page. The
 * home page offers the same choice for visitors who come to the front door.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (!openAccessEnabled()) return see("/login");
  const view = url.searchParams.get("as") === "teacher" ? "teacher" : "student";
  const next = safePath(url.searchParams.get("next")) ?? (view === "teacher" ? "/teacher" : "/student");
  await enterOpenAccess(view);
  return see(next);
}
