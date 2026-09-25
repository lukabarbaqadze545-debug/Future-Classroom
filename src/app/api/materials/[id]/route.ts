import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { materialMetaSchema } from "@/lib/domain/schemas";
import { deleteMaterial, getMaterial, getMaterialPreview, updateMaterial } from "@/lib/services/materials";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  const { id } = await params;
  return json({ material: getMaterial(id, user), preview: getMaterialPreview(id, user).chunks });
});

export const PATCH = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const meta = await readJson(req, materialMetaSchema);
  return json({ material: updateMaterial((await params).id, user, meta) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  deleteMaterial((await params).id, user);
  return new Response(null, { status: 204 });
});
