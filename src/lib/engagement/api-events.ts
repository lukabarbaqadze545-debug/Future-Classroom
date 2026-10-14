import type { EngagementEvent } from "./model";

/**
 * Which successful calls to the platform count as learning for the "Today"
 * game: a correct answer while practising, a finished quiz, an answer or a
 * join in a live class, work in a laboratory. Everything else is not.
 */
export function eventFromApiCall(url: string, method: string, data: unknown): EngagementEvent | null {
  const path = url.split("?")[0];
  const verb = method.toUpperCase();
  const body = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;

  if (verb === "POST" && path === "/api/practice/check") return body.isCorrect === true ? { kind: "practice" } : null;

  if (verb === "POST" && /^\/api\/quizzes\/[^/]+\/attempts$/.test(path)) {
    const result = (body.result && typeof body.result === "object" ? body.result : {}) as Record<string, unknown>;
    return typeof result.score === "number" && typeof result.maxScore === "number" ? { kind: "quiz", score: result.score, max: result.maxScore } : null;
  }

  if (verb === "POST" && /^\/api\/sessions\/[^/]+\/respond$/.test(path)) return { kind: "live" };
  if (verb === "POST" && path === "/api/sessions/join") return { kind: "join" };

  const lab = /^\/api\/labs\/(programming|stem|research|critical)\//.exec(path);
  if (lab && (verb === "POST" || verb === "PUT")) return { kind: "lab", lab: lab[1] };

  return null;
}
