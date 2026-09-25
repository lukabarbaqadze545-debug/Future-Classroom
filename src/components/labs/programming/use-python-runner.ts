"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface BrowserRunResult {
  output: string;
  error?: string;
  timedOut?: boolean;
  /** Not run because an earlier test ran out of time. */
  skipped?: boolean;
}

type Status = "idle" | "loading" | "ready" | "running" | "failed";

/**
 * Runs Python in a Web Worker (Pyodide/WebAssembly) in the student's own
 * browser. Each test gets a time limit; a stuck program is stopped by
 * terminating the worker, which is then recreated.
 */
export function usePythonRunner() {
  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef<Promise<void> | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const seq = useRef(0);

  const spawn = useCallback(() => {
    workerRef.current?.terminate();
    const worker = new Worker("/workers/python-runner.js", { type: "module" });
    workerRef.current = worker;
    readyRef.current = new Promise<void>((resolve, reject) => {
      const id = ++seq.current;
      const onMessage = (event: MessageEvent) => {
        if (event.data.id !== id) return;
        worker.removeEventListener("message", onMessage);
        if (event.data.type === "ready") resolve();
        else reject(new Error(event.data.error ?? "Python failed to start"));
      };
      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", () => reject(new Error("Python worker failed")), { once: true });
      worker.postMessage({ id, type: "init" });
    });
    return readyRef.current;
  }, []);

  const prepare = useCallback(async () => {
    if (readyRef.current) return readyRef.current;
    setStatus("loading");
    try {
      await spawn();
      setStatus("ready");
    } catch {
      readyRef.current = null;
      setStatus("failed");
      throw new Error("python_unavailable");
    }
  }, [spawn]);

  const runOne = useCallback((code: string, input: string, timeLimitMs: number): Promise<BrowserRunResult> => {
    const worker = workerRef.current!;
    const id = ++seq.current;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        worker.removeEventListener("message", onMessage);
        // Stop the runaway program; a fresh worker is prepared for the next run.
        readyRef.current = null;
        worker.terminate();
        workerRef.current = null;
        resolve({ output: "", timedOut: true });
      }, timeLimitMs);
      const onMessage = (event: MessageEvent) => {
        if (event.data.id !== id) return;
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        if (event.data.type === "result") resolve({ output: event.data.output, error: event.data.error });
        else resolve({ output: "", error: event.data.error ?? "Error" });
      };
      worker.addEventListener("message", onMessage);
      worker.postMessage({ id, type: "run", code, input });
    });
  }, []);

  /** Runs the code once per input, in order. Stops early after a timeout. */
  const run = useCallback(
    async (code: string, inputs: string[], timeLimitMs: number, onProgress?: (done: number) => void): Promise<BrowserRunResult[]> => {
      await prepare();
      setStatus("running");
      const results: BrowserRunResult[] = [];
      try {
        for (let i = 0; i < inputs.length; i++) {
          if (!workerRef.current) await prepare();
          onProgress?.(i);
          const result = await runOne(code, inputs[i], timeLimitMs);
          results.push(result);
          if (result.timedOut) {
            // The remaining tests are reported as not run.
            for (let j = i + 1; j < inputs.length; j++) results.push({ output: "", skipped: true });
            break;
          }
        }
      } finally {
        setStatus(workerRef.current ? "ready" : "idle");
      }
      return results;
    },
    [prepare, runOne],
  );

  useEffect(() => () => workerRef.current?.terminate(), []);

  return { status, prepare, run };
}
