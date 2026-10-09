import { CppError, syntaxError, unsupported } from "./errors";
import { KEYWORDS, preprocess, type Token } from "./lexer";
import { GLOBAL_TYPES, STD_FUNCTION_TEMPLATES, STD_PLAIN_TYPES, STD_TEMPLATES } from "./stdnames";
import type { AliasDecl, ClassDecl, Declarator, EnumDecl, Expr, FieldDecl, FuncDecl, Initializer, Loc, Param, Program, Stmt, SwitchCase, TopDecl, TypeSpec } from "./ast";

/**
 * Tokens → syntax tree.
 *
 * C++ cannot be parsed without knowing which names are types (`a * b;` is a
 * declaration if `a` is a type and a multiplication if it is not), so the
 * parser keeps the set of type names it has seen so far, exactly as a
 * compiler does. Where it has to guess, it tries one reading and goes back to
 * try the other.
 */

const BUILTIN_WORDS = new Set(["signed", "unsigned", "short", "long", "int", "char", "bool", "float", "double", "void"]);
const ASSIGN_OPS = new Set(["=", "+=", "-=", "*=", "/=", "%=", "<<=", ">>=", "&=", "|=", "^="]);
const ALT_OPS: Record<string, string> = { and: "&&", or: "||", not: "!", xor: "^" };

/** Binary operators by precedence (higher binds tighter). */
const PREC: Record<string, number> = {
  "||": 1, "&&": 2, "|": 3, "^": 4, "&": 5, "==": 6, "!=": 6, "<": 7, ">": 7, "<=": 7, ">=": 7, "<<": 8, ">>": 8, "+": 9, "-": 9, "*": 10, "/": 10, "%": 10,
};

type Access = "public" | "private" | "protected";

export function parseProgram(source: string): Program {
  const { tokens, includes } = preprocess(source);
  return new Parser(tokens, includes).program();
}

class Parser {
  private p = 0;
  private userTypes = new Set<string>();
  private userTemplates = new Set<string>();
  private funcTemplates = new Set<string>();
  /** Template parameter names currently in scope; they are types. */
  private tparams: string[][] = [];
  private usingStd = false;
  private usingNames = new Set<string>();
  /** Depth of template argument lists being parsed: `>` closes them instead of comparing. */
  private noGt = 0;
  private currentClass: string | null = null;
  /** Tokens that were split (`>>` → `>`) while looking ahead, to put back when the look-ahead is abandoned. */
  private undo: { at: number; tok: Token }[] = [];

  constructor(
    private toks: Token[],
    private includes: string[],
  ) {}

  /* ------------------------------ token helpers ------------------------------ */

  private peek(n = 0): Token {
    return this.toks[Math.min(this.p + n, this.toks.length - 1)];
  }
  private next(): Token {
    const t = this.toks[this.p];
    if (this.p < this.toks.length - 1) this.p++;
    return t;
  }
  private isOp(s: string, n = 0): boolean {
    const t = this.peek(n);
    return t.k === "op" && t.s === s;
  }
  private isWord(s: string, n = 0): boolean {
    const t = this.peek(n);
    return t.k === "id" && t.s === s;
  }
  private accept(s: string): boolean {
    if (this.isOp(s)) {
      this.next();
      return true;
    }
    return false;
  }
  private acceptWord(s: string): boolean {
    if (this.isWord(s)) {
      this.next();
      return true;
    }
    return false;
  }
  private loc(t: Token = this.peek()): Loc {
    return { line: t.line, col: t.col };
  }
  private describe(t: Token): string {
    return t.k === "eof" ? "end of file" : t.k === "str" ? "a string" : `'${t.s}'`;
  }
  /** Where the previous token ends: a missing `;` is reported there, not at the next statement. */
  private afterPrev(): Loc {
    const prev = this.toks[Math.max(0, this.p - 1)];
    return { line: prev.line, col: prev.col + Math.max(1, prev.s.length) };
  }

  private expectOp(s: string): Token {
    if (this.isOp(s)) return this.next();
    const t = this.peek();
    if (s === ";") {
      const at = this.afterPrev();
      throw syntaxError("missing-semicolon", "expected ';'", at.line, at.col, { found: this.describe(t) });
    }
    throw syntaxError("expected", `expected '${s}' but found ${this.describe(t)}`, t.line, t.col, { expected: s, found: this.describe(t) });
  }
  private expectWord(s: string): Token {
    if (this.isWord(s)) return this.next();
    const t = this.peek();
    throw syntaxError("expected", `expected '${s}' but found ${this.describe(t)}`, t.line, t.col, { expected: s, found: this.describe(t) });
  }
  private expectIdent(what = "a name"): Token {
    const t = this.peek();
    if (t.k === "id" && !KEYWORDS.has(t.s)) return this.next();
    throw syntaxError("expected-name", `expected ${what} but found ${this.describe(t)}`, t.line, t.col, { found: this.describe(t) });
  }

  private rewind(mark: number): void {
    while (this.undo.length > mark) {
      const u = this.undo.pop()!;
      this.toks[u.at] = u.tok;
    }
  }

  private tryParse<T>(f: () => T): T | null {
    const save = this.p;
    const saveGt = this.noGt;
    const mark = this.undo.length;
    try {
      return f();
    } catch (e) {
      if (!(e instanceof CppError)) throw e;
      this.p = save;
      this.noGt = saveGt;
      this.rewind(mark);
      return null;
    }
  }

  /* --------------------------------- names ----------------------------------- */

  private isTypeParam(name: string): boolean {
    return this.tparams.some((l) => l.includes(name));
  }

  /** Whether a plain identifier names a type here (user types, template parameters, global typedefs and the standard types). */
  private isTypeName(name: string): boolean {
    return this.userTypes.has(name) || this.isTypeParam(name) || STD_PLAIN_TYPES.has(name) || GLOBAL_TYPES.has(name);
  }
  private isTemplateName(name: string): boolean {
    return STD_TEMPLATES.has(name) || this.userTemplates.has(name);
  }

  /* ---------------------------------- program -------------------------------- */

  program(): Program {
    const decls: TopDecl[] = [];
    while (this.peek().k !== "eof") {
      if (this.accept(";")) continue;
      this.topDecl(decls);
    }
    return { decls, includes: this.includes, usingStd: this.usingStd };
  }

  private topDecl(out: TopDecl[]): void {
    const t = this.peek();
    if (this.isWord("using")) return void this.usingDecl(out);
    if (this.isWord("typedef")) return void this.typedefDecl(out);
    if (this.isWord("namespace")) throw unsupported("namespaces", t.line, t.col);
    if (this.isWord("extern") && this.peek(1).k === "str") throw unsupported("extern \"C\"", t.line, t.col);
    if (this.isWord("static_assert")) {
      this.next();
      this.expectOp("(");
      this.parseAssignment();
      if (this.accept(",")) this.next();
      this.expectOp(")");
      this.expectOp(";");
      return;
    }
    let tparams: string[] = [];
    if (this.isWord("template")) tparams = this.templateHeader();
    if (tparams.length) this.tparams.push(tparams);
    try {
      if ((this.isWord("struct") || this.isWord("class") || this.isWord("union")) && this.isClassDefinition()) {
        out.push(this.classDecl(tparams));
        // `struct P { … } a, b;` declares variables as well.
        if (!this.isOp(";")) throw unsupported("declaring variables together with a struct definition", this.peek().line, this.peek().col);
        this.expectOp(";");
        return;
      }
      if (this.isWord("enum")) {
        out.push(this.enumDecl());
        this.expectOp(";");
        return;
      }
      if (this.isWord("struct") || this.isWord("class")) {
        // forward declaration: `struct Node;`
        if (this.peek(1).k === "id" && this.isOp(";", 2)) {
          this.userTypes.add(this.peek(1).s);
          this.p += 3;
          return;
        }
      }
      this.functionOrGlobal(out, tparams);
    } finally {
      if (tparams.length) this.tparams.pop();
    }
  }

