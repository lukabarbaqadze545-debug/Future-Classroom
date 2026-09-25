import { handler, json } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { duplicateLesson } from "@/lib/services/lessons";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  return json({ lesson: duplicateLesson((await params).id, user) }, { status: 201 });
});
