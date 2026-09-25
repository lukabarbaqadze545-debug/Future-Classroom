import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { ZodType } from "zod";
import { AIGenerationError, type AIProvider, type ChatTurn, type Effort } from "./provider";

/** Model families that accept server-side refusal fallbacks ("default" routing). */
function supportsDefaultFallbacks(model: string): boolean {
  return /^claude-(opus-5|fable-5-1)/.test(model);
}

function mapError(error: unknown): AIGenerationError {
  if (error instanceof AIGenerationError) return error;
  if (error instanceof Anthropic.RateLimitError) return new AIGenerationError("AI rate limit reached", "rate_limited");
  if (error instanceof Anthropic.APIConnectionError) return new AIGenerationError("Could not reach the AI service", "network");
  if (error instanceof Anthropic.APIError) return new AIGenerationError(`AI service error (${error.status ?? "unknown"})`, "api");
  return new AIGenerationError(error instanceof Error ? error.message : "Unknown AI error", "api");
}

/**
 * Claude via the official Anthropic SDK. The API key is read on the server
 * only (ANTHROPIC_API_KEY) and never sent to the browser.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey, maxRetries: 1, timeout: 90_000 });
  }

  private fallbackParams() {
    return supportsDefaultFallbacks(this.model)
      ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
      : {};
  }

  async generateObject<T>(request: {
    system: string;
    prompt: string;
    schema: ZodType<T>;
    maxTokens?: number;
    effort?: Effort;
    timeoutMs?: number;
  }): Promise<T> {
    try {
      const response = await this.client.beta.messages.parse(
        {
          model: this.model,
          max_tokens: request.maxTokens ?? 16000,
          system: request.system,
          messages: [{ role: "user", content: request.prompt }],
          thinking: { type: "adaptive" },
          output_config: {
            effort: request.effort ?? "medium",
            format: betaZodOutputFormat(request.schema),
          },
          ...this.fallbackParams(),
        },
        { timeout: request.timeoutMs ?? 120_000 },
      );
      if (response.stop_reason === "refusal") {
        throw new AIGenerationError("The AI declined this request", "refused");
      }
      if (response.stop_reason === "max_tokens") {
        throw new AIGenerationError("The AI response was cut off", "invalid_output");
      }
      const parsed = response.parsed_output;
      if (parsed === null || parsed === undefined) {
        throw new AIGenerationError("The AI response did not match the expected format", "invalid_output");
      }
      return request.schema.parse(parsed);
    } catch (error) {
      throw mapError(error);
    }
  }

  async generateText(request: {
    system: string;
    messages: ChatTurn[];
    maxTokens?: number;
    effort?: Effort;
    timeoutMs?: number;
  }): Promise<string> {
    try {
      const response = await this.client.beta.messages.create(
        {
          model: this.model,
          max_tokens: request.maxTokens ?? 4000,
          system: request.system,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          thinking: { type: "adaptive" },
          output_config: { effort: request.effort ?? "low" },
          ...this.fallbackParams(),
        },
        { timeout: request.timeoutMs ?? 60_000 },
      );
      if (response.stop_reason === "refusal") {
        throw new AIGenerationError("The AI declined this request", "refused");
      }
      const text = response.content
        .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      if (!text) throw new AIGenerationError("The AI returned an empty answer", "invalid_output");
      return text;
    } catch (error) {
      throw mapError(error);
    }
  }
}