  private templateHeader(): string[] {
    this.expectWord("template");
    this.expectOp("<");
    const names: string[] = [];
    if (!this.isOp(">")) {
      do {
        if (this.isWord("typename") || this.isWord("class")) {
          this.next();
          if (this.accept("...")) throw unsupported("variadic templates", this.peek().line, this.peek().col);
          names.push(this.expectIdent("a template parameter name").s);
          if (this.accept("=")) this.parseType();
        } else {
          const t = this.peek();
          throw unsupported("template parameters that are not types", t.line, t.col);
        }
      } while (this.accept(","));
    }
    this.expectOp(">");
    return names;
  }

  private usingDecl(out: TopDecl[]): void {
    const at = this.loc();
    this.expectWord("using");
    if (this.acceptWord("namespace")) {
      const name = this.expectIdent().s;
      if (name !== "std") throw unsupported(`using namespace ${name}`, at.line, at.col);
      this.usingStd = true;
      this.expectOp(";");
      return;
    }
    // using X = type;   or   using std::vector;
    if (this.peek(1).k === "op" && this.peek(1).s === "=") {
      const name = this.expectIdent().s;
      this.expectOp("=");
      const type = this.parseType();
      this.expectOp(";");
      this.userTypes.add(name);
      out.push({ k: "alias", name, type, ...at } as AliasDecl);
      return;
    }
    const q = this.qualifiedName();
    this.expectOp(";");
    const m = /^std::(\w+)$/.exec(q);
    if (!m) throw unsupported(`using ${q}`, at.line, at.col);
    this.usingNames.add(m[1]);
  }

  private typedefDecl(out: TopDecl[]): void {
    const at = this.loc();
    this.expectWord("typedef");
    const base = this.parseTypeSpecifier();
    do {
      const type = this.pointerRef(base);
      const name = this.expectIdent().s;
      const dims = this.arrayDims();
      if (dims.length) throw unsupported("typedef of array types", at.line, at.col);
      this.userTypes.add(name);
      out.push({ k: "alias", name, type, ...at } as AliasDecl);
    } while (this.accept(","));
    this.expectOp(";");
  }

  private isClassDefinition(): boolean {
    // struct Name [: bases] {   or   struct {
    let n = 1;
    if (this.peek(n).k === "id" && !KEYWORDS.has(this.peek(n).s)) n++;
    if (this.isOp("<", n)) return true; // specialisations are rejected later
    if (this.isOp(":", n)) return true;
    return this.isOp("{", n);
  }

  /* ---------------------------- classes and enums ---------------------------- */

  private classDecl(tparams: string[]): ClassDecl {
    const at = this.loc();
    const isStruct = this.next().s !== "class";
    if (this.peek().s === "union") throw unsupported("unions", at.line, at.col);
    const name = this.expectIdent("a class name").s;
    this.userTypes.add(name);
    if (tparams.length) this.userTemplates.add(name);
    const bases: { name: string; access: string }[] = [];
    if (this.accept(":")) {
      do {
        let access = isStruct ? "public" : "private";
        for (;;) {
          if (this.isWord("public") || this.isWord("private") || this.isWord("protected")) access = this.next().s;
          else if (this.isWord("virtual")) throw unsupported("virtual inheritance", this.peek().line, this.peek().col);
          else break;
        }
        bases.push({ name: this.qualifiedName(), access });
      } while (this.accept(","));
    }
    this.expectOp("{");
    const cls: ClassDecl = { k: "class", name, isStruct, tparams, bases, fields: [], methods: [], ...at };
    const saveClass = this.currentClass;
    this.currentClass = name;
    let access: Access = isStruct ? "public" : "private";
    while (!this.isOp("}")) {
      if (this.peek().k === "eof") throw syntaxError("expected", `expected '}' to close ${name}`, this.peek().line, this.peek().col, { expected: "}" });
      if ((this.isWord("public") || this.isWord("private") || this.isWord("protected")) && this.isOp(":", 1)) {
        access = this.next().s as Access;
        this.next();
        continue;
      }
      if (this.accept(";")) continue;
      this.classMember(cls, access);
    }
    this.expectOp("}");
    this.currentClass = saveClass;
    return cls;
  }

  private classMember(cls: ClassDecl, access: Access): void {
    const at = this.loc();
    if (this.isWord("using")) {
      const out: TopDecl[] = [];
      this.usingDecl(out);
      return;
    }
    if (this.isWord("typedef")) {
      this.typedefDecl([]);
      return;
    }
    if (this.isWord("friend")) throw unsupported("friend declarations", at.line, at.col);
    if (this.isWord("template")) throw unsupported("member templates", at.line, at.col);
    if (this.isWord("struct") || this.isWord("class") || this.isWord("enum")) {
      const t = this.peek();
      if (this.isWord("enum")) {
        this.enumDecl();
        this.expectOp(";");
        return;
      }
      throw unsupported("classes defined inside classes", t.line, t.col);
    }
    let isStatic = false;
    let isVirtual = false;
    let isConstexpr = false;
    for (;;) {
      if (this.acceptWord("static")) isStatic = true;
      else if (this.acceptWord("virtual")) isVirtual = true;
      else if (this.acceptWord("inline") || this.acceptWord("explicit") || this.acceptWord("mutable")) continue;
      else if (this.acceptWord("constexpr")) isConstexpr = true;
      else break;
    }
    void isConstexpr;
    // Destructor
    if (this.isOp("~")) {
      this.next();
      const name = this.expectIdent().s;
      if (name !== cls.name) throw syntaxError("bad-destructor", `expected the class name after '~'`, at.line, at.col);
      cls.methods.push(this.functionRest({ name: `~${name}`, ret: this.namedType("void", at), tparams: [], cls: cls.name, isStatic, isVirtual, access, at, isCtor: false, isDtor: true }));
      return;
    }
    // Constructor: Name(
    if (this.peek().k === "id" && this.peek().s === cls.name && this.isOp("(", 1)) {
      this.next();
      cls.methods.push(this.functionRest({ name: cls.name, ret: this.namedType("void", at), tparams: [], cls: cls.name, isStatic, isVirtual, access, at, isCtor: true, isDtor: false }));
      return;
    }
    const base = this.parseTypeSpecifier();
    for (;;) {
      const type = this.pointerRef(base);
      const nameTok = this.peek();
      let name: string;
      if (this.isWord("operator")) name = this.operatorName();
      else name = this.expectIdent("a member name").s;
      if (this.isOp("(")) {
        cls.methods.push(this.functionRest({ name, ret: type, tparams: [], cls: cls.name, isStatic, isVirtual, access, at: this.loc(nameTok), isCtor: false, isDtor: false }));
        return;
      }
      const dims = this.arrayDims();
      let init: Initializer | null = null;
      if (this.isOp("=")) {
        this.next();
        init = { k: "assign", expr: this.parseAssignment() };
      } else if (this.isOp("{")) {
        init = { k: "brace", args: this.braceList() };
      }
      const field: FieldDecl = { name, type, dims, init, isStatic, access, ...this.loc(nameTok) };
      cls.fields.push(field);
      if (!this.accept(",")) break;
    }
    this.expectOp(";");
  }

