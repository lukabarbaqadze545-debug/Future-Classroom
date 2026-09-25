import { z } from "zod";
import {
  ACTIVITY_TYPES,
  CONTENT_LANGUAGES,
  DIFFICULTIES,
  MATERIAL_VISIBILITIES,
  MAX_AUTHORED_HINTS,
  QUIZ_QUESTION_TYPES,
  SECTION_KINDS,
  SUBJECTS,
} from "./catalog";

/*
 * Domain schemas. Every piece of lesson / quiz content that enters the
 * database — whether written by a teacher, produced by a template or returned
 * by an AI model — is validated against these.
 */

const text = (max: number) => z.string().trim().max(max);
const id = z.string().trim().min(1).max(40);

export const optionSchema = z.object({
  id,
  text: text(500),
});
export type Option = z.infer<typeof optionSchema>;

export const visualSchema = z.object({
  type: z.literal("function_plot"),
  expression: text(120),
  xMin: z.number().min(-1000).max(1000),
  xMax: z.number().min(-1000).max(1000),
  caption: text(200).default(""),
});
export type Visual = z.infer<typeof visualSchema>;

export const activitySchema = z.object({
  id,
  type: z.enum(ACTIVITY_TYPES),
  title: text(120).default(""),
  prompt: text(2000).min(1),
  options: z.array(optionSchema).max(8).default([]),
  correctOptionIds: z.array(id).max(8).default([]),
  acceptedAnswers: z.array(text(200)).max(10).default([]),
  /** Ordered hint ladder: conceptual → specific → next step → explanation. */
  hints: z.array(text(1000)).max(MAX_AUTHORED_HINTS).default([]),
  solution: text(3000).default(""),
  allowSolution: z.boolean().default(true),
  explanation: text(2000).default(""),
  timeLimitSec: z.number().int().min(10).max(3600).nullable().default(null),
});
export type Activity = z.infer<typeof activitySchema>;

export const sectionSchema = z.object({
  id,
  kind: z.enum(SECTION_KINDS),
  title: text(160).min(1),
  body: text(8000).default(""),
  minutes: z.number().int().min(0).max(240).default(5),
  visual: visualSchema.nullable().default(null),
});
export type Section = z.infer<typeof sectionSchema>;

export const lessonContentSchema = z.object({
  objectives: z.array(text(400)).max(12).default([]),
  sections: z.array(sectionSchema).max(30).default([]),
  activities: z.array(activitySchema).max(30).default([]),
  discussionQuestions: z.array(text(600)).max(12).default([]),
  assessment: z.array(text(600)).max(12).default([]),
  homework: z.array(text(600)).max(12).default([]),
  teacherNotes: text(4000).default(""),
  /** Teacher-supplied references. AI output never fills this in. */
  sources: z.array(text(400)).max(20).default([]),
});
export type LessonContent = z.infer<typeof lessonContentSchema>;

export const lessonMetaSchema = z.object({
  title: text(160).min(1),
  subject: z.enum(SUBJECTS),
  grade: z.number().int().min(1).max(12),
  topic: text(160).min(1),
  durationMin: z.number().int().min(10).max(240),
  objective: text(600).default(""),
  difficulty: z.enum(DIFFICULTIES),
  language: z.enum(CONTENT_LANGUAGES),
});
export type LessonMeta = z.infer<typeof lessonMetaSchema>;

export const lessonInputSchema = z.object({
  subject: z.enum(SUBJECTS),
  grade: z.number().int().min(1).max(12),
  topic: text(160).min(2),
  durationMin: z.number().int().min(10).max(240).default(45),
  objective: text(600).default(""),
  difficulty: z.enum(DIFFICULTIES).default("standard"),
  language: z.enum(CONTENT_LANGUAGES).default("en"),
  materialIds: z.array(id).max(5).default([]),
});
export type LessonInput = z.infer<typeof lessonInputSchema>;

export const quizQuestionSchema = z.object({
  id,
  type: z.enum(QUIZ_QUESTION_TYPES),
  prompt: text(2000).min(1),
  options: z.array(optionSchema).max(8).default([]),
  correctOptionIds: z.array(id).max(8).default([]),
  acceptedAnswers: z.array(text(200)).max(10).default([]),
  numericAnswer: z.number().nullable().default(null),
  tolerance: z.number().min(0).default(0),
  explanation: text(2000).default(""),
  points: z.number().int().min(1).max(10).default(1),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizFeedbackModes = ["full", "score_only"] as const;
export type QuizFeedbackMode = (typeof quizFeedbackModes)[number];

export const quizDraftSchema = z.object({
  title: text(160).min(1),
  subject: z.enum(SUBJECTS),
  grade: z.number().int().min(1).max(12),
  topic: text(160).default(""),
  feedbackMode: z.enum(quizFeedbackModes).default("full"),
  questions: z.array(quizQuestionSchema).max(40),
});
export type QuizDraft = z.infer<typeof quizDraftSchema>;

/** What a student submits for an activity or quiz question. */
export const answerSchema = z.object({
  optionIds: z.array(id).max(8).default([]),
  text: text(2000).default(""),
});
export type Answer = z.infer<typeof answerSchema>;

export const materialMetaSchema = z.object({
  title: text(160).min(1),
  subject: z.enum(SUBJECTS),
  grade: z.number().int().min(1).max(12).nullable(),
  author: text(120).default(""),
  tags: z.array(text(40).min(1)).max(12).default([]),
  visibility: z.enum(MATERIAL_VISIBILITIES).default("teachers"),
});
export type MaterialMeta = z.infer<typeof materialMetaSchema>;
