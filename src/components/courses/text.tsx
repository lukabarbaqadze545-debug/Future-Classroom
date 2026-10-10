import type { ReactNode } from "react";
import type { Text } from "@/lib/courses/types";
import type { Locale } from "@/lib/i18n/config";

/** The text in the visitor's language; Georgian when there is no English version. */
export function pick(text: Text, locale: Locale): string {
  return locale === "en" && text.en !== undefined ? text.en : text.ka;
}

/** Whether the English reader would see Georgian here. */
export const isFallback = (text: Text, locale: Locale) => locale === "en" && text.en === undefined;

/** Inline markup: `code`, **bold**, *italic*. */
export function inline(source: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;
  for (let m = pattern.exec(source); m; m = pattern.exec(source)) {
    if (m.index > last) out.push(source.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <code key={key++} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-ink">
          {m[1]}
        </code>,
      );
    } else if (m[2] !== undefined) out.push(<strong key={key++}>{m[2]}</strong>);
    else out.push(<em key={key++}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < source.length) out.push(source.slice(last));
  return out;
}

/** A piece of text with inline markup; blank lines separate paragraphs. */
export function RichText({ text, locale, className }: { text: Text; locale: Locale; className?: string }) {
  const paragraphs = pick(text, locale).split(/\n\s*\n/);
  return (
    <>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className={className}>
          {inline(paragraph)}
        </p>
      ))}
    </>
  );
}
