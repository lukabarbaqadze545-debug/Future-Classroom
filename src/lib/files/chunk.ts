import type { ExtractedPage } from "./extract";

/** Removes Markdown syntax that would look like noise in quoted passages. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

const HEADING = /^\s{0,3}#{1,6}\s+/;

/**
 * Splits text into chunks of roughly `size` characters. Markdown headings
 * start a new chunk, so each passage stays about one idea — this makes
 * retrieval and citations more precise. Chunks are the unit of retrieval
 * and citation.
 */
export function chunkPages(pages: ExtractedPage[], size = 900): { page: number | null; content: string }[] {
  const chunks: { page: number | null; content: string }[] = [];
  for (const { page, text } of pages) {
    const paragraphs = text
      .replace(/\r\n?/g, "\n")
      .split(/\n\s*\n|\n(?=\s{0,3}#{1,6}\s)/)
      .map((p) => p.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean);
    let current = "";
    const flush = () => {
      const content = stripMarkdown(current).trim();
      if (content) chunks.push({ page, content });
      current = "";
    };
    for (const paragraph of paragraphs) {
      if (HEADING.test(paragraph)) flush();
      if (paragraph.length > size) {
        flush();
        const sentences = paragraph.split(/(?<=[.!?։])\s+/);
        for (const sentence of sentences) {
          if ((current + " " + sentence).length > size) flush();
          current = current ? `${current} ${sentence}` : sentence;
        }
        flush();
        continue;
      }
      if ((current + "\n\n" + paragraph).length > size) flush();
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
    flush();
  }
  return chunks;
}
