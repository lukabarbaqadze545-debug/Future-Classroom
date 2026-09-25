import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getQuizForEditor, getQuizResults } from "@/lib/services/quizzes";
import { ApiError } from "@/lib/http/errors";
import { PageContainer } from "@/components/layout/site-header";
import { QuizEditor } from "@/components/quiz/quiz-editor";
import { QuizResults } from "@/components/quiz/quiz-results";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Quiz" };

export default async function QuizPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; generated?: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ id }, sp, { dict, locale }] = await Promise.all([params, searchParams, getDictionary()]);
  let quiz;
  try {
    quiz = getQuizForEditor(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const tab = sp.tab === "results" ? "results" : "edit";
  const tabClass = (active: boolean) => cn("inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium", active ? "bg-surface shadow-sm" : "text-ink-muted hover:text-ink");
  return (
    <PageContainer>
      <nav aria-label={dict.nav.quizzes} className="mb-5 inline-flex gap-1 rounded-xl border border-line bg-muted/70 p-1">
        <Link href={`/teacher/quizzes/${id}`} className={tabClass(tab === "edit")} aria-current={tab === "edit" ? "page" : undefined}>
          {dict.common.edit}
        </Link>
        <Link href={`/teacher/quizzes/${id}?tab=results`} className={tabClass(tab === "results")} aria-current={tab === "results" ? "page" : undefined}>
          {dict.teacher.quizzes.results}
        </Link>
      </nav>
      {tab === "edit" ? <QuizEditor key={quiz.updatedAt} quiz={quiz} generated={sp.generated === "1"} /> : <QuizResults results={getQuizResults(id, user)} dict={dict} locale={locale} />}
    </PageContainer>
  );
}
