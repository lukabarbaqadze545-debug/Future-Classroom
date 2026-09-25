import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { resourceSchema } from "@/lib/labs/library/model";
import { deleteResource, updateResource } from "@/lib/labs/library/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ resource: resourceSchema, materialId: z.string().max(40).nullable().default(null) });

export const PUT = handler(async (req, { params }: Ctx) => {
  await requireApiUser(STAFF_ROLES);
  const { resource, materialId } = await readJson(req, schema);
  return json({ resource: updateResource((await params).id, resource, materialId) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  await requireApiUser(STAFF_ROLES);
  deleteResource((await params).id);
  return new Response(null, { status: 204 });
});
