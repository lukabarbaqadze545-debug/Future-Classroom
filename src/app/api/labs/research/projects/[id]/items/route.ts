import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { addItem, getResearchBundle } from "@/lib/labs/research/service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ collection: z.enum(["sources", "notes", "datasets"]), data: z.unknown() });

/** Adds a source, note/quote/evidence or dataset; returns the refreshed lists. */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  const { id } = await params;
  const { collection, data } = await readJson(req, schema);
  const itemId = addItem(id, user, collection, data);
  const bundle = getResearchBundle(id, user);
  return json({ id: itemId, sources: bundle.sources, notes: bundle.notes, datasets: bundle.datasets }, { status: 201 });
});