  private enumDecl(): EnumDecl {
    const at = this.loc();
    this.expectWord("enum");
    const scoped = this.acceptWord("class") || this.acceptWord("struct");
    let name: string | null = null;
    if (this.peek().k === "id" && !KEYWORDS.has(this.peek().s)) name = this.next().s;
    if (this.accept(":")) this.parseType();
    if (name) this.userTypes.add(name);
    const items: { name: string; value: Expr | null }[] = [];
    if (this.accept("{")) {
      while (!this.isOp("}")) {
        const n = this.expectIdent("an enumerator name").s;
        const value = this.accept("=") ? this.parseConditional() : null;
        items.push({ name: n, value });
        if (!this.accept(",")) break;
      }
      this.expectOp("}");
    }
    return { k: "enum", name, scoped, items, ...at };
  }

  /* ------------------------ functions and global variables -------------------- */

  private operatorName(): string {
    this.expectWord("operator");
    const t = this.next();
    if (t.k === "op") {
      if (t.s === "(" && this.isOp(")")) {
        this.next();
        return "operator()";
      }
      if (t.s === "[" && this.isOp("]")) {
        this.next();
        return "operator[]";
      }
      if ((t.s === "+" || t.s === "-") && this.peek().s === t.s && this.peek().k === "op") {
        // operator++ written as two tokens is not produced by the lexer; kept for safety
      }
      return `operator${t.s}`;
    }
    if (t.k === "id" && (t.s === "new" || t.s === "delete")) throw unsupported(`operator ${t.s}`, t.line, t.col);
    throw unsupported("conversion operators", t.line, t.col);
  }

  private functionOrGlobal(out: TopDecl[], tparams: string[]): void {
    const at = this.loc();
    let isStatic = false;
    let isConstexpr = false;
    for (;;) {
      if (this.acceptWord("static")) isStatic = true;
      else if (this.acceptWord("inline") || this.acceptWord("extern") || this.acceptWord("volatile")) continue;
      else if (this.acceptWord("constexpr")) isConstexpr = true;
      else break;
    }
    if (this.peek().k !== "id") throw syntaxError("expected-declaration", `expected a declaration but found ${this.describe(this.peek())}`, at.line, at.col, { found: this.describe(this.peek()) });
    const base = this.parseTypeSpecifier();
    const first = this.pointerRef(base);
    const nameTok = this.peek();
    // Destructor or constructor defined outside the class: Name::Name(...)
    let name: string;
    let cls: string | null = null;
    if (this.isWord("operator")) name = this.operatorName();
    else {
      name = this.expectIdent("a name").s;
      while (this.isOp("::")) {
        this.next();
        cls = cls ? `${cls}::${name}` : name;
        if (this.isWord("operator")) name = this.operatorName();
        else if (this.isOp("~")) {
          this.next();
          name = `~${this.expectIdent().s}`;
        } else name = this.expectIdent().s;
      }
    }
    if (this.isOp("(") && this.looksLikeFunction()) {
      if (tparams.length) this.funcTemplates.add(name);
      out.push(
        this.functionRest({
          name,
          ret: first,
          tparams,
          cls,
          isStatic,
          isVirtual: false,
          access: "public",
          at: this.loc(nameTok),
          isCtor: cls !== null && name === cls.split("::").pop(),
          isDtor: name.startsWith("~"),
        }),
      );
      return;
    }
    if (tparams.length) throw unsupported("templates other than functions and classes", at.line, at.col);
    // Global variable(s)
    const decls: Declarator[] = [];
    let type = first;
    let n = name;
    let nTok = nameTok;
    for (;;) {
      const dims = this.arrayDims();
      const init = this.initializerOpt();
      decls.push({ name: n, type, dims, init, loc: this.loc(nTok) });
      if (!this.accept(",")) break;
      type = this.pointerRef(base);
      nTok = this.peek();
      n = this.expectIdent("a variable name").s;
    }
    this.expectOp(";");
    out.push({ k: "global", stmt: { k: "decl", type: base, decls, storage: isStatic ? "static" : "", constexpr: isConstexpr, ...at }, ...at });
  }

  /** After `type name (`: a parameter list (or nothing) means a function; an expression means a variable with an initialiser. */
  private looksLikeFunction(): boolean {
    const save = this.p;
    try {
      this.next(); // (
      if (this.isOp(")")) return true;
      if (this.isWord("void") && this.isOp(")", 1)) return true;
      if (this.isWord("const") || this.isWord("unsigned") || this.isWord("signed")) return true;
      const t = this.peek();
      if (t.k !== "id") return false;
      return this.tryParse(() => this.pointerRef(this.parseTypeSpecifier(true))) !== null;
    } finally {
      this.p = save;
    }
  }

  private functionRest(h: {
    name: string;
    ret: TypeSpec;
    tparams: string[];
    cls: string | null;
    isStatic: boolean;
    isVirtual: boolean;
    access: Access;
    at: Loc;
    isCtor: boolean;
    isDtor: boolean;
  }): FuncDecl {
    this.expectOp("(");
    const params = this.parseParams();
    this.expectOp(")");
    let isConst = false;
    let defaulted = false;
    let deleted = false;
    let pure = false;
    let isOverride = false;
    for (;;) {
      if (this.acceptWord("const")) isConst = true;
      else if (this.acceptWord("override")) isOverride = true;
      else if (this.acceptWord("noexcept") || this.acceptWord("final")) continue;
      else break;
    }
    if (this.accept("->")) h.ret = this.parseType();
    const inits: FuncDecl["inits"] = [];
    if (h.isCtor && this.accept(":")) {
      do {
        const name = this.qualifiedName();
        if (this.isOp("(")) {
          this.next();
          const args = this.isOp(")") ? [] : this.argList();
          this.expectOp(")");
          inits.push({ name, args, brace: false });
        } else if (this.isOp("{")) {
          inits.push({ name, args: this.braceList(), brace: true });
        } else {
          const t = this.peek();
          throw syntaxError("expected", `expected '(' or '{' after ${name} in the initialiser list`, t.line, t.col, { expected: "(" });
        }
      } while (this.accept(","));
    }
    let body: Stmt | null = null;
    if (this.isOp("{")) {
      const saveClass = this.currentClass;
      if (h.cls) this.currentClass = h.cls.split("::").pop()!;
      body = this.parseBlock();
      this.currentClass = saveClass;
    } else if (this.accept("=")) {
      if (this.acceptWord("default")) defaulted = true;
      else if (this.acceptWord("delete")) deleted = true;
      else if (this.peek().k === "int" && this.peek().num === 0) {
        this.next();
        pure = true;
      }
      else throw syntaxError("expected", "expected 'default' or 'delete'", this.peek().line, this.peek().col, { expected: "default" });
      this.expectOp(";");
    } else {
      this.expectOp(";");
    }
    return {
      k: "func",
      name: h.name,
      ret: h.ret,
      params,
      body,
      tparams: h.tparams,
      cls: h.cls,
      isConst,
      isStatic: h.isStatic,
      isVirtual: h.isVirtual,
      inits,
      isCtor: h.isCtor,
      isDtor: h.isDtor,
      defaulted,
      deleted,
      pure,
      isOverride,
      access: h.access,
      ...h.at,
    };
  }

