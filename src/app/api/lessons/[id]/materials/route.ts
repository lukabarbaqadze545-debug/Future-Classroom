import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { addLessonMaterial } from "@/lib/services/lessons";
import { getMaterial } from "@/lib/services/materials";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { materialId } = await readJson(req, z.object({ materialId: z.string().max(40) }));
  getMaterial(materialId, user); // must be visible to this teacher
  addLessonMaterial((await params).id, user, materialId);
  return json({ ok: true });
});
