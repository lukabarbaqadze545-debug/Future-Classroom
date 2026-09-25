import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { createLesson, listLessonsForTeacher } from "@/lib/services/lessons";
import { lessonContentSchema, lessonMetaSchema } from "@/lib/domain/schemas";

export const GET = handler(async () => {
  const user = await requireApiUser(STAFF_ROLES);
  return json({ lessons: listLessonsForTeacher(user.id) });
});

/** Creates a lesson written by hand (no AI involved). */
export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const body = await readJson(req, z.object({ meta: lessonMetaSchema, content: lessonContentSchema.optional() }));
  const lesson = createLesson({ teacherId: user.id, meta: body.meta, content: body.content ?? lessonContentSchema.parse({}), origin: "manual" });
  return json({ lesson }, { status: 201 });
});
