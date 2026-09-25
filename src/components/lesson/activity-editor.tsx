"use client";

import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { ACTIVITY_TYPES, MAX_AUTHORED_HINTS, OPTION_ACTIVITY_TYPES } from "@/lib/domain/catalog";
import type { Activity } from "@/lib/domain/schemas";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const LETTERS = "abcdefgh";

export function ActivityEditor({ activity, onChange }: { activity: Activity; onChange: (activity: Activity) => void }) {
  const { dict } = useI18n();
  const e = dict.teacher.editor;
  const set = <K extends keyof Activity>(key: K, value: Activity[K]) => onChange({ ...activity, [key]: value });
  const usesOptions = OPTION_ACTIVITY_TYPES.includes(activity.type);
  const hasAnswerKey = activity.type === "short_answer" || activity.type === "exercise";
  const gradable = activity.type === "multiple_choice" || hasAnswerKey;
  const hints = [...activity.hints, ...Array(MAX_AUTHORED_HINTS).fill("")].slice(0, activity.type === "poll" ? 0 : MAX_AUTHORED_HINTS);

  const changeType = (type: Activity["type"]) => {
    const next: Activity = { ...activity, type };
    if (OPTION_ACTIVITY_TYPES.includes(type) && next.options.length < 2) {
      next.options = [
        { id: "a", text: "" },
        { id: "b", text: "" },
      ];
    }
    if (type !== "multiple_choice") next.correctOptionIds = [];
    if (!OPTION_ACTIVITY_TYPES.includes(type)) next.options = [];
    if (type === "discussion" || type === "exit_ticket" || type === "poll") {
      next.allowSolution = false;
      next.solution = "";
      next.acceptedAnswers = [];
    }
    onChange(next);
  };

  const addOption = () => {
    const used = new Set(activity.options.map((o) => o.id));
    const id = [...LETTERS].find((l) => !used.has(l)) ?? `o${activity.options.length}`;
    set("options", [...activity.options, { id, text: "" }]);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <Field label={dict.teacher.quizzes.questionType} hint={dict.activityTypeHelp[activity.type]}>
          {(ids) => (
            <Select {...ids} value={activity.type} onChange={(ev) => changeType(ev.target.value as Activity["type"])}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {dict.activityTypes[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={e.activityTitle} optionalLabel={dict.common.optional}>
          {(ids) => <Input {...ids} value={activity.title} onChange={(ev) => set("title", ev.target.value)} maxLength={120} />}
        </Field>
      </div>
      <Field label={e.prompt}>{(ids) => <Textarea {...ids} value={activity.prompt} rows={3} onChange={(ev) => set("prompt", ev.target.value)} required />}</Field>

      {usesOptions ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{e.options}</legend>
          {activity.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="w-6 text-center text-sm font-semibold text-ink-subtle uppercase">{option.id}</span>
              <Input
                aria-label={`${e.options} ${option.id.toUpperCase()}`}
                value={option.text}
                onChange={(ev) => set("options", activity.options.map((o, i) => (i === index ? { ...o, text: ev.target.value } : o)))}
                className="flex-1"
              />
              {activity.type === "multiple_choice" ? (
                <Checkbox
                  label={e.correctOption}
                  checked={activity.correctOptionIds.includes(option.id)}
                  onChange={(ev) =>
                    set(
                      "correctOptionIds",
                      ev.target.checked ? [...activity.correctOptionIds, option.id] : activity.correctOptionIds.filter((id) => id !== option.id),
                    )
                  }
                  className="shrink-0"
                />
              ) : null}
              <button
                type="button"
                onClick={() => onChange({ ...activity, options: activity.options.filter((_, i) => i !== index), correctOptionIds: activity.correctOptionIds.filter((id) => id !== option.id) })}
                className="rounded-md p-2 text-ink-subtle hover:bg-danger-soft hover:text-danger disabled:opacity-30"
                disabled={activity.options.length <= 2}
                aria-label={`${dict.common.remove} ${option.id.toUpperCase()}`}
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </div>
          ))}
          {activity.options.length < 8 ? (
            <Button variant="ghost" size="sm" onClick={addOption}>
              <Plus aria-hidden className="size-4" />
              {e.addOption}
            </Button>
          ) : null}
        </fieldset>
      ) : null}

      {hasAnswerKey ? (
        <Field label={e.acceptedAnswers} hint={e.acceptedAnswersHelp}>
          {(ids) => (
            <Textarea
              {...ids}
              rows={2}
              value={activity.acceptedAnswers.join("\n")}
              onChange={(ev) => set("acceptedAnswers", ev.target.value.split("\n").slice(0, 10))}
              onBlur={() => set("acceptedAnswers", activity.acceptedAnswers.map((a) => a.trim()).filter(Boolean))}
              className="font-mono text-sm"
            />
          )}
        </Field>
      ) : null}

      {hints.length ? (
        <fieldset className="rounded-xl border border-warn/20 bg-warn-soft/40 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">{e.hints}</legend>
          <p className="mb-3 text-xs text-ink-muted">{e.hintsHelp}</p>
          <div className="space-y-2">
            {hints.map((hint, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2.5 w-16 shrink-0 text-xs font-medium text-warn">{fmt(e.hintLevel, { n: i + 1 })}</span>
                <Textarea
                  aria-label={fmt(e.hintLevel, { n: i + 1 })}
                  rows={2}
                  value={hint}
                  onChange={(ev) => {
                    const next = [...hints];
                    next[i] = ev.target.value;
                    // Keep trailing empty hints out of the saved ladder.
                    while (next.length && !next[next.length - 1].trim()) next.pop();
                    set("hints", next);
                  }}
                  className="flex-1 text-sm"
                />
              </div>
            ))}
          </div>
          {gradable ? (
            <div className="mt-4 space-y-2">
              <Field label={e.solution}>{(ids) => <Textarea {...ids} rows={3} value={activity.solution} onChange={(ev) => set("solution", ev.target.value)} className="text-sm" />}</Field>
              <Checkbox label={e.allowSolution} checked={activity.allowSolution} onChange={(ev) => set("allowSolution", ev.target.checked)} />
            </div>
          ) : null}
        </fieldset>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        {activity.type !== "poll" ? (
          <Field label={e.explanation} optionalLabel={dict.common.optional}>
            {(ids) => <Textarea {...ids} rows={2} value={activity.explanation} onChange={(ev) => set("explanation", ev.target.value)} className="text-sm" />}
          </Field>
        ) : (
          <div />
        )}
        <Field label={e.timeLimit} optionalLabel={dict.common.optional}>
          {(ids) => (
            <Input
              {...ids}
              type="number"
              min={10}
              max={3600}
              placeholder={e.noTimeLimit}
              value={activity.timeLimitSec ?? ""}
              onChange={(ev) => set("timeLimitSec", ev.target.value ? Math.max(10, Math.min(3600, Number(ev.target.value))) : null)}
            />
          )}
        </Field>
      </div>
    </div>
  );
}
