"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Diagnostic, RunOptions, RunResult } from "@/lib/cpp";

export type CppRun = { kind: "done"; result: RunResult } | { kind: "timeout" } | { kind: "failed" };

type Status = "idle" | "ready" | "failed";

/** Longest a program may run in the browser before the worker is stopped. */
const WALL_MS = 12_000;

/**
 * Runs C++ in a Web Worker in the visitor's own browser (the site's runner is plain JavaScript).
 * A program that runs too long is stopped by terminating the worker, and a new one is made for the
 * next run.
 */
export function useCppRunner() {
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);
  const [status, setStatus] = useState<Status>("idle");

  const spawn = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;
    try {
      const worker = new Worker(new URL("../../lib/cpp/worker.ts", import.meta.url));
      workerRef.current = worker;
      setStatus("ready");
      return worker;
    } catch {
      setStatus("failed");
      return null;
    }
  }, []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  const call = useCallback(
    <T,>(message: Record<string, unknown>, wantType: string, pick: (data: Record<string, unknown>) => T, wallMs = WALL_MS): Promise<T | "timeout" | "failed"> => {
      const worker = spawn();
      if (!worker) return Promise.resolve("failed");
      const id = ++seq.current;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          worker.removeEventListener("message", onMessage);
          worker.terminate();
          workerRef.current = null;
          resolve("timeout");
        }, wallMs);
        const onMessage = (event: MessageEvent) => {
          if (event.data?.id !== id) return;
          clearTimeout(timer);
          worker.removeEventListener("message", onMessage);
          resolve(event.data.type === wantType ? pick(event.data) : "failed");
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener(
          "error",
          () => {
            clearTimeout(timer);
            worker.removeEventListener("message", onMessage);
            workerRef.current = null;
            setStatus("failed");
            resolve("failed");
          },
          { once: true },
        );
        worker.postMessage({ ...message, id });
      });
    },
    [spawn],
  );

  const run = useCallback(
    async (source: string, stdin: string, options?: RunOptions): Promise<CppRun> => {
      const r = await call<RunResult>({ type: "run", source, stdin, options: { stepLimit: 150_000_000, ...options } }, "result", (d) => d.result as RunResult);
      if (r === "timeout") return { kind: "timeout" };
      if (r === "failed") return { kind: "failed" };
      return { kind: "done", result: r };
    },
    [call],
  );

  const check = useCallback(
    async (source: string): Promise<Diagnostic | null | "failed"> => {
      const r = await call<Diagnostic | null>({ type: "check", source }, "checked", (d) => (d.diagnostic ?? null) as Diagnostic | null, 5000);
      return r === "timeout" || r === "failed" ? "failed" : r;
    },
    [call],
  );

  return { run, check, status };
}
