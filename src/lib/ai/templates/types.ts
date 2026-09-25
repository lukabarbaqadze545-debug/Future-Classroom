import type { LessonContent, QuizQuestion } from "@/lib/domain/schemas";
import type { ContentLanguage, Difficulty, Subject } from "@/lib/domain/catalog";

/** A hand-written lesson that ships with the platform. */
export interface CuratedLesson {
  key: string;
  /** Matches teacher-entered topics (both languages where relevant). */
  match: RegExp;
  subject: Subject;
  language: ContentLanguage;
  title: string;
  topic: string;
  grade: number;
  durationMin: number;
  difficulty: Difficulty;
  objective: string;
  content: LessonContent;
  quiz: { title: string; questions: QuizQuestion[] };
}
