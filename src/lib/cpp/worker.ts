/**
 * The C++ runner in a Web Worker: the student's program runs here, away from the page, so a program
 * that never ends can be stopped by terminating the worker. Messages in: { id, type: "run", source,
 * stdin, options } or { id, type: "check", source }. Messages out: { id, type: "result", result } or
 * { id, type: "checked", diagnostic }.
 */
import { checkCpp, runCpp, type RunOptions } from "./index";

type In = { id: number; type: "run"; source: string; stdin: string; options?: RunOptions } | { id: number; type: "check"; source: string };

const scope = self as unknown as {
  onmessage: ((event: { data: In }) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = (event) => {
  const message = event.data;
  try {
    if (message.type === "check") {
      scope.postMessage({ id: message.id, type: "checked", diagnostic: checkCpp(message.source) });
    } else {
      scope.postMessage({ id: message.id, type: "result", result: runCpp(message.source, { ...message.options, stdin: message.stdin }) });
    }
  } catch (error) {
    scope.postMessage({ id: message.id, type: "failed", error: String(error) });
  }
};
