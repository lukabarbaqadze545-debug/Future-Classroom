import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { ASSIGNMENT_KINDS, type AssignmentKind } from "@/lib/labs/registry";
import { assignableItems } from "@/lib/labs/assignment-items";
import { listClassesForTeacher, listStudents } from "@/lib/services/classes";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { AssignmentForm } from "@/components/assignments/assignment-form";

export const metadata = { title: "New assignment" };

export default async function NewAssignmentPage({ searchParams }: { searchParams: Promise<{ kind?: string; ref?: string }> }) {
  const user = (await getCurrentUser())!;
  const { dict, locale } = await getDictionary();
  const { kind, ref } = await searchParams;
  const initialKind: AssignmentKind = kind && (ASSIGNMENT_KINDS as readonly string[]).includes(kind) ? (kind as AssignmentKind) : "programming";
  const classes = listClassesForTeacher(user.id).map((c) => ({ id: c.id, name: c.name, memberIds: c.members.map((m) => m.id) }));
  return (
    <PageContainer>
      <PageHeader title={dict.labs.assignments.newTitle} description={dict.labs.assignments.teacherLead} />
      <AssignmentForm
        items={assignableItems(locale)}
        classes={classes}
        students={listStudents().map((s) => ({ id: s.id, name: s.displayName }))}
        initialKind={initialKind}
        initialRef={ref ?? null}
      />
    </PageContainer>
  );
}
