import { CppError, syntaxError, unsupported } from "./errors";

/**
 * Source text → tokens, with the preprocessor in front: `#include` (checked
 * against the headers the runner has), object-like and function-like `#define`,
 * and `#ifdef/#ifndef/#else/#endif`.
 *
 * Strings and characters are converted to UTF-8 bytes, one JS character per
 * byte, because that is what a C++ `std::string` holds: the Georgian word
 * "გამარჯობა" is 27 bytes there, and `.size()` must say so.
 */

export type TokKind = "id" | "int" | "float" | "char" | "str" | "op" | "eof";

export interface Token {
  k: TokKind;
  /** Identifier or operator text; for literals the source text. */
  s: string;
  line: number;
  col: number;
  /** Integer literal: its value and how it was written. */
  num?: number | bigint;
  /** "int" literal suffix flags; for floats, `f` means float. */
  unsigned?: boolean;
  long?: number;
  isFloat32?: boolean;
  /** Float literal value. */
  fval?: number;
  /** Char literal value, or string literal bytes. */
  cval?: number;
  sval?: string;
  /** The token was preceded by whitespace (needed to tell `f(x)` from a function-like macro use). */
  spaceBefore?: boolean;
}

export const KEYWORDS = new Set([
  "alignas", "alignof", "and", "asm", "auto", "bool", "break", "case", "catch", "char", "class", "const", "constexpr", "const_cast", "continue", "decltype",
  "default", "delete", "do", "double", "dynamic_cast", "else", "enum", "explicit", "export", "extern", "false", "final", "float", "for", "friend", "goto", "if",
  "inline", "int", "long", "mutable", "namespace", "new", "noexcept", "not", "nullptr", "operator", "or", "override", "private", "protected", "public", "register",
  "reinterpret_cast", "return", "short", "signed", "sizeof", "static", "static_assert", "static_cast", "struct", "switch", "template", "this", "thread_local", "throw", "true",
  "try", "typedef", "typeid", "typename", "union", "unsigned", "using", "virtual", "void", "volatile", "while", "xor",
]);

/** Standard headers and what they bring; unknown headers are an error with a clear message. */
export const KNOWN_HEADERS = new Set([
  "iostream", "cstdio", "cstdlib", "cmath", "string", "vector", "algorithm", "numeric", "map", "set", "unordered_map", "unordered_set", "queue", "stack", "deque",
  "utility", "iomanip", "climits", "cstring", "cctype", "functional", "tuple", "array", "bitset", "limits", "cstdint", "cassert", "sstream", "list", "iterator",
  "bits/stdc++.h", "cfloat", "ctime", "memory", "random", "chrono", "fstream", "stdio.h", "stdlib.h", "math.h", "string.h", "ctype.h", "limits.h", "iosfwd", "ios", "istream", "ostream",
  "cinttypes", "complex", "optional", "variant", "any", "stdint.h", "assert.h", "time.h", "forward_list", "valarray", "regex", "thread", "mutex", "atomic",
]);

/** Headers that exist in C++ but whose contents the runner does not provide. */
const UNSUPPORTED_HEADERS = new Set(["fstream", "thread", "mutex", "atomic", "regex", "variant", "any", "valarray", "complex", "chrono", "random", "memory", "optional", "list", "forward_list", "iosfwd"]);

const PUNCT = [
  "<<=", ">>=", "...", "->*", "<=>", "::", "->", "++", "--", "&&", "||", "==", "!=", "<=", ">=", "<<", ">>", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", ".*",
  "+", "-", "*", "/", "%", "&", "|", "^", "~", "!", "=", "<", ">", "?", ":", ";", ",", ".", "(", ")", "[", "]", "{", "}", "#",
];

export function utf8Bytes(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80) out += String.fromCharCode(cp);
    else if (cp < 0x800) out += String.fromCharCode(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) out += String.fromCharCode(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else out += String.fromCharCode(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  return out;
}

/** Bytes (as a binary string) back to text for display; invalid sequences become the replacement character. */
export function fromUtf8Bytes(bytes: string): string {
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i) & 255;
  return new TextDecoder("utf-8").decode(arr);
}

const isIdStart = (c: string) => /[A-Za-z_]/.test(c);
const isIdPart = (c: string) => /[A-Za-z0-9_]/.test(c);
const isDigit = (c: string) => c >= "0" && c <= "9";

const SIMPLE_ESCAPES: Record<string, number> = { n: 10, t: 9, r: 13, "0": 0, a: 7, b: 8, f: 12, v: 11, "\\": 92, "'": 39, '"': 34, "?": 63 };

