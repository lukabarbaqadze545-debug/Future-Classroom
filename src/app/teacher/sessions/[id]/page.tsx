import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, pageTitle } from "@/lib/i18n/server";
import { getSessionForTeacher, getSessionSummary, getTeacherSessionView } from "@/lib/services/sessions";
import { getLesson } from "@/lib/services/lessons";
import { ApiError } from "@/lib/http/errors";
import { PageContainer } from "@/components/layout/site-header";
import { TeacherConsole } from "@/components/session/teacher-console";
import { SessionSummaryView } from "@/components/session/session-summary";
import { StartSessionButton } from "@/components/teacher/start-session-dialog";

export async function generateMetadata() {
  return pageTitle((p) => p.sessionConsole);
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ id }, { dict, locale }] = await Promise.all([params, getDictionary()]);
  let session;
  try {
    session = getSessionForTeacher(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  if (session.status === "ended") {
    const lesson = session.lessonId ? getLesson(session.lessonId) : null;
    const canRerun = lesson && (lesson.teacherId === user.id || user.role === "admin" || lesson.status === "published") && lesson.content.activities.length > 0;
    return (
      <PageContainer>
        <SessionSummaryView
          summary={getSessionSummary(id, user)}
          dict={dict}
          locale={locale}
          rerun={canRerun ? <StartSessionButton size="md" label={dict.teacher.summary.runAgain} lessonId={lesson.id} classId={session.classId} /> : null}
        />
      </PageContainer>
    );
  }
  return (
    <PageContainer wide>
      <TeacherConsole initial={getTeacherSessionView(id, user)} />
    </PageContainer>
  );
}
