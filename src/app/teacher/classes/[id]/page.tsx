import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Play } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { fmt, fmtCount, formatDateTime, relativeTime } from "@/lib/i18n/config";
import { ApiError } from "@/lib/http/errors";
import { classProgress, listStudents } from "@/lib/services/classes";
import { publicOrigin } from "@/lib/labs/library/qr";
import { PageContainer } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Meter, PageHeader } from "@/components/ui/misc";
import { ClassRoster } from "@/components/classes/class-roster";

type Props = { params: Promise<{ id: string }> };

function load(id: string, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  try {
    return classProgress(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) return {};
  try {
    return { title: classProgress((await params).id, user).class.name };
  } catch {
    return {};
  }
}

/** One class: its students (add, remove, new password) and its progress. */
export default async function ClassPage({ params }: Props) {
  const { id } = await params;
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const c = dict.labs.classes;
  const { class: cls, students, sessions, assignments } = load(id, user);
  const memberIds = new Set(cls.members.map((m) => m.id));
  const others = listStudents().filter((s) => !memberIds.has(s.id));
  const origin = await publicOrigin();

  return (
    <PageContainer wide>
      <PageHeader
        eyebrow={
          <Link href="/teacher/students" className="hover:underline">
            {c.title}
          </Link>
        }
        title={cls.name}
        description={fmtCount(c.membersCount, cls.members.length)}
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/teacher/sessions/new?class=${cls.id}`} size="lg" data-testid="class-start-lesson">
              <Play aria-hidden className="size-5" />
              {c.startLesson}
            </ButtonLink>
            <ButtonLink href={`/teacher/assignments/new?class=${cls.id}`} size="lg" variant="secondary">
              <ClipboardList aria-hidden className="size-5" />
              {c.assignWork}
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title={c.progressTitle} />
            {students.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm" data-testid="class-progress">
                  <thead className="border-b border-line bg-muted/40 text-left text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-medium">{c.student}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{c.colAssignments}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{c.colLessons}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{c.colAnswers}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{c.colQuiz}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{c.colLastActive}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {students.map((s) => (
                      <tr key={s.id}>
                        <th scope="row" className="px-4 py-2.5 text-left font-medium">
                          <Link href={`/teacher/students/${s.id}`} className="hover:text-brand hover:underline">
                            {s.displayName}
                          </Link>
                        </th>
                        <td className="px-4 py-2.5">
                          <span className="tabular-nums">{s.assignmentsTotal ? `${s.assignmentsDone}/${s.assignmentsTotal}` : "—"}</span>
                          <span className="ml-2 inline-flex gap-1">
                            {s.overdue ? <Badge tone="danger">{fmt(dict.labs.assignments.overdueCount, { n: s.overdue })}</Badge> : null}
                            {s.toReview ? <Badge tone="warn">{fmt(c.toReview, { n: s.toReview })}</Badge> : null}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{s.sessionsAttended ? fmtCount(c.lessonsAttended, s.sessionsAttended) : "—"}</td>
                        <td className="px-4 py-2.5 tabular-nums">{s.sessionGraded ? `${s.sessionCorrect}/${s.sessionGraded}` : "—"}</td>
                        <td className="px-4 py-2.5 tabular-nums">{s.quizAveragePercent === null ? "—" : `${s.quizAveragePercent}%`}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{s.lastActiveAt ? relativeTime(dict, s.lastActiveAt) : c.never}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-5 text-sm text-ink-muted">{c.noMyStudents}</p>
            )}
          </Card>

          <ClassRoster
            classId={cls.id}
            className={cls.name}
            members={cls.members}
            others={others}
            signInUrl={`${origin.replace(/^https?:\/\//, "")}/login`}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={c.sessionsTitle} />
            {sessions.length ? (
              <ul className="divide-y divide-line" data-testid="class-sessions">
                {sessions.slice(0, 10).map((s) => (
                  <li key={s.id}>
                    <Link href={`/teacher/sessions/${s.id}`} className="block px-5 py-3 hover:bg-muted/50">
                      <span className="block font-medium">{s.title}</span>
                      <span className="text-sm text-ink-muted">
                        {formatDateTime(locale, s.started_at ?? s.created_at)} · {dict.status[s.status as "lobby" | "live" | "ended"]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-ink-muted">{c.noSessions}</p>
            )}
          </Card>
          <Card>
            <CardHeader title={c.assignmentsTitle} />
            {assignments.length ? (
              <ul className="divide-y divide-line">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <Link href={`/teacher/assignments/${a.id}`} className="block px-5 py-3 hover:bg-muted/50">
                      <span className="block font-medium">{a.title}</span>
                      <span className="text-sm text-ink-muted">{fmt(c.completion, { done: a.done, total: a.total })}</span>
                      <Meter value={a.total ? (a.done / a.total) * 100 : 0} tone="success" className="mt-1.5 h-1.5" label={fmt(c.completion, { done: a.done, total: a.total })} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-ink-muted">{c.noAssignments}</p>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