/** Reads one escape sequence starting after the backslash; returns the byte values and the new index. */
function readEscape(src: string, i: number, line: number, col: number): { bytes: number[]; next: number } {
  const c = src[i];
  if (c === "x") {
    let j = i + 1;
    let v = 0;
    while (j < src.length && /[0-9a-fA-F]/.test(src[j])) v = v * 16 + parseInt(src[j++], 16);
    if (j === i + 1) throw syntaxError("bad-escape", "\\x used with no following hex digits", line, col);
    return { bytes: [v & 255], next: j };
  }
  if (c >= "0" && c <= "7") {
    let j = i;
    let v = 0;
    while (j < src.length && j < i + 3 && src[j] >= "0" && src[j] <= "7") v = v * 8 + (src.charCodeAt(j++) - 48);
    return { bytes: [v & 255], next: j };
  }
  if (c === "u" || c === "U") {
    const n = c === "u" ? 4 : 8;
    const hex = src.slice(i + 1, i + 1 + n);
    if (hex.length !== n || !/^[0-9a-fA-F]+$/.test(hex)) throw syntaxError("bad-escape", "incomplete universal character name", line, col);
    const bytes = [...utf8Bytes(String.fromCodePoint(parseInt(hex, 16)))].map((ch) => ch.charCodeAt(0));
    return { bytes, next: i + 1 + n };
  }
  if (c in SIMPLE_ESCAPES) return { bytes: [SIMPLE_ESCAPES[c]], next: i + 1 };
  throw syntaxError("bad-escape", `unknown escape sequence '\\${c}'`, line, col, { seq: `\\${c}` });
}

/** Tokens of already-preprocessed text. */
export function lex(src: string, baseLine = 1): Token[] {
  const toks: Token[] = [];
  let i = 0;
  let line = baseLine;
  let lineStart = 0;
  let space = false;
  const n = src.length;
  const push = (t: Token) => {
    t.spaceBefore = space;
    space = false;
    toks.push(t);
  };
  while (i < n) {
    const c = src[i];
    if (c === "\n") {
      line++;
      i++;
      lineStart = i;
      space = true;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r" || c === "\f" || c === "\v") {
      i++;
      space = true;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      space = true;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const startLine = line;
      const startCol = i - lineStart + 1;
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") {
          line++;
          lineStart = i + 1;
        }
        i++;
      }
      if (i >= n) throw syntaxError("unterminated-comment", "unterminated /* comment", startLine, startCol);
      i += 2;
      space = true;
      continue;
    }
    const col = i - lineStart + 1;
    if (isIdStart(c)) {
      let j = i + 1;
      while (j < n && isIdPart(src[j])) j++;
      const word = src.slice(i, j);
      // String / char prefixes (u8"…", L'…') are not supported; a raw string prefix is.
      if ((word === "R" || word === "u8R") && src[j] === '"') throw unsupported("raw string literals", line, col);
      push({ k: "id", s: word, line, col });
      i = j;
      continue;
    }
    if (isDigit(c) || (c === "." && isDigit(src[i + 1] ?? ""))) {
      i = lexNumber(src, i, line, col, push);
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let bytes = "";
      while (j < n && src[j] !== '"') {
        if (src[j] === "\n") throw syntaxError("unterminated-string", "missing terminating \" character", line, col);
        if (src[j] === "\\") {
          if (src[j + 1] === "\n") {
            j += 2;
            line++;
            lineStart = j;
            continue;
          }
          const esc = readEscape(src, j + 1, line, col);
          for (const b of esc.bytes) bytes += String.fromCharCode(b);
          j = esc.next;
        } else {
          const cp = src.codePointAt(j)!;
          const ch = String.fromCodePoint(cp);
          bytes += utf8Bytes(ch);
          j += ch.length;
        }
      }
      if (j >= n) throw syntaxError("unterminated-string", "missing terminating \" character", line, col);
      push({ k: "str", s: src.slice(i, j + 1), sval: bytes, line, col });
      i = j + 1;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      const bytes: number[] = [];
      while (j < n && src[j] !== "'") {
        if (src[j] === "\n") throw syntaxError("unterminated-char", "missing terminating ' character", line, col);
        if (src[j] === "\\") {
          const esc = readEscape(src, j + 1, line, col);
          bytes.push(...esc.bytes);
          j = esc.next;
        } else {
          const ch = String.fromCodePoint(src.codePointAt(j)!);
          for (const b of utf8Bytes(ch)) bytes.push(b.charCodeAt(0));
          j += ch.length;
        }
      }
      if (j >= n) throw syntaxError("unterminated-char", "missing terminating ' character", line, col);
      if (bytes.length === 0) throw syntaxError("empty-char", "empty character constant", line, col);
      if (bytes.length > 1) throw syntaxError("multi-char", "a character literal holds one character; use double quotes for text (and note that one Georgian letter takes three bytes)", line, col);
      // `char` is signed: '\xff' is -1.
      push({ k: "char", s: src.slice(i, j + 1), cval: (bytes[0] << 24) >> 24, line, col });
      i = j + 1;
      continue;
    }
    const op = PUNCT.find((p) => src.startsWith(p, i));
    if (!op) {
      const ch = String.fromCodePoint(src.codePointAt(i)!);
      throw syntaxError("bad-character", `stray '${ch}' in the program`, line, col, { ch });
    }
    push({ k: "op", s: op, line, col });
    i += op.length;
  }
  toks.push({ k: "eof", s: "", line, col: i - lineStart + 1 });
  return toks;
}

