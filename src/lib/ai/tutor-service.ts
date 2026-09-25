import "server-only";
import type { LessonRecord } from "@/lib/services/lessons";
import { withAIStatus } from "./index";
import type { ChatTurn } from "./provider";
import { EDUCATIONAL_GUARDRAILS, HINT_LEVEL_GUIDE, detectLanguage, languageInstruction } from "./prompts";

/**
 * The study tutor answers students' questions about a lesson using the same
 * hint-first ladder as classroom activities. The student chooses how much
 * help they want; the tutor never jumps straight to a finished answer unless
 * the student has asked for the most detailed level.
 *
 * Conversations are not stored on the server.
 */
export const TUTOR_LEVELS = [1, 2, 3, 4, 5] as const;

export function tutorSystemPrompt(lesson: Pick<LessonRecord, "title" | "subject" | "grade" | "language" | "content"> | null, helpLevel: number, questionText: string): string {
  const language = lesson?.language ?? detectLanguage(questionText);
  const context = lesson
    ? [
        `The student is studying "${lesson.title}" (${lesson.subject.replace("_", " ")}, grade ${lesson.grade}).`,
        `Lesson objectives: ${lesson.content.objectives.join("; ")}`,
        `Key lesson content (for reference; stay consistent with it):\n${lesson.content.sections.map((s) => `- ${s.title}: ${s.body.slice(0, 600)}`).join("\n")}`,
      ].join("\n")
    : "The student has not selected a lesson.";
  return [
    EDUCATIONAL_GUARDRAILS,
    "You are a friendly, patient study tutor for a secondary-school student. Your goal is that the student understands and does the thinking themselves.",
    HINT_LEVEL_GUIDE,
    `The student has currently chosen help level ${helpLevel}. Answer at that level. If they ask for the answer below level 5, give the level-${helpLevel} help and tell them they can choose “more help” if they are still stuck.`,
    "Questions about facts or concepts (not homework problems) may be explained directly and clearly at any level.",
    "Keep replies short (under 150 words), use simple language, and end with a question that invites the student to try the next step when appropriate.",
    "If a question is unrelated to learning, or asks for something inappropriate, politely steer back to the lesson.",
    languageInstruction(language),
    context,
  ].join("\n\n");
}

export async function askTutor(input: {
  lesson: LessonRecord | null;
  helpLevel: number;
  messages: ChatTurn[];
}): Promise<string> {
  const lastQuestion = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  return withAIStatus((ai) =>
    ai.generateText({
      system: tutorSystemPrompt(input.lesson, input.helpLevel, lastQuestion),
      messages: input.messages.slice(-12),
      maxTokens: 3000,
      effort: "low",
      timeoutMs: 45_000,
    }),
  );
}
