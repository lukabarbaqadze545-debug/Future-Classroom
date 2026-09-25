"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { PROG_TOPICS, type ProgTopic } from "@/lib/labs/programming/types";
import type { CustomProblemInput } from "@/lib/labs/programming/service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { CodeEditor } from "../code-editor";

const EMPTY: CustomProblemInput = {
  title: "",
  level: 1,
  topic: "loops",
  difficulty: 2,
  statement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  tests: [
    { input: "", output: "", sample: true },
    { input: "", output: "", sample: false },
  ],
  hints: ["", "", ""],
  explanation: "",
  starterPython: "",
  starterCpp: "",
  solutionPython: "",
  solutionCpp: "",
  timeLimitMs: 2000,
};

/** Teachers write their own problems: statement, sample and hidden tests, hints, solutions. */
export function ProblemForm({ id, initial }: { id?: string; initial?: CustomProblemInput }) {
  const { dict } = useI18n();
  const p = dict.labs.programming;
  const f = p.form;
  const router = useRouter();
  const [form, setForm] = useState<CustomProblemInput>(() => (initial ? { ...initial, hints: [...initial.hints, "", "", ""].slice(0, 3) } : EMPTY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof CustomProblemInput>(key: K, value: CustomProblemInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setTest = (i: number, patch: Partial<CustomProblemInput["tests"][number]>) => set("tests", form.tests.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { ...form, hints: form.hints.map((h) => h.trim()).filter(Boolean) };
      const res = await api<{ id: string }>(id ? `/api/labs/programming/problems/${id}` : "/api/labs/programming/problems", { method: id ? "PUT" : "POST", body });
      router.push(`/labs/programming/${res.id}`);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !window.confirm(dict.labs.common.deleteConfirm)) return;
    setBusy(true);
    try {
      await api(`/api/labs/programming/problems/${id}`, { method: "DELETE" });
      router.push("/labs/programming");
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="space-y-4 p-5">
        <Field label={f.title}>{(ids) => <Input {...ids} required maxLength={160} value={form.title} onChange={(e) => set("title", e.target.value)} />}</Field>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label={f.level}>
            {(ids) => (
              <Select {...ids} value={form.level} onChange={(e) => set("level", Number(e.target.value) as CustomProblemInput["level"])}>
                {([1, 2, 3, 4] as const).map((n) => (
                  <option key={n} value={n}>
                    {n} — {p.levels[n].name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.topic}>
            {(ids) => (
              <Select {...ids} value={form.topic} onChange={(e) => set("topic", e.target.value as ProgTopic)}>
                {PROG_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {p.topics[t]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.difficulty}>
            {(ids) => (
              <Select {...ids} value={form.difficulty} onChange={(e) => set("difficulty", Number(e.target.value) as 1 | 2 | 3)}>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.timeLimit}>
            {(ids) => <Input {...ids} type="number" min={500} max={10000} step={100} value={form.timeLimitMs} onChange={(e) => set("timeLimitMs", Number(e.target.value) || 2000)} />}
          </Field>
        </div>
        <Field label={f.statement}>{(ids) => <Textarea {...ids} required rows={6} value={form.statement} onChange={(e) => set("statement", e.target.value)} />}</Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={f.inputFormat}>{(ids) => <Textarea {...ids} rows={3} value={form.inputFormat} onChange={(e) => set("inputFormat", e.target.value)} />}</Field>
          <Field label={f.outputFormat}>{(ids) => <Textarea {...ids} rows={3} value={form.outputFormat} onChange={(e) => set("outputFormat", e.target.value)} />}</Field>
          <Field label={f.constraints}>{(ids) => <Textarea {...ids} rows={3} value={form.constraints} onChange={(e) => set("constraints", e.target.value)} />}</Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">{f.tests}</h2>
          <p className="text-sm text-ink-muted">{f.testsHelp}</p>
        </div>
        <ol className="space-y-3">
          {form.tests.map((t, i) => (
            <li key={i} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Checkbox label={f.sample} checked={t.sample} onChange={(e) => setTest(i, { sample: e.target.checked })} />
                <Button variant="ghost" size="sm" onClick={() => set("tests", form.tests.filter((_, j) => j !== i))} disabled={form.tests.length <= 1} aria-label={`${dict.common.remove} ${i + 1}`}>
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={f.input}>{(ids) => <Textarea {...ids} rows={3} className="font-mono" value={t.input} onChange={(e) => setTest(i, { input: e.target.value })} />}</Field>
                <Field label={f.output}>{(ids) => <Textarea {...ids} rows={3} className="font-mono" value={t.output} onChange={(e) => setTest(i, { output: e.target.value })} />}</Field>
              </div>
            </li>
          ))}
        </ol>
        <Button variant="secondary" size="sm" onClick={() => set("tests", [...form.tests, { input: "", output: "", sample: false }])} disabled={form.tests.length >= 20}>
          <Plus aria-hidden className="size-4" />
          {f.addTest}
        </Button>
      </Card>

      <Card className="space-y-4 p-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{f.hints}</legend>
          {form.hints.map((h, i) => (
            <Input key={i} aria-label={`${f.hints} ${i + 1}`} value={h} maxLength={1000} onChange={(e) => set("hints", form.hints.map((x, j) => (j === i ? e.target.value : x)))} />
          ))}
        </fieldset>
        <Field label={f.explanation}>{(ids) => <Textarea {...ids} rows={3} value={form.explanation} onChange={(e) => set("explanation", e.target.value)} />}</Field>
      </Card>

      <Card className="grid gap-4 p-5 xl:grid-cols-2">
        {(
          [
            ["starterPython", f.starterPython],
            ["starterCpp", f.starterCpp],
            ["solutionPython", f.solutionPython],
            ["solutionCpp", f.solutionCpp],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="min-w-0">
            <p className="mb-1.5 text-sm font-medium">{label}</p>
            <CodeEditor value={form[key]} onChange={(v) => set(key, v)} label={label} minRows={8} />
          </div>
        ))}
      </Card>

      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div className="flex flex-wrap justify-between gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? dict.common.saving : f.save}
        </Button>
        {id ? (
          <Button variant="danger" onClick={remove} disabled={busy}>
            <Trash2 aria-hidden className="size-4" />
            {p.deleteProblem}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