function lexNumber(src: string, start: number, line: number, col: number, push: (t: Token) => void): number {
  let i = start;
  const n = src.length;
  let isFloat = false;
  let radix = 10;
  let digits = "";
  if (src[i] === "0" && (src[i + 1] === "x" || src[i + 1] === "X")) {
    radix = 16;
    i += 2;
    while (i < n && (/[0-9a-fA-F]/.test(src[i]) || src[i] === "'")) digits += src[i++] === "'" ? "" : src[i - 1];
  } else if (src[i] === "0" && (src[i + 1] === "b" || src[i + 1] === "B")) {
    radix = 2;
    i += 2;
    while (i < n && (/[01]/.test(src[i]) || src[i] === "'")) digits += src[i++] === "'" ? "" : src[i - 1];
  } else {
    while (i < n && (isDigit(src[i]) || src[i] === "'")) digits += src[i++] === "'" ? "" : src[i - 1];
    if (src[i] === "." ) {
      isFloat = true;
      digits += src[i++];
      while (i < n && (isDigit(src[i]) || src[i] === "'")) digits += src[i++] === "'" ? "" : src[i - 1];
    }
    if ((src[i] === "e" || src[i] === "E") && (isDigit(src[i + 1] ?? "") || ((src[i + 1] === "+" || src[i + 1] === "-") && isDigit(src[i + 2] ?? "")))) {
      isFloat = true;
      digits += src[i++];
      if (src[i] === "+" || src[i] === "-") digits += src[i++];
      while (i < n && isDigit(src[i])) digits += src[i++];
    }
    if (!isFloat && digits.length > 1 && digits[0] === "0") radix = 8;
  }
  let suffix = "";
  while (i < n && /[uUlLfF]/.test(src[i])) suffix += src[i++];
  if (i < n && isIdPart(src[i])) throw syntaxError("bad-number", `invalid suffix on the number '${src.slice(start, i + 1)}'`, line, col);
  const text = src.slice(start, i);
  if (isFloat || (radix === 10 && /[fF]/.test(suffix))) {
    const value = Number(digits);
    if (!Number.isFinite(value)) throw syntaxError("bad-number", `invalid number '${text}'`, line, col);
    push({ k: "float", s: text, fval: value, isFloat32: /[fF]/.test(suffix), line, col });
    return i;
  }
  if (digits === "") throw syntaxError("bad-number", `invalid number '${text}'`, line, col);
  let value: bigint;
  try {
    const prefix = radix === 16 ? "0x" : radix === 2 ? "0b" : radix === 8 ? "0o" : "";
    value = BigInt(prefix + (radix === 8 ? digits.slice(1) || "0" : digits));
  } catch {
    throw syntaxError("bad-number", `invalid number '${text}'`, line, col);
  }
  const unsigned = /[uU]/.test(suffix);
  const long = (suffix.match(/[lL]/g) ?? []).length;
  if (value > 0xffffffffffffffffn) throw syntaxError("bad-number", `integer constant '${text}' is too large for any integer type`, line, col);
  push({ k: "int", s: text, num: value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value, unsigned, long, line, col });
  return i;
}

/* ------------------------------ preprocessor ------------------------------ */

interface Macro {
  params: string[] | null;
  body: Token[];
}

export interface Preprocessed {
  tokens: Token[];
  includes: string[];
}

