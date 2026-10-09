import { ArrowLeft } from "lucide-react";
import { requirePageUser, ALL_ROLES } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { todayInSchool } from "@/lib/services/daily";
import { hasDictionary, wordsOfTheDay } from "@/lib/services/dictionary";
import { PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { WordsPractice } from "@/components/vocab/words-practice";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.assistant.words.title };
}

/** The words a visitor saved, with practice. The list itself is on their device; only the dictionary entries come from the server. */
export default async function WordsPage() {
  const user = await requirePageUser(ALL_ROLES, "/learning-assistant/words");
  const { dict } = await getDictionary();
  const w = dict.assistant.words;
  const available = hasDictionary(user);
  // Fifteen words of the day: the first three are shown as today's words, all are used as wrong answers when choosing.
  const pool = available ? wordsOfTheDay(user, todayInSchool(), 15) : [];
  return (
    <PageContainer>
      <PageHeader
        title={w.title}
        description={w.lead}
        actions={
          <ButtonLink href="/learning-assistant" variant="secondary">
            <ArrowLeft aria-hidden className="size-4" />
            {w.backToAssistant}
          </ButtonLink>
        }
      />
      <WordsPractice available={available} daily={pool.slice(0, 3)} pool={pool} />
    </PageContainer>
  );
}
