import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { createSession } from "@/lib/services/sessions";
import { subjectFor, toSessionActivities } from "@/lib/labs/session-bridge";

const schema = z.object({
  items: z.array(z.string().max(60)).min(1).max(20),
  title: z.string().trim().min(1).max(160),
  classLabel: z.string().trim().max(30).default(""),
});

/** Creates a live classroom session from laboratory items. */
export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { items, title, classLabel } = await readJson(req, schema);
  const { locale } = await getDictionary();
  const activities = items.flatMap((key) => toSessionActivities(key, locale));
  if (activities.length === 0) throw new ApiError(400, "invalid_input", "None of these items can be shown in a session.");
  if (activities.length > 30) throw new ApiError(400, "invalid_input", "A session can hold up to 30 activities.");
  const session = createSession({ teacherId: user.id, lessonId: null, title, subject: subjectFor(items[0]), grade: 9, classLabel, activities });
  return json({ sessionId: session.id, joinCode: session.joinCode }, { status: 201 });
});
