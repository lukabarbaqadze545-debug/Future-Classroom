/** The syntax tree of the C++ the runner understands. Types here are as written; `types.ts` has the resolved ones. */

export interface Loc {
  line: number;
  col: number;
}

/* ------------------------------ written types ----------------------------- */

export type TypeSpec =
  /** `int`, `unsigned long long`, `std::string`, `vector<int>`, `Node` … */
  | (Loc & { k: "named"; name: string; args: TypeSpec[]; const: boolean; /** A constant written as a template argument: `array<int, 5>`. */ lit?: number; expr?: Expr })
  | (Loc & { k: "ptr"; to: TypeSpec; const: boolean })
  | (Loc & { k: "ref"; to: TypeSpec; rvalue: boolean })
  | (Loc & { k: "auto"; const: boolean })
  /** `decltype(expr)` */
  | (Loc & { k: "decltype"; expr: Expr });

export interface Declarator {
  name: string;
  /** The type written after the name: `[10][20]` become dims, `*` and `&` are on `type`. */
  type: TypeSpec;
  dims: (Expr | null)[];
  init: Initializer | null;
  loc: Loc;
}

/** `= expr`, `(args)` or `{args}`. */
export type Initializer = { k: "assign"; expr: Expr } | { k: "paren"; args: Expr[] } | { k: "brace"; args: Expr[] };

/* ------------------------------- expressions ------------------------------ */

export type Expr = Loc &
  (
    | { k: "int"; value: number | bigint; unsigned: boolean; long: number }
    | { k: "float"; value: number; f32: boolean }
    | { k: "char"; value: number }
    | { k: "str"; value: string }
    | { k: "bool"; value: boolean }
    | { k: "null" }
    | { k: "this" }
    | { k: "id"; name: string; targs?: TypeSpec[]; global?: boolean }
    | { k: "unary"; op: "+" | "-" | "!" | "~" | "*" | "&" | "++" | "--"; e: Expr }
    | { k: "postfix"; op: "++" | "--"; e: Expr }
    | { k: "binary"; op: string; l: Expr; r: Expr }
    | { k: "assign"; op: string; l: Expr; r: Expr }
    | { k: "cond"; c: Expr; a: Expr; b: Expr }
    | { k: "call"; callee: Expr; args: Expr[]; targs?: TypeSpec[] }
    | { k: "index"; e: Expr; i: Expr }
    | { k: "member"; e: Expr; name: string; arrow: boolean }
    | { k: "cast"; type: TypeSpec; e: Expr; style: "c" | "static" | "reinterpret" | "const" }
    /** `T(args)` or `T{args}`: a value of type T built from the arguments. */
    | { k: "construct"; type: TypeSpec; args: Expr[]; brace: boolean }
    | { k: "sizeof"; type?: TypeSpec; e?: Expr }
    | { k: "new"; type: TypeSpec; args: Expr[]; array: Expr | null; brace: boolean }
    | { k: "delete"; e: Expr; array: boolean }
    | { k: "lambda"; captures: Capture[]; defaultCapture: "" | "=" | "&"; params: Param[]; ret: TypeSpec | null; body: Stmt; mutable: boolean }
    | { k: "init"; type: TypeSpec | null; elems: Expr[] }
    | { k: "comma"; l: Expr; r: Expr }
  );

export interface Capture {
  name: string;
  byRef: boolean;
}

export interface Param {
  type: TypeSpec;
  name: string;
  def: Expr | null;
  loc: Loc;
}

/* -------------------------------- statements ------------------------------ */

export type Stmt = Loc &
  (
    | { k: "block"; body: Stmt[] }
    | { k: "expr"; e: Expr }
    | { k: "decl"; type: TypeSpec; decls: Declarator[]; storage: "" | "static"; constexpr: boolean }
    /** `auto [a, b] = expr;` */
    | { k: "bind"; type: TypeSpec; names: string[]; init: Expr }
    | { k: "if"; c: Expr | null; init: Stmt | null; then: Stmt; else: Stmt | null; condDecl?: Stmt }
    | { k: "while"; c: Expr; body: Stmt }
    | { k: "do"; body: Stmt; c: Expr }
    | { k: "for"; init: Stmt | null; c: Expr | null; step: Expr | null; body: Stmt }
    | { k: "rangefor"; type: TypeSpec; names: string[]; bindings: boolean; range: Expr; body: Stmt }
    | { k: "switch"; e: Expr; cases: SwitchCase[] }
    | { k: "break" }
    | { k: "continue" }
    | { k: "goto"; name: string }
    | { k: "label"; name: string; stmt: Stmt }
    | { k: "return"; e: Expr | null }
    | { k: "empty" }
    | { k: "typedef" }
  );

export interface SwitchCase {
  /** null = default */
  value: Expr | null;
  body: Stmt[];
  loc: Loc;
}

/* ------------------------------ declarations ------------------------------ */

export interface FuncDecl extends Loc {
  k: "func";
  name: string;
  ret: TypeSpec;
  params: Param[];
  body: Stmt | null;
  /** `template<typename T, int N>` parameter names (types only are supported). */
  tparams: string[];
  /** Member function of this class (the class name), when defined inside or as `Class::name`. */
  cls: string | null;
  isConst: boolean;
  isStatic: boolean;
  isVirtual: boolean;
  /** Constructors: initialiser list. */
  inits: { name: string; args: Expr[]; brace: boolean }[];
  isCtor: boolean;
  isDtor: boolean;
  /** `= default` / `= delete` */
  defaulted: boolean;
  deleted: boolean;
  /** `= 0`: a pure virtual function (no body; derived classes must supply one). */
  pure: boolean;
  /** Written with `override`. */
  isOverride: boolean;
  access: "public" | "private" | "protected";
}

export interface FieldDecl extends Loc {
  name: string;
  type: TypeSpec;
  dims: (Expr | null)[];
  init: Initializer | null;
  isStatic: boolean;
  access: "public" | "private" | "protected";
}

export interface ClassDecl extends Loc {
  k: "class";
  name: string;
  isStruct: boolean;
  tparams: string[];
  bases: { name: string; access: string }[];
  fields: FieldDecl[];
  methods: FuncDecl[];
}

export interface EnumDecl extends Loc {
  k: "enum";
  name: string | null;
  scoped: boolean;
  items: { name: string; value: Expr | null }[];
}

export interface GlobalDecl extends Loc {
  k: "global";
  stmt: Extract<Stmt, { k: "decl" }>;
}

export interface AliasDecl extends Loc {
  k: "alias";
  name: string;
  type: TypeSpec;
}

export type TopDecl = FuncDecl | ClassDecl | EnumDecl | GlobalDecl | AliasDecl;

export interface Program {
  decls: TopDecl[];
  includes: string[];
  usingStd: boolean;
}
