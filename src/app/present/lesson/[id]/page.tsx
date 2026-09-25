import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLesson } from "@/lib/services/lessons";
import { PresentLesson } from "@/components/present/present-lesson";

export const metadata = { title: "Presentation" };

export default async function PresentLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const lesson = getLesson(id);
  // Teachers can present their own lessons and any published lesson.
  if (!lesson || (lesson.teacherId !== user.id && lesson.status !== "published" && user.role !== "admin")) notFound();
  return (
    <PresentLesson
      lesson={{ id: lesson.id, title: lesson.title, subject: lesson.subject, grade: lesson.grade, language: lesson.language, content: lesson.content, activityCount: lesson.teacherId === user.id ? lesson.content.activities.length : 0 }}
    />
  );
}
