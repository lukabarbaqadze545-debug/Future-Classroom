import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { PORTFOLIO_SOURCES } from "@/lib/services/portfolio";
import { addToPortfolioFromSource } from "@/lib/services/portfolio-sources";

const schema = z.object({ kind: z.enum(PORTFOLIO_SOURCES), id: z.string().min(1).max(60) });

/** Turns a piece of lab work into a portfolio item (idempotent). */
export const POST = handler(async (req) => {
  const user = await requireApiUser(["student"]);
  const { kind, id } = await readJson(req, schema);
  const { locale } = await getDictionary();
  return json(addToPortfolioFromSource(user, kind, id, locale));
});
