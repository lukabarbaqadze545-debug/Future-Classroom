import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { createCard } from "@/lib/labs/career/service";
import { GUIDE_CHECKED_AT, GUIDE_FIELDS, getUniversity, guideCard } from "@/lib/labs/career/universities";

/**
 * Saves a university from the built-in guide as the student's own research
 * card, in their language, dated with the day the guide was checked (so the
 * usual "check the official site" warning applies to it too).
 */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  const body = await readJson(req, z.object({ id: z.string().max(60), field: z.enum(GUIDE_FIELDS).nullable().default(null) }));
  const u = getUniversity(body.id);
  if (!u) throw new ApiError(404, "not_found");
  const { dict, locale } = await getDictionary();
  const card = createCard(user, guideCard(u, body.field, locale, dict.labs.career.guide.fieldNames), { checkedAt: GUIDE_CHECKED_AT });
  return json({ card }, { status: 201 });
});
