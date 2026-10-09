import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser } from "@/lib/auth/session";
import { suggestWords, wordCards } from "@/lib/services/dictionary";

/** Words and Spanish translations that start with what is being typed (for the search box). */
export const GET = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`words-suggest:${user.id}`, 240, 60_000);
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  return json({ suggestions: suggestWords(user, q, 8) });
});

const cardsSchema = z.object({ words: z.array(z.string().trim().min(1).max(60)).min(1).max(200) });

/** The dictionary entries of saved words, in the order asked (the words themselves are kept on the device). */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`words-cards:${user.id}`, 60, 60_000);
  const { words } = await readJson(req, cardsSchema);
  return json({ cards: wordCards(user, words) });
});
