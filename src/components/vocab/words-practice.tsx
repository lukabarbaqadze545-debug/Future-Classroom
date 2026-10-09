"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Layers, ListChecks, RotateCcw, Trash2, Volume2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { api } from "@/lib/client/api";
import { practiceRound, TOP_BOX, type SavedWord } from "@/lib/vocab/model";
import type { WordCard } from "@/lib/services/dictionary";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";
import { award } from "@/components/engagement/store";
import { WordCardView } from "@/components/assistant/word-card";
import { speak, useCanSpeak } from "@/components/assistant/speak";
import { forgetWord, gradeWord, saveWords } from "./store";
import { useWords } from "./use-words";

type Direction = "en-es" | "es-en";
type Mode = "cards" | "choice";

interface Round {
  mode: Mode;
  direction: Direction;
  queue: string[];
  index: number;
  revealed: boolean;
  picked: string | null;
  options: string[];
  results: { word: string; correct: boolean }[];
}

const ROUND = 10;

const shuffle = <T,>(list: T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** What a card answers with in a direction: the Spanish when asked for Spanish, the English word otherwise. */
const answerOf = (card: WordCard, direction: Direction) => (direction === "en-es" ? card.translations[0]?.text ?? card.spanish : card.word);

/** Three wrong answers (the same part of speech first) and the right one, in random order. */
function optionsFor(card: WordCard, direction: Direction, pool: WordCard[]): string[] {
  const correct = answerOf(card, direction);
  const others = pool.filter((c) => c.word !== card.word && answerOf(c, direction) !== correct);
  const same = shuffle(others.filter((c) => c.pos[0] === card.pos[0]));
  const rest = shuffle(others.filter((c) => c.pos[0] !== card.pos[0]));
  const wrong = [...new Set([...same, ...rest].map((c) => answerOf(c, direction)))].slice(0, 3);
  return shuffle([correct, ...wrong]);
}

function Stat({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]">
      <dd className="text-3xl font-semibold tracking-tight text-ink tabular-nums" data-testid={testId}>
        {value}
      </dd>
      <dt className="mt-0.5 text-sm text-ink-muted">{label}</dt>
    </div>
  );
}

/** The cards of the saved words, asked for once and kept while this page is open. */
function useCards(words: string[]): Record<string, WordCard> {
  const [cards, setCards] = useState<Record<string, WordCard>>({});
  const missing = words.filter((w) => !(w in cards));
  const key = missing.join("|");
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await api<{ cards: WordCard[] }>("/api/learning-assistant/words", { body: { words: key.split("|").slice(0, 200) } });
        if (!cancelled) setCards((previous) => ({ ...previous, ...Object.fromEntries(response.cards.map((c) => [c.word, c])) }));
      } catch {
        // The list still shows the words; they just have no entry to practise from.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);
  return cards;
}

export interface WordsPracticeProps {
  /** Whether this person can open a dictionary at all. */
  available: boolean;
  /** Today's words, the same for everyone. */
  daily: WordCard[];
  /** More words, used only as wrong answers when choosing. */
  pool: WordCard[];
}

