import { handler, json } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser } from "@/lib/auth/session";
import { todayInSchool } from "@/lib/services/daily";
import { wordsOfTheDay } from "@/lib/services/dictionary";

/** Today's words: the same for everyone on a given school day. */
export const GET = handler(async () => {
  const user = await requireApiUser();
  rateLimit(`words-daily:${user.id}`, 60, 60_000);
  const day = todayInSchool();
  return json({ day, cards: wordsOfTheDay(user, day, 3) });
});
