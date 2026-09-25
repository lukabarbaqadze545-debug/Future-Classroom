"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, formatDate } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr } from "@/lib/labs/localized";
import { SKILLS } from "@/lib/labs/career/skills";
import type { Goal, GoalInput } from "@/lib/labs/career/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Meter } from "@/components/ui/misc";
import { Notice } from "@/components/ui/notice";

const EMPTY: GoalInput = { title: "", why: "", skillId: null, targetDate: null, steps: [{ text: "", done: false }], reflection: "" };

export function Goals({ initial }: { initial: Goal[] }) {
  const { dict, locale } = useI18n();
  const g = dict.labs.career.goals;
  const [goals, setGoals] = useState(initial);
  const [draft, setDraft] = useState<GoalInput | null>(null);
  const [error, setError] = useState("");

  const put = async (goal: Goal, patch: Partial<GoalInput>, status = goal.status) => {
    const { id } = goal;
    const content: GoalInput = { title: goal.title, why: goal.why, skillId: goal.skillId, targetDate: goal.targetDate, steps: goal.steps, reflection: goal.reflection };
    const body = { goal: { ...content, ...patch }, status };
    setGoals((list) => list.map((x) => (x.id === id ? { ...x, ...patch, status } : x)));
    try {
      await api(`/api/career/goals/${id}`, { method: "PUT", body });
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };

  async function create() {
    if (!draft) return;
    setError("");
    try {
      const res = await api<{ goal: Goal }>("/api/career/goals", { body: { ...draft, steps: draft.steps.filter((s) => s.text.trim()) } });
      setGoals((list) => [res.goal, ...list]);
      setDraft(null);
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  const render = (goal: Goal) => {
    const done = goal.steps.filter((s) => s.done).length;
    const skill = goal.skillId ? SKILLS.find((s) => s.id === goal.skillId) : null;
    return (
      <Card key={goal.id} className="space-y-3 p-5" data-testid="goal">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{goal.title}</h3>
            {goal.why ? <p className="text-sm text-ink-muted">{goal.why}</p> : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skill ? <Badge>{tr(skill.name, locale)}</Badge> : null}
            {goal.targetDate ? <Badge tone="neutral">{formatDate(locale, new Date(`${goal.targetDate}T12:00:00`).getTime())}</Badge> : null}
          </div>
        </div>
        {goal.steps.length ? (
          <>
            <Meter value={(done / goal.steps.length) * 100} tone="success" label={fmt(g.stepsDone, { done, total: goal.steps.length })} />
            <ul className="space-y-1.5">
              {goal.steps.map((s, i) => (
                <li key={i}>
                  <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-[15px]">
                    <input
                      type="checkbox"
                      checked={s.done}
                      disabled={goal.status === "done"}
                      onChange={() => put(goal, { steps: goal.steps.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })}
                      className="size-4.5 accent-[var(--color-lab-career)]"
                    />
                    <span className={s.done ? "text-ink-muted line-through" : undefined}>{s.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {goal.status === "done" ? (
          goal.reflection ? <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm whitespace-pre-line">{goal.reflection}</p> : null
        ) : (
          <Textarea aria-label={g.reflection} placeholder={g.reflection} rows={2} defaultValue={goal.reflection} onBlur={(e) => e.target.value !== goal.reflection && put(goal, { reflection: e.target.value })} />
        )}
        <div className="flex flex-wrap gap-2">
          {goal.status === "active" ? (
            <Button size="sm" variant="secondary" onClick={() => put(goal, {}, "done")}>
              <CheckCircle2 aria-hidden className="size-4" />
              {g.markDone}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => put(goal, {}, "active")}>
              {g.reopen}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-danger"
            onClick={async () => {
              if (!window.confirm(dict.labs.common.deleteConfirm)) return;
              await api(`/api/career/goals/${goal.id}`, { method: "DELETE" });
              setGoals((list) => list.filter((x) => x.id !== goal.id));
            }}
          >
            <Trash2 aria-hidden className="size-4" />
            {g.delete}
          </Button>
        </div>
      </Card>
    );
  };

  const active = goals.filter((x) => x.status === "active");
  const done = goals.filter((x) => x.status === "done");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] text-ink-muted">{g.lead}</p>
        {!draft ? (
          <Button onClick={() => setDraft(EMPTY)}>
            <Plus aria-hidden className="size-4" />
            {g.add}
          </Button>
        ) : null}
      </div>
      {draft ? (
        <Card className="space-y-4 border-lab-career/30 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={g.goal} className="md:col-span-3">
              {(ids) => <Input {...ids} required maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />}
            </Field>
            <Field label={g.skill}>
              {(ids) => (
                <Select {...ids} value={draft.skillId ?? ""} onChange={(e) => setDraft({ ...draft, skillId: (e.target.value || null) as GoalInput["skillId"] })}>
                  <option value="">{g.noSkill}</option>
                  {SKILLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {tr(s.name, locale)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={g.target}>{(ids) => <Input {...ids} type="date" value={draft.targetDate ?? ""} onChange={(e) => setDraft({ ...draft, targetDate: e.target.value || null })} />}</Field>
          </div>
          <Field label={g.why}>{(ids) => <Textarea {...ids} rows={2} value={draft.why} onChange={(e) => setDraft({ ...draft, why: e.target.value })} />}</Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{g.steps}</legend>
            {draft.steps.map((s, i) => (
              <Input key={i} aria-label={`${g.steps} ${i + 1}`} placeholder={g.stepPlaceholder} value={s.text} onChange={(e) => setDraft({ ...draft, steps: draft.steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
            ))}
            <Button variant="secondary" size="sm" onClick={() => setDraft({ ...draft, steps: [...draft.steps, { text: "", done: false }] })} disabled={draft.steps.length >= 10}>
              <Plus aria-hidden className="size-4" />
              {g.addStep}
            </Button>
          </fieldset>
          <div className="flex gap-2">
            <Button onClick={create} disabled={!draft.title.trim()}>
              {g.save}
            </Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {g.cancel}
            </Button>
          </div>
        </Card>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <section className="space-y-3">
        <h3 className="font-semibold">{g.active}</h3>
        {active.length ? <div className="grid gap-4 lg:grid-cols-2">{active.map(render)}</div> : <p className="text-sm text-ink-muted">{g.empty}</p>}
      </section>
      {done.length ? (
        <section className="space-y-3">
          <h3 className="font-semibold">{g.done}</h3>
          <div className="grid gap-4 lg:grid-cols-2">{done.map(render)}</div>
        </section>
      ) : null}
    </div>
  );
}
