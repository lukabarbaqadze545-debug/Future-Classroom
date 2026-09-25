import "server-only";
import { z } from "zod";
import { ACTIVITY_TYPES, SECTION_KINDS, type ContentLanguage } from "@/lib/domain/catalog";
import {
  activitySchema,
  lessonContentSchema,
  sectionSchema,
  type Activity,
  type LessonContent,
  type LessonInput,
  type LessonMeta,
  type Section,
} from "@/lib/domain/schemas";
import { compileExpression } from "@/lib/domain/math-expression";
import { newId } from "@/lib/domain/ids";
import { getAIProvider, withAIStatus } from "./index";
import { EDUCATIONAL_GUARDRAILS, HINT_LEVEL_GUIDE, languageInstruction } from "./prompts";
import { buildOutline, findCuratedLesson } from "./templates";

/*
 * Lesson generation. With AI configured, the model drafts a full lesson that
 * the teacher then reviews and edits. Without AI, a hand-written lesson is
 * used when one exists for the topic, otherwise a structured outline. The
 * result always says which of these happened — the UI never presents
 * template content as AI output.
 */

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

// Simple, fully-required shapes for structured output. They are mapped onto
// the stricter domain schemas afterwards.
const aiSection = z.object({
  kind: z.enum(SECTION_KINDS),
  title: z.string(),
  body: z.string(),
  minutes: z.number(),
  graphExpression: z.string().describe("Optional function of x to plot, e.g. 'x^2 - 5x + 6'. Empty string if no graph helps."),
  graphXMin: z.number(),
  graphXMax: z.number(),
  graphCaption: z.string(),
});

const aiActivity = z.object({
  type: z.enum(ACTIVITY_TYPES),
  title: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).describe("Answer options for multiple_choice and poll; empty otherwise."),
  correctOptionIndexes: z.array(z.number()).describe("Zero-based indexes of correct options for multiple_choice; empty otherwise."),
  acceptedAnswers: z.array(z.string()).describe("Accepted short answers for short_answer and exercise; empty for open questions."),
  hints: z.array(z.string()).describe("Exactly four hints following hint levels 1-4. Empty for poll."),
  solution: z.string().describe("Complete worked solution (hint level 5). Empty for discussion, poll and exit_ticket."),
  explanation: z.string().describe("Short feedback shown after a correct answer."),
});

const aiLesson = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  sections: z.array(aiSection),
  activities: z.array(aiActivity),
  discussionQuestions: z.array(z.string()),
  assessment: z.array(z.string()),
  homework: z.array(z.string()),
  teacherNotes: z.string(),
});

export type GenerationSource =
  | { kind: "ai"; model: string }
  | { kind: "template"; reason: "ai_offline" | "ai_failed"; curated: boolean };

export interface GeneratedLesson {
  meta: LessonMeta;
  content: LessonContent;
  source: GenerationSource;
}

function mapVisual(s: z.infer<typeof aiSection>): Section["visual"] {
  const expression = s.graphExpression.trim();
  if (!expression || !(s.graphXMax > s.graphXMin)) return null;
  try {
    compileExpression(expression);
    return { type: "function_plot", expression, xMin: s.graphXMin, xMax: s.graphXMax, caption: s.graphCaption };
  } catch {
    return null; // Drop graphs the safe plotter cannot draw rather than showing a broken figure.
  }
}

export function mapAISection(s: z.infer<typeof aiSection>, id = newId(8)): Section {
  return sectionSchema.parse({
    id,
    kind: s.kind,
    title: s.title.slice(0, 160) || "Section",
    body: s.body.slice(0, 8000),
    minutes: Math.max(0, Math.min(240, Math.round(s.minutes))),
    visual: mapVisual(s),
  });
}

