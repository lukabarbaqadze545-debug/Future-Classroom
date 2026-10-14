"use client";

import Link from "next/link";
import { ArrowRight, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { WordCard } from "@/lib/services/dictionary";
import { SaveWordButton } from "@/components/assistant/word-card";
import { speak, useCanSpeak } from "@/components/assistant/speak";
import { useWords } from "@/components/vocab/use-words";

/** The word of the day from the school dictionary, with a way to keep it and a way on to practising. */
export function WordOfTheDay({ card }: { card: WordCard }) {
  const { dict } = useI18n();
  const w = dict.assistant.words;
  const d = dict.assistant.dictionary;
  const can = useCanSpeak();
  const { ready, stats } = useWords();
  return (
    <section className="fc-rise fc-spotlight rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6" style={{ "--i": 3 } as React.CSSProperties} data-testid="word-of-day" aria-label={w.wordOfDay}>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-ink-subtle uppercase">{w.wordOfDay}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-3xl font-semibold tracking-tight text-ink" data-testid="word-of-day-word">
              {card.word}
            </h2>
            {can ? (
              <button type="button" onClick={() => speak(card.word, "en")} aria-label={fmt(d.listenWord, { word: card.word })} className="flex size-9 items-center justify-center rounded-full border border-line text-ink-muted hover:border-brand/40 hover:bg-brand-soft hover:text-brand">
                <Volume2 aria-hidden className="size-4" />
              </button>
            ) : null}
            <span className="text-sm text-ink-muted">{card.ipa}</span>
          </div>
          <p className="mt-1.5 text-xl font-medium text-brand" lang="es">
            {card.spanish}
          </p>
          <p className="mt-3 text-[15px] text-ink" lang="en">
            {card.meaning}
          </p>
          <p className="mt-1.5 text-[15px] text-ink-muted" lang="en">
            “{card.example}”
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          <SaveWordButton word={card.word} className="justify-center" />
          <Link href="/learning-assistant/words" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium text-ink hover:border-brand/40 hover:bg-brand-soft/40" data-testid="word-of-day-more">
            {ready && stats.due > 0 ? fmt(w.dueBadge, { n: stats.due }) : w.wordOfDayCta}
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
