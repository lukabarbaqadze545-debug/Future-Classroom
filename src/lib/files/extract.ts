import type { MaterialKind } from "./validate";
import type { DocumentFormat, SourcePage } from "@/lib/knowledge/ingest";

export type ExtractedPage = SourcePage;

interface PositionedText {
  str: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
}

/**
 * Rebuild a PDF page's lines from positioned text. PDFs store fragments, not
 * lines; grouping by vertical position recovers the line structure that
 * heading detection and hyphenation repair need.
 */
export function itemsToLines(items: readonly PositionedText[]): string {
  const rows = new Map<number, PositionedText[]>();
  for (const item of items) {
    if (!item.str) continue;
    // Bucket to 2 units so a slightly offset glyph stays on its line.
    const key = Math.round(item.y / 2) * 2;
    const row = rows.get(key);
    if (row) row.push(item);
    else rows.set(key, [item]);
  }
  return [...rows.entries()]
    // PDF y grows upwards: descending y is reading order.
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => {
      row.sort((a, b) => a.x - b.x);
      let line = "";
      let end = -Infinity;
      for (const cell of row) {
        const gap = cell.x - end;
        if (line && gap > Math.max(1, cell.fontSize * 0.15) && !/\s$/.test(line) && !/^\s/.test(cell.str)) line += " ";
        line += cell.str;
        end = cell.x + cell.width;
      }
      return line.replace(/\s+/g, " ").trim();
    })
    .filter(Boolean)
    .join("\n");
}

/** Word headings become Markdown headings, so the document keeps its structure. */
function htmlToMarkdown(html: string): string {
  const decode = (s: string) =>
    s
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();
  return html
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level: string, body: string) => `\n\n${"#".repeat(Number(level))} ${decode(body)}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, body: string) => `\n- ${decode(body)}\n`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, body: string) => `\n\n${decode(body)}\n\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts text from an uploaded document so it can be indexed. Scanned PDFs
 * (images only) yield no text — the material is still stored and marked
 * "no text" rather than failing. Pages are numbered only when the document
 * has pages (PDF).
 */
export async function extractText(kind: MaterialKind, bytes: Uint8Array, fileName = ""): Promise<{ pages: ExtractedPage[]; pageCount: number | null; format: DocumentFormat }> {
  switch (kind) {
    case "text": {
      const text = new TextDecoder("utf-8").decode(bytes);
      return { pages: [{ page: null, text }], pageCount: null, format: /\.(md|markdown)$/i.test(fileName) ? "markdown" : "plain" };
    }
    case "docx": {
      const mammoth = await import("mammoth");
      try {
        const html = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
        return { pages: [{ page: null, text: htmlToMarkdown(html.value) }], pageCount: null, format: "markdown" };
      } catch {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
        return { pages: [{ page: null, text: result.value }], pageCount: null, format: "plain" };
      }
    }
    case "pdf": {
      const { extractTextItems, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      const { totalPages, items } = await extractTextItems(pdf);
      return { pages: items.map((pageItems, i) => ({ page: i + 1, text: itemsToLines(pageItems) })), pageCount: totalPages, format: "pdf" };
    }
  }
}
