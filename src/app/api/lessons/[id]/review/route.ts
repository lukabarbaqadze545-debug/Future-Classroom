import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { REVIEW_STATUSES } from "@/lib/domain/review";
import { recordReview, reviewHistory } from "@/lib/services/lesson-review";

type Ctx = { params: Promise<{ id: string }> };

/** Records one content-review step (staff only; students never see review states). */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id } = await params;
  const body = await readJson(req, z.object({ status: z.enum(REVIEW_STATUSES), note: z.string().max(1000).default("") }));
  const lesson = recordReview(id, user, body);
  return json({ reviewStatus: lesson.reviewStatus, history: reviewHistory(id) });
});
