import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { COPY_STATUSES } from "@/lib/labs/library/model";
import { deleteCopy, updateCopy } from "@/lib/labs/library/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({
  shelf: z.string().trim().max(80).optional(),
  status: z.enum(COPY_STATUSES).optional(),
  borrowerId: z.string().max(40).nullable().optional(),
  dueAt: z.number().int().positive().nullable().optional(),
});

/** Loans and returns are recorded by staff. */
export const PUT = handler(async (req, { params }: Ctx) => {
  await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, schema);
  return json({ copy: updateCopy((await params).id, input) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  await requireApiUser(STAFF_ROLES);
  deleteCopy((await params).id);
  return new Response(null, { status: 204 });
});
