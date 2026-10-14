import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { getUserByUsername } from "@/lib/services/users";
import { OPEN_ACCESS_ACCOUNTS, createAuthSession, enterOpenAccess } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { demoSignInEnabled, openAccessEnabled } from "@/lib/config";

/** One-click demo sign-in (DEMO_MODE, or open access). */
export const POST = handler(async (req) => {
  if (!demoSignInEnabled()) throw new ApiError(404, "not_found");
  const { role } = await readJson(req, z.object({ role: z.enum(["teacher", "student"]) }));
  getDb();
  const user = getUserByUsername(OPEN_ACCESS_ACCOUNTS[role]);
  if (!user) throw new ApiError(404, "not_found");
  if (openAccessEnabled()) await enterOpenAccess(role);
  else await createAuthSession(user.id);
  return json({ user, redirect: role === "teacher" ? "/teacher" : "/student" });
});
