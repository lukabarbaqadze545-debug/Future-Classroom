import { handler, json } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { isSubject } from "@/lib/domain/catalog";
import { materialMetaSchema } from "@/lib/domain/schemas";
import { MAX_UPLOAD_BYTES } from "@/lib/files/validate";
import { createMaterial, listMaterials } from "@/lib/services/materials";

export const maxDuration = 120;

export const GET = handler(async (req) => {
  const user = await requireApiUser();
  const params = req.nextUrl.searchParams;
  const subject = params.get("subject") ?? "";
  const grade = Number(params.get("grade"));
  return json({
    materials: listMaterials(user, {
      subject: isSubject(subject) ? subject : undefined,
      grade: Number.isInteger(grade) && grade > 0 ? grade : undefined,
      q: params.get("q")?.slice(0, 200) ?? undefined,
    }),
  });
});

/** Multipart upload. The file is validated by content, stored privately and indexed. */
export const POST = handler(async (req) => {
  const user = await requireApiUser(STAFF_ROLES);
  rateLimit(`upload:${user.id}`, 30, 60 * 60_000);
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) throw new ApiError(413, "file_too_large");
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "invalid_input", "Choose a file to upload.");
  const gradeValue = String(form.get("grade") ?? "");
  const meta = materialMetaSchema.parse({
    title: String(form.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, ""),
    subject: String(form.get("subject") ?? ""),
    grade: gradeValue ? Number(gradeValue) : null,
    author: String(form.get("author") ?? ""),
    tags: String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    visibility: String(form.get("visibility") ?? "teachers"),
  });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const material = await createMaterial({ owner: user, meta, fileName: file.name, bytes });
  return json({ material }, { status: 201 });
});
