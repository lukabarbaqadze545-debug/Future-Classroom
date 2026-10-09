import { CppError, limitError, runtimeError } from "./errors";
import { Op, type FnInfo, type Frame, type Instr } from "./core";
import { ElemPlace, Func, type Rt } from "./values";

/**
 * Runs compiled code.
 *
 * Straight-line code without calls is compiled to closures and run in one go;
 * anything with a call to user code is a list of instructions run here with an
 * explicit stack of frames, so a recursion thousands of calls deep never
 * touches the JS stack.
 */

interface Saved {
  code: Instr[];
  fr: Frame;
  pc: number;
  dst: number;
  fn: FnInfo;
  line: number;
}

export class Machine {
  constructor(private readonly rt: Rt) {
    rt.invoke = (f, args) => this.invoke(f, args);
  }

  /** Calls a function from outside (the entry point, or a native calling back). */
  call(fn: FnInfo, args: any[]): any {
    const fr: Frame = new Array(fn.nslots);
    for (let i = 0; i < args.length; i++) fr[i + 1] = args[i];
    return this.run(fn, fr);
  }

  invoke(f: Func, args: any[]): any {
    const info = f.info as FnInfo;
    if (info.native) return info.native(...args);
    const fr: Frame = new Array(info.nslots);
    const caps = info.captures;
    for (let i = 0; i < caps.length; i++) fr[caps[i].slot] = caps[i].viaEnv ? new ElemPlace(f.env, i) : f.env[i];
    const params = info.params;
    // A method is called with its object first.
    const off = info.isMethod ? 1 : 0;
    if (off) fr[1] = args[0];
    for (let i = off; i < args.length; i++) fr[params[i - off] ? params[i - off].slot : i + 1] = args[i];
    return this.run(info, fr);
  }

  /** The most-derived override of a virtual method for the object it is called on. */
  private resolveVirtual(fn: FnInfo, self: any): FnInfo {
    const cls = self && self.__c;
    if (!cls) return fn;
    const found = findOverride(cls, fn);
    return found ?? fn;
  }

  run(fn0: FnInfo, fr0: Frame): any {
    const rt = this.rt;
    if (fn0.fast) {
      rt.depth++;
      if (rt.depth > rt.maxDepth) throw limitError("stack-overflow", "the recursion went too deep (stack overflow)");
      try {
        return fn0.fast(fr0);
      } finally {
        rt.depth--;
      }
    }
    const baseDepth = rt.depth;
    rt.depth++;
    if (rt.depth > rt.maxDepth) throw limitError("stack-overflow", "the recursion went too deep (stack overflow)");
    const stack: Saved[] = [];
    let fn = fn0;
    let code = fn.code!;
    let fr = fr0;
    let pc = 0;
    let line = fn0.line;
    try {
      for (;;) {
        if (--rt.budget < 0) throw limitError("time-limit", "the program ran for too long");
        const ins = code[pc++];
        switch (ins.op) {
          case Op.Exec:
            line = ins.line;
            ins.f(fr);
            break;
          case Op.Jmp:
            pc = ins.to.pc;
            break;
          case Op.Jf:
            if (!ins.c(fr)) pc = ins.to.pc;
            break;
          case Op.Jt:
            if (ins.c(fr)) pc = ins.to.pc;
            break;
          case Op.Call: {
            line = ins.line;
            let callee = ins.fn;
            const args = ins.args;
            let nf: Frame;
            if (ins.virt) {
              const self = args[0](fr);
              callee = this.resolveVirtual(callee, self);
              nf = new Array(callee.nslots);
              nf[1] = self;
              for (let i = 1; i < args.length; i++) nf[i + 1] = args[i](fr);
            } else {
              nf = new Array(callee.nslots);
              for (let i = 0; i < args.length; i++) nf[i + 1] = args[i](fr);
            }
            if (callee.fast) {
              const v = callee.fast(nf);
              if (ins.dst >= 0) fr[ins.dst] = v;
              break;
            }
            if (!callee.code) throw runtimeError("no-body", `the function '${callee.qname}' has no body`, line);
            if (++rt.depth > rt.maxDepth) throw limitError("stack-overflow", "the recursion went too deep (stack overflow)");
            stack.push({ code, fr, pc, dst: ins.dst, fn, line });
            fn = callee;
            code = callee.code;
            fr = nf;
            pc = 0;
            break;
          }
          case Op.CallInd: {
            line = ins.line;
            const f = ins.callee(fr);
            if (f === null || f === undefined) throw runtimeError("null-call", "calling a function through an empty function pointer", line);
            const info = (f as Func).info as FnInfo;
            if (info.native) {
              const v = info.native(...ins.args.map((a) => a(fr)));
              if (ins.dst >= 0) fr[ins.dst] = v;
              break;
            }
            const nf: Frame = new Array(info.nslots);
            const caps = info.captures;
            for (let i = 0; i < caps.length; i++) nf[caps[i].slot] = caps[i].viaEnv ? new ElemPlace((f as Func).env, i) : (f as Func).env[i];
            const args = ins.args;
            const params = info.params;
            for (let i = 0; i < args.length; i++) nf[params[i] ? params[i].slot : i + 1] = args[i](fr);
            if (info.fast) {
              const v = info.fast(nf);
              if (ins.dst >= 0) fr[ins.dst] = v;
              break;
            }
            if (++rt.depth > rt.maxDepth) throw limitError("stack-overflow", "the recursion went too deep (stack overflow)");
            stack.push({ code, fr, pc, dst: ins.dst, fn, line });
            fn = info;
            code = info.code!;
            fr = nf;
            pc = 0;
            break;
          }
          case Op.Ret: {
            const value = ins.v ? ins.v(fr) : undefined;
            if (stack.length === 0) return value;
            const s = stack.pop()!;
            rt.depth--;
            code = s.code;
            fr = s.fr;
            pc = s.pc;
            fn = s.fn;
            line = s.line;
            if (s.dst >= 0) fr[s.dst] = value;
            break;
          }
          case Op.Switch: {
            const key = ins.sel(fr);
            const target = ins.table.get(key) ?? ins.dflt ?? ins.end;
            pc = target.pc;
            break;
          }
          case Op.Label:
            break;
        }
      }
    } catch (e) {
      if (e instanceof CppError && e.diagnostic.line === 0) e.diagnostic.line = line;
      throw e;
    } finally {
      rt.depth = baseDepth;
    }
  }
}

/** Finds the method that overrides `fn` in `cls` (or the nearest base), by name and parameter count. */
function findOverride(cls: any, fn: FnInfo): FnInfo | null {
  for (let c = cls; c; c = c.bases?.[0]) {
    const list: FnInfo[] | undefined = c.methods.get(fn.name);
    if (!list) continue;
    const m = list.find((x) => x.params.length === fn.params.length && !x.isStatic);
    if (m) return m;
  }
  return null;
}