export function mapAIActivity(a: z.infer<typeof aiActivity>, id = newId(8)): Activity {
  const usesOptions = a.type === "multiple_choice" || a.type === "poll";
  const options = usesOptions ? a.options.slice(0, 8).map((text, i) => ({ id: LETTERS[i], text: text.slice(0, 500) })) : [];
  const correct =
    a.type === "multiple_choice"
      ? a.correctOptionIndexes.filter((i) => Number.isInteger(i) && i >= 0 && i < options.length).map((i) => LETTERS[i])
      : [];
  const open = a.type === "discussion" || a.type === "poll" || a.type === "exit_ticket";
  return activitySchema.parse({
    id,
    type: a.type,
    title: a.title.slice(0, 120),
    prompt: a.prompt.slice(0, 2000) || "—",
    options,
    correctOptionIds: correct,
    acceptedAnswers: a.type === "short_answer" || a.type === "exercise" ? a.acceptedAnswers.slice(0, 10).map((x) => x.slice(0, 200)) : [],
    hints: a.type === "poll" ? [] : a.hints.slice(0, 4).map((h) => h.slice(0, 1000)),
    solution: open ? "" : a.solution.slice(0, 3000),
    allowSolution: !open,
    explanation: a.explanation.slice(0, 2000),
    timeLimitSec: null,
  });
}

function lessonPrompt(input: LessonInput, materialExcerpts: string[]): string {
  return [
    `Create a complete, classroom-ready lesson plan.`,
    `Subject: ${input.subject.replace("_", " ")}`,
    `Grade: ${input.grade}`,
    `Topic: ${input.topic}`,
    `Lesson length: ${input.durationMin} minutes (section minutes should add up to roughly this)`,
    `Difficulty: ${input.difficulty}`,
    input.objective ? `Teacher's learning objective: ${input.objective}` : "",
    materialExcerpts.length
      ? `Base the lesson on these excerpts from the school's own materials where relevant (do not quote beyond them):\n${materialExcerpts.map((e, i) => `[${i + 1}] ${e}`).join("\n\n")}`
      : "",
    "",
    "Requirements:",
    "- 3–5 measurable learning objectives.",
    "- 4–6 sections covering introduction, explanation, a worked example, practice and a summary. Section bodies are written for the teacher to present; use short paragraphs and bullet points (•).",
    "- Add a graph only when it genuinely helps (e.g. a function in mathematics or physics).",
    "- 5–7 interactive activities for a live classroom session, in teaching order: include at least one multiple_choice, one exercise (a problem with a checkable answer), one short_answer or discussion, one poll, and finish with an exit_ticket.",
    "- Every gradable activity needs acceptedAnswers or a correct option, four progressive hints and a worked solution.",
    `- ${HINT_LEVEL_GUIDE.split("\n").slice(1).join(" ")}`,
    "- 2–4 discussion questions, 2–3 assessment checks for the teacher, 2–3 homework tasks.",
    "- teacherNotes: common misconceptions to watch for and anything the teacher should verify against the curriculum.",
  ]
    .filter(Boolean)
    .join("\n");
}

function systemPrompt(language: ContentLanguage): string {
  return `${EDUCATIONAL_GUARDRAILS}\n\nYou are an experienced teacher and curriculum designer helping a colleague plan a lesson. The teacher will review and edit everything you write.\n${languageInstruction(language)}`;
}

export async function generateLessonWithAI(input: LessonInput, materialExcerpts: string[] = []): Promise<GeneratedLesson> {
  const result = await withAIStatus((ai) =>
    ai.generateObject({
      system: systemPrompt(input.language),
      prompt: lessonPrompt(input, materialExcerpts),
      schema: aiLesson,
      maxTokens: 16000,
      effort: "medium",
      timeoutMs: 180_000,
    }),
  );
  const content = lessonContentSchema.parse({
    objectives: result.objectives.slice(0, 12).map((o) => o.slice(0, 400)),
    sections: result.sections.slice(0, 30).map((s, i) => mapAISection(s, `s${i + 1}`)),
    activities: result.activities.slice(0, 30).map((a, i) => mapAIActivity(a, `a${i + 1}`)),
    discussionQuestions: result.discussionQuestions.slice(0, 12).map((q) => q.slice(0, 600)),
    assessment: result.assessment.slice(0, 12).map((q) => q.slice(0, 600)),
    homework: result.homework.slice(0, 12).map((q) => q.slice(0, 600)),
    teacherNotes: result.teacherNotes.slice(0, 4000),
    sources: [],
  });
  return {
    meta: {
      title: result.title.trim().slice(0, 160) || input.topic,
      subject: input.subject,
      grade: input.grade,
      topic: input.topic,
      durationMin: input.durationMin,
      objective: input.objective,
      difficulty: input.difficulty,
      language: input.language,
    },
    content,
    source: { kind: "ai", model: getAIProvider()?.model ?? "unknown" },
  };
}

