import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { deleteItem, updateItem, type ResearchCollection } from "@/lib/labs/research/service";

type Ctx = { params: Promise<{ collection: string; itemId: string }> };
const COLLECTIONS: ResearchCollection[] = ["sources", "notes", "datasets"];

async function target(ctx: Ctx) {
  const { collection, itemId } = await ctx.params;
  if (!COLLECTIONS.includes(collection as ResearchCollection)) throw new ApiError(404, "not_found");
  return { collection: collection as ResearchCollection, itemId };
}

export const PUT = handler(async (req, ctx: Ctx) => {
  const user = await requireApiUser(["student"]);
  const { collection, itemId } = await target(ctx);
  const { data } = await readJson(req, z.object({ data: z.unknown() }));
  updateItem(collection, itemId, user, data);
  return json({ ok: true });
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  const user = await requireApiUser(["student"]);
  const { collection, itemId } = await target(ctx);
  deleteItem(collection, itemId, user);
  return new Response(null, { status: 204 });
});
