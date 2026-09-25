import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { createSessionFromLesson } from "@/lib/services/sessions";

export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const body = await readJson(
    req,
    z.object({ lessonId: z.string().max(40), classLabel: z.string().trim().max(30).default(""), activityIds: z.array(z.string().max(40)).max(30).optional() }),
  );
  const session = createSessionFromLesson({ user, lessonId: body.lessonId, classLabel: body.classLabel, activityIds: body.activityIds });
  return json({ sessionId: session.id, joinCode: session.joinCode }, { status: 201 });
});
