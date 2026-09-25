import "server-only";
import { AnthropicProvider } from "./anthropic";
import { AIGenerationError, AIUnavailableError, type AIProvider } from "./provider";

export { AIGenerationError, AIUnavailableError } from "./provider";
export type { AIProvider } from "./provider";

export const DEFAULT_MODEL = "claude-opus-5";

type AIState = {
  provider?: AIProvider | null;
  override?: AIProvider | null;
  lastFailureAt?: number;
  lastFailureReason?: string;
};
const g = globalThis as typeof globalThis & { __fcAI?: AIState };
const state: AIState = (g.__fcAI ??= {});

/** The configured provider, or null when AI is not set up (offline mode). */
export function getAIProvider(): AIProvider | null {
  if (state.override !== undefined) return state.override;
  if (state.provider === undefined) {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    state.provider = key ? new AnthropicProvider(key, process.env.AI_MODEL?.trim() || DEFAULT_MODEL) : null;
  }
  return state.provider;
}

export function requireAIProvider(): AIProvider {
  const provider = getAIProvider();
  if (!provider) throw new AIUnavailableError();
  return provider;
}

/** Test hook: inject a fake provider (or null to simulate offline mode). */
export function setAIProviderForTests(provider: AIProvider | null | undefined): void {
  state.override = provider;
  state.lastFailureAt = undefined;
}

export function reportAIFailure(error: unknown): void {
  state.lastFailureAt = Date.now();
  state.lastFailureReason = error instanceof AIGenerationError ? error.reason : "api";
}

export function reportAISuccess(): void {
  state.lastFailureAt = undefined;
}

export type AIStatus =
  | { mode: "online"; provider: string; model: string }
  | { mode: "degraded"; provider: string; model: string; reason: string }
  | { mode: "offline" };

/** Shown in the UI so teachers always know whether AI is actually in use. */
export function getAIStatus(): AIStatus {
  const provider = getAIProvider();
  if (!provider) return { mode: "offline" };
  if (state.lastFailureAt && Date.now() - state.lastFailureAt < 2 * 60_000) {
    return { mode: "degraded", provider: provider.name, model: provider.model, reason: state.lastFailureReason ?? "api" };
  }
  return { mode: "online", provider: provider.name, model: provider.model };
}

/** Runs an AI call and records success/failure for the status indicator. */
export async function withAIStatus<T>(fn: (provider: AIProvider) => Promise<T>): Promise<T> {
  const provider = requireAIProvider();
  try {
    const result = await fn(provider);
    reportAISuccess();
    return result;
  } catch (error) {
    reportAIFailure(error);
    throw error;
  }
}
