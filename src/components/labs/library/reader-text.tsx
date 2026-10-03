import type { ReactNode } from "react";
import { HEADWORD_LINE } from "@/lib/services/material-reader";
import { Badge } from "@/components/ui/badge";

/**
 * The paragraphs of a book page. Plain books are shown as paragraphs; entries of
 * a learner's dictionary (headword line, then Spanish / Meaning / Example …)
 * become small cards so a page can be scanned.
 */

const ENTRY_LINE = /^(Spanish|Meaning|Example|Common|Note):\s*([\s\S]*)$/;
const WORD_LIST_ITEM = /^[A-Za-zÀ-ÿ'’ -]{1,40} \([ABC][12]\)$/;

type Block = { kind: "paragraph"; text: string } | { kind: "entry"; head: RegExpMatchArray; lines: string[] } | { kind: "words"; items: string[] };

function toBlocks(paragraphs: string[]): Block[] {
  const blocks: Block[] = [];
  for (const text of paragraphs) {
    const head = text.match(HEADWORD_LINE);
    const last = blocks[blocks.length - 1];
    if (head) blocks.push({ kind: "entry", head, lines: [] });
    else if (last?.kind === "entry" && (ENTRY_LINE.test(text) || text.startsWith("→"))) last.lines.push(text);
    else if (WORD_LIST_ITEM.test(text)) {
      if (last?.kind === "words") last.items.push(text);
      else blocks.push({ kind: "words", items: [text] });
    } else blocks.push({ kind: "paragraph", text });
  }
  return blocks;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps matches of the searched text in <mark>; the first one gets id="hit" so a link can scroll to it. */
function makeHighlighter(query: string) {
  const q = query.trim();
  let first = true;
  if (q.length < 2) return (text: string): ReactNode => text;
  const pattern = new RegExp(`(${escapeRegExp(q)})`, "ig");
  return (text: string): ReactNode =>
    text.split(pattern).map((part, i) => {
      if (i % 2 === 0) return part;
      const id = first ? "hit" : undefined;
      first = false;
      return (
        <mark key={i} id={id} className="rounded bg-warn-soft px-0.5 text-ink">
          {part}
        </mark>
      );
    });
}

export function ReaderText({ paragraphs, highlight = "" }: { paragraphs: string[]; highlight?: string }) {
  const mark = makeHighlighter(highlight);
  return (
    <div className="space-y-3">
      {toBlocks(paragraphs).map((block, i) => {
        if (block.kind === "entry") {
          const [, word, pronunciation, partOfSpeech, level] = block.head;
          return (
            <article key={i} className="rounded-xl border border-line bg-surface px-4 py-3" data-testid="dictionary-entry">
              <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-xl font-semibold text-ink">{mark(word)}</h3>
                <span className="text-sm text-ink-muted">{pronunciation}</span>
                <Badge tone="neutral">{partOfSpeech}</Badge>
                <Badge tone="brand">{level}</Badge>
              </header>
              <div className="mt-2 space-y-1.5">
                {block.lines.map((line, j) => {
                  const labelled = line.match(ENTRY_LINE);
                  if (!labelled)
                    return (
                      <p key={j} className="pl-3 text-ink-muted italic">
                        {mark(line)}
                      </p>
                    );
                  const [, label, value] = labelled;
                  return (
                    <p key={j} className={label === "Spanish" ? "text-lg font-medium text-brand-ink" : "text-[15px]"}>
                      <span className="mr-2 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{label}</span>
                      {mark(value)}
                    </p>
                  );
                })}
              </div>
            </article>
          );
        }
        if (block.kind === "words") {
          return (
            <ul key={i} className="columns-2 gap-6 text-[15px] sm:columns-3 lg:columns-4">
              {block.items.map((item) => (
                <li key={item} className="break-inside-avoid py-0.5">
                  {mark(item)}
                </li>
              ))}
            </ul>
          );
        }
        const bullet = block.text.startsWith("•");
        return (
          <p key={i} className={bullet ? "pl-5 -indent-4" : undefined}>
            {mark(block.text)}
          </p>
        );
      })}
    </div>
  );
}
