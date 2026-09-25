import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { lessonsForResource, setLessonResource } from "@/lib/labs/library/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ lessonId: z.string().max(40), attached: z.boolean() });

/** Attaches a library resource to a lesson (students see it in the lesson). */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id } = await params;
  const { lessonId, attached } = await readJson(req, schema);
  setLessonResource(user, lessonId, id, attached);
  return json({ lessons: lessonsForResource(id) });
});
