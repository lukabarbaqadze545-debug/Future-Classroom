import type { SourceInput } from "./model";

/**
 * A simplified APA-style reference built only from what the student typed.
 * Missing parts are left out (never guessed); "n.d." marks a missing date.
 */
export function formatReference(source: Pick<SourceInput, "authors" | "organisation" | "year" | "title" | "publisher" | "url" | "accessed" | "type">, labels: { accessed: string; noDate: string }): string {
  const who = source.authors.trim() || source.organisation.trim();
  const year = source.year.trim() || labels.noDate;
  const parts: string[] = [];
  parts.push(who ? `${who} (${year}).` : `${source.title.trim()} (${year}).`);
  if (who) parts.push(`${source.title.trim()}${/[.?!]$/.test(source.title.trim()) ? "" : "."}`);
  const publisher = source.publisher.trim() && source.publisher.trim() !== who ? source.publisher.trim() : "";
  if (publisher) parts.push(`${publisher}.`);
  if (source.url.trim()) parts.push(source.url.trim() + (source.accessed.trim() ? ` (${labels.accessed} ${source.accessed.trim()})` : ""));
  return parts.join(" ");
}

export function sortReferences<T extends { reference: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.reference.localeCompare(b.reference));
}