  private parseParams(): Param[] {
    const params: Param[] = [];
    if (this.isOp(")")) return params;
    if (this.isWord("void") && this.isOp(")", 1)) {
      this.next();
      return params;
    }
    do {
      if (this.isOp("...")) throw unsupported("variadic functions", this.peek().line, this.peek().col);
      const at = this.loc();
      const base = this.parseTypeSpecifier();
      let type = this.pointerRef(base);
      let name = "";
      if (this.peek().k === "id" && !KEYWORDS.has(this.peek().s)) name = this.next().s;
      // `int a[]` and `int a[][10]` are pointers.
      const dims = this.arrayDims();
      if (dims.length) {
        type = { k: "ptr", to: type, const: false, ...at };
        if (dims.length > 1) {
          // pointer to array: keep the inner dimensions as an array type
          let inner = base;
          for (let i = dims.length - 1; i >= 1; i--) inner = { k: "named", name: "#array", args: [inner], const: false, expr: dims[i] ?? undefined, ...at };
          type = { k: "ptr", to: inner, const: false, ...at };
        }
      }
      let def: Expr | null = null;
      if (this.accept("=")) def = this.parseAssignment();
      params.push({ type, name, def, loc: at });
    } while (this.accept(","));
    return params;
  }

  /* ----------------------------------- types ---------------------------------- */

  private namedType(name: string, at: Loc, args: TypeSpec[] = [], isConst = false): TypeSpec {
    return { k: "named", name, args, const: isConst, ...at };
  }

  /** `a::b::c`, as one string. */
  private qualifiedName(): string {
    let name = "";
    if (this.accept("::")) name = "::";
    name += this.expectIdent().s;
    while (this.isOp("::") && this.peek(1).k === "id") {
      this.next();
      name += `::${this.next().s}`;
    }
    return name;
  }

  /** Whether the next tokens can start a type (without consuming anything). */
  private startsType(): boolean {
    const t = this.peek();
    if (t.k !== "id") return false;
    if (BUILTIN_WORDS.has(t.s) || t.s === "const" || t.s === "auto" || t.s === "typename" || t.s === "decltype" || t.s === "volatile") return true;
    if (t.s === "struct" || t.s === "class" || t.s === "enum") return true;
    if (KEYWORDS.has(t.s)) return false;
    if (t.s === "std" && this.isOp("::", 1)) return true;
    if (this.isTypeName(t.s)) return true;
    if (this.isTemplateName(t.s) && this.isOp("<", 1)) return true;
    return false;
  }

  /** The part of a type before any `*` or `&`: `const unsigned long long`, `std::vector<int>`, `auto`, `Node`. */
  private parseTypeSpecifier(strict = false): TypeSpec {
    const at = this.loc();
    let isConst = false;
    for (;;) {
      if (this.acceptWord("const")) isConst = true;
      else if (this.acceptWord("volatile") || this.acceptWord("typename") || this.acceptWord("register")) continue;
      else break;
    }
    if (this.acceptWord("struct") || this.acceptWord("class") || this.acceptWord("enum")) {
      /* elaborated type specifier: use the name */
    }
    if (this.isWord("auto")) {
      this.next();
      let c = isConst;
      while (this.acceptWord("const")) c = true;
      return { k: "auto", const: c, ...at };
    }
    if (this.isWord("decltype")) {
      this.next();
      this.expectOp("(");
      const expr = this.parseExpression();
      this.expectOp(")");
      return { k: "decltype", expr, ...at };
    }
    // builtin type words in any order
    if (this.peek().k === "id" && BUILTIN_WORDS.has(this.peek().s)) {
      const words: string[] = [];
      while (this.peek().k === "id" && (BUILTIN_WORDS.has(this.peek().s) || this.peek().s === "const")) {
        const w = this.next().s;
        if (w === "const") isConst = true;
        else words.push(w);
      }
      return this.namedType(normaliseBuiltin(words, at), at, [], isConst);
    }
    const t = this.peek();
    if (t.k !== "id" || KEYWORDS.has(t.s)) throw syntaxError("expected-type", `expected a type but found ${this.describe(t)}`, t.line, t.col, { found: this.describe(t) });
    let name = this.qualifiedName();
    const last = name.split("::").pop()!;
    if (strict && !name.includes("::") && !this.isTypeName(last) && !this.isTemplateName(last)) throw syntaxError("not-a-type", "", 0, 0);
    // `Outer::Inner` and `std::string` are names; template arguments follow templates only.
    let args: TypeSpec[] = [];
    let lit: number | undefined;
    if (this.isOp("<") && (this.isTemplateName(last) || this.userTemplates.has(last))) {
      args = this.templateArgs();
    } else if (!this.isTypeName(last) && !this.isTemplateName(last) && !name.startsWith("std::")) {
      // An identifier that is not (yet) a type: let the caller decide whether that is an error.
      if (!this.usingStd && STD_PLAIN_TYPES.has(last)) name = last;
    }
    while (this.acceptWord("const")) isConst = true;
    return { k: "named", name, args, const: isConst, lit, ...at };
  }

  /** `<int, vector<int>, 5>`. A `>>` closes two lists. */
  private templateArgs(): TypeSpec[] {
    this.expectOp("<");
    this.noGt++;
    const args: TypeSpec[] = [];
    if (!this.closingAngle()) {
      do {
        const at = this.loc();
        const asType = this.startsType() ? this.tryParse(() => this.parseType()) : null;
        if (asType && this.isOp("(")) {
          // A function type: `int(int, double)` as in std::function<int(int, double)>
          this.next();
          const params: TypeSpec[] = [];
          if (!this.isOp(")")) {
            do {
              params.push(this.parseType());
              if (this.peek().k === "id" && !KEYWORDS.has(this.peek().s)) this.next();
            } while (this.accept(","));
          }
          this.expectOp(")");
          args.push({ k: "named", name: "#fn", args: [asType, ...params], const: false, ...at });
        } else if (asType) args.push(asType);
        else {
          const expr = this.parseBinary(8);
          args.push({ k: "named", name: "#const", args: [], const: false, lit: expr.k === "int" && typeof expr.value === "number" ? expr.value : undefined, expr, ...at });
        }
      } while (this.accept(","));
    }
    this.noGt--;
    if (!this.closeAngle()) {
      const t = this.peek();
      throw syntaxError("expected", `expected '>' but found ${this.describe(t)}`, t.line, t.col, { expected: ">" });
    }
    return args;
  }

  private closingAngle(): boolean {
    return this.isOp(">") || this.isOp(">>");
  }

