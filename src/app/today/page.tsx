import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { publicChallenge } from "@/lib/daily/pick";
import { todayInSchool } from "@/lib/services/daily";
import { getCurrentUser } from "@/lib/auth/session";
import { wordsOfTheDay } from "@/lib/services/dictionary";
import { PageContainer, SiteHeader } from "@/components/layout/site-header";
import { TodayHero } from "@/components/engagement/today-hero";
import { DailyChallenge } from "@/components/engagement/daily-challenge";
import { QuestsCard } from "@/components/engagement/quests-card";
import { BadgesCard } from "@/components/engagement/badges-card";
import { WordOfTheDay } from "@/components/engagement/word-of-the-day";
import { ResetProgress } from "@/components/engagement/reset-progress";

export async function generateMetadata() {
  return pageTitle((p) => p.today);
}

/** Open to everyone: the daily challenge needs no account, and the streak lives in the visitor's own browser. */
export default async function TodayPage() {
  const { locale, dict } = await getDictionary();
  const day = todayInSchool();
  const challenge = publicChallenge(day, locale);
  // The word of the day comes from the school dictionary, so it needs someone who may open it; the rest of the page needs nobody.
  const user = await getCurrentUser();
  const word = user ? wordsOfTheDay(user, day, 1)[0] : undefined;
  return (
    <>
      <SiteHeader />
      <PageContainer>
        <div className="space-y-6">
          <TodayHero />
          <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
            <DailyChallenge challenge={challenge} />
            <QuestsCard />
          </div>
          {word ? <WordOfTheDay card={word} /> : null}
          <BadgesCard />
          <div className="flex flex-col gap-2 text-sm text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl">{dict.today.deviceNote}</p>
            <ResetProgress />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
