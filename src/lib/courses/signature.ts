import { createHash } from "node:crypto";
import type { Block, Exercise } from "./types";

/** A fingerprint of what the generated outputs of an exercise were made from. */
export function exerciseSig(e: Pick<Exercise, "solution" | "samples" | "tests">): string {
  return createHash("sha256").update(JSON.stringify([e.solution, e.samples, e.tests])).digest("hex").slice(0, 16);
}

/** The same for a runnable example or a "what does it print?" program. */
export function blockSig(b: Extract<Block, { k: "code" | "predict" }>): string {
  return createHash("sha256").update(JSON.stringify([b.code, b.stdin ?? ""])).digest("hex").slice(0, 16);
}