  /** Consumes one `>`; a `>>` token is split so the outer list can take the other. */
  private closeAngle(): boolean {
    const t = this.peek();
    if (t.k === "op" && t.s === ">") {
      this.next();
      return true;
    }
    if (t.k === "op" && (t.s === ">>" || t.s === ">=")) {
      this.undo.push({ at: this.p, tok: t });
      this.toks[this.p] = { ...t, s: t.s === ">>" ? ">" : "=", col: t.col + 1 };
      return true;
    }
    return false;
  }

  /** `*`, `const`, `&`, `&&` after a type specifier. */
  private pointerRef(base: TypeSpec): TypeSpec {
    let type = base;
    for (;;) {
      const at = this.loc();
      if (this.accept("*")) {
        const isConst = this.acceptWord("const");
        type = { k: "ptr", to: type, const: isConst, ...at };
      } else if (this.isOp("&&")) {
        this.next();
        type = { k: "ref", to: type, rvalue: true, ...at };
      } else if (this.accept("&")) {
        type = { k: "ref", to: type, rvalue: false, ...at };
      } else break;
    }
    return type;
  }

  private parseType(): TypeSpec {
    return this.pointerRef(this.parseTypeSpecifier());
  }

  private arrayDims(): (Expr | null)[] {
    const dims: (Expr | null)[] = [];
    while (this.isOp("[")) {
      this.next();
      dims.push(this.isOp("]") ? null : this.parseConditional());
      this.expectOp("]");
    }
    return dims;
  }

  /* ---------------------------------- statements ------------------------------- */

  private parseBlock(): Stmt {
    const at = this.loc();
    this.expectOp("{");
    const body: Stmt[] = [];
    while (!this.isOp("}")) {
      if (this.peek().k === "eof") throw syntaxError("unclosed-brace", "expected '}' before end of file", this.peek().line, this.peek().col, { expected: "}" });
      body.push(this.parseStatement());
    }
    this.expectOp("}");
    return { k: "block", body, ...at };
  }

  private initializerOpt(): Initializer | null {
    if (this.accept("=")) return { k: "assign", expr: this.parseAssignment() };
    if (this.isOp("(")) {
      this.next();
      const args = this.isOp(")") ? [] : this.argList();
      this.expectOp(")");
      return { k: "paren", args };
    }
    if (this.isOp("{")) return { k: "brace", args: this.braceList() };
    return null;
  }

  private braceList(): Expr[] {
    this.expectOp("{");
    const elems: Expr[] = [];
    while (!this.isOp("}")) {
      elems.push(this.parseAssignment());
      if (!this.accept(",")) break;
    }
    this.expectOp("}");
    return elems;
  }

  /** Is the statement a declaration? (`int x`, `vector<int> v`, `Node* p`, `auto [a, b]`, `strng s` with an unknown type.) */
  private looksLikeDeclaration(): boolean {
    const t = this.peek();
    if (t.k !== "id") return false;
    if (t.s === "static" || t.s === "constexpr" || t.s === "register" || t.s === "volatile") return true;
    if (t.s === "const" || t.s === "auto" || t.s === "decltype") return true;
    if (t.s === "struct" || t.s === "class" || t.s === "enum") return true;
    if (BUILTIN_WORDS.has(t.s)) {
      // `int(x)` / `double(a)` start an expression; `int x`, `unsigned long y` and `int* p` start declarations.
      return !this.isOp("(", 1) && !this.isOp("{", 1);
    }
    if (KEYWORDS.has(t.s)) return false;
    if (!this.startsType()) {
      // `Strng s;` — an unknown word followed by a name can only be a declaration.
      const n1 = this.peek(1);
      const n2 = this.peek(2);
      return n1.k === "id" && !KEYWORDS.has(n1.s) && n2.k === "op" && ["=", ";", ",", "[", "("].includes(n2.s) && !this.isOp("(", 2);
    }
    const save = this.p;
    const mark = this.undo.length;
    const saveGt = this.noGt;
    try {
      const type = this.tryParse(() => this.parseTypeSpecifier());
      if (!type) return false;
      for (;;) {
        if (this.isOp("*") || this.isOp("&") || this.isOp("&&")) this.next();
        else if (this.isWord("const")) this.next();
        else break;
      }
      if (this.isOp("[") && type.k === "auto") return true;
      const n = this.peek();
      if (n.k !== "id" || KEYWORDS.has(n.s)) return false;
      const after = this.peek(1);
      return after.k === "op" && ["=", ";", ",", "[", "(", "{", ":"].includes(after.s);
    } finally {
      this.p = save;
      this.rewind(mark);
      this.noGt = saveGt;
    }
  }

  private declStatement(): Stmt {
    const at = this.loc();
    let storage: "" | "static" = "";
    let isConstexpr = false;
    for (;;) {
      if (this.acceptWord("static")) storage = "static";
      else if (this.acceptWord("constexpr")) isConstexpr = true;
      else if (this.acceptWord("register") || this.acceptWord("volatile")) continue;
      else break;
    }
    const base = this.parseTypeSpecifier();
    // Structured binding: auto [a, b] = expr;
    if (this.isOp("[") || ((this.isOp("&") || this.isOp("&&")) && this.isOp("[", 1))) {
      let type: TypeSpec = base;
      if (this.isOp("&") || this.isOp("&&")) type = { k: "ref", to: base, rvalue: this.next().s === "&&", ...at };
      this.expectOp("[");
      const names: string[] = [];
      do names.push(this.expectIdent().s);
      while (this.accept(","));
      this.expectOp("]");
      this.expectOp("=");
      const init = this.parseAssignment();
      this.expectOp(";");
      return { k: "bind", type, names, init, ...at };
    }
    const decls: Declarator[] = [];
    do {
      const type = this.pointerRef(base);
      const nameTok = this.peek();
      const name = this.expectIdent("a variable name").s;
      const dims = this.arrayDims();
      const init = this.initializerOpt();
      decls.push({ name, type, dims, init, loc: this.loc(nameTok) });
    } while (this.accept(","));
    this.expectOp(";");
    return { k: "decl", type: base, decls, storage, constexpr: isConstexpr, ...at };
  }

