import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { listClassesForTeacher, listStudents } from "@/lib/services/classes";
import { assignmentStats } from "@/lib/services/assignments";
import { programmingProgress } from "@/lib/labs/programming/service";
import { PageContainer } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { ClassesManager } from "@/components/assignments/classes-manager";

export async function generateMetadata() {
  return pageTitle((p) => p.students);
}

export default async function StudentsPage() {
  const user = (await getCurrentUser())!;
  const { dict } = await getDictionary();
  const c = dict.labs.classes;
  const students = listStudents();
  const classes = listClassesForTeacher(user.id);
  return (
    <PageContainer>
      <PageHeader title={c.title} description={c.lead} />
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">{c.myClasses}</h2>
        <ClassesManager initial={classes.map((x) => ({ id: x.id, name: x.name, memberIds: x.members.map((m) => m.id) }))} students={students.map((s) => ({ id: s.id, name: s.displayName }))} />
      </section>
      <Card>
        <CardHeader title={c.allStudents} />
        <ul className="divide-y divide-line" data-testid="student-list">
          {students.map((s) => {
            const work = assignmentStats(s.id);
            const prog = programmingProgress(s.id);
            return (
              <li key={s.id}>
                <Link href={`/teacher/students/${s.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                  <span>
                    <span className="font-medium">{s.displayName}</span>
                    <span className="text-sm text-ink-muted"> · @{s.username}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                    <span>{fmt(dict.labs.assignments.progressCount, { done: work.done, total: work.total })}</span>
                    <span>· {dict.labs.profile.solvedProblems}: {prog.solved}</span>
                    {work.overdue ? <Badge tone="danger">{fmt(dict.labs.assignments.overdueCount, { n: work.overdue })}</Badge> : null}
                    <span className="font-medium text-brand">{c.openProfile}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </PageContainer>
  );
}
