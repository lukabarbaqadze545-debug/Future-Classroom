import { describe, expect, it } from "vitest";
import { checkCpp, runCpp } from "@/lib/cpp";

/**
 * What a student sees when the program is wrong: the kind of problem, a stable code
 * (the UI turns it into a Georgian sentence) and the line. And the limits that keep
 * a runaway program from taking the server with it.
 */
const H = `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n`;
// With H in front, the program's own first line is line 5.

const COMPILE: [name: string, source: string, code: string, line: number][] = [
  ["a missing semicolon", H + `int main() {\n  int x = 5\n  cout << x;\n}`, "missing-semicolon", 6],
  ["an undeclared variable", H + `int main() {\n  cout << y;\n}`, "undeclared", 6],
  ["a missing #include", `using namespace std;\nint main() {\n  cout << 1;\n}`, "missing-include", 3],
  ["a missing using namespace", `#include <iostream>\nint main() {\n  cout << 1;\n}`, "missing-std", 3],
  ["a string put into an int", H + `int main() {\n  int x = "hello";\n}`, "bad-conversion", 6],
  ["an int put into a string", H + `int main() {\n  string s = 5;\n}`, "bad-conversion", 6],
  ["no main", H + `int f() { return 1; }`, "no-main", 1],
  ["too many arguments", H + `int f(int a) { return a; }\nint main() {\n  cout << f(1, 2);\n}`, "no-matching-function", 7],
  ["an unknown function", H + `int main() {\n  cout << foo(1);\n}`, "undeclared", 6],
  ["assigning to a const", H + `int main() {\n  const int x = 1;\n  x = 2;\n}`, "assign-const", 7],
  ["a missing closing brace", H + `int main() {\n  cout << 1;\n`, "unclosed-brace", 7],
  ["an extra closing brace", H + `int main() {\n  cout << 1;\n}}`, "expected-declaration", 7],
  ["reading into a literal", H + `int main() {\n  cin >> "x";\n}`, "not-lvalue", 6],
  ["adding two string literals", H + `int main() {\n  string s = "a" + "b";\n}`, "bad-operands", 6],
  ["return without a value", H + `int f() { return; }\nint main(){}`, "return-missing", 5],
  ["using a void result", H + `void f() {}\nint main(){ int x = f(); }`, "bad-conversion", 6],
  ["the wrong argument type", H + `void f(int a) {}\nint main(){ f("s"); }`, "no-matching-function", 6],
  ["declaring a name twice", H + `int main(){ int a = 1; int a = 2; }`, "redeclared", 5],
  ["a misspelled type", H + `int main(){ itn x = 1; }`, "unknown-type", 5],
  ["a misspelled cout", H + `int main(){ cuot << 1; }`, "undeclared", 5],
  ["an unterminated string", H + `int main(){ cout << "hello; }`, "unterminated-string", 5],
  ["a stray character", H + `int main(){ int x = 1 @ 2; }`, "bad-character", 5],
  ["String with a capital S", H + `int main(){ String s = "a"; }`, "unknown-type", 5],
  ["a method that does not exist", H + `int main(){ string s; s.foo(); }`, "no-member", 5],
  ["a negative array size", H + `int main(){ int a[-1]; }`, "array-size-negative", 5],
  ["a pointer made from an int", H + `int main(){ int x = 5; int *p = x; }`, "bad-conversion", 5],
  ["a goto without a label", H + `int main(){ goto nowhere; }`, "unknown-label", 5],
  ["two equal case labels", H + `int main(){ int x=1; switch(x){case 1: break; case 1: break;} }`, "duplicate-case", 5],
  ["comparing a string with an int", H + `int main(){ string s = "a"; if (s == 1) {} }`, "bad-operands", 5],
  ["narrowing in braces", H + `int main(){ int x{3.5}; }`, "narrowing", 5],
  ["creating an object of an abstract class", H + `struct A { virtual void f() = 0; };\nint main(){ A a; }`, "abstract-class", 6],
];

const RUNTIME: [name: string, source: string, code: string][] = [
  ["an index past the end of an array", H + `int main(){ int a[3]; a[5] = 1; cout << a[5]; }`, "index-range"],
  ["division by zero", H + `int main(){ int a = 0; cout << 5 / a; }`, "div-zero"],
  ["remainder by zero", H + `int main(){ int a = 0; cout << 5 % a; }`, "div-zero"],
  ["a null pointer", H + `int main(){ int *p = nullptr; cout << *p; }`, "null-deref"],
  ["an uninitialised variable", H + `int main(){ int x; cout << x; }`, "uninitialized"],
  ["vector::at out of range", H + `int main(){ vector<int> v(3); cout << v.at(7); }`, "index-range"],
  ["v[i] out of range", H + `int main(){ vector<int> v(3); cout << v[7]; }`, "index-range"],
  ["falling off the end of a function", H + `int f(int x){ if (x>0) return 1; }\nint main(){ cout << f(-1); }`, "missing-return"],
  ["stoi of a word", H + `int main(){ cout << stoi("abc"); }`, "invalid-argument"],
  ["deleting twice", H + `int main(){ int *p = new int(3); delete p; delete p; }`, "double-delete"],
  ["deleting an object twice", H + `struct T { ~T() {} };\nint main(){ T *p = new T; delete p; delete p; }`, "double-delete"],
  ["a huge vector", H + `int main(){ vector<long long> v(1000000000); }`, "memory"],
];