/** Joins lines ending in a backslash, keeping the line count right by leaving empty lines behind. */
function joinContinuations(src: string): string[] {
  const raw = src.split("\n");
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    let text = raw[i];
    let extra = 0;
    while (text.endsWith("\\") && i + 1 < raw.length) {
      text = `${text.slice(0, -1)} ${raw[++i]}`;
      extra++;
    }
    out.push(text);
    for (let k = 0; k < extra; k++) out.push("");
  }
  return out;
}

export function preprocess(source: string): Preprocessed {
  const lines = joinContinuations(source.replace(/\r\n?/g, "\n"));
  const macros = new Map<string, Macro>();
  const includes: string[] = [];
  const out: string[] = [];
  // Stack of conditional states: [active, anyBranchTaken, parentActive].
  const cond: { active: boolean; taken: boolean; parent: boolean }[] = [];
  let inBlockComment = false;
  const active = () => cond.every((c) => c.active);

  for (let ln = 0; ln < lines.length; ln++) {
    const text = lines[ln];
    const lineNo = ln + 1;
    // Block comments may hide a '#' at the start of a line.
    let probe = text;
    if (inBlockComment) {
      const end = probe.indexOf("*/");
      if (end === -1) {
        out.push(text);
        continue;
      }
      probe = " ".repeat(end + 2) + probe.slice(end + 2);
      inBlockComment = false;
    }
    const trimmed = probe.trimStart();
    if (trimmed.startsWith("#")) {
      const m = /^#\s*(\w+)\s*(.*)$/.exec(trimmed);
      const directive = m?.[1] ?? "";
      const rest = (m?.[2] ?? "").replace(/\/\/.*$/, "").trim();
      const col = text.length - trimmed.length + 1;
      switch (directive) {
        case "include": {
          if (!active()) break;
          const h = /^<([^>]+)>$|^"([^"]+)"$/.exec(rest);
          if (!h) throw syntaxError("bad-include", "#include expects <file> or \"file\"", lineNo, col);
          const name = h[1] ?? h[2];
          if (h[2] !== undefined) throw new CppError("unsupported", "include-file", `#include "${name}": the runner has only one file, so there is nothing to include`, lineNo, col, { name });
          if (!KNOWN_HEADERS.has(name)) throw new CppError("syntax", "unknown-header", `<${name}>: no such header`, lineNo, col, { name });
          if (UNSUPPORTED_HEADERS.has(name)) throw unsupported(`<${name}>`, lineNo, col);
          includes.push(name);
          break;
        }
        case "define": {
          if (!active()) break;
          const d = /^([A-Za-z_]\w*)(\(([^)]*)\))?\s*(.*)$/.exec(rest);
          if (!d) throw syntaxError("bad-define", "macro names must be identifiers", lineNo, col);
          const params = d[2] !== undefined && !/^\s/.test(rest.slice(d[1].length)) ? d[3].split(",").map((p) => p.trim()).filter(Boolean) : null;
          const bodyText = params === null && d[2] !== undefined ? `${d[2]} ${d[4]}` : d[4];
          macros.set(d[1], { params, body: lex(bodyText, lineNo).slice(0, -1) });
          break;
        }
        case "undef":
          if (active()) macros.delete(rest);
          break;
        case "ifdef":
        case "ifndef": {
          const defined = macros.has(rest);
          const on = directive === "ifdef" ? defined : !defined;
          const parent = active();
          cond.push({ active: on, taken: on, parent });
          break;
        }
        case "if": {
          const parent = active();
          const value = parent ? evalCondition(rest, macros, lineNo) : false;
          cond.push({ active: value, taken: value, parent });
          break;
        }
        case "elif": {
          const top = cond[cond.length - 1];
          if (!top) throw syntaxError("stray-directive", "#elif without #if", lineNo, col);
          const value = !top.taken && top.parent ? evalCondition(rest, macros, lineNo) : false;
          top.active = value;
          top.taken = top.taken || value;
          break;
        }
        case "else": {
          const top = cond[cond.length - 1];
          if (!top) throw syntaxError("stray-directive", "#else without #if", lineNo, col);
          top.active = !top.taken;
          top.taken = true;
          break;
        }
        case "endif":
          if (!cond.pop()) throw syntaxError("stray-directive", "#endif without #if", lineNo, col);
          break;
        case "pragma":
        case "error":
        case "warning":
        case "line":
        case "":
          if (directive === "error" && active()) throw syntaxError("user-error", `#error ${rest}`, lineNo, col);
          break;
        default:
          throw syntaxError("bad-directive", `invalid preprocessing directive #${directive}`, lineNo, col, { directive });
      }
      out.push("");
      continue;
    }
    if (!active()) {
      out.push("");
      continue;
    }
    // Track whether a /* comment stays open at the end of the line.
    const stripped = stripStringsAndLineComments(text);
    let k = 0;
    while (k < stripped.length) {
      const o = stripped.indexOf("/*", k);
      if (o === -1) break;
      const e = stripped.indexOf("*/", o + 2);
      if (e === -1) {
        inBlockComment = true;
        break;
      }
      k = e + 2;
    }
    out.push(text);
  }
  if (cond.length) throw syntaxError("unterminated-conditional", "unterminated #if", lines.length, 1);
  const tokens = expandMacros(lex(out.join("\n")), macros);
  return { tokens, includes };
}

