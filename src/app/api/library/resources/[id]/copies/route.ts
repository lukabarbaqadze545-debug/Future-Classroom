import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { COPY_STATUSES } from "@/lib/labs/library/model";
import { addCopy } from "@/lib/labs/library/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ shelf: z.string().trim().max(80).default(""), status: z.enum(COPY_STATUSES).default("available") });

/** Registers a physical copy; it gets its own code and QR label. */
export const POST = handler(async (req, { params }: Ctx) => {
  await requireApiUser(STAFF_ROLES);
  const input = await readJson(req, schema);
  return json({ copy: addCopy((await params).id, input) }, { status: 201 });
});
