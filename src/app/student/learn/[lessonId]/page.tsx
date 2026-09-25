import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublishedLesson, lessonVersion } from "@/lib/services/lessons";
import { getLocale } from "@/lib/i18n/server";
import { listAttemptsForStudent, listQuizzesForLesson } from "@/lib/services/quizzes";
import { listMaterialsForLesson } from "@/lib/services/materials";
import { resourcesForLesson } from "@/lib/labs/library/service";
import { recordLessonView } from "@/lib/services/progress";
import { hintLadderInfo } from "@/lib/ai/hint-service";
import { getAIProvider } from "@/lib/ai";
import { ApiError } from "@/lib/http/errors";
import { PageContainer } from "@/components/layout/site-header";
import { TopicView, type StudentLesson } from "@/components/student/topic-view";

export const metadata = { title: "Topic" };

const PRACTICE_TYPES = new Set(["multiple_choice", "short_answer", "exercise"]);

export default async function TopicPage({ params, searchParams }: { params: Promise<{ lessonId: string }>; searchParams: Promise<{ tab?: string; version?: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ lessonId }, { tab, version }, locale] = await Promise.all([params, searchParams, getLocale()]);
  let lesson;
  try {
    lesson = getPublishedLesson(lessonId);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  // Built-in lessons follow the interface language unless the student chose a version.
  if (lesson.contentGroup && lesson.language !== locale && !version) {
    const localized = lessonVersion(lesson.contentGroup, locale);
    if (localized) redirect(`/student/learn/${localized.id}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`);
  }
  const other = lesson.contentGroup ? lessonVersion(lesson.contentGroup, lesson.language === "en" ? "ka" : "en") : null;
  recordLessonView(user.id, lesson);
  const attempts = listAttemptsForStudent(user.id);
  // Only what a student may see: no answer keys, hints or solutions.
  const view: StudentLesson = {
    id: lesson.id,
    title: lesson.title,
    subject: lesson.subject,
    grade: lesson.grade,
    language: lesson.language,
    otherVersion: other ? { id: other.id, language: other.language } : null,
    objectives: lesson.content.objectives,
    sections: lesson.content.sections,
    discussionQuestions: lesson.content.discussionQuestions,
    homework: lesson.content.homework,
    practice: lesson.content.activities
      .filter((a) => PRACTICE_TYPES.has(a.type))
      .map((a) => ({ id: a.id, type: a.type, title: a.title, prompt: a.prompt, options: a.options, maxLevel: hintLadderInfo(a).maxLevel })),
    quizzes: listQuizzesForLesson(lesson.id)
      .filter((q) => q.status === "published")
      .map((q) => {
        const mine = attempts.filter((a) => a.quizId === q.id);
        const best = mine.sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)[0];
        return { id: q.id, title: q.title, questionCount: q.questions.length, best: best ? `${best.score}/${best.maxScore}` : null };
      }),
    materials: listMaterialsForLesson(lesson.id, user).map((m) => ({ id: m.id, title: m.title })),
    libraryResources: resourcesForLesson(lesson.id).map((r) => ({ id: r.id, title: r.title })),
  };
  const initialTab = tab === "practice" || tab === "quiz" || tab === "ask" ? tab : "learn";
  return (
    <PageContainer>
      <TopicView lesson={view} aiAvailable={getAIProvider() !== null} initialTab={initialTab} />
    </PageContainer>
  );
}
