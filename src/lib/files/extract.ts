import "server-only";
import type { MaterialKind } from "./validate";

export interface ExtractedPage {
  page: number | null;
  text: string;
}

/**
 * Extracts plain text from an uploaded document so it can be indexed for
 * search. Scanned PDFs (images only) yield no text — the material is still
 * stored and marked "no text" rather than failing.
 */
export async function extractText(kind: MaterialKind, bytes: Uint8Array): Promise<{ pages: ExtractedPage[]; pageCount: number | null }> {
  switch (kind) {
    case "text": {
      const text = new TextDecoder("utf-8").decode(bytes);
      return { pages: [{ page: null, text }], pageCount: null };
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      return { pages: [{ page: null, text: result.value }], pageCount: null };
    }
    case "pdf": {
      const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      const { totalPages, text } = await extractPdfText(pdf, { mergePages: false });
      return { pages: text.map((pageText, i) => ({ page: i + 1, text: pageText })), pageCount: totalPages };
    }
  }
}
