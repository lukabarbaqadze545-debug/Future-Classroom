/**
 * Everything that can go wrong with a C++ program run by the site's runner.
 *
 * Errors carry a code and arguments, not only an English sentence, so the
 * interface can say it in the visitor's language. `unsupported` is different
 * from the others on purpose: it means "this is valid C++, but this runner does
 * not run it", and must never be shown as the student's mistake.
 */

export type CppErrorKind =
  /** The program is not valid C++ (a missing semicolon, an unknown name…). */
  | "syntax"
  | "semantic"
  /** Valid C++ that this runner does not implement yet. */
  | "unsupported"
  /** The program started and then did something that is an error (division by zero, index out of range…). */
  | "runtime"
  /** The program used more time, memory or output than allowed. */
  | "limit";

export interface Diagnostic {
  kind: CppErrorKind;
  /** A short stable identifier, e.g. "undeclared", "missing-semicolon", "div-zero". */
  code: string;
  /** English text, used when no translation exists. */
  message: string;
  /** Values the message is about (names, types, numbers). */
  args: Record<string, string | number>;
  line: number;
  col: number;
}

export class CppError extends Error {
  readonly diagnostic: Diagnostic;
  constructor(kind: CppErrorKind, code: string, message: string, line = 0, col = 0, args: Record<string, string | number> = {}) {
    super(message);
    this.diagnostic = { kind, code, message, args, line, col };
  }
}

export const syntaxError = (code: string, message: string, line: number, col: number, args: Record<string, string | number> = {}) => new CppError("syntax", code, message, line, col, args);
export const semanticError = (code: string, message: string, line: number, col: number, args: Record<string, string | number> = {}) => new CppError("semantic", code, message, line, col, args);
export const unsupported = (feature: string, line: number, col: number) => new CppError("unsupported", "unsupported", `The runner does not support ${feature} yet.`, line, col, { feature });
export const runtimeError = (code: string, message: string, line = 0, args: Record<string, string | number> = {}) => new CppError("runtime", code, message, line, 0, args);
export const limitError = (code: string, message: string) => new CppError("limit", code, message, 0, 0);
