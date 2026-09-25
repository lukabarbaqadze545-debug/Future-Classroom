"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr } from "@/lib/labs/localized";
import type { StemCheckResult, StudentItem } from "@/lib/labs/stem/service";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";

export type TaskValues = Partial<Record<"projectile_target" | "circuit_current" | "fit_line" | "robot_goal", { summary: string; value: unknown }>>;

/** Auto-checked questions for simulations and electronics/robotics challenge sets. */
export function ItemChallenge({
  kind,
  id,
  items,
  taskValues = {},
  initialBest,
  title,
}: {
  kind: "simulation" | "challenge";
  id: string;
  items: StudentItem[];
  taskValues?: TaskValues;
  initialBest: { score: number; max: number } | null;
  title?: string;
}) {
  const { dict, locale } = useI18n();
  const s = dict.labs.stem;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<StemCheckResult | null>(null);
  const [best, setBest] = useState(initialBest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    setBusy(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { ...answers };
      for (const item of items) if (item.type === "task" && item.task) payload[item.id] = taskValues[item.task]?.value ?? null;
      const res = await api<{ result: StemCheckResult; best: { score: number; max: number } }>("/api/labs/stem/check", { body: { kind, id, answers: payload } });
      setResult(res.result);
      setBest(res.best);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-testid="stem-challenge">
      <CardHeader
        title={title ?? s.challenge}
        description={s.challengeLead}
        action={best ? <span className="text-sm font-semibold text-success">{fmt(s.bestScore, { score: best.score, max: best.max })}</span> : null}
      />
      <ol className="divide-y divide-line">
        {items.map((item, index) => {
          const r = result?.items.find((x) => x.id === item.id);
          return (
            <li key={item.id} className="space-y-3 px-5 py-4">
              <p className="font-medium">
                <span className="mr-2 text-ink-subtle">{index + 1}.</span>
                {tr(item.prompt, locale)}
              </p>
              {item.type === "choice" ? (
                <div role="radiogroup" aria-label={tr(item.prompt, locale)} className="grid gap-2 sm:grid-cols-2">
                  {item.options.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2 text-[15px]",
                        answers[item.id] === o.id ? "border-lab-stem bg-lab-stem/5" : "border-line-strong hover:bg-muted/60",
                        r && r.expected === o.id ? "border-success bg-success-soft/50" : null,
                      )}
                    >
                      <input type="radio" name={`${id}-${item.id}`} checked={answers[item.id] === o.id} onChange={() => setAnswers((a) => ({ ...a, [item.id]: o.id }))} className="accent-[var(--color-lab-stem)]" />
                      {tr(o.text, locale)}
                    </label>
                  ))}
                </div>
              ) : item.type === "numeric" ? (
                <div className="flex max-w-xs items-center gap-2">
                  <Input inputMode="decimal" aria-label={tr(item.prompt, locale)} placeholder={s.answerPlaceholder} value={answers[item.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [item.id]: e.target.value }))} data-testid="numeric-answer" />
                  {item.unit ? <span className="text-sm font-medium text-ink-muted">{item.unit}</span> : null}
                </div>
              ) : (
                <p className="rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm">
                  {s.useCurrent} <span className="font-semibold tabular-nums">{item.task ? (taskValues[item.task]?.summary ?? "—") : "—"}</span>
                </p>
              )}
              {r ? (
                <div className={cn("rounded-xl px-3.5 py-2.5 text-sm", r.correct ? "bg-success-soft" : "bg-danger-soft/70")}>
                  <p className={cn("flex items-center gap-2 font-semibold", r.correct ? "text-success" : "text-danger")}>
                    {r.correct ? <CheckCircle2 aria-hidden className="size-4" /> : <XCircle aria-hidden className="size-4" />}
                    {r.correct ? s.correct : s.incorrect}
                  </p>
                  {r.measured !== null ? <p className="mt-1">{fmt(s.measured, { value: r.measured })}</p> : null}
                  {!r.correct && typeof r.expected === "number" ? <p className="mt-1">{fmt(s.expectedAnswer, { value: r.expected })}</p> : null}
                  <p className="mt-1">{tr(r.explanation, locale)}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
        <Button onClick={check} disabled={busy} data-testid="stem-check">
          {busy ? s.checking : s.check}
        </Button>
        {result ? <span className="text-sm font-medium tabular-nums">{fmt(s.scoreNow, { score: result.score, max: result.max })}</span> : null}
      </div>
      {error ? <Notice tone="danger" className="mx-5 mb-4">{error}</Notice> : null}
    </Card>
  );
}
