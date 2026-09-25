// Runs student Python code with Pyodide inside a dedicated Web Worker.
// The worker has no access to the page or its cookies' DOM; the main thread
// terminates it if a test runs longer than the time limit.
let pyodidePromise = null;

const RUNNER = `
import sys, io, traceback
def __fc_run(code, data):
    out = io.StringIO()
    old_in, old_out = sys.stdin, sys.stdout
    sys.stdin, sys.stdout = io.StringIO(data), out
    err = None
    try:
        exec(compile(code, "main.py", "exec"), {"__name__": "__main__"})
    except SystemExit:
        pass
    except BaseException:
        lines = traceback.format_exc().splitlines()
        # Keep the student's own frames, hide the runner's internals.
        err = "\\n".join(l for l in lines if "__fc_run" not in l and "<exec>" not in l)[-2000:]
    finally:
        sys.stdin, sys.stdout = old_in, old_out
    return out.getvalue()[:200000], err
`;

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const { loadPyodide } = await import("/pyodide/pyodide.mjs");
      const pyodide = await loadPyodide({ indexURL: "/pyodide/" });
      pyodide.runPython(RUNNER);
      return pyodide;
    })();
  }
  return pyodidePromise;
}

self.onmessage = async (event) => {
  const { id, type, code, input } = event.data;
  try {
    const pyodide = await getPyodide();
    if (type === "init") {
      self.postMessage({ id, type: "ready" });
      return;
    }
    const run = pyodide.globals.get("__fc_run");
    const result = run(code, input).toJs();
    run.destroy();
    self.postMessage({ id, type: "result", output: result[0], error: result[1] ?? undefined });
  } catch (error) {
    self.postMessage({ id, type: "failed", error: String(error && error.message ? error.message : error) });
  }
};
