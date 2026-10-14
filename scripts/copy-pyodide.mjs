// Copies the Pyodide runtime (Python compiled to WebAssembly) from node_modules to
// public/pyodide before a build, so a host that serves public/ as static files (such
// as Vercel, where a function's response may not exceed 4.5 MB) delivers it from there.
// Elsewhere /pyodide/[file] (src/app/pyodide) serves the same files from node_modules.
import fs from "node:fs";
import path from "node:path";

const FILES = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
const from = path.resolve("node_modules", "pyodide");
const to = path.resolve("public", "pyodide");

if (!fs.existsSync(path.join(from, FILES[0]))) {
  console.warn("copy-pyodide: node_modules/pyodide not found; the Programming Lab will rely on the /pyodide route.");
  process.exit(0);
}
fs.mkdirSync(to, { recursive: true });
for (const file of FILES) fs.copyFileSync(path.join(from, file), path.join(to, file));
console.log(`copy-pyodide: ${FILES.length} files -> public/pyodide`);
