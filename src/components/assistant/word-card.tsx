"use client";

import Link from "next/link";
import { BookOpen, Check, Plus, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { MatchKind } from "@/lib/knowledge/dictionary";
import type { WordCard } from "@/lib/services/dictionary";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";
import { forgetWord, saveWord } from "@/components/vocab/store";
import { useWords } from "@/components/vocab/use-words";
import { speak, useCanSpeak } from "./speak";

/** A small round button that reads something aloud. */
function ListenButton({ text, language, label, testId }: { text: string; language: "en" | "es"; label: string; testId?: string }) {
  const can = useCanSpeak();
  if (!can) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text, language)}
      aria-label={label}
      title={label}
      data-testid={testId}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
    >
      <Volume2 aria-hidden className="size-4" />
    </button>
  );
}

/** Saves the word to "My words" on this device, or takes it out again. */
export function SaveWordButton({ word, className }: { word: string; className?: string }) {
  const { dict } = useI18n();
  const d = dict.assistant.dictionary;
  const { ready, has } = useWords();
  const saved = ready && has(word);
  return (
    <button
      type="button"
      onClick={() => (saved ? forgetWord(word) : saveWord(word))}
      aria-pressed={saved}
      disabled={!ready}
      data-testid="word-save"
      data-saved={saved ? "yes" : "no"}
      title={saved ? dict.assistant.words.removeWord.replace("{word}", word) : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors disabled:opacity-60",
        saved ? "border-success/30 bg-success-soft text-success hover:bg-success-soft/70" : "border-brand/30 bg-brand-soft text-brand-ink hover:bg-brand-soft/70",
        className,
      )}
    >
      {saved ? <Check aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
      {saved ? d.saved : d.save}
    </button>
  );
}

export interface WordCardViewProps {
  card: WordCard;
  /** How the word was found; shown only when it was not the headword itself. */
  how?: MatchKind;
  via?: string | null;
  /** Called with a phrase when it is pressed; without it, phrases are plain text. */
  onLookup?: (text: string) => void;
  className?: string;
}

/** One dictionary entry, exactly as the book prints it, with the ways to listen to it and keep it. */
export function WordCardView({ card, how = "headword", via = null, onLookup, className }: WordCardViewProps) {
  const { dict } = useI18n();
  const d = dict.assistant.dictionary;
  const levelName = d.levels[card.level] ?? "";
  const label = how !== "headword" ? fmt(d.how[how], { via: via ?? "" }) : null;

  return (
    <article className={cn("rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]", className)} data-testid="word-card" data-word={card.word} data-how={how}>
      {label ? (
        <p className="mb-3 inline-flex rounded-lg bg-warn-soft/60 px-2.5 py-1 text-sm text-ink-muted" data-testid="word-how">
          {label}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <Badge tone="brand" className="font-semibold" >
              <span title={fmt(d.levelTitle, { level: card.level, name: levelName })}>{card.level}</span>
            </Badge>
            {card.pos.map((pos) => (
              <Badge key={pos}>{pos}</Badge>
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-3xl font-semibold tracking-tight break-words text-ink" data-testid="word-headword">
              {card.word}
            </h3>
            <ListenButton text={card.word} language="en" label={fmt(d.listenWord, { word: card.word })} testId="word-listen" />
          </div>
          <p className="mt-0.5 text-sm text-ink-muted" lang="en">
            {card.ipa}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveWordButton word={card.word} />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand/20 bg-brand-soft/30 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{d.spanish}</p>
          <p className="mt-0.5 text-xl font-semibold text-ink" lang="es" data-testid="word-spanish">
            {card.spanish}
          </p>
          {card.translations.some((t) => t.note) ? (
            <p className="mt-0.5 text-sm text-ink-muted">{card.translations.filter((t) => t.note).map((t) => `${t.text}: ${t.note}`).join(" · ")}</p>
          ) : null}
        </div>
        <ListenButton text={card.translations[0]?.text ?? card.spanish} language="es" label={d.listenSpanish} />
      </div>

      <dl className="mt-4 space-y-3 text-[15px]">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{d.meaning}</dt>
          <dd className="mt-0.5 text-ink" lang="en">
            {card.meaning}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{d.example}</dt>
          <dd className="mt-0.5 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-ink" lang="en">
                {card.example}
              </p>
              <p className="mt-0.5 text-ink-muted" lang="es">
                → {card.exampleEs}
              </p>
            </div>
            <ListenButton text={card.example} language="en" label={d.listenExample} />
          </dd>
        </div>
        {card.common.length ? (
          <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{d.common}</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5" lang="en">
              {card.common.map((phrase) =>
                onLookup ? (
                  <button key={phrase} type="button" onClick={() => onLookup(phrase)} className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink hover:border-brand/40 hover:bg-brand-soft/40">
                    {phrase}
                  </button>
                ) : (
                  <span key={phrase} className="rounded-full border border-line px-3 py-1 text-sm text-ink">
                    {phrase}
                  </span>
                ),
              )}
            </dd>
          </div>
        ) : null}
        {card.note ? (
          <div className="rounded-xl border border-warn/25 bg-warn-soft/40 px-3.5 py-2.5">
            <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{d.note}</dt>
            <dd className="mt-0.5 text-ink">{card.note}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-sm text-ink-muted">
        <span className="min-w-0 break-words">{fmt(d.from, { title: card.source.title })}</span>
        {card.source.href ? (
          <Link href={card.source.href} className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline" data-testid="word-open-book">
            <BookOpen aria-hidden className="size-4" />
            {d.open}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
