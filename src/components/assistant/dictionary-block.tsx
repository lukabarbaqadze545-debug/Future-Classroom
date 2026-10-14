"use client";

import { useState } from "react";
import Link from "next/link";
import { BookA } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import type { DictionaryResult } from "@/lib/services/dictionary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useWords } from "@/components/vocab/use-words";
import { WordCardView } from "./word-card";

/** How many entries are open at first; the rest wait behind a button. */
const OPEN = 2;

/** The dictionary's answer to a word the question is about: entries first, then ways to look further. */
export function DictionaryBlock({ result, onLookup }: { result: DictionaryResult; onLookup: (text: string) => void }) {
  const { dict } = useI18n();
  const d = dict.assistant.dictionary;
  const { ready, stats } = useWords();
  const [all, setAll] = useState(false);
  const shown = all ? result.matches : result.matches.slice(0, OPEN);
  const hidden = result.matches.length - shown.length;

  return (
    <section className="space-y-3" data-testid="assistant-dictionary" aria-label={d.title}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="flex items-center gap-2 font-semibold">
          <BookA aria-hidden className="size-4 text-brand" />
          {d.title}
        </h2>
        {result.matches.length ? <Badge tone="brand">{d.direction[result.direction]}</Badge> : null}
        {ready && stats.total > 0 ? (
          <Link href="/learning-assistant/words" className="ml-auto text-sm font-medium text-brand hover:underline" data-testid="dictionary-my-words">
            {d.myWords} ({stats.total})
          </Link>
        ) : null}
      </div>

      {result.matches.length === 0 ? (
        <Notice tone="warn" title={fmt(d.noEntry, { word: result.query })} className="mb-0">
          {result.suggestions.length ? (
            <div className="flex flex-wrap items-center gap-2" data-testid="dictionary-suggestions">
              <span>{d.didYouMean}</span>
              {result.suggestions.map((s) => (
                <button key={s.word} type="button" onClick={() => onLookup(s.word)} className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink hover:border-brand/40 hover:bg-brand-soft/40">
                  {s.word} <span className="font-normal text-ink-muted">· {s.spanish}</span>
                </button>
              ))}
            </div>
          ) : null}
        </Notice>
      ) : (
        <div className="space-y-3">
          {shown.map((m) => (
            <WordCardView key={m.card.word} card={m.card} how={m.how} via={m.via} onLookup={onLookup} />
          ))}
          {hidden > 0 || all ? (
            result.matches.length > OPEN ? (
              <Button variant="secondary" size="sm" onClick={() => setAll((v) => !v)} aria-expanded={all}>
                {all ? d.showLess : fmtCount(d.showMore, hidden)}
              </Button>
            ) : null
          ) : null}
        </div>
      )}
      <p className="text-xs text-ink-subtle">{d.honesty}</p>
    </section>
  );
}
