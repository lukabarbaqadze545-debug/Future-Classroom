import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { ApiError } from "@/lib/http/errors";
import { getLessonForEditor, setLessonStatus } from "@/lib/services/lessons";

type Ctx = { params: Promise<{ id: string }> };

/** Publishing an AI draft requires the teacher to confirm they reviewed it. */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id } = await params;
  const body = await readJson(req, z.object({ status: z.enum(["draft", "published"]), reviewed: z.boolean().optional() }));
  const lesson = getLessonForEditor(id, user);
  if (body.status === "published" && lesson.origin === "ai" && !body.reviewed) {
    throw new ApiError(400, "invalid_input", "Confirm that you reviewed the AI-generated content.");
  }
  return json({ lesson: setLessonStatus(id, user, body.status) });
});