function stripStringsAndLineComments(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "/" && text[i + 1] === "/") break;
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < text.length && text[i] !== q) {
        if (text[i] === "\\") i++;
        i++;
      }
      out += " ";
      continue;
    }
    out += c;
  }
  return out;
}

/** `#if` conditions: integer literals, `defined(X)`, `!`, `&&`, `||`, and comparisons of numbers; anything else is false. */
function evalCondition(expr: string, macros: Map<string, Macro>, line: number): boolean {
  const replaced = expr.replace(/defined\s*\(?\s*(\w+)\s*\)?/g, (_, name: string) => (macros.has(name) ? "1" : "0")).replace(/\b[A-Za-z_]\w*\b/g, (name) => {
    const m = macros.get(name);
    return m && m.params === null && m.body.length === 1 && m.body[0].k === "int" ? String(m.body[0].num) : "0";
  });
  if (!/^[\s\d()!&|<>=+\-*/%]*$/.test(replaced)) throw syntaxError("bad-condition", "unsupported #if condition", line, 1);
  try {
    return Boolean(Function(`"use strict"; return (${replaced || "0"});`)());
  } catch {
    throw syntaxError("bad-condition", "invalid #if condition", line, 1);
  }
}

const MAX_EXPANSIONS = 20000;

function expandMacros(tokens: Token[], macros: Map<string, Macro>): Token[] {
  if (macros.size === 0) return tokens;
  let budget = MAX_EXPANSIONS;
  const expand = (input: Token[], hide: Set<string>): Token[] => {
    const out: Token[] = [];
    for (let i = 0; i < input.length; i++) {
      const t = input[i];
      if (t.k !== "id" || hide.has(t.s) || !macros.has(t.s)) {
        out.push(t);
        continue;
      }
      const macro = macros.get(t.s)!;
      if (--budget < 0) throw syntaxError("macro-loop", "macro expansion is too deep", t.line, t.col);
      if (macro.params === null) {
        const body = macro.body.map((b) => ({ ...b, line: t.line, col: t.col }));
        if (body[0]) body[0].spaceBefore = t.spaceBefore;
        out.push(...expand(body, new Set([...hide, t.s])));
        continue;
      }
      // A function-like macro is expanded only when followed by '('.
      if (!(input[i + 1]?.k === "op" && input[i + 1].s === "(")) {
        out.push(t);
        continue;
      }
      let depth = 0;
      let j = i + 1;
      const args: Token[][] = [[]];
      for (; j < input.length; j++) {
        const a = input[j];
        if (a.k === "op" && a.s === "(") {
          if (depth++ > 0) args[args.length - 1].push(a);
        } else if (a.k === "op" && a.s === ")") {
          if (--depth === 0) break;
          args[args.length - 1].push(a);
        } else if (a.k === "op" && a.s === "," && depth === 1) args.push([]);
        else args[args.length - 1].push(a);
      }
      if (j >= input.length) throw syntaxError("macro-args", `unterminated argument list invoking macro '${t.s}'`, t.line, t.col, { name: t.s });
      if (args.length === 1 && args[0].length === 0 && macro.params.length === 0) args.pop();
      if (args.length !== macro.params.length) throw syntaxError("macro-args", `macro '${t.s}' passed ${args.length} arguments, but takes ${macro.params.length}`, t.line, t.col, { name: t.s });
      const expandedArgs = args.map((a) => expand(a, hide));
      const body: Token[] = [];
      for (const b of macro.body) {
        const p = b.k === "id" ? macro.params.indexOf(b.s) : -1;
        if (p >= 0) body.push(...expandedArgs[p].map((x) => ({ ...x })));
        else body.push({ ...b, line: t.line, col: t.col });
      }
      out.push(...expand(body, new Set([...hide, t.s])));
      i = j;
    }
    return out;
  };
  const expanded = expand(tokens.slice(0, -1), new Set());
  expanded.push(tokens[tokens.length - 1]);
  return expanded;
}