export function generateLessonFromTemplate(input: LessonInput, reason: "ai_offline" | "ai_failed"): GeneratedLesson {
  const curated = findCuratedLesson(input.topic, input.subject, input.language);
  if (curated) {
    return {
      meta: {
        title: curated.title,
        subject: input.subject,
        grade: input.grade,
        topic: input.topic,
        durationMin: input.durationMin,
        objective: input.objective || curated.objective,
        difficulty: input.difficulty,
        language: curated.language,
      },
      content: structuredClone(curated.content),
      source: { kind: "template", reason, curated: true },
    };
  }
  return {
    meta: {
      title: input.topic,
      subject: input.subject,
      grade: input.grade,
      topic: input.topic,
      durationMin: input.durationMin,
      objective: input.objective,
      difficulty: input.difficulty,
      language: input.language,
    },
    content: buildOutline(input),
    source: { kind: "template", reason, curated: false },
  };
}

/** Generates a lesson, falling back to templates when AI is unavailable. */
export async function generateLesson(input: LessonInput, materialExcerpts: string[] = []): Promise<GeneratedLesson> {
  if (!getAIProvider()) return generateLessonFromTemplate(input, "ai_offline");
  try {
    return await generateLessonWithAI(input, materialExcerpts);
  } catch (error) {
    console.warn("[ai] lesson generation failed, using template", error instanceof Error ? error.message : error);
    return generateLessonFromTemplate(input, "ai_failed");
  }
}

// ---------------------------------------------------------------------------
// Regenerating one part of a lesson (AI only — the teacher asked for new text)
// ---------------------------------------------------------------------------

export async function regenerateSection(meta: LessonMeta, content: LessonContent, sectionId: string, instruction: string): Promise<Section> {
  const current = content.sections.find((s) => s.id === sectionId);
  if (!current) throw new Error("Section not found");
  const result = await withAIStatus((ai) =>
    ai.generateObject({
      system: systemPrompt(meta.language),
      prompt: [
        `Lesson: ${meta.title} (${meta.subject.replace("_", " ")}, grade ${meta.grade}, ${meta.durationMin} min)`,
        `Lesson outline: ${content.sections.map((s) => s.title).join(" → ")}`,
        `Rewrite this section. Keep its role in the lesson (${current.kind}) and roughly ${current.minutes} minutes.`,
        `Current title: ${current.title}`,
        `Current text:\n${current.body}`,
        instruction ? `Teacher's request: ${instruction}` : "Make it clearer and more engaging for students.",
      ].join("\n"),
      schema: aiSection,
      maxTokens: 6000,
      effort: "low",
      timeoutMs: 90_000,
    }),
  );
  return mapAISection(result, current.id);
}

export async function regenerateActivity(meta: LessonMeta, content: LessonContent, activityId: string, instruction: string): Promise<Activity> {
  const current = content.activities.find((a) => a.id === activityId);
  if (!current) throw new Error("Activity not found");
  const result = await withAIStatus((ai) =>
    ai.generateObject({
      system: systemPrompt(meta.language),
      prompt: [
        `Lesson: ${meta.title} (${meta.subject.replace("_", " ")}, grade ${meta.grade})`,
        `Objectives: ${content.objectives.join("; ")}`,
        `Write a new classroom activity of type "${current.type}" to replace this one:`,
        `Current prompt: ${current.prompt}`,
        instruction ? `Teacher's request: ${instruction}` : "Make a fresh, different question at the same level.",
        "Include four progressive hints (levels 1–4) and a worked solution for gradable types.",
        HINT_LEVEL_GUIDE,
      ].join("\n"),
      schema: aiActivity,
      maxTokens: 6000,
      effort: "low",
      timeoutMs: 90_000,
    }),
  );
  return mapAIActivity({ ...result, type: current.type }, current.id);
}
