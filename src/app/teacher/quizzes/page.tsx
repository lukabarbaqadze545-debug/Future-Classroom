import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { listQuizzesForTeacher } from "@/lib/services/quizzes";
import { PageContainer } from "@/components/layout/site-header";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Quizzes" };

export default async function QuizzesPage() {
  const user = (await getCurrentUser())!;
  const { dict } = await getDictionary();
  const q = dict.teacher.quizzes;
  const quizzes = listQuizzesForTeacher(user.id);
  return (
    <PageContainer>
      <PageHeader title={q.title} description={q.lead} />
      {quizzes.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap gap-2">
                <Badge tone={quiz.status === "published" ? "success" : "neutral"} dot>
                  {dict.status[quiz.status]}
                </Badge>
                <Badge tone={quiz.origin === "ai" ? "ai" : quiz.origin === "template" ? "brand" : "neutral"}>{dict.origin[quiz.origin]}</Badge>
              </div>
              <Link href={`/teacher/quizzes/${quiz.id}`} className="mt-3 text-lg font-semibold hover:text-brand">
                {quiz.title}
              </Link>
              <p className="mt-1 text-sm text-ink-muted">
                {dict.subjects[quiz.subject]} · {fmtCount(q.questions, quiz.questions.length)} · {relativeTime(dict, quiz.updatedAt)}
              </p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-sm text-ink-muted">
                  {fmtCount(dict.teacher.dashboard.attempts, quiz.attemptCount)}
                  {quiz.averagePercent !== null ? ` · ${fmt(dict.teacher.dashboard.averageScore, { n: quiz.averagePercent })}` : ""}
                </span>
                <ButtonLink href={`/teacher/quizzes/${quiz.id}?tab=results`} variant="ghost" size="sm">
                  {q.results}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={q.empty} action={<ButtonLink href="/teacher/lessons">{dict.nav.lessons}</ButtonLink>} />
      )}
    </PageContainer>
  );
}
