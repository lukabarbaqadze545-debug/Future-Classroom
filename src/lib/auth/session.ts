import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, now } from "@/lib/db";
import { hashToken, newToken } from "@/lib/domain/ids";
import type { Role } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";
import { openAccessEnabled } from "@/lib/config";

export const AUTH_COOKIE = "fc_auth";
/** Open access: which demo view the visitor chose ("teacher" or "student"); nothing is stored on the server. */
export const OPEN_COOKIE = "fc_open";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // one school day
const OPEN_TTL_S = 60 * 60 * 24 * 30;

/** The demo accounts open access works as (see `seedDemoSchool`). */
export const OPEN_ACCESS_ACCOUNTS: Record<"teacher" | "student", string> = { teacher: "nino", student: "mariam" };

export interface CurrentUser {
  id: string;
  role: Role;
  username: string;
  displayName: string;
  /** Signed in with a temporary password set by a teacher or administrator. */
  mustChangePassword?: boolean;
}

/** Whether cookies should carry the Secure flag for this request. */
export async function shouldUseSecureCookies(): Promise<boolean> {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const h = await headers();
  return h.get("x-forwarded-proto") === "https";
}

export async function createAuthSession(userId: string): Promise<void> {
  const token = newToken();
  const db = getDb();
  const created = now();
  db.prepare("DELETE FROM auth_sessions WHERE expires_at < ?").run(created);
  db.prepare(
    "INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).run(hashToken(token), userId, created + SESSION_TTL_MS, created);
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookies(),
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/**
 * Open access: remembers the chosen demo view in a cookie. The cookie is the
 * whole "session" (no row in the database), so any server instance can serve
 * the visitor, which a host that runs several instances needs.
 */
export async function enterOpenAccess(role: "teacher" | "student"): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  store.set(OPEN_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookies(),
    path: "/",
    maxAge: OPEN_TTL_S,
  });
}

export async function destroyAuthSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM auth_sessions WHERE token_hash = ?").run(hashToken(token));
  store.delete(AUTH_COOKIE);
  store.delete(OPEN_COOKIE);
}

const SELECT_USER = `SELECT u.id, u.role, u.username, u.display_name AS displayName, u.must_change_password AS mustChange FROM users u`;
type UserRow = Omit<CurrentUser, "mustChangePassword"> & { mustChange: number };

function toCurrentUser(row: UserRow): CurrentUser {
  const { mustChange, ...user } = row;
  return { ...user, mustChangePassword: mustChange === 1 };
}

/** The signed-in user, resolved from the server-side session table (or, with open access, the demo view the visitor chose). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (token) {
    const row = getDb()
      .prepare(`${SELECT_USER} JOIN auth_sessions s ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?`)
      .get(hashToken(token), now()) as UserRow | undefined;
    if (row) return toCurrentUser(row);
  }
  if (openAccessEnabled()) {
    const view = store.get(OPEN_COOKIE)?.value;
    if (view === "teacher" || view === "student") {
      const row = getDb().prepare(`${SELECT_USER} WHERE u.username = ?`).get(OPEN_ACCESS_ACCOUNTS[view]) as UserRow | undefined;
      if (row) return toCurrentUser(row);
    }
  }
  return null;
}

export function isStaff(user: CurrentUser | null): boolean {
  return user?.role === "teacher" || user?.role === "admin";
}

/** For pages: redirects to sign-in when the role does not match. */
export async function requirePageUser(roles: Role[], nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    // With open access there is no sign-in page: the visitor is let in as the demo view the page is meant for.
    const view = roles.includes("student") ? "student" : "teacher";
    redirect(openAccessEnabled() ? `/enter?as=${view}&next=${encodeURIComponent(nextPath)}` : `/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!roles.includes(user.role)) redirect(user.role === "student" ? "/student" : "/teacher");
  return user;
}

/** For API routes: throws 401/403 instead of redirecting. */
export async function requireApiUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "unauthorized");
  if (roles && !roles.includes(user.role)) throw new ApiError(403, "forbidden");
  return user;
}

export const STAFF_ROLES: Role[] = ["teacher", "admin"];
export const ALL_ROLES: Role[] = ["student", "teacher", "admin"];
