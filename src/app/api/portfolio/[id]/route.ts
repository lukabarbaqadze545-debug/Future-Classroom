import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { deletePortfolioItem, portfolioItemSchema, updatePortfolioItem } from "@/lib/services/portfolio";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  const input = await readJson(req, portfolioItemSchema);
  return json({ item: updatePortfolioItem((await params).id, user, input) });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  deletePortfolioItem((await params).id, user);
  return new Response(null, { status: 204 });
});
