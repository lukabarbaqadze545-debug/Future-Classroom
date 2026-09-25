import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { deleteLesson, getLessonForEditor, updateLesson } from "@/lib/services/lessons";
import { lessonContentSchema, lessonMetaSchema } from "@/lib/domain/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  return json({ lesson: getLessonForEditor((await params).id, user) });
});

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const body = await readJson(req, z.object({ meta: lessonMetaSchema, content: lessonContentSchema, materialIds: z.array(z.string().max(40)).max(50).optional() }));
  return json({ lesson: updateLesson((await params).id, user, body) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  deleteLesson((await params).id, user);
  return new Response(null, { status: 204 });
});
