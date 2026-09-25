import { notFound } from "next/navigation";
import { ClipboardList, Pencil, Radio } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { getProblem, judgeInfo, listSubmissions, problemClassStats, problemStatuses, toStudentProblem } from "@/lib/labs/programming/service";
import { isBookmarked } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { findPortfolioItemBySource } from "@/lib/services/portfolio";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LabHeader, Stars } from "@/components/labs/lab-shell";
import { CodeBlock } from "@/components/labs/code-editor";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { BookmarkButton } from "@/components/labs/shared/bookmark-button";
import { ProblemWorkspace } from "@/components/labs/programming/problem-workspace";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, dict } = await getDictionary();
  const problem = getProblem((await params).id);
  return { title: problem ? tr(problem.title, locale) : dict.labs.hub.rooms.programming.name };
}

export default async function ProblemPage({ params }: Props) {
  const { id } = await params;
  const problem = getProblem(id);
  if (!problem) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const p = dict.labs.programming;
  const staff = isStaff(user);
  const solved = problemStatuses(user.id).get(id) === "solved";
  const assignments = staff ? [] : openAssignmentsFor(user.id, "programming", id);
  const canEdit = staff && problem.authorId && (problem.authorId === user.id || user.role === "admin");
  const stats = staff ? problemClassStats(id) : null;

  return (
    <PageContainer wide>
      <LabHeader
        lab="programming"
        hubLabel={dict.labs.hub.title}
        labName={p.title}
        title={tr(problem.title, locale)}
        lead={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{fmt(dict.labs.common.level, { n: problem.level })}</Badge>
            <Badge tone={problem.kind === "code" ? "brand" : problem.kind === "predict" ? "warn" : "neutral"}>{p.kinds[problem.kind]}</Badge>
            <span>{p.topics[problem.topic]}</span>
            <Stars value={problem.difficulty} label={`${dict.labs.common.difficulty}: ${problem.difficulty}/3`} />
            {problem.authorName ? <span>· {fmt(p.byAuthor, { name: problem.authorName })}</span> : null}
          </span>
        }
        actions={
          <>
            <BookmarkButton kind="programming" refId={id} initial={isBookmarked(user.id, "programming", id)} size="md" />
            {staff ? (
              <>
                <ButtonLink href={`/teacher/assignments/new?kind=programming&ref=${encodeURIComponent(id)}`} variant="secondary">
                  <ClipboardList aria-hidden className="size-4" />
                  {dict.labs.common.assign}
                </ButtonLink>
                <ButtonLink href={`/teacher/sessions/labs?add=programming:${encodeURIComponent(id)}`} variant="secondary">
                  <Radio aria-hidden className="size-4" />
                  {dict.labs.common.useInClass}
                </ButtonLink>
              </>
            ) : null}
            {canEdit ? (
              <ButtonLink href={`/labs/programming/${id}/edit`} variant="ghost">
                <Pencil aria-hidden className="size-4" />
                {p.editProblem}
              </ButtonLink>
            ) : null}
          </>
        }
      />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      <ProblemWorkspace
        problem={toStudentProblem(problem)}
        history={listSubmissions(user.id, id)}
        judge={{ cpp: judgeInfo().cpp }}
        initiallySolved={solved}
        explanation={solved || staff ? problem.explanation : null}
        isStudent={!staff}
        inPortfolio={!staff && findPortfolioItemBySource(user.id, "programming", id) !== null}
      />

      {staff ? (
        <Card className="mt-8 border-dashed">
          <CardHeader
            title={dict.labs.common.teacherView}
            description={stats && stats.attempted ? fmt(dict.labs.common.studentsSolved, { solved: stats.solved, attempted: stats.attempted }) : undefined}
          />
          <div className="grid gap-5 px-5 py-5 xl:grid-cols-2">
            {problem.kind === "code" ? (
              <>
                <div className="min-w-0 space-y-3">
                  <h3 className="font-semibold">{p.teacherSolution}</h3>
                  {(["python", "cpp"] as const).map((lang) =>
                    problem.solution[lang] ? (
                      <div key={lang}>
                        <p className="mb-1 text-xs font-medium text-ink-muted">{p.languages[lang]}</p>
                        <CodeBlock code={problem.solution[lang]} />
                      </div>
                    ) : null,
                  )}
                </div>
                <div className="min-w-0 space-y-3">
                  <h3 className="font-semibold">{p.allTests}</h3>
                  <ol className="space-y-2">
                    {problem.tests.map((t, i) => (
                      <li key={i} className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-medium text-ink-muted">
                            {t.sample ? fmt(p.test, { n: i + 1 }) : fmt(p.hiddenTest, { n: i + 1 })} · {p.exampleInput}
                          </p>
                          <CodeBlock code={t.input || " "} />
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-ink-muted">{p.expected}</p>
                          <CodeBlock code={t.output} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : problem.kind === "predict" ? (
              (["python", "cpp"] as const).map((lang) => (
                <div key={lang}>
                  <p className="mb-1 text-sm font-semibold">
                    {p.expected} · {p.languages[lang]}
                  </p>
                  <CodeBlock code={problem.expected[lang]} />
                </div>
              ))
            ) : (
              <p>
                <span className="font-semibold">{p.expected}: </span>
                {tr(problem.options.find((o) => o.id === problem.correct)!.text, locale)}
              </p>
            )}
            {problem.hints.length ? (
              <div className="min-w-0 xl:col-span-2">
                <h3 className="font-semibold">{p.hints}</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  {problem.hints.map((h, i) => (
                    <li key={i}>{tr(h, locale)}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
    </PageContainer>
  );
}