  private parseStatement(): Stmt {
    const t = this.peek();
    const at = this.loc();
    // A label: `name:` in front of a statement (never `::`, `case`, `default` or an access specifier)
    if (t.k === "id" && this.isOp(":", 1) && !KEYWORDS.has(t.s)) {
      this.next();
      this.next();
      const stmt = this.isOp("}") ? ({ k: "empty", ...at } as Stmt) : this.parseStatement();
      return { k: "label", name: t.s, stmt, ...at };
    }
    if (t.k === "op") {
      if (t.s === "{") return this.parseBlock();
      if (t.s === ";") {
        this.next();
        return { k: "empty", ...at };
      }
    }
    if (t.k === "id") {
      switch (t.s) {
        case "if":
          return this.ifStatement();
        case "while": {
          this.next();
          this.expectOp("(");
          const c = this.parseExpression();
          this.expectOp(")");
          return { k: "while", c, body: this.parseStatement(), ...at };
        }
        case "do": {
          this.next();
          const body = this.parseStatement();
          this.expectWord("while");
          this.expectOp("(");
          const c = this.parseExpression();
          this.expectOp(")");
          this.expectOp(";");
          return { k: "do", body, c, ...at };
        }
        case "for":
          return this.forStatement();
        case "switch":
          return this.switchStatement();
        case "break":
          this.next();
          this.expectOp(";");
          return { k: "break", ...at };
        case "continue":
          this.next();
          this.expectOp(";");
          return { k: "continue", ...at };
        case "return": {
          this.next();
          const e = this.isOp(";") ? null : this.isOp("{") ? this.initListExpr() : this.parseExpression();
          this.expectOp(";");
          return { k: "return", e, ...at };
        }
        case "goto": {
          this.next();
          const name = this.expectIdent("a label name").s;
          this.expectOp(";");
          return { k: "goto", name, ...at };
        }
        case "try":
        case "throw":
        case "catch":
          throw unsupported("exceptions (try, catch and throw)", t.line, t.col);
        case "using": {
          const out: TopDecl[] = [];
          this.usingDecl(out);
          return { k: "typedef", ...at };
        }
        case "typedef": {
          this.typedefDecl([]);
          return { k: "typedef", ...at };
        }
        case "struct":
        case "class":
        case "union":
          if (this.isClassDefinition()) throw unsupported("classes defined inside a function (define them above `main`)", t.line, t.col);
          break;
        case "enum":
          throw unsupported("enums defined inside a function (define them above `main`)", t.line, t.col);
        case "case":
        case "default":
          throw syntaxError("case-outside-switch", `'${t.s}' is only allowed inside a switch`, t.line, t.col, { word: t.s });
        case "else":
          throw syntaxError("else-without-if", "'else' without a previous 'if'", t.line, t.col);
        case "namespace":
          throw unsupported("namespaces", t.line, t.col);
        case "template":
          throw unsupported("templates inside functions", t.line, t.col);
      }
    }
    if (this.looksLikeDeclaration()) return this.declStatement();
    const e = this.parseExpression();
    this.expectOp(";");
    return { k: "expr", e, ...at };
  }

  private ifStatement(): Stmt {
    const at = this.loc();
    this.expectWord("if");
    this.acceptWord("constexpr");
    this.expectOp("(");
    let init: Stmt | null = null;
    let c: Expr | null = null;
    let condDecl: Stmt | undefined;
    if (this.looksLikeDeclaration()) {
      // `if (int x = f())` or `if (init; cond)`
      const declAt = this.loc();
      const save = this.p;
      const stmt = this.declWithoutSemicolon();
      if (this.accept(";")) {
        init = stmt;
        c = this.parseExpression();
      } else {
        condDecl = stmt;
        c = null;
        void save;
        void declAt;
      }
    } else {
      const e = this.parseExpression();
      if (this.isOp(";")) {
        this.next();
        init = { k: "expr", e, line: e.line, col: e.col };
        c = this.parseExpression();
      } else c = e;
    }
    this.expectOp(")");
    const then = this.parseStatement();
    const els = this.acceptWord("else") ? this.parseStatement() : null;
    return { k: "if", c, init, then, else: els, condDecl, ...at };
  }

  /** A declaration up to (not including) its `;`, for `if (...)` and `for (...)`. */
  private declWithoutSemicolon(): Stmt {
    const at = this.loc();
    const base = this.parseTypeSpecifier();
    const decls: Declarator[] = [];
    do {
      const type = this.pointerRef(base);
      const nameTok = this.peek();
      const name = this.expectIdent("a variable name").s;
      const dims = this.arrayDims();
      const init = this.initializerOpt();
      decls.push({ name, type, dims, init, loc: this.loc(nameTok) });
    } while (this.accept(","));
    return { k: "decl", type: base, decls, storage: "", constexpr: false, ...at };
  }

  private forStatement(): Stmt {
    const at = this.loc();
    this.expectWord("for");
    this.expectOp("(");
    // Range-for: declaration then ':'
    if (this.looksLikeRangeFor()) {
      const declAt = this.loc();
      const base = this.parseTypeSpecifier();
      let type = this.pointerRef(base);
      let names: string[];
      let bindings = false;
      if (this.isOp("[")) {
        this.next();
        names = [];
        do names.push(this.expectIdent().s);
        while (this.accept(","));
        this.expectOp("]");
        bindings = true;
      } else names = [this.expectIdent("a variable name").s];
      this.expectOp(":");
      const range = this.isOp("{") ? this.initListExpr() : this.parseExpression();
      this.expectOp(")");
      void declAt;
      if (base.k === "named" && base.const && type === base) type = base;
      return { k: "rangefor", type, names, bindings, range, body: this.parseStatement(), ...at };
    }
    let init: Stmt | null = null;
    if (this.isOp(";")) this.next();
    else if (this.looksLikeDeclaration()) init = this.declStatement();
    else {
      const e = this.parseExpression();
      this.expectOp(";");
      init = { k: "expr", e, line: e.line, col: e.col };
    }
    const c = this.isOp(";") ? null : this.parseExpression();
    this.expectOp(";");
    const step = this.isOp(")") ? null : this.parseExpression();
    this.expectOp(")");
    return { k: "for", init, c, step, body: this.parseStatement(), ...at };
  }

  private looksLikeRangeFor(): boolean {
    if (!this.looksLikeDeclaration() && !(this.startsType() || this.isWord("auto") || this.isWord("const"))) return false;
    const save = this.p;
    const mark = this.undo.length;
    const saveGt = this.noGt;
    try {
      if (!this.tryParse(() => this.parseType())) return false;
      if (this.isOp("[")) {
        while (!this.isOp("]") && this.peek().k !== "eof") this.next();
        this.next();
      } else if (this.peek().k === "id") this.next();
      else return false;
      return this.isOp(":") && !this.isOp("::");
    } finally {
      this.p = save;
      this.rewind(mark);
      this.noGt = saveGt;
    }
  }

  private switchStatement(): Stmt {
    const at = this.loc();
    this.expectWord("switch");
    this.expectOp("(");
    const e = this.parseExpression();
    this.expectOp(")");
    this.expectOp("{");
    const cases: SwitchCase[] = [];
    let current: SwitchCase | null = null;
    while (!this.isOp("}")) {
      if (this.peek().k === "eof") throw syntaxError("unclosed-brace", "expected '}' before end of file", this.peek().line, this.peek().col, { expected: "}" });
      const loc = this.loc();
      if (this.acceptWord("case")) {
        const value = this.parseConditional();
        this.expectOp(":");
        current = { value, body: [], loc };
        cases.push(current);
      } else if (this.acceptWord("default")) {
        this.expectOp(":");
        current = { value: null, body: [], loc };
        cases.push(current);
      } else {
        if (!current) throw syntaxError("statement-before-case", "a statement inside a switch must come after a 'case' or 'default'", loc.line, loc.col);
        current.body.push(this.parseStatement());
      }
    }
    this.expectOp("}");
    return { k: "switch", e, cases, ...at };
  }

  /* --------------------------------- expressions ------------------------------- */

  parseExpression(): Expr {
    let e = this.parseAssignment();
    while (this.isOp(",")) {
      const at = this.loc();
      this.next();
      const r = this.parseAssignment();
      e = { k: "comma", l: e, r, ...at };
    }
    return e;
  }

  private argList(): Expr[] {
    const args: Expr[] = [];
    do args.push(this.isOp("{") ? this.initListExpr() : this.parseAssignment());
    while (this.accept(","));
    return args;
  }

