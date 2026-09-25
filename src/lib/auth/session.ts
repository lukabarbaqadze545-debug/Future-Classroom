import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, now } from "@/lib/db";
import { hashToken, newToken } from "@/lib/domain/ids";
import type { Role } from "@/lib/domain/catalog";
import { ApiError } from "@/lib/http/errors";

export const AUTH_COOKIE = "fc_auth";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // one school day

export interface CurrentUser {
  id: string;
  role: Role;
  username: string;
  displayName: string;
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

export async function destroyAuthSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM auth_sessions WHERE token_hash = ?").run(hashToken(token));
  store.delete(AUTH_COOKIE);
}

/** The signed-in user, resolved from the server-side session table. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.role, u.username, u.display_name AS displayName
         FROM auth_sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), now()) as CurrentUser | undefined;
  return row ?? null;
}

export function isStaff(user: CurrentUser | null): boolean {
  return user?.role === "teacher" || user?.role === "admin";
}

/** For pages: redirects to sign-in when the role does not match. */
export async function requirePageUser(roles: Role[], nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
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
