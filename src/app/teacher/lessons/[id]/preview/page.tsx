import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Pencil, Presentation } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { ApiError } from "@/lib/http/errors";
import { SYSTEM_USER_ID } from "@/lib/db/builtin";
import { getLessonForStaff, reviewHistory } from "@/lib/services/lesson-review";
import { listQuizzesForLesson } from "@/lib/services/quizzes";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Notice } from "@/components/ui/notice";
import { FunctionPlot } from "@/components/charts/function-plot";
import { StartSessionButton } from "@/components/teacher/start-session-dialog";
import { DuplicateLessonButton } from "@/components/lesson/duplicate-button";
import { ReviewPanel } from "@/components/lesson/review-panel";

type Props = { params: Promise<{ id: string }> };

function load(id: string, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  try {
    return getLessonForStaff(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return {};
  try {
    return { title: getLessonForStaff((await params).id, user).title };
  } catch {
    return {};
  }
}

/** Read-only teacher preview with the answer key, plus the content review panel. */
export default async function LessonPreviewPage({ params }: Props) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const { dict } = await getDictionary();
  const r = dict.review;
  const lesson = load(id, user);
  const own = lesson.teacherId === user.id || user.role === "admin";
  const quizzes = listQuizzesForLesson(lesson.id).filter((q) => q.status === "published" || own);
  const { content } = lesson;

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={
          <span>
            {dict.subjects[lesson.subject]} · {fmt(dict.common.grade, { n: lesson.grade })} · {dict.contentLanguages[lesson.language]}
          </span>
        }
        title={<span lang={lesson.language}>{lesson.title}</span>}
        description={lesson.teacherId === SYSTEM_USER_ID ? dict.common.builtInLesson : fmt(r.author, { name: lesson.teacherName })}
        actions={
          <div className="flex flex-wrap gap-2">
            <StartSessionButton lessonId={lesson.id} label={dict.subjectCatalog.startInClass} disabledReason={content.activities.length ? null : dict.teacher.editor.noActivities} />
            <ButtonLink href={`/present/lesson/${lesson.id}`} size="lg" variant="secondary">
              <Presentation aria-hidden className="size-5" />
              {dict.teacher.editor.present}
            </ButtonLink>
            {own ? (
              <ButtonLink href={`/teacher/lessons/${lesson.id}`} size="lg" variant="secondary" data-testid="preview-edit">
                <Pencil aria-hidden className="size-5" />
                {r.edit}
              </ButtonLink>
            ) : (
              <DuplicateLessonButton lessonId={lesson.id} />
            )}
          </div>
        }
      />
      <Notice tone="info" className="mb-6">
        {r.previewLead}
      </Notice>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6" lang={lesson.language}>
          {content.objectives.length ? (
            <Card className="p-5">
              <h2 className="font-semibold">{dict.teacher.editor.objectives}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
                {content.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-semibold">{r.sectionsTitle}</h2>
            <div className="space-y-3">
              {content.sections.map((s) => (
                <Card key={s.id} className="p-5">
                  <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                    {dict.sectionKinds[s.kind]} · {fmt(dict.common.minutes, { n: s.minutes })}
                  </p>
                  <h3 className="mt-1 font-semibold">{s.title}</h3>
                  {s.body ? <p className="fc-prose mt-2 text-ink-muted">{s.body}</p> : null}
                  {s.visual ? <FunctionPlot className="mt-3 max-w-md" {...s.visual} /> : null}
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{dict.teacher.editor.activities}</h2>
            <ol className="space-y-3" data-testid="preview-activities">
              {content.activities.map((a, i) => (
                <li key={a.id}>
                  <Card className="p-5">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                      <span className="font-semibold">{i + 1}.</span>
                      <Badge>{dict.activityTypes[a.type]}</Badge>
                      {a.timeLimitSec ? <span>{fmt(r.timeLimit, { n: a.timeLimitSec })}</span> : null}
                    </p>
                    {a.title ? <h3 className="mt-2 font-semibold">{a.title}</h3> : null}
                    <p className="mt-1 whitespace-pre-line">{a.prompt}</p>
                    {a.options.length ? (
                      <ul className="mt-3 space-y-1.5">
                        {a.options.map((o) => {
                          const correct = a.correctOptionIds.includes(o.id);
                          return (
                            <li key={o.id} className={correct ? "flex gap-2 rounded-lg bg-success-soft px-3 py-1.5 font-medium text-success" : "flex gap-2 rounded-lg px-3 py-1.5 text-ink-muted"} data-correct={correct || undefined}>
                              {correct ? <Check aria-label={r.correct} className="mt-0.5 size-4 shrink-0" /> : <span aria-hidden className="size-4 shrink-0" />}
                              {o.text}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    {a.acceptedAnswers.length ? (
                      <p className="mt-3 text-sm">
                        <span className="font-medium">{r.accepted}:</span> {a.acceptedAnswers.join(" · ")}
                      </p>
                    ) : null}
                    {!a.options.length && !a.acceptedAnswers.length && !a.correctOptionIds.length ? <p className="mt-3 text-sm text-ink-subtle">{r.noAnswerKey}</p> : null}
                    {a.hints.length ? (
                      <div className="mt-3 text-sm">
                        <p className="font-medium">{r.hints}</p>
                        <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink-muted">
                          {a.hints.map((h) => (
                            <li key={h}>{h}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    {a.solution ? (
                      <div className="mt-3 text-sm">
                        <p className="font-medium">{r.solution}</p>
                        <p className="mt-1 whitespace-pre-line text-ink-muted">{a.solution}</p>
                        {a.allowSolution ? null : <p className="mt-1 text-xs text-ink-subtle">{r.solutionHidden}</p>}
                      </div>
                    ) : null}
                    {a.explanation ? (
                      <p className="mt-3 text-sm">
                        <span className="font-medium">{r.explanation}:</span> <span className="text-ink-muted">{a.explanation}</span>
                      </p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {quizzes.map((q) => (
            <section key={q.id}>
              <h2 className="mb-3 text-lg font-semibold">
                {r.quiz}: {q.title}
              </h2>
              <ol className="space-y-2">
                {q.questions.map((question, i) => (
                  <li key={question.id}>
                    <Card className="p-4 text-sm">
                      <p>
                        <span className="font-semibold">{i + 1}.</span> {question.prompt}
                      </p>
                      <p className="mt-1 text-success">
                        {r.correct}:{" "}
                        {[
                          ...question.options.filter((o) => question.correctOptionIds.includes(o.id)).map((o) => o.text),
                          ...question.acceptedAnswers,
                          ...(question.numericAnswer === null ? [] : [question.tolerance ? `${question.numericAnswer} ± ${question.tolerance}` : String(question.numericAnswer)]),
                        ].join(" · ") || "—"}
                      </p>
                    </Card>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          {[
            [dict.teacher.editor.discussionQuestions, content.discussionQuestions],
            [dict.teacher.editor.assessment, content.assessment],
            [dict.teacher.editor.homework, content.homework],
            [dict.teacher.editor.sources, content.sources],
          ].map(([title, items]) =>
            (items as string[]).length ? (
              <Card key={title as string} className="p-5">
                <h2 className="font-semibold">{title as string}</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  {(items as string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            ) : null,
          )}
          {content.teacherNotes ? (
            <Card className="p-5">
              <h2 className="font-semibold">{dict.teacher.editor.teacherNotes}</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-ink-muted">{content.teacherNotes}</p>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <ReviewPanel lessonId={lesson.id} language={lesson.language} status={lesson.reviewStatus} history={reviewHistory(lesson.id)} />
          <p className="text-sm">
            <Link href="/teacher/lessons/review" className="text-brand hover:underline">
              {r.queue}
            </Link>
          </p>
        </aside>
      </div>
    </PageContainer>
  );
}
