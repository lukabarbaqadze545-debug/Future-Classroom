import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getDb, now } from "@/lib/db";
import type { Activity } from "@/lib/domain/schemas";
import { MAX_AUTHORED_HINTS } from "@/lib/domain/catalog";
import { getAIProvider, withAIStatus } from "./index";
import { EDUCATIONAL_GUARDRAILS, HINT_LEVEL_GUIDE, detectLanguage, languageInstruction } from "./prompts";

/**
 * Hint-first help. Students climb a ladder of increasingly specific help;
 * the full solution is always the last rung and only exists when the teacher
 * allows it. Sources, in order:
 *   1. hints the teacher wrote (or reviewed) for the activity
 *   2. AI-generated hints, cached per activity + level
 *   3. general study-strategy prompts (translated in the UI), clearly
 *      labelled as generic when AI is offline and no hint was written
 */
export type HintKind = "concept" | "specific" | "next_step" | "explanation" | "solution";
export const HINT_KINDS: HintKind[] = ["concept", "specific", "next_step", "explanation", "solution"];

export interface HintResult {
  level: number;
  kind: HintKind;
  source: "teacher" | "ai" | "generic";
  /** Hint text. Null for generic hints, which the client renders from `genericKey`. */
  text: string | null;
  genericKey: string | null;
  isSolution: boolean;
  maxLevel: number;
}

const SOLVABLE_TYPES: Activity["type"][] = ["multiple_choice", "short_answer", "exercise"];

export function hintLadderInfo(activity: Activity): { maxLevel: number } {
  if (activity.type === "poll") return { maxLevel: 0 };
  const canShowSolution =
    activity.allowSolution && SOLVABLE_TYPES.includes(activity.type) && (activity.solution.trim().length > 0 || getAIProvider() !== null);
  return { maxLevel: canShowSolution ? 5 : MAX_AUTHORED_HINTS };
}

function cacheKey(activity: Activity, level: number): string {
  return createHash("sha256")
    .update(JSON.stringify([activity.type, activity.prompt, activity.options, activity.correctOptionIds, activity.acceptedAnswers, level]))
    .digest("hex");
}

function genericKey(activity: Activity, level: number): string {
  const family = activity.type === "discussion" || activity.type === "exit_ticket" ? "reflect" : "solve";
  return `${family}_${Math.min(level, 4)}`;
}

const hintOutput = z.object({ hint: z.string() });

async function generateAIHint(activity: Activity, level: number): Promise<string> {
  const language = detectLanguage(activity.prompt);
  const previous = activity.hints.slice(0, level - 1).filter(Boolean);
  const answerKey =
    activity.type === "multiple_choice"
      ? activity.options.filter((o) => activity.correctOptionIds.includes(o.id)).map((o) => o.text).join("; ")
      : activity.acceptedAnswers.join("; ");
  const prompt = [
    `Question type: ${activity.type.replace("_", " ")}`,
    `Question: ${activity.prompt}`,
    activity.options.length ? `Options: ${activity.options.map((o) => o.text).join(" | ")}` : "",
    answerKey ? `Correct answer (for your reference only — do not reveal below level 5): ${answerKey}` : "",
    activity.solution ? `Teacher's worked solution (reference only): ${activity.solution}` : "",
    previous.length ? `Hints the student has already seen:\n${previous.map((h, i) => `${i + 1}. ${h}`).join("\n")}` : "",
    "",
    `Write the level ${level} hint. One to three short sentences${level >= 4 ? " (a short worked explanation is fine)" : ""}. Speak directly to the student.`,
  ]
    .filter(Boolean)
    .join("\n");
  const result = await withAIStatus((ai) =>
    ai.generateObject({
      system: `${EDUCATIONAL_GUARDRAILS}\n\nYou are a patient tutor giving one hint at a time.\n${HINT_LEVEL_GUIDE}\n${languageInstruction(language)}`,
      prompt,
      schema: hintOutput,
      maxTokens: 2000,
      effort: "low",
      timeoutMs: 30_000,
    }),
  );
  return result.hint.trim();
}

export async function getHint(input: { activity: Activity; level: number; cachedOnly?: boolean }): Promise<HintResult> {
  const { activity } = input;
  const { maxLevel } = hintLadderInfo(activity);
  const level = Math.max(1, Math.min(input.level, Math.max(maxLevel, 1)));
  const kind = HINT_KINDS[level - 1];
  const base = { level, kind, maxLevel, isSolution: level === 5 };

  // 1. Teacher-authored content.
  if (level <= MAX_AUTHORED_HINTS && activity.hints[level - 1]?.trim()) {
    return { ...base, source: "teacher", text: activity.hints[level - 1].trim(), genericKey: null };
  }
  if (level === 5 && activity.solution.trim()) {
    return { ...base, source: "teacher", text: activity.solution.trim(), genericKey: null };
  }

  // 2. Cached or freshly generated AI hint.
  const db = getDb();
  const key = cacheKey(activity, level);
  const cached = db.prepare("SELECT text FROM hint_cache WHERE cache_key = ?").get(key) as { text: string } | undefined;
  if (cached) return { ...base, source: "ai", text: cached.text, genericKey: null };
  if (!input.cachedOnly && getAIProvider()) {
    try {
      const text = await generateAIHint(activity, level);
      if (text) {
        db.prepare("INSERT OR REPLACE INTO hint_cache (cache_key, text, model, created_at) VALUES (?, ?, ?, ?)").run(
          key,
          text,
          getAIProvider()?.model ?? "unknown",
          now(),
        );
        return { ...base, source: "ai", text, genericKey: null };
      }
    } catch {
      // Fall through to a generic strategy prompt; the AI status badge shows the failure.
    }
  }

  // 3. Generic strategy prompt (never pretends to be tailored or AI-written).
  return { ...base, isSolution: false, source: "generic", text: null, genericKey: genericKey(activity, level) };
}
