import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Radio } from "lucide-react";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { tr } from "@/lib/labs/localized";
import { findExercise } from "@/lib/labs/critical/catalog";
import { exerciseClassStats, getAttemptFor, listAttempts, toStudentExercise } from "@/lib/labs/critical/service";
import { isBookmarked } from "@/lib/services/bookmarks";
import { openAssignmentsFor } from "@/lib/services/assignments";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { LabHeader, Stars } from "@/components/labs/lab-shell";
import { AssignmentBanner } from "@/components/labs/shared/assignment-banner";
import { BookmarkButton } from "@/components/labs/shared/bookmark-button";
import { ExerciseRunner } from "@/components/labs/critical/exercise-runner";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ attempt?: string }> };

const SESSION_READY = new Set(["fallacy", "bias", "media", "sources", "claim"]);

export async function generateMetadata({ params }: Props) {
  const exercise = findExercise((await params).id);
  return { title: exercise ? exercise.title.en : "Critical Thinking Lab" };
}

export default async function ExercisePage({ params, searchParams }: Props) {
  const { id } = await params;
  const exercise = findExercise(id);
  if (!exercise) notFound();
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const c = dict.labs.critical;
  const staff = isStaff(user);
  const attemptId = (await searchParams).attempt;
  let viewAttempt = null;
  if (attemptId) {
    try {
      const attempt = getAttemptFor(attemptId, user);
      if (attempt.exerciseId === id) viewAttempt = attempt;
    } catch {
      viewAttempt = null;
    }
  }
  const history = listAttempts(user.id, id, 10);
  const assignments = staff ? [] : openAssignmentsFor(user.id, "critical", id);
  const stats = staff ? exerciseClassStats(id) : null;

  return (
    <PageContainer>
      <LabHeader
        lab="critical"
        hubLabel={dict.labs.hub.title}
        labName={c.title}
        title={tr(exercise.title, locale)}
        lead={
          <span className="block space-y-2">
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone="danger">{c.kinds[exercise.kind]}</Badge>
              <span>
                {c.topics[exercise.topic]} · {fmt(c.minutes, { n: exercise.minutes })}
              </span>
              <Stars value={exercise.difficulty} label={`${dict.labs.common.difficulty}: ${exercise.difficulty}/3`} />
            </span>
            <span className="block">{tr(exercise.intro, locale)}</span>
          </span>
        }
        actions={
          <>
            <BookmarkButton kind="critical" refId={id} initial={isBookmarked(user.id, "critical", id)} size="md" />
            {staff ? (
              <ButtonLink href={`/teacher/assignments/new?kind=critical&ref=${id}`} variant="secondary">
                <ClipboardList aria-hidden className="size-4" />
                {dict.labs.common.assign}
              </ButtonLink>
            ) : null}
            {staff && SESSION_READY.has(exercise.kind) ? (
              <ButtonLink href={`/teacher/sessions/labs?add=critical:${id}`} variant="secondary">
                <Radio aria-hidden className="size-4" />
                {dict.labs.common.useInClass}
              </ButtonLink>
            ) : null}
          </>
        }
      />
      <AssignmentBanner assignments={assignments} dict={dict} locale={locale} />
      {stats ? (
        <p className="mb-4 text-sm text-ink-muted">{stats.students ? fmt(c.classStats, { students: stats.students, avg: stats.average ?? 0 }) : c.noClassStats}</p>
      ) : null}
      <ExerciseRunner key={viewAttempt?.id ?? "new"} exercise={toStudentExercise(exercise)} viewAttempt={viewAttempt} />
      <Card className="mt-8">
        <CardHeader title={c.history} as="h2" />
        {history.length ? (
          <ul className="divide-y divide-line">
            {history.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                <span>
                  <span className="font-semibold tabular-nums">{fmt(c.scored, { score: a.score, max: a.maxScore })}</span>
                  <span className="text-ink-muted"> · {relativeTime(dict, a.createdAt)}</span>
                </span>
                <Link href={`/labs/critical-thinking/${id}?attempt=${a.id}`} className="font-medium text-brand hover:underline">
                  {c.viewAttempt}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-ink-muted">{c.noHistory}</p>
        )}
      </Card>
    </PageContainer>
  );
}