  private initListExpr(type: TypeSpec | null = null): Expr {
    const at = this.loc();
    this.expectOp("{");
    const elems: Expr[] = [];
    while (!this.isOp("}")) {
      elems.push(this.isOp("{") ? this.initListExpr() : this.parseAssignment());
      if (!this.accept(",")) break;
    }
    this.expectOp("}");
    return { k: "init", type, elems, ...at };
  }

  parseAssignment(): Expr {
    if (this.isOp("{")) return this.initListExpr();
    const l = this.parseConditional();
    const t = this.peek();
    if (t.k === "op" && ASSIGN_OPS.has(t.s)) {
      this.next();
      const r = this.parseAssignment();
      return { k: "assign", op: t.s, l, r, line: t.line, col: t.col };
    }
    return l;
  }

  parseConditional(): Expr {
    const c = this.parseBinary(1);
    if (this.isOp("?")) {
      const at = this.loc();
      this.next();
      const a = this.parseAssignment();
      this.expectOp(":");
      const b = this.parseAssignment();
      return { k: "cond", c, a, b, ...at };
    }
    return c;
  }

  private binaryOp(): string | null {
    const t = this.peek();
    if (t.k === "op") {
      if (t.s === ">" && this.noGt > 0) return null;
      if (t.s === ">>" && this.noGt > 0) return null;
      return PREC[t.s] !== undefined ? t.s : null;
    }
    if (t.k === "id" && ALT_OPS[t.s] && t.s !== "not") return ALT_OPS[t.s];
    return null;
  }

  parseBinary(minPrec: number): Expr {
    let l = this.parseUnary();
    for (;;) {
      const op = this.binaryOp();
      if (op === null) break;
      const prec = PREC[op];
      if (prec < minPrec) break;
      const t = this.next();
      const r = this.parseBinary(prec + 1);
      l = { k: "binary", op, l, r, line: t.line, col: t.col };
    }
    return l;
  }

  private parseUnary(): Expr {
    const t = this.peek();
    const at = this.loc();
    if (t.k === "op") {
      switch (t.s) {
        case "+":
        case "-":
        case "!":
        case "~":
        case "*":
        case "&": {
          this.next();
          const e = this.parseUnary();
          return { k: "unary", op: t.s, e, ...at };
        }
        case "++":
        case "--": {
          this.next();
          const e = this.parseUnary();
          return { k: "unary", op: t.s, e, ...at };
        }
        case "(": {
          // C-style cast: (type) unary-expression
          const cast = this.tryParse(() => {
            this.next();
            if (!this.startsType()) throw syntaxError("not-a-cast", "", 0, 0);
            const type = this.parseType();
            this.expectOp(")");
            const n = this.peek();
            // `(a) - b` is a cast only when `a` really is a type, which startsType() has checked.
            if (n.k === "op" && [")", ";", ",", "]", "}", "?", ":", "=", "==", "!=", "<", ">", "<=", ">=", "&&", "||", "*", "/", "%", ".", "->"].includes(n.s) && !(n.s === "*" || n.s === "&")) throw syntaxError("not-a-cast", "", 0, 0);
            return type;
          });
          if (cast) {
            const e = this.parseUnary();
            return { k: "cast", type: cast, e, style: "c", ...at };
          }
          break;
        }
      }
    }
    if (t.k === "id") {
      if (t.s === "not") {
        this.next();
        return { k: "unary", op: "!", e: this.parseUnary(), ...at };
      }
      if (t.s === "sizeof") {
        this.next();
        if (this.isOp("(")) {
          const asType = this.tryParse(() => {
            this.next();
            if (!this.startsType()) throw syntaxError("not-a-type", "", 0, 0);
            const type = this.parseType();
            this.expectOp(")");
            return type;
          });
          if (asType) return { k: "sizeof", type: asType, ...at };
        }
        return { k: "sizeof", e: this.parseUnary(), ...at };
      }
      if (t.s === "new") return this.newExpr();
      if (t.s === "delete") {
        this.next();
        let array = false;
        if (this.isOp("[")) {
          this.next();
          this.expectOp("]");
          array = true;
        }
        return { k: "delete", e: this.parseUnary(), array, ...at };
      }
      if (t.s === "static_cast" || t.s === "reinterpret_cast" || t.s === "const_cast" || t.s === "dynamic_cast") {
        if (t.s === "dynamic_cast") throw unsupported("dynamic_cast", t.line, t.col);
        this.next();
        this.expectOp("<");
        this.noGt++;
        const type = this.parseType();
        this.noGt--;
        if (!this.closeAngle()) throw syntaxError("expected", "expected '>'", this.peek().line, this.peek().col, { expected: ">" });
        this.expectOp("(");
        const e = this.parseExpression();
        this.expectOp(")");
        const style = t.s === "static_cast" ? "static" : t.s === "const_cast" ? "const" : "reinterpret";
        return this.postfix({ k: "cast", type, e, style, ...at });
      }
      if (t.s === "throw") throw unsupported("exceptions (try, catch and throw)", t.line, t.col);
    }
    return this.parsePostfix();
  }

  private newExpr(): Expr {
    const at = this.loc();
    this.expectWord("new");
    const base = this.parseTypeSpecifier();
    const type = this.pointerRef(base);
    let array: Expr | null = null;
    if (this.isOp("[")) {
      this.next();
      array = this.parseExpression();
      this.expectOp("]");
    }
    let args: Expr[] = [];
    let brace = false;
    if (this.isOp("(")) {
      this.next();
      args = this.isOp(")") ? [] : this.argList();
      this.expectOp(")");
    } else if (this.isOp("{")) {
      brace = true;
      args = this.braceList();
    }
    return { k: "new", type, args, array, brace, ...at };
  }

  private parsePostfix(): Expr {
    return this.postfix(this.parsePrimary());
  }

  private postfix(start: Expr): Expr {
    let e = start;
    for (;;) {
      const t = this.peek();
      if (t.k !== "op") break;
      if (t.s === "(") {
        this.next();
        const args = this.isOp(")") ? [] : this.argList();
        this.expectOp(")");
        e = { k: "call", callee: e, args, line: t.line, col: t.col };
      } else if (t.s === "[") {
        this.next();
        const i = this.parseExpression();
        this.expectOp("]");
        e = { k: "index", e, i, line: t.line, col: t.col };
      } else if (t.s === "." || t.s === "->") {
        this.next();
        if (this.isWord("template")) this.next();
        const name = this.isWord("operator") ? this.operatorName() : this.expectIdent("a member name").s;
        e = { k: "member", e, name, arrow: t.s === "->", line: t.line, col: t.col };
      } else if (t.s === "++" || t.s === "--") {
        this.next();
        e = { k: "postfix", op: t.s, e, line: t.line, col: t.col };
      } else break;
    }
    return e;
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    const at = this.loc();
    switch (t.k) {
      case "int":
        this.next();
        return { k: "int", value: t.num!, unsigned: !!t.unsigned, long: t.long ?? 0, ...at };
      case "float":
        this.next();
        return { k: "float", value: t.fval!, f32: !!t.isFloat32, ...at };
      case "char":
        this.next();
        return { k: "char", value: t.cval!, ...at };
      case "str": {
        let value = "";
        while (this.peek().k === "str") value += this.next().sval!;
        return { k: "str", value, ...at };
      }
      case "op": {
        if (t.s === "(") {
          this.next();
          const e = this.parseExpression();
          this.expectOp(")");
          return e;
        }
        if (t.s === "[") return this.lambda();
        if (t.s === "{") return this.initListExpr();
        if (t.s === "::") return this.identExpr();
        break;
      }
      case "id":
        return this.identExpr();
    }
    throw syntaxError("expected-expression", `expected an expression but found ${this.describe(t)}`, t.line, t.col, { found: this.describe(t) });
  }

