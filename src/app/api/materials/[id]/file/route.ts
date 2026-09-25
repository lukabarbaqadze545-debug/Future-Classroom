import fs from "node:fs";
import { handler } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { getMaterialFile } from "@/lib/services/materials";

type Ctx = { params: Promise<{ id: string }> };

/** Serves the original file to users allowed to see it. Never from /public. */
export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  const { path, record } = getMaterialFile((await params).id, user);
  if (!fs.existsSync(path)) throw new ApiError(404, "not_found");
  const data = fs.readFileSync(path);
  const disposition = record.mimeType === "application/pdf" ? "inline" : "attachment";
  return new Response(data, {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(record.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=300",
    },
  });
});
