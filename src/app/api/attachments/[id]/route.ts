import fs from "node:fs";
import { handler } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { deleteAttachment, getAttachmentFile } from "@/lib/services/attachments";

type Ctx = { params: Promise<{ id: string }> };

/** Serves an attachment to its owner and to staff. Images and PDFs open inline. */
export const GET = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  const { path, record } = getAttachmentFile((await params).id, user);
  if (!fs.existsSync(path)) throw new ApiError(404, "not_found");
  const data = fs.readFileSync(path);
  const inline = record.isImage || record.mimeType === "application/pdf";
  return new Response(data, {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(record.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
      "Cache-Control": "private, max-age=300",
    },
  });
});

export const DELETE = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser();
  deleteAttachment((await params).id, user);
  return new Response(null, { status: 204 });
});
