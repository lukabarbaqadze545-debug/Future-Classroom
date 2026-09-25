import type { ZodType } from "zod";

/**
 * Provider-neutral AI interface. Services (lesson generation, hints,
 * tutoring, library answers) depend only on this, so the model vendor can be
 * swapped without touching the rest of the app.
 */
export type Effort = "low" | "medium" | "high";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  /** Returns a value that has been validated against `schema`. */
  generateObject<T>(request: {
    system: string;
    prompt: string;
    schema: ZodType<T>;
    maxTokens?: number;
    effort?: Effort;
    timeoutMs?: number;
  }): Promise<T>;
  generateText(request: {
    system: string;
    messages: ChatTurn[];
    maxTokens?: number;
    effort?: Effort;
    timeoutMs?: number;
  }): Promise<string>;
}

/** AI is not configured (no API key). Callers should use their offline path. */
export class AIUnavailableError extends Error {
  constructor() {
    super("AI is not configured");
  }
}

/** The provider was reached but the request failed or was declined. */
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly reason: "refused" | "invalid_output" | "rate_limited" | "network" | "api",
  ) {
    super(message);
  }
}
