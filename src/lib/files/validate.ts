import { ApiError } from "@/lib/http/errors";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type MaterialKind = "pdf" | "docx" | "text";

const EXTENSIONS: Record<string, { kind: MaterialKind; mime: string }> = {
  pdf: { kind: "pdf", mime: "application/pdf" },
  docx: { kind: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  txt: { kind: "text", mime: "text/plain; charset=utf-8" },
  md: { kind: "text", mime: "text/markdown; charset=utf-8" },
};

export const ACCEPTED_EXTENSIONS = Object.keys(EXTENSIONS).map((ext) => `.${ext}`);

/** Strips paths and unusual characters from a user-supplied file name. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "file";
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, i) => bytes[i] === value);
}

/**
 * Validates an upload by extension AND content (magic bytes). The browser's
 * declared MIME type is not trusted.
 */
export function validateUpload(fileName: string, bytes: Uint8Array): { kind: MaterialKind; mime: string; extension: string } {
  if (bytes.byteLength === 0) throw new ApiError(400, "file_invalid", "The file is empty.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new ApiError(413, "file_too_large");
  const extension = sanitizeFileName(fileName).split(".").pop()?.toLowerCase() ?? "";
  const expected = EXTENSIONS[extension];
  if (!expected) throw new ApiError(415, "file_type_not_allowed");

  switch (expected.kind) {
    case "pdf":
      if (!startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) throw new ApiError(415, "file_invalid", "Not a valid PDF file.");
      break;
    case "docx":
      // DOCX is a ZIP container ("PK\x03\x04").
      if (!startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) throw new ApiError(415, "file_invalid", "Not a valid DOCX file.");
      break;
    case "text": {
      const sample = bytes.subarray(0, Math.min(bytes.byteLength, 8192));
      if (sample.includes(0)) throw new ApiError(415, "file_invalid", "Text files must not contain binary data.");
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(sample.byteLength < bytes.byteLength ? sample.subarray(0, sample.byteLength - 4) : sample);
      } catch {
        throw new ApiError(415, "file_invalid", "Text files must be UTF-8 encoded.");
      }
      break;
    }
  }
  return { kind: expected.kind, mime: expected.mime, extension };
}

const IMAGE_TYPES: Record<string, { mime: string; signature: number[][] }> = {
  png: { mime: "image/png", signature: [[0x89, 0x50, 0x4e, 0x47]] },
  jpg: { mime: "image/jpeg", signature: [[0xff, 0xd8, 0xff]] },
  jpeg: { mime: "image/jpeg", signature: [[0xff, 0xd8, 0xff]] },
  webp: { mime: "image/webp", signature: [[0x52, 0x49, 0x46, 0x46]] },
};

export const ATTACHMENT_EXTENSIONS = [...ACCEPTED_EXTENSIONS, ".png", ".jpg", ".jpeg", ".webp"];
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Student attachments: the document types above plus photos (checked by content). */
export function validateAttachment(fileName: string, bytes: Uint8Array): { mime: string; extension: string; isImage: boolean } {
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new ApiError(413, "file_too_large");
  const extension = sanitizeFileName(fileName).split(".").pop()?.toLowerCase() ?? "";
  const image = IMAGE_TYPES[extension];
  if (image) {
    if (bytes.byteLength === 0 || !image.signature.some((sig) => startsWith(bytes, sig))) throw new ApiError(415, "file_invalid");
    return { mime: image.mime, extension, isImage: true };
  }
  const doc = validateUpload(fileName, bytes);
  return { mime: doc.mime, extension: doc.extension, isImage: false };
}
