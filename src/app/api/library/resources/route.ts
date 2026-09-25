import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { resourceSchema } from "@/lib/labs/library/model";
import { createResource } from "@/lib/labs/library/service";

const schema = z.object({ resource: resourceSchema, materialId: z.string().max(40).nullable().default(null) });

export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { resource, materialId } = await readJson(req, schema);
  return json({ resource: createResource(user, resource, materialId) }, { status: 201 });
});
