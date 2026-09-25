import "server-only";
import { z } from "zod";
import { QUIZ_QUESTION_TYPES } from "@/lib/domain/catalog";
import { quizQuestionSchema, type LessonContent, type LessonMeta, type QuizDraft, type QuizQuestion } from "@/lib/domain/schemas";
import { extractNumbers } from "@/lib/domain/grading";
import { getAIProvider, withAIStatus } from "./index";
import { EDUCATIONAL_GUARDRAILS, languageInstruction } from "./prompts";
import { findCuratedLesson } from "./templates";
import type { GenerationSource } from "./lesson-generator";

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

const aiQuestion = z.object({
  type: z.enum(QUIZ_QUESTION_TYPES),
  prompt: z.string(),
  options: z.array(z.string()).describe("Options for multiple_choice (3-4). Empty for other types."),
  correctOptionIndex: z.number().describe("Zero-based index of the correct option for multiple_choice; -1 otherwise."),
  trueFalseAnswer: z.boolean().describe("The correct answer for true_false; false for other types."),
  acceptedAnswers: z.array(z.string()).describe("Accepted answers for short_answer; empty otherwise."),
  numericAnswer: z.number().describe("Correct value for numerical; 0 for other types."),
  tolerance: z.number().describe("Allowed absolute error for numerical; 0 otherwise."),
  explanation: z.string(),
});
const aiQuiz = z.object({ title: z.string(), questions: z.array(aiQuestion) });

export function mapAIQuestion(q: z.infer<typeof aiQuestion>, id: string, trueFalseLabels: [string, string]): QuizQuestion | null {
  const base = { id, prompt: q.prompt.slice(0, 2000), explanation: q.explanation.slice(0, 2000), points: 1, tolerance: 0, numericAnswer: null, acceptedAnswers: [], options: [], correctOptionIds: [] };
  let question: unknown;
  switch (q.type) {
    case "multiple_choice": {
      const options = q.options.slice(0, 8).map((text, i) => ({ id: LETTERS[i], text: text.slice(0, 500) }));
      if (options.length < 2 || q.correctOptionIndex < 0 || q.correctOptionIndex >= options.length) return null;
      question = { ...base, type: "multiple_choice", options, correctOptionIds: [LETTERS[q.correctOptionIndex]] };
      break;
    }
    case "true_false":
      question = {
        ...base,
        type: "true_false",
        options: [
          { id: "true", text: trueFalseLabels[0] },
          { id: "false", text: trueFalseLabels[1] },
        ],
        correctOptionIds: [q.trueFalseAnswer ? "true" : "false"],
      };
      break;
    case "numerical":
      question = { ...base, type: "numerical", numericAnswer: q.numericAnswer, tolerance: Math.max(0, q.tolerance) };
      break;
    case "short_answer":
      if (q.acceptedAnswers.length === 0) return null;
      question = { ...base, type: "short_answer", acceptedAnswers: q.acceptedAnswers.slice(0, 10).map((a) => a.slice(0, 200)) };
      break;
  }
  const parsed = quizQuestionSchema.safeParse(question);
  return parsed.success ? parsed.data : null;
}

function trueFalseLabels(language: LessonMeta["language"]): [string, string] {
  return language === "ka" ? ["სწორია", "არასწორია"] : ["True", "False"];
}

