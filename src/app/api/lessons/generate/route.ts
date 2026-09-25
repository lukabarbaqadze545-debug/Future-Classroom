import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { rateLimit } from "@/lib/http/rate-limit";
import { lessonInputSchema } from "@/lib/domain/schemas";
import { generateLesson } from "@/lib/ai/lesson-generator";
import { createLesson, setLessonMaterials } from "@/lib/services/lessons";
import { getMaterial, searchPassages } from "@/lib/services/materials";

export const maxDuration = 300;

/**
 * Drafts a lesson (AI, or a template when AI is unavailable) and saves it as
 * a draft. The response says exactly how it was produced.
 */
export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  rateLimit(`generate:${user.id}`, 12, 60 * 60_000);
  const input = await readJson(req, lessonInputSchema);

  // Excerpts from selected school materials ground the AI draft.
  const materialIds = input.materialIds.filter((id) => {
    try {
      getMaterial(id, user);
      return true;
    } catch {
      return false;
    }
  });
  const excerpts = materialIds.length
    ? searchPassages(user, `${input.topic} ${input.objective}`, { materialIds, limit: 6 }).map((p) => `${p.materialTitle}: ${p.content}`)
    : [];

  const generated = await generateLesson(input, excerpts);
  const lesson = createLesson({
    teacherId: user.id,
    meta: generated.meta,
    content: generated.content,
    origin: generated.source.kind === "ai" ? "ai" : "template",
    aiModel: generated.source.kind === "ai" ? generated.source.model : null,
  });
  if (materialIds.length) setLessonMaterials(lesson.id, materialIds);
  return json({ lessonId: lesson.id, source: generated.source }, { status: 201 });
});
