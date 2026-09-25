import { describe, expect, it } from "vitest";
import { compileExpression, ExpressionError, sampleFunction } from "@/lib/domain/math-expression";

describe("compileExpression", () => {
  it("evaluates polynomials with implicit multiplication", () => {
    const f = compileExpression("x^2 - 5x + 6");
    expect(f(2)).toBe(0);
    expect(f(3)).toBe(0);
    expect(f(0)).toBe(6);
  });
  it("respects precedence and unary minus", () => {
    expect(compileExpression("-x^2")(3)).toBe(-9);
    expect(compileExpression("2(x+1)")(4)).toBe(10);
    expect(compileExpression("2^3^2")(0)).toBe(512);
    expect(compileExpression("x/2")(10)).toBe(5);
  });
  it("supports functions and constants", () => {
    expect(compileExpression("sqrt(x)")(9)).toBe(3);
    expect(compileExpression("ln(x)/ln(2)")(8)).toBeCloseTo(3);
    expect(compileExpression("sin(pi)")(0)).toBeCloseTo(0);
    expect(compileExpression("2x²")(3)).toBe(18);
  });
  it.each(["process.exit()", "constructor", "x; alert(1)", "(x", "", "x +", "a = 1"])("rejects unsafe or invalid input %s", (source) => {
    expect(() => compileExpression(source)).toThrow(ExpressionError);
  });
  it("marks non-finite samples as gaps", () => {
    const points = sampleFunction("1/x", -1, 1, 2);
    expect(points[1]).toEqual({ x: 0, y: null });
  });
});
