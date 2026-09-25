import fs from "node:fs";
import path from "node:path";

/**
 * Serves the Pyodide runtime (Python compiled to WebAssembly) from the school
 * server, so the Programming Lab works without internet access. Only the
 * runtime files are exposed; nothing here executes on the server.
 */
const FILES: Record<string, string> = {
  "pyodide.mjs": "text/javascript; charset=utf-8",
  "pyodide.asm.mjs": "text/javascript; charset=utf-8",
  "pyodide.asm.wasm": "application/wasm",
  "python_stdlib.zip": "application/zip",
  "pyodide-lock.json": "application/json",
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const type = FILES[file];
  if (!type) return new Response("Not found", { status: 404 });
  const filePath = path.join(process.cwd(), "node_modules", "pyodide", file);
  try {
    const data = await fs.promises.readFile(filePath);
    return new Response(data, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
