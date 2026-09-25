import "server-only";
import type { ProgLanguage } from "./types";

/**
 * Server-side judge abstraction. This server never executes student code
 * itself. A judge is an *external, sandboxed* service that runs code and
 * returns outputs; comparison with expected outputs always happens here.
 *
 * Implemented: Judge0 (open-source, self-hostable) when JUDGE0_URL is set.
 * Without a judge, Python runs in the student's own browser (WebAssembly)
 * and C++ is checked by comparing outputs the student produced locally.
 */
export interface RunResult {
  output: string;
  error?: string;
  timedOut?: boolean;
  compileError?: string;
}

export interface CodeJudge {
  readonly name: string;
  supports(language: ProgLanguage): boolean;
  run(code: string, language: ProgLanguage, inputs: string[], timeLimitMs: number): Promise<RunResult[]>;
}

const b64 = (text: string) => Buffer.from(text, "utf8").toString("base64");
const unb64 = (text: string | null | undefined) => (text ? Buffer.from(text, "base64").toString("utf8") : "");

export class Judge0Judge implements CodeJudge {
  readonly name = "judge0";
  constructor(
    private readonly baseUrl: string,
    private readonly token: string | undefined,
    private readonly languageIds: Record<ProgLanguage, number>,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  supports(language: ProgLanguage): boolean {
    return Boolean(this.languageIds[language]);
  }

  async run(code: string, language: ProgLanguage, inputs: string[], timeLimitMs: number): Promise<RunResult[]> {
    const results: RunResult[] = [];
    for (const input of inputs) {
      const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/submissions?base64_encoded=true&wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(this.token ? { "X-Auth-Token": this.token } : {}) },
        body: JSON.stringify({
          source_code: b64(code),
          language_id: this.languageIds[language],
          stdin: b64(input),
          cpu_time_limit: Math.max(1, timeLimitMs / 1000),
          wall_time_limit: Math.max(2, (timeLimitMs / 1000) * 3),
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Judge responded with ${response.status}`);
      const body = (await response.json()) as {
        stdout?: string | null;
        stderr?: string | null;
        compile_output?: string | null;
        status?: { id: number; description: string };
      };
      const status = body.status?.id ?? 0;
      if (status === 6) {
        // Compilation failed: no point running the other tests.
        const compileError = unb64(body.compile_output).slice(0, 2000) || "Compilation error";
        return inputs.map(() => ({ output: "", compileError }));
      }
      results.push({
        output: unb64(body.stdout),
        timedOut: status === 5,
        error: status >= 7 ? (unb64(body.stderr) || body.status?.description || "Runtime error").slice(0, 2000) : undefined,
      });
    }
    return results;
  }
}

export function getServerJudge(): CodeJudge | null {
  const url = process.env.JUDGE0_URL?.trim();
  if (!url) return null;
  return new Judge0Judge(url, process.env.JUDGE0_TOKEN?.trim() || undefined, {
    python: Number(process.env.JUDGE0_PYTHON_ID || 71),
    cpp: Number(process.env.JUDGE0_CPP_ID || 54),
  });
}
