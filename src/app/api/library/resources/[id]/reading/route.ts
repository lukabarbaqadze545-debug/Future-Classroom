import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { READING_STATUSES } from "@/lib/labs/library/model";
import { setReading } from "@/lib/labs/library/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ status: z.enum(READING_STATUSES).nullable(), percent: z.number().min(0).max(100).default(0), note: z.string().max(2000).default("") });

export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser();
  const input = await readJson(req, schema);
  return json({ reading: setReading(user, (await params).id, input) });
});
