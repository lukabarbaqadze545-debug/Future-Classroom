import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { createPortfolioItem, portfolioItemSchema } from "@/lib/services/portfolio";

export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const input = await readJson(req, portfolioItemSchema);
  return json({ item: createPortfolioItem(user, input) }, { status: 201 });
});
