import { handler, json } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser } from "@/lib/auth/session";
import { MAX_ATTACHMENT_BYTES } from "@/lib/files/validate";
import { ATTACHMENT_TARGETS, createAttachment, type AttachmentTarget } from "@/lib/services/attachments";

/** Multipart upload of a photo or document onto the student's own work. */
export const POST = handler(async (req) => {
  const user = await requireApiUser();
  rateLimit(`attach:${user.id}`, 40, 60 * 60_000);
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_ATTACHMENT_BYTES + 64 * 1024) throw new ApiError(413, "file_too_large");
  const form = await req.formData();
  const file = form.get("file");
  const targetKind = String(form.get("targetKind") ?? "") as AttachmentTarget;
  const targetId = String(form.get("targetId") ?? "").slice(0, 100);
  if (!(file instanceof File) || !ATTACHMENT_TARGETS.includes(targetKind) || !targetId) throw new ApiError(400, "invalid_input");
  const bytes = new Uint8Array(await file.arrayBuffer());
  return json({ attachment: createAttachment(user, targetKind, targetId, file.name, bytes) }, { status: 201 });
});