  private lambda(): Expr {
    const at = this.loc();
    this.expectOp("[");
    const captures: { name: string; byRef: boolean }[] = [];
    let defaultCapture: "" | "=" | "&" = "";
    while (!this.isOp("]")) {
      if (this.isOp("=") && (this.isOp(",", 1) || this.isOp("]", 1))) {
        this.next();
        defaultCapture = "=";
      } else if (this.isOp("&") && (this.isOp(",", 1) || this.isOp("]", 1))) {
        this.next();
        defaultCapture = "&";
      } else if (this.isOp("&")) {
        this.next();
        captures.push({ name: this.expectIdent().s, byRef: true });
      } else if (this.isWord("this")) {
        this.next();
        captures.push({ name: "this", byRef: true });
      } else {
        const name = this.expectIdent("a captured variable").s;
        if (this.isOp("=")) throw unsupported("lambda init-captures", at.line, at.col);
        captures.push({ name, byRef: false });
      }
      if (!this.accept(",")) break;
    }
    this.expectOp("]");
    let params: Param[] = [];
    if (this.accept("(")) {
      params = this.parseParams();
      this.expectOp(")");
    }
    let mutable = false;
    while (this.acceptWord("mutable") || this.acceptWord("noexcept") || this.acceptWord("constexpr")) mutable = mutable || this.toks[this.p - 1].s === "mutable";
    let ret: TypeSpec | null = null;
    if (this.accept("->")) ret = this.parseType();
    const body = this.parseBlock();
    return { k: "lambda", captures, defaultCapture, params, ret, body, mutable, ...at };
  }

  /** An identifier, a qualified name, or a type used as a value (`int(x)`, `vector<int>(n)`, `Node{1, 2}`). */
  private identExpr(): Expr {
    const at = this.loc();
    const t = this.peek();
    // Builtin type words: int(x), unsigned(x), (long long)…
    if (t.k === "id" && BUILTIN_WORDS.has(t.s)) {
      const type = this.parseTypeSpecifier();
      if (this.isOp("(")) {
        this.next();
        const args = this.isOp(")") ? [] : this.argList();
        this.expectOp(")");
        return { k: "construct", type, args, brace: false, ...at };
      }
      if (this.isOp("{")) return { k: "construct", type, args: this.braceList(), brace: true, ...at };
      throw syntaxError("expected-expression", `expected an expression but found ${this.describe(this.peek())}`, this.peek().line, this.peek().col, { found: this.describe(this.peek()) });
    }
    if (t.k === "id" && (t.s === "true" || t.s === "false")) {
      this.next();
      return { k: "bool", value: t.s === "true", ...at };
    }
    if (t.k === "id" && t.s === "nullptr") {
      this.next();
      return { k: "null", ...at };
    }
    if (t.k === "id" && t.s === "this") {
      this.next();
      return { k: "this", ...at };
    }
    if (t.k === "id" && KEYWORDS.has(t.s) && t.s !== "operator") {
      throw syntaxError("expected-expression", `expected an expression but found '${t.s}'`, t.line, t.col, { found: `'${t.s}'` });
    }
    const name = this.isWord("operator") ? this.operatorName() : this.qualifiedName();
    const last = name.split("::").pop()!;
    // Template arguments: vector<int>(n), max<int>(a, b), numeric_limits<int>::max()
    if (this.isOp("<") && (this.isTemplateName(last) || this.funcTemplates.has(last) || STD_FUNCTION_TEMPLATES.has(last))) {
      const targs = this.tryParse(() => {
        const a = this.templateArgs();
        const n = this.peek();
        if (!(n.k === "op" && ["(", "{", "::"].includes(n.s))) throw syntaxError("not-template-args", "", 0, 0);
        return a;
      });
      if (targs) {
        if (this.isOp("::")) {
          this.next();
          const member = this.expectIdent().s;
          return { k: "id", name: `${name}::${member}`, targs, ...at };
        }
        if (this.isTemplateName(last) && !STD_FUNCTION_TEMPLATES.has(last) || this.userTemplates.has(last)) {
          const type: TypeSpec = { k: "named", name, args: targs, const: false, ...at };
          if (this.isOp("(")) {
            this.next();
            const args = this.isOp(")") ? [] : this.argList();
            this.expectOp(")");
            return { k: "construct", type, args, brace: false, ...at };
          }
          if (this.isOp("{")) return { k: "construct", type, args: this.braceList(), brace: true, ...at };
        }
        return { k: "id", name, targs, ...at };
      }
    }
    // A user type used as a value: Node(1, 2) or Node{1, 2}
    if (this.isTypeName(last) && !name.includes("::")) {
      if (this.isOp("(") || this.isOp("{")) {
        const type: TypeSpec = { k: "named", name, args: [], const: false, ...at };
        if (this.isOp("(")) {
          this.next();
          const args = this.isOp(")") ? [] : this.argList();
          this.expectOp(")");
          return { k: "construct", type, args, brace: false, ...at };
        }
        return { k: "construct", type, args: this.braceList(), brace: true, ...at };
      }
    }
    if (name === "std::string" || name === "string") {
      if (this.isOp("(") || this.isOp("{")) {
        const type: TypeSpec = { k: "named", name, args: [], const: false, ...at };
        const brace = this.isOp("{");
        let args: Expr[];
        if (brace) args = this.braceList();
        else {
          this.next();
          args = this.isOp(")") ? [] : this.argList();
          this.expectOp(")");
        }
        return { k: "construct", type, args, brace, ...at };
      }
    }
    if (name.startsWith("::")) return { k: "id", name: name.slice(2), global: true, ...at };
    return { k: "id", name, ...at };
  }
}

/** `unsigned long long int` → "unsigned long long"; `long` → "long"; `unsigned` → "unsigned int". */
function normaliseBuiltin(words: string[], at: Loc): string {
  const count = (w: string) => words.filter((x) => x === w).length;
  const unsigned = count("unsigned") > 0;
  const signed = count("signed") > 0;
  const longs = count("long");
  const base = ["void", "bool", "char", "float", "double"].find((w) => count(w) > 0);
  if (unsigned && signed) throw syntaxError("bad-type", "both 'signed' and 'unsigned' in a type", at.line, at.col);
  if (base === "double") return longs ? "long double" : "double";
  if (base === "void" || base === "bool" || base === "float") return base;
  if (base === "char") return unsigned ? "unsigned char" : signed ? "signed char" : "char";
  if (count("short")) return unsigned ? "unsigned short" : "short";
  if (longs >= 2) return unsigned ? "unsigned long long" : "long long";
  if (longs === 1) return unsigned ? "unsigned long" : "long";
  return unsigned ? "unsigned int" : "int";
}