export function WordsPractice({ available, daily, pool }: WordsPracticeProps) {
  const { dict } = useI18n();
  const w = dict.assistant.words;
  const { ready, words, today, stats, has } = useWords();
  const cards = useCards(useMemo(() => words.map((x) => x.word), [words]));
  const [mode, setMode] = useState<Mode>("cards");
  const [direction, setDirection] = useState<Direction>("en-es");
  const [round, setRound] = useState<Round | null>(null);
  const canSpeak = useCanSpeak();

  const choicePool = useMemo(() => {
    const byWord = new Map<string, WordCard>();
    for (const c of [...Object.values(cards), ...daily, ...pool]) byWord.set(c.word, c);
    return [...byWord.values()];
  }, [cards, daily, pool]);
  const canChoose = choicePool.length >= 4;

  const start = (anyway: boolean) => {
    const queue = practiceRound({ v: 1, words }, today, ROUND, anyway)
      .map((x) => x.word)
      .filter((word) => cards[word]);
    if (queue.length === 0) return;
    const chosenMode: Mode = mode === "choice" && canChoose ? "choice" : "cards";
    setRound({
      mode: chosenMode,
      direction,
      queue,
      index: 0,
      revealed: false,
      picked: null,
      options: chosenMode === "choice" ? optionsFor(cards[queue[0]], direction, choicePool) : [],
      results: [],
    });
  };

  const record = (current: Round, correct: boolean) => {
    const word = current.queue[current.index];
    gradeWord(word, correct);
    if (correct) award({ kind: "word" });
    return [...current.results, { word, correct }];
  };

  const advance = (current: Round, results: Round["results"]) => {
    const index = current.index + 1;
    const nextWord = current.queue[index];
    setRound({
      ...current,
      results,
      index,
      revealed: false,
      picked: null,
      options: nextWord && current.mode === "choice" ? optionsFor(cards[nextWord], current.direction, choicePool) : [],
    });
  };

  const gradeCard = (correct: boolean) => {
    if (!round) return;
    advance(round, record(round, correct));
  };

  const choose = (option: string) => {
    if (!round || round.picked !== null) return;
    const card = cards[round.queue[round.index]];
    const results = record(round, option === answerOf(card, round.direction));
    setRound({ ...round, picked: option, results });
  };

  const finished = round !== null && round.index >= round.queue.length;
  const dueLabel = (word: SavedWord) => (word.due <= today ? w.due : fmtCount(w.inDays, Math.max(1, Math.round((Date.parse(word.due) - Date.parse(today)) / 86_400_000))));

  if (!available) {
    return (
      <div data-testid="words-unavailable">
        <Notice tone="info">{w.unavailable}</Notice>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="words-practice">
      {/* ---- numbers ---- */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={w.stats.total} value={ready ? stats.total : 0} testId="words-stat-total" />
        <Stat label={w.stats.due} value={ready ? stats.due : 0} testId="words-stat-due" />
        <Stat label={w.stats.learning} value={ready ? stats.learning : 0} testId="words-stat-learning" />
        <Stat label={w.stats.known} value={ready ? stats.known : 0} testId="words-stat-known" />
      </dl>

      {/* ---- practice ---- */}
      <section className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-7" aria-label={w.practice.replace(" ({n})", "")}>
        {round === null ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-muted">{w.modeLabel}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["cards", "choice"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={mode === m}
                      onClick={() => setMode(m)}
                      data-testid={`words-mode-${m}`}
                      className={cn("flex h-12 items-center justify-center gap-2 rounded-xl border text-[15px] font-medium transition-colors", mode === m ? "border-brand bg-brand-soft/60 text-brand-ink" : "border-line hover:border-brand/40")}
                    >
                      {m === "cards" ? <Layers aria-hidden className="size-4" /> : <ListChecks aria-hidden className="size-4" />}
                      {w.modes[m]}
                    </button>
                  ))}
                </div>
                {mode === "choice" && !canChoose ? <p className="mt-2 text-sm text-ink-muted">{w.choiceNeedsMore}</p> : null}
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-muted">{w.directions[direction]}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["en-es", "es-en"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={direction === d}
                      onClick={() => setDirection(d)}
                      data-testid={`words-direction-${d}`}
                      className={cn("flex h-12 items-center justify-center rounded-xl border text-[15px] font-medium transition-colors", direction === d ? "border-brand bg-brand-soft/60 text-brand-ink" : "border-line hover:border-brand/40")}
                    >
                      {w.directions[d]}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            {ready && stats.total === 0 ? (
              <div data-testid="words-empty">
                <Notice tone="info">{w.empty}</Notice>
              </div>
            ) : ready && stats.due === 0 ? (
              <div data-testid="words-none-due">
                <Notice tone="success">{w.nothingDue}</Notice>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => start(false)} disabled={!ready || stats.due === 0 || Object.keys(cards).length === 0} data-testid="words-start">
                {fmt(w.practice, { n: ready ? stats.due : 0 })}
              </Button>
              {ready && stats.total > 0 && stats.due === 0 ? (
                <Button size="lg" variant="secondary" onClick={() => start(true)} disabled={Object.keys(cards).length === 0} data-testid="words-start-anyway">
                  {w.practiceAnyway}
                </Button>
              ) : null}
              <ButtonLink href="/learning-assistant" variant="ghost" size="lg">
                {w.lookUp}
              </ButtonLink>
            </div>
            <p className="text-xs text-ink-subtle">{w.xpNote}</p>
          </div>
        ) : finished ? (
          <div className="space-y-5" data-testid="words-done">
            <h2 className="text-xl font-semibold">{w.roundDone}</h2>
            <p className="text-lg" data-testid="words-result">
              {fmt(w.roundResult, { known: round.results.filter((r) => r.correct).length, total: round.results.length })}
            </p>
            {round.results.some((r) => !r.correct) ? (
              <div>
                <h3 className="text-sm font-semibold">{w.roundMissed}</h3>
                <ul className="mt-2 space-y-1.5">
                  {round.results
                    .filter((r) => !r.correct)
                    .map((r) => (
                      <li key={r.word} className="rounded-xl border border-line px-3.5 py-2.5 text-[15px]">
                        <span className="font-semibold">{r.word}</span> <span className="text-ink-muted">· {cards[r.word]?.spanish}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setRound(null);
                  start(stats.due === 0);
                }}
                data-testid="words-again"
              >
                <RotateCcw aria-hidden className="size-4" />
                {w.roundAgain}
              </Button>
              <Button variant="secondary" onClick={() => setRound(null)} data-testid="words-close">
                {w.listTitle}
              </Button>
            </div>
          </div>
        ) : (
          <RoundView round={round} card={cards[round.queue[round.index]]} canSpeak={canSpeak} onShow={() => setRound({ ...round, revealed: true })} onGrade={gradeCard} onChoose={choose} onNext={() => advance(round, round.results)} />
        )}
      </section>

      {/* ---- all my words ---- */}
      <section aria-labelledby="words-list-title">
        <h2 id="words-list-title" className="mb-3 text-lg font-semibold">
          {w.listTitle}
        </h2>
        {ready && words.length === 0 ? (
          <p className="text-sm text-ink-muted">{w.empty}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2" data-testid="words-list">
            {words.map((word) => (
              <li key={word.word} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3" data-testid="words-list-item" data-word={word.word}>
                <div className="min-w-0 flex-1">
                  <Link href={`/learning-assistant?q=${encodeURIComponent(word.word)}`} className="font-semibold text-ink hover:text-brand hover:underline">
                    {word.word}
                  </Link>
                  <p className="truncate text-sm text-ink-muted" lang="es">
                    {cards[word.word]?.spanish ?? "…"}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
                    <span aria-label={fmt(w.box, { n: word.box })} className="flex gap-0.5">
                      {Array.from({ length: TOP_BOX }, (_, i) => (
                        <span key={i} aria-hidden className={cn("h-1.5 w-4 rounded-full", i < word.box ? "bg-brand-solid" : "bg-line-strong")} />
                      ))}
                    </span>
                    <span>{dueLabel(word)}</span>
                    {word.reviews > 0 ? <span>· {fmtCount(w.reviews, word.reviews)}</span> : null}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => forgetWord(word.word)} aria-label={fmt(w.removeWord, { word: word.word })} data-testid="words-remove">
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- today's words ---- */}
      {daily.length ? (
        <section aria-labelledby="words-daily-title" data-testid="words-daily">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="words-daily-title" className="text-lg font-semibold">
                {w.todayTitle}
              </h2>
              <p className="text-sm text-ink-muted">{w.todayLead}</p>
            </div>
            {ready && daily.some((c) => !has(c.word)) ? (
              <Button variant="secondary" size="sm" onClick={() => saveWords(daily.map((c) => c.word))} data-testid="words-save-all">
                {w.addAll}
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {daily.map((card) => (
              <WordCardView key={card.word} card={card} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-sm text-ink-subtle">{w.deviceNote}</p>
    </div>
  );
}

/* --------------------------------- a round --------------------------------- */

function RoundView({
  round,
  card,
  canSpeak,
  onShow,
  onGrade,
  onChoose,
  onNext,
}: {
  round: Round;
  card: WordCard | undefined;
  canSpeak: boolean;
  onShow: () => void;
  onGrade: (correct: boolean) => void;
  onChoose: (option: string) => void;
  onNext: () => void;
}) {
  const { dict } = useI18n();
  const w = dict.assistant.words;
  if (!card) return null;
  const asking = round.direction === "en-es";
  const front = asking ? card.word : card.translations[0]?.text ?? card.spanish;
  const answer = answerOf(card, round.direction);
  const answered = round.mode === "cards" ? round.revealed : round.picked !== null;
  const lastWasRight = round.results.at(-1)?.correct;

  return (
    <div className="space-y-5" data-testid="words-round" data-mode={round.mode}>
      <div>
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span data-testid="words-progress">{fmt(w.progress, { i: round.index + 1, n: round.queue.length })}</span>
          <Badge>{w.directions[round.direction]}</Badge>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={round.queue.length} aria-valuenow={round.index}>
          <div className="h-full rounded-full bg-brand-solid transition-[width] duration-300" style={{ width: `${(round.index / round.queue.length) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-night px-5 py-8 text-center text-white sm:py-10" data-testid="words-front">
        <p className="text-sm text-white/60">{asking ? w.askEnEs : w.askEsEn}</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight break-words sm:text-5xl" lang={asking ? "en" : "es"}>
          {front}
        </p>
        {asking ? <p className="mt-1.5 text-sm text-white/60">{card.ipa}</p> : null}
        {canSpeak && asking ? (
          <button type="button" onClick={() => speak(card.word, "en")} aria-label={fmt(dict.assistant.dictionary.listenWord, { word: card.word })} className="mx-auto mt-4 flex size-10 items-center justify-center rounded-full border border-white/20 text-white/80 hover:bg-white/10">
            <Volume2 aria-hidden className="size-4.5" />
          </button>
        ) : null}
      </div>

      {round.mode === "choice" ? (
        <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-label={asking ? w.askEnEs : w.askEsEn}>
          {round.options.map((option) => {
            const picked = round.picked === option;
            const right = option === answer;
            return (
              <button
                key={option}
                type="button"
                disabled={round.picked !== null}
                onClick={() => onChoose(option)}
                data-testid="words-option"
                data-state={round.picked === null ? "open" : right ? "right" : picked ? "wrong" : "idle"}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition-colors",
                  round.picked === null && "border-line bg-surface hover:border-brand/50 hover:bg-brand-soft/30",
                  round.picked !== null && right && "border-success/50 bg-success-soft text-success",
                  round.picked !== null && picked && !right && "border-danger/50 bg-danger-soft text-danger",
                  round.picked !== null && !picked && !right && "border-line bg-surface opacity-60",
                )}
              >
                <span lang={asking ? "es" : "en"}>{option}</span>
                {round.picked !== null && right ? <Check aria-hidden className="size-4.5 shrink-0" /> : null}
                {round.picked !== null && picked && !right ? <X aria-hidden className="size-4.5 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : round.revealed ? (
        <div className="rounded-2xl border border-brand/25 bg-brand-soft/30 px-5 py-4" data-testid="words-back">
          <p className="text-2xl font-semibold" lang={asking ? "es" : "en"} data-testid="words-answer">
            {asking ? card.spanish : card.word}
          </p>
          <p className="mt-2 text-[15px]" lang="en">
            {card.meaning}
          </p>
          <p className="mt-1.5 text-[15px] text-ink-muted" lang="en">
            {card.example}
          </p>
        </div>
      ) : null}

      {round.mode === "choice" && answered ? (
        <div className="space-y-3">
          <p className={cn("font-medium", lastWasRight ? "text-success" : "text-danger")} role="status" data-testid="words-feedback">
            {lastWasRight ? w.correct : fmt(w.wrong, { answer })}
          </p>
          <div className="rounded-2xl border border-line px-4 py-3 text-[15px]">
            <p lang="en">{card.meaning}</p>
            <p className="mt-1 text-ink-muted" lang="en">
              {card.example}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {round.mode === "cards" && !round.revealed ? (
          <Button size="lg" onClick={onShow} data-testid="words-show">
            {w.show}
          </Button>
        ) : null}
        {round.mode === "cards" && round.revealed ? (
          <>
            <Button size="lg" variant="success" onClick={() => onGrade(true)} data-testid="words-knew">
              <Check aria-hidden className="size-4.5" />
              {w.knew}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => onGrade(false)} data-testid="words-missed">
              {w.missed}
            </Button>
          </>
        ) : null}
        {round.mode === "choice" && answered ? (
          <Button size="lg" onClick={onNext} data-testid="words-next">
            {w.next}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
