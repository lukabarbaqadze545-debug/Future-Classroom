import { requirePageUser, STAFF_ROLES } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { challengeFor, publicChallenge } from "@/lib/daily/pick";
import { todayInSchool } from "@/lib/services/daily";
import { PresentDaily } from "@/components/present/present-daily";

export async function generateMetadata() {
  return pageTitle((p) => p.presentation);
}

/** For teachers: today's challenge on the classroom display, with the answer behind a button. */
export default async function PresentDailyPage() {
  await requirePageUser(STAFF_ROLES, "/teacher");
  const { locale } = await getDictionary();
  const day = todayInSchool();
  const question = challengeFor(day, locale);
  // The last hint of a ladder is the explanation: the board gets the ones before it.
  const hints = question.hints.length > 1 ? question.hints.slice(0, -1) : question.hints;
  return <PresentDaily challenge={publicChallenge(day, locale)} answer={question.answer} explanation={question.explanation || question.solution} hints={hints} />;
}
