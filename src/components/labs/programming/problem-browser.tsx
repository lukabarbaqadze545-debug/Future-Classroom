"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { BookmarkCheck, CheckCircle2, CircleDot, Circle } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { tr, type L } from "@/lib/labs/localized";
import { PROG_TOPICS, type ProgLevel, type ProgTopic } from "@/lib/labs/programming/types";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Meter } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/components/ui/cn";
import { Stars } from "../lab-shell";

export interface ProblemSummary {
  id: string;
  kind: "code" | "predict" | "choice";
  level: ProgLevel;
  topic: ProgTopic;
  difficulty: 1 | 2 | 3;
  title: L;
  authorName: string | null;
  status: "solved" | "attempted" | null;
  bookmarked: boolean;
}

const LANG_KEY = "fc:prog-lang";
const langListeners = new Set<() => void>();
export function readProgLanguage(): "python" | "cpp" {
  try {
    return window.localStorage.getItem(LANG_KEY) === "cpp" ? "cpp" : "python";
  } catch {
    return "python";
  }
}
export function writeProgLanguage(lang: "python" | "cpp") {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage unavailable: the choice lasts for this page only.
  }
  langListeners.forEach((l) => l());
}
export function useProgLanguage(): "python" | "cpp" {
  return useSyncExternalStore(
    (listener) => {
      langListeners.add(listener);
      return () => langListeners.delete(listener);
    },
    readProgLanguage,
    () => "python",
  );
}

export function ProblemBrowser({ problems, progress }: { problems: ProblemSummary[]; progress: { level: number; total: number; solved: number }[] }) {
  const { dict, locale } = useI18n();
  const p = dict.labs.programming;
  const [level, setLevel] = useState<"all" | "1" | "2" | "3" | "4">("all");
  const [topic, setTopic] = useState<ProgTopic | "">("");
  const [status, setStatus] = useState<"all" | "unsolved" | "solved" | "bookmarked">("all");
  const language = useProgLanguage();

  const filtered = useMemo(
    () =>
      problems.filter(
        (x) =>
          (level === "all" || x.level === Number(level)) &&
          (!topic || x.topic === topic) &&
          (status === "all" || (status === "solved" ? x.status === "solved" : status === "unsolved" ? x.status !== "solved" : x.bookmarked)),
      ),
    [problems, level, topic, status],
  );
  const usedTopics = PROG_TOPICS.filter((t) => problems.some((x) => x.topic === t));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {progress.map((lv) => {
          const info = p.levels[lv.level as ProgLevel];
          return (
            <button
              key={lv.level}
              type="button"
              onClick={() => setLevel(level === String(lv.level) ? "all" : (String(lv.level) as "1"))}
              className={cn(
                "rounded-2xl border bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-colors",
                level === String(lv.level) ? "border-lab-programming ring-2 ring-lab-programming/20" : "border-line hover:border-line-strong",
              )}
              aria-pressed={level === String(lv.level)}
            >
              <p className="text-xs font-semibold tracking-wide text-lab-programming uppercase">{fmt(dict.labs.common.level, { n: lv.level })}</p>
              <p className="mt-1 font-semibold">{info.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{info.text}</p>
              <p className="mt-3 text-xs text-ink-subtle">{fmt(p.solvedCount, { solved: lv.solved, total: lv.total })}</p>
              <Meter value={lv.total ? (lv.solved / lv.total) * 100 : 0} className="mt-1.5" tone="success" />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 lg:flex-row lg:items-center">
        <Tabs
          value={status}
          onChange={setStatus}
          tabs={(["all", "unsolved", "solved", "bookmarked"] as const).map((id) => ({ id, label: p.filterStatus[id] }))}
          className="lg:flex-1"
        />
        <Select aria-label={p.topic} value={topic} onChange={(e) => setTopic(e.target.value as ProgTopic | "")} className="lg:w-56">
          <option value="">{p.allTopics}</option>
          {usedTopics.map((t) => (
            <option key={t} value={t}>
              {p.topics[t]}
            </option>
          ))}
        </Select>
        <div role="group" aria-label={p.language} className="inline-flex rounded-xl border border-line-strong p-1">
          {(["python", "cpp"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              aria-pressed={language === lang}
              onClick={() => writeProgLanguage(lang)}
              className={cn("h-9 rounded-lg px-4 text-sm font-semibold", language === lang ? "bg-lab-programming text-white" : "text-ink-muted hover:bg-muted")}
            >
              {p.languages[lang]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="problem-list">
          {filtered.map((x) => {
            const StatusIcon = x.status === "solved" ? CheckCircle2 : x.status === "attempted" ? CircleDot : Circle;
            return (
              <li key={x.id}>
                <Link
                  href={`/labs/programming/${x.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-lab-programming/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge>{fmt(dict.labs.common.level, { n: x.level })}</Badge>
                      <Badge tone={x.kind === "code" ? "brand" : x.kind === "predict" ? "warn" : "neutral"}>{p.kinds[x.kind]}</Badge>
                    </div>
                    <StatusIcon
                      aria-label={x.status === "solved" ? p.solved : x.status === "attempted" ? p.attempted : dict.labs.common.notStarted}
                      className={cn("size-5 shrink-0", x.status === "solved" ? "text-success" : x.status === "attempted" ? "text-warn" : "text-line-strong")}
                    />
                  </div>
                  <h3 className="mt-2.5 font-semibold group-hover:text-lab-programming">{tr(x.title, locale)}</h3>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm text-ink-muted">
                    <span>
                      {p.topics[x.topic]}
                      {x.authorName ? ` · ${fmt(p.byAuthor, { name: x.authorName })}` : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      {x.bookmarked ? <BookmarkCheck aria-label={dict.labs.common.bookmarked} className="size-4 text-brand" /> : null}
                      <Stars value={x.difficulty} label={`${dict.labs.common.difficulty}: ${x.difficulty}/3`} />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-muted">{dict.labs.common.empty}</p>
      )}
    </div>
  );
}
