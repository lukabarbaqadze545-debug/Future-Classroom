import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getAIProvider } from "@/lib/ai";
import { curatedTopicsFor } from "@/lib/ai/templates";
import { getLessonForEditor } from "@/lib/services/lessons";
import { listMaterials } from "@/lib/services/materials";
import { listQuizzesForLesson } from "@/lib/services/quizzes";
import { ApiError } from "@/lib/http/errors";
import { PageContainer } from "@/components/layout/site-header";
import { LessonEditor, type GenerationNotice } from "@/components/lesson/lesson-editor";

export const metadata = { title: "Lesson" };

const NOTICES: GenerationNotice[] = ["ai", "curated", "outline", "ai_failed"];

export default async function LessonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ generated?: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ id }, { generated }, { locale }] = await Promise.all([params, searchParams, getDictionary()]);
  let lesson;
  try {
    lesson = getLessonForEditor(id, user);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const materials = listMaterials(user).map((m) => ({ id: m.id, title: m.title, subject: m.subject, textStatus: m.textStatus }));
  const quizzes = listQuizzesForLesson(id).map((q) => ({ id: q.id, title: q.title, status: q.status, questionCount: q.questions.length }));
  const notice = NOTICES.find((n) => n === generated) ?? null;
  // Built-in lessons for this lesson's subject (in the other language if there are none in this one).
  const forSubject = (language: typeof locale) => curatedTopicsFor(language).filter((t) => t.subject === lesson.subject).map((t) => t.title);
  const curatedTopics = (forSubject(locale).length ? forSubject(locale) : forSubject(locale === "ka" ? "en" : "ka")).join(", ");
  return (
    <PageContainer>
      <LessonEditor
        key={lesson.updatedAt}
        lesson={lesson}
        aiAvailable={getAIProvider() !== null}
        materials={materials}
        quizzes={quizzes}
        notice={notice}
        curatedTopics={curatedTopics}
      />
    </PageContainer>
  );
}
