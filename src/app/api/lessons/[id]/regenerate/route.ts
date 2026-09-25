import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { getLessonForEditor } from "@/lib/services/lessons";
import { getAIProvider } from "@/lib/ai";
import { regenerateActivity, regenerateSection } from "@/lib/ai/lesson-generator";
import { lessonContentSchema, lessonMetaSchema } from "@/lib/domain/schemas";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Rewrites one section or activity with AI and returns it — it is NOT saved.
 * The teacher sees the new version in the editor and decides whether to keep it.
 */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  getLessonForEditor((await params).id, user);
  if (!getAIProvider()) throw new ApiError(503, "ai_unavailable");
  rateLimit(`regenerate:${user.id}`, 40, 60 * 60_000);
  const body = await readJson(
    req,
    z.object({
      part: z.enum(["section", "activity"]),
      partId: z.string().max(40),
      instruction: z.string().max(500).default(""),
      meta: lessonMetaSchema,
      content: lessonContentSchema,
    }),
  );
  try {
    if (body.part === "section") return json({ section: await regenerateSection(body.meta, body.content, body.partId, body.instruction) });
    return json({ activity: await regenerateActivity(body.meta, body.content, body.partId, body.instruction) });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "ai_failed");
  }
});
