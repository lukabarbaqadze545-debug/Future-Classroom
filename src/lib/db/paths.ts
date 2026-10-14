import os from "node:os";
import path from "node:path";

/**
 * Where the database and the uploaded files live unless DATABASE_PATH and
 * UPLOAD_DIR say otherwise. Vercel runs the app from a read-only folder: only
 * the temporary folder is writable there, and it belongs to one running
 * instance (what is in it is gone when that instance is replaced).
 */
export function dataDir(): string {
  return process.env.VERCEL ? path.join(os.tmpdir(), "future-classroom") : path.join(process.cwd(), "data");
}
