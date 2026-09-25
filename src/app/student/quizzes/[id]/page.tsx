import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { getAttempt, getPublishedQuiz, studentAttemptView, toStudentQuestions } from "@/lib/services/quizzes";
import { ApiError } from "@/lib/http/errors";
import { PageContainer } from "@/components/layout/site-header";
import { PageHeader } from "@/components/ui/misc";
import { QuizPlayer, QuizResultView } from "@/components/quiz/quiz-player";

export const metadata = { title: "Quiz" };

export default async function StudentQuizPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ attempt?: string }> }) {
  const user = (await getCurrentUser())!;
  const [{ id }, { attempt: attemptId }, { dict }] = await Promise.all([params, searchParams, getDictionary()]);
  let quiz;
  try {
    quiz = getPublishedQuiz(id);
  } catch (error) {
    if (error instanceof ApiError) notFound();
    throw error;
  }
  const attempt = attemptId ? getAttempt(attemptId) : null;
  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow={`${dict.student.quiz.title} · ${dict.subjects[quiz.subject]}`} title={quiz.title} />
        {attempt && attempt.studentId === user.id && attempt.quizId === quiz.id ? (
          <QuizResultView result={studentAttemptView(quiz, attempt)} quizId={quiz.id} lessonId={quiz.lessonId} />
        ) : (
          <QuizPlayer quiz={{ id: quiz.id, title: quiz.title, lessonId: quiz.lessonId, questions: toStudentQuestions(quiz) }} />
        )}
      </div>
    </PageContainer>
  );
}
