/**
 * A small, safe math expression evaluator used to draw function plots in
 * lessons (e.g. "x^2 - 5x + 6"). No eval / Function constructor: expressions
 * are tokenised and parsed with a recursive-descent parser.
 *
 * Supported: numbers, x, + - * / ^, parentheses, implicit multiplication
 * ("5x", "2(x+1)"), constants pi and e, and sin cos tan sqrt abs log ln exp.
 */

type Token =
  | { kind: "num"; value: number }
  | { kind: "var" }
  | { kind: "op"; value: "+" | "-" | "*" | "/" | "^" }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "fn"; name: FnName }
  | { kind: "const"; value: number };

const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log10,
  ln: Math.log,
  exp: Math.exp,
} as const;
type FnName = keyof typeof FUNCTIONS;

type Node =
  | { type: "num"; value: number }
  | { type: "var" }
  | { type: "neg"; arg: Node }
  | { type: "bin"; op: "+" | "-" | "*" | "/" | "^"; left: Node; right: Node }
  | { type: "call"; fn: FnName; arg: Node };

export class ExpressionError extends Error {}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const input = source.replace(/\s+/g, "").replace(/[−–]/g, "-").replace(/[·×]/g, "*").replace(/²/g, "^2").replace(/³/g, "^3");
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const value = Number(input.slice(i, j));
      if (!Number.isFinite(value)) throw new ExpressionError(`Invalid number near "${input.slice(i, j)}"`);
      tokens.push({ kind: "num", value });
      i = j;
      continue;
    }
    if (/[a-z]/i.test(ch)) {
      let j = i;
      while (j < input.length && /[a-z]/i.test(input[j])) j++;
      const word = input.slice(i, j).toLowerCase();
      if (word in FUNCTIONS) {
        tokens.push({ kind: "fn", name: word as FnName });
      } else if (word === "pi") {
        tokens.push({ kind: "const", value: Math.PI });
      } else if (word === "e") {
        tokens.push({ kind: "const", value: Math.E });
      } else if (/^x+$/.test(word)) {
        for (let k = 0; k < word.length; k++) tokens.push({ kind: "var" });
      } else {
        throw new ExpressionError(`Unknown name "${word}"`);
      }
      i = j;
      continue;
    }
    if ("+-*/^".includes(ch)) {
      tokens.push({ kind: "op", value: ch as "+" | "-" | "*" | "/" | "^" });
    } else if (ch === "(") {
      tokens.push({ kind: "lparen" });
    } else if (ch === ")") {
      tokens.push({ kind: "rparen" });
    } else {
      throw new ExpressionError(`Unexpected character "${ch}"`);
    }
    i++;
  }
  // Insert implicit multiplication: "5x", "2(", ")(", "x(", ")x", "2sin".
  const withImplicit: Token[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const prev = withImplicit[withImplicit.length - 1];
    const cur = tokens[k];
    const prevEndsValue = prev && (prev.kind === "num" || prev.kind === "var" || prev.kind === "rparen" || prev.kind === "const");
    const curStartsValue = cur.kind === "num" || cur.kind === "var" || cur.kind === "lparen" || cur.kind === "fn" || cur.kind === "const";
    if (prevEndsValue && curStartsValue) withImplicit.push({ kind: "op", value: "*" });
    withImplicit.push(cur);
  }
  return withImplicit;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    if (this.tokens.length === 0) throw new ExpressionError("Empty expression");
    const node = this.parseSum();
    if (this.pos < this.tokens.length) throw new ExpressionError("Unexpected input at end of expression");
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private parseSum(): Node {
    let node = this.parseProduct();
    for (let t = this.peek(); t && t.kind === "op" && (t.value === "+" || t.value === "-"); t = this.peek()) {
      this.pos++;
      node = { type: "bin", op: t.value, left: node, right: this.parseProduct() };
    }
    return node;
  }

  private parseProduct(): Node {
    let node = this.parseUnary();
    for (let t = this.peek(); t && t.kind === "op" && (t.value === "*" || t.value === "/"); t = this.peek()) {
      this.pos++;
      node = { type: "bin", op: t.value, left: node, right: this.parseUnary() };
    }
    return node;
  }

  private parseUnary(): Node {
    const t = this.peek();
    if (t && t.kind === "op" && (t.value === "-" || t.value === "+")) {
      this.pos++;
      const arg = this.parseUnary();
      return t.value === "-" ? { type: "neg", arg } : arg;
    }
    return this.parsePower();
  }

  private parsePower(): Node {
    const base = this.parseAtom();
    const t = this.peek();
    if (t && t.kind === "op" && t.value === "^") {
      this.pos++;
      // Right-associative, and binds tighter than unary minus on the left.
      return { type: "bin", op: "^", left: base, right: this.parseUnary() };
    }
    return base;
  }

  private parseAtom(): Node {
    const t = this.peek();
    if (!t) throw new ExpressionError("Unexpected end of expression");
    this.pos++;
    switch (t.kind) {
      case "num":
        return { type: "num", value: t.value };
      case "const":
        return { type: "num", value: t.value };
      case "var":
        return { type: "var" };
      case "lparen": {
        const inner = this.parseSum();
        if (this.peek()?.kind !== "rparen") throw new ExpressionError("Missing closing parenthesis");
        this.pos++;
        return inner;
      }
      case "fn": {
        const next = this.peek();
        if (next?.kind === "lparen") {
          this.pos++;
          const arg = this.parseSum();
          if (this.peek()?.kind !== "rparen") throw new ExpressionError("Missing closing parenthesis");
          this.pos++;
          return { type: "call", fn: t.name, arg };
        }
        return { type: "call", fn: t.name, arg: this.parsePower() };
      }
      default:
        throw new ExpressionError("Unexpected token");
    }
  }
}

function evaluate(node: Node, x: number): number {
  switch (node.type) {
    case "num":
      return node.value;
    case "var":
      return x;
    case "neg":
      return -evaluate(node.arg, x);
    case "call":
      return FUNCTIONS[node.fn](evaluate(node.arg, x));
    case "bin": {
      const a = evaluate(node.left, x);
      const b = evaluate(node.right, x);
      switch (node.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "^":
          return a ** b;
      }
    }
  }
}

/** Compiles an expression into a function of x. Throws ExpressionError. */
export function compileExpression(source: string): (x: number) => number {
  if (source.length > 200) throw new ExpressionError("Expression is too long");
  const ast = new Parser(tokenize(source)).parse();
  return (x: number) => evaluate(ast, x);
}

export function sampleFunction(
  source: string,
  xMin: number,
  xMax: number,
  samples = 200,
): { x: number; y: number | null }[] {
  const fn = compileExpression(source);
  const points: { x: number; y: number | null }[] = [];
  const step = (xMax - xMin) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = xMin + step * i;
    const y = fn(x);
    points.push({ x, y: Number.isFinite(y) ? y : null });
  }
  return points;
}
