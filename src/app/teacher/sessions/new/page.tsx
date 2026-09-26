import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { lessonsForSessions } from "@/lib/services/lessons";
import { listClassesForTeacher } from "@/lib/services/classes";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { StartSessionForm } from "@/components/teacher/start-session-form";

export async function generateMetadata() {
  const { dict } = await getDictionary();
  return { title: dict.newSession.title };
}

/** Start a live lesson: from a subject page (?lesson=), a class page (?class=) or from scratch. */
export default async function NewSessionPage({ searchParams }: { searchParams: Promise<{ lesson?: string; class?: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ dict, locale }, params] = await Promise.all([getDictionary(), searchParams]);
  const lessons = lessonsForSessions(user, locale);
  const classes = listClassesForTeacher(user.id).map((c) => ({ id: c.id, name: c.name, size: c.members.length }));
  const initialLessonId = lessons.some((l) => l.id === params.lesson) ? params.lesson! : null;
  const initialClassId = classes.some((c) => c.id === params.class) ? params.class! : null;
  return (
    <PageContainer>
      <PageHeader title={dict.newSession.title} description={dict.newSession.lead} />
      <StartSessionForm lessons={lessons} classes={classes} initialLessonId={initialLessonId} initialClassId={initialClassId} />
    </PageContainer>
  );
}
