import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { getUserByUsername } from "@/lib/services/users";
import { createAuthSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { demoSignInEnabled } from "@/lib/config";

/** One-click demo sign-in (DEMO_MODE, or open access). */
export const POST = handler(async (req) => {
  if (!demoSignInEnabled()) throw new ApiError(404, "not_found");
  const { role } = await readJson(req, z.object({ role: z.enum(["teacher", "student"]) }));
  getDb();
  const user = getUserByUsername(role === "teacher" ? "nino" : "mariam");
  if (!user) throw new ApiError(404, "not_found");
  await createAuthSession(user.id);
  return json({ user, redirect: role === "teacher" ? "/teacher" : "/student" });
});
