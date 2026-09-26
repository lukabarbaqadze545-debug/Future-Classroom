import { handler, json } from "@/lib/http/api";
import { clearRateLimit, LOGIN_FAILURES, rateLimit } from "@/lib/http/rate-limit";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { getClassForTeacher } from "@/lib/services/classes";
import { setTemporaryPassword } from "@/lib/services/accounts";

type Ctx = { params: Promise<{ id: string; studentId: string }> };

/** A teacher gives a student in their class a new temporary password (students have no e-mail). */
export const POST = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id, studentId } = await params;
  const cls = getClassForTeacher(id, user);
  if (!cls.members.some((m) => m.id === studentId)) throw new ApiError(404, "not_found");
  rateLimit(`password-reset:${user.id}`, 60, 60 * 60_000);
  const password = setTemporaryPassword(studentId);
  const { username } = getDb().prepare("SELECT username FROM users WHERE id = ?").get(studentId) as { username: string };
  clearRateLimit(LOGIN_FAILURES.key(username));
  return json({ password });
});