/** Builds quiz questions from the lesson's own checkable activities. */
export function quizFromActivities(content: LessonContent): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (const activity of content.activities) {
    const id = `q${questions.length + 1}`;
    if (activity.type === "multiple_choice" && activity.correctOptionIds.length) {
      questions.push({ id, type: "multiple_choice", prompt: activity.prompt, options: activity.options, correctOptionIds: activity.correctOptionIds, acceptedAnswers: [], numericAnswer: null, tolerance: 0, explanation: activity.explanation || activity.solution, points: 1 });
    } else if ((activity.type === "exercise" || activity.type === "short_answer") && activity.acceptedAnswers.length) {
      const numbers = extractNumbers(activity.acceptedAnswers[0]);
      const isSingleNumber = numbers.length === 1 && activity.acceptedAnswers[0].replace(/[\d.,\s-]/g, "").length <= 4;
      questions.push(
        isSingleNumber
          ? { id, type: "numerical", prompt: activity.prompt, options: [], correctOptionIds: [], acceptedAnswers: [], numericAnswer: numbers[0], tolerance: 0, explanation: activity.explanation || activity.solution, points: 1 }
          : { id, type: "short_answer", prompt: activity.prompt, options: [], correctOptionIds: [], acceptedAnswers: activity.acceptedAnswers, numericAnswer: null, tolerance: 0, explanation: activity.explanation || activity.solution, points: 1 },
      );
    }
  }
  return questions;
}

export interface GeneratedQuiz {
  draft: QuizDraft;
  source: GenerationSource;
}

export function generateQuizFromTemplate(meta: LessonMeta, content: LessonContent, reason: "ai_offline" | "ai_failed"): GeneratedQuiz {
  const curated = findCuratedLesson(meta.topic, meta.subject, meta.language) ?? findCuratedLesson(meta.title, meta.subject, meta.language);
  const questions = curated ? structuredClone(curated.quiz.questions) : quizFromActivities(content);
  return {
    draft: {
      title: curated?.quiz.title ?? `${meta.title} — ${meta.language === "ka" ? "ქვიზი" : "Quiz"}`,
      subject: meta.subject,
      grade: meta.grade,
      topic: meta.topic,
      feedbackMode: "full",
      questions,
    },
    source: { kind: "template", reason, curated: Boolean(curated) },
  };
}

export async function generateQuizWithAI(meta: LessonMeta, content: LessonContent, count: number): Promise<GeneratedQuiz> {
  const result = await withAIStatus((ai) =>
    ai.generateObject({
      system: `${EDUCATIONAL_GUARDRAILS}\n\nYou write fair, unambiguous assessment questions for teachers to review.\n${languageInstruction(meta.language)}`,
      prompt: [
        `Write a ${count}-question quiz for this lesson.`,
        `Lesson: ${meta.title} — ${meta.subject.replace("_", " ")}, grade ${meta.grade}, difficulty ${meta.difficulty}`,
        `Objectives:\n${content.objectives.map((o) => `- ${o}`).join("\n")}`,
        `Lesson content:\n${content.sections.map((s) => `## ${s.title}\n${s.body}`).join("\n\n").slice(0, 12000)}`,
        "Mix question types (multiple_choice, true_false, numerical, short_answer). Each question must have exactly one defensible correct answer and a one-sentence explanation.",
        "For short_answer, list all reasonable phrasings of the correct answer in acceptedAnswers.",
      ].join("\n\n"),
      schema: aiQuiz,
      maxTokens: 8000,
      effort: "low",
      timeoutMs: 120_000,
    }),
  );
  const labels = trueFalseLabels(meta.language);
  const questions = result.questions
    .map((q, i) => mapAIQuestion(q, `q${i + 1}`, labels))
    .filter((q): q is QuizQuestion => q !== null)
    .slice(0, 40);
  if (questions.length === 0) throw new Error("AI returned no usable questions");
  return {
    draft: { title: result.title.slice(0, 160) || meta.title, subject: meta.subject, grade: meta.grade, topic: meta.topic, feedbackMode: "full", questions },
    source: { kind: "ai", model: getAIProvider()?.model ?? "unknown" },
  };
}

export async function generateQuiz(meta: LessonMeta, content: LessonContent, count = 6): Promise<GeneratedQuiz> {
  if (!getAIProvider()) return generateQuizFromTemplate(meta, content, "ai_offline");
  try {
    return await generateQuizWithAI(meta, content, count);
  } catch (error) {
    console.warn("[ai] quiz generation failed, using template", error instanceof Error ? error.message : error);
    return generateQuizFromTemplate(meta, content, "ai_failed");
  }
}