describe("compile errors", () => {
  for (const [name, source, code, line] of COMPILE) {
    it(`reports ${name}`, () => {
      const r = runCpp(source);
      expect(r.status).toBe("compile_error");
      expect(r.diagnostic?.code).toBe(code);
      expect(r.diagnostic?.line).toBe(line);
      expect(r.stdout).toBe("");
      // checkCpp finds the same problem without running anything
      expect(checkCpp(source)?.code).toBe(code);
    });
  }

  it("carries the names a translation needs", () => {
    const r = runCpp(H + `int main() { cout << total; }`);
    expect(r.diagnostic?.args).toEqual({ name: "total" });
    const s = runCpp(H + `int main() { int x = "a"; }`);
    expect(s.diagnostic?.args).toEqual({ from: "const char*", to: "int" });
  });

  it("does not report a correct program", () => {
    expect(checkCpp(H + `int main() { cout << "hi"; }`)).toBeNull();
  });

  it("separates a student's mistake from a feature the runner does not have", () => {
    const r = runCpp(`#include <regex>\nint main() {}`);
    expect(r.status).toBe("unsupported");
    const t = runCpp(H + `int main() { try { throw 1; } catch (...) {} }`);
    expect(t.status).toBe("unsupported");
  });
});

describe("runtime errors", () => {
  for (const [name, source, code] of RUNTIME) {
    it(`stops on ${name}`, () => {
      const r = runCpp(source, { memoryLimit: 64 * 1024 * 1024 });
      expect(r.status).toBe("runtime_error");
      expect(r.diagnostic?.code).toBe(code);
      expect(r.diagnostic?.line, "the line of the failing statement").toBeGreaterThan(0);
    });
  }

  it("keeps what was printed before the failure", () => {
    const r = runCpp(H + `int main() { cout << "before\\n"; int a = 0; cout << 1 / a; }`);
    expect(r.status).toBe("runtime_error");
    expect(r.stdout).toBe("before\n");
  });

  it("reports the line inside a function that the failure happens in", () => {
    const r = runCpp(H + `int half(int a, int b) {\n  return a / b;\n}\nint main() {\n  cout << half(4, 0);\n}`);
    expect(r.diagnostic?.code).toBe("div-zero");
    expect(r.diagnostic?.line).toBe(6);
  });
});

describe("limits", () => {
  it("stops an endless loop", () => {
    const r = runCpp(H + `int main(){ while (true) {} }`, { stepLimit: 5_000_000 });
    expect(r.status).toBe("time_limit");
  });
  it("stops endless recursion", () => {
    const r = runCpp(H + `int f(int n){ return f(n+1)+1; }\nint main(){ cout << f(0); }`);
    expect(r.status).toBe("stack_overflow");
  });
  it("allows deep but finite recursion", () => {
    const r = runCpp(H + `int depth(int n){ return n == 0 ? 0 : 1 + depth(n - 1); }\nint main(){ cout << depth(100000); }`);
    expect(r.stdout).toBe("100000");
  });
  it("stops a program that prints without end", () => {
    const r = runCpp(H + `int main(){ while(true) cout << "hello hello hello\\n"; }`, { outputLimit: 100_000, stepLimit: 50_000_000 });
    expect(r.status).toBe("output_limit");
  });
  it("stops a program that asks for too much memory", () => {
    const r = runCpp(H + `int main(){ int a[100000000]; a[0]=1; cout << a[0]; }`, { memoryLimit: 64 * 1024 * 1024 });
    expect(r.status).toBe("memory_limit");
  });
  it("stops a program that fills memory bit by bit", () => {
    const r = runCpp(H + `int main(){ vector<long long> v; while (true) v.push_back(1); }`, { memoryLimit: 32 * 1024 * 1024, stepLimit: 500_000_000 });
    expect(["memory_limit", "runtime_error"]).toContain(r.status);
  });
  it("counts steps deterministically", () => {
    const src = H + `int main(){ long long s = 0; for (int i = 0; i < 1000; i++) s += i; cout << s; }`;
    const a = runCpp(src);
    const b = runCpp(src);
    expect(a.steps).toBe(b.steps);
    expect(a.steps).toBeGreaterThan(500);
  });
});

describe("the program's own exit", () => {
  it("returns main's value", () => {
    expect(runCpp(H + `int main(){ return 3; }`).exitCode).toBe(3);
  });
  it("exit() ends the program at once", () => {
    const r = runCpp(H + `#include <cstdlib>\nint main(){ cout << "a"; exit(2); cout << "b"; }`);
    expect(r.exitCode).toBe(2);
    expect(r.stdout).toBe("a");
  });
  it("tells stdout from stderr", () => {
    const r = runCpp(H + `int main(){ cout << "out"; cerr << "err"; }`);
    expect(r.stdout).toBe("out");
    expect(r.stderr).toBe("err");
  });
  it("runs destructors of globals after main", () => {
    const r = runCpp(H + `struct G { ~G() { cout << "bye"; } } g;\nint main(){ cout << "main "; }`);
    expect(r.stdout).toBe("main bye");
  });
});
