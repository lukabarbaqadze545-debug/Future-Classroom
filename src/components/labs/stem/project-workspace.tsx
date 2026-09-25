"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { ProjectData } from "@/lib/labs/stem/service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { useLocalJsonDraft } from "../use-local-draft";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-lg font-semibold text-lab-stem">{title}</h2>
      {children}
    </Card>
  );
}

/** The engineering design cycle as one structured, saveable document. */
export function ProjectWorkspace({
  id,
  initialTitle,
  initialData,
  initialStatus,
  initialUpdatedAt,
  readOnly,
}: {
  id: string;
  initialTitle: string;
  initialData: ProjectData;
  initialStatus: "draft" | "submitted";
  initialUpdatedAt: number;
  readOnly: boolean;
}) {
  const { dict } = useI18n();
  const s = dict.labs.stem;
  const f = s.fields;
  const router = useRouter();
  const [server, setServer] = useState({ title: initialTitle, data: initialData });
  const [draft, setDraft, clearDraft, unsaved] = useLocalJsonDraft(`stem:project:${id}`, server);
  const value = readOnly ? server : draft;
  const data = value.data;
  const [status, setStatus] = useState(initialStatus);
  const [savedAt, setSavedAt] = useState(initialUpdatedAt);
  const [busy, setBusy] = useState<null | "save" | "submit" | "delete">(null);
  const [error, setError] = useState("");
  const set = (patch: Partial<ProjectData>) => setDraft({ ...value, data: { ...data, ...patch } });

  async function save(submit: boolean) {
    setBusy(submit ? "submit" : "save");
    setError("");
    try {
      const res = await api<{ project: { status: "draft" | "submitted"; updatedAt: number } }>(`/api/labs/stem/projects/${id}`, { method: "PUT", body: { title: value.title, data, submit } });
      setServer(value);
      clearDraft();
      setStatus(res.project.status);
      setSavedAt(res.project.updatedAt);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(dict.labs.common.deleteConfirm)) return;
    setBusy("delete");
    try {
      await api(`/api/labs/stem/projects/${id}`, { method: "DELETE" });
      clearDraft();
      router.push("/labs/stem#mine");
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(null);
    }
  }

  const text = (key: keyof ProjectData, label: string, rows = 3, testId?: string) => (
    <Field label={label}>
      {(ids) => <Textarea {...ids} rows={rows} value={data[key] as string} onChange={(e) => set({ [key]: e.target.value } as Partial<ProjectData>)} data-testid={testId} />}
    </Field>
  );

  return (
    <div className="space-y-5" data-testid="project-workspace">
      <fieldset disabled={readOnly} className="space-y-5">
        <Card className="p-5">
          <Field label={s.projectTitle}>{(ids) => <Input {...ids} value={value.title} maxLength={160} onChange={(e) => setDraft({ ...value, title: e.target.value })} />}</Field>
        </Card>
        <Section title={s.sections.define}>
          {text("problem", f.problem, 3, "project-problem")}
          {text("users", f.users, 2)}
          <div className="grid gap-4 md:grid-cols-2">
            {text("constraints", f.constraints, 3)}
            {text("criteria", f.criteria, 3)}
          </div>
        </Section>
        <Section title={s.sections.research}>{text("research", f.research, 5)}</Section>
        <Section title={s.sections.ideas}>
          {data.ideas.map((idea, i) => (
            <div key={i} className="flex gap-2">
              <Textarea aria-label={fmt(f.idea, { n: i + 1 })} placeholder={fmt(f.idea, { n: i + 1 })} rows={2} value={idea} onChange={(e) => set({ ideas: data.ideas.map((x, j) => (j === i ? e.target.value : x)) })} />
              <Button variant="ghost" aria-label={dict.common.remove} onClick={() => set({ ideas: data.ideas.filter((_, j) => j !== i) })}>
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => set({ ideas: [...data.ideas, ""] })} disabled={data.ideas.length >= 10}>
            <Plus aria-hidden className="size-4" />
            {f.addIdea}
          </Button>
        </Section>
        <Section title={s.sections.solution}>
          {text("solution", f.solution, 2, "project-solution")}
          {text("justification", f.justification, 3)}
        </Section>
        <Section title={s.sections.design}>
          {text("design", f.design, 5)}
          {text("materials", f.materials, 2)}
        </Section>
        <Section title={s.sections.iterations}>
          {data.iterations.map((it, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{fmt(f.iteration, { n: i + 1 })}</p>
                <Button variant="ghost" size="sm" aria-label={dict.common.remove} onClick={() => set({ iterations: data.iterations.filter((_, j) => j !== i) })}>
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </div>
              <Input aria-label={f.iterationTitle} placeholder={f.iterationTitle} value={it.title} onChange={(e) => set({ iterations: data.iterations.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
              <div className="grid gap-3 md:grid-cols-3">
                {(["change", "result", "next"] as const).map((k) => (
                  <Field key={k} label={f[k]}>
                    {(ids) => <Textarea {...ids} rows={3} value={it[k]} onChange={(e) => set({ iterations: data.iterations.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} />}
                  </Field>
                ))}
              </div>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => set({ iterations: [...data.iterations, { title: "", change: "", result: "", next: "" }] })} disabled={data.iterations.length >= 10}>
            <Plus aria-hidden className="size-4" />
            {f.addIteration}
          </Button>
        </Section>
        <Section title={s.sections.results}>{text("results", f.results, 4)}</Section>
        <Section title={s.sections.reflect}>{text("reflection", f.reflection, 4)}</Section>
      </fieldset>

      {!readOnly ? (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-[var(--shadow-raised)] backdrop-blur">
          <Button variant="secondary" onClick={() => save(false)} disabled={busy !== null} data-testid="save-project">
            {busy === "save" ? dict.common.saving : s.saveDraft}
          </Button>
          <Button onClick={() => save(true)} disabled={busy !== null} data-testid="submit-project">
            <Send aria-hidden className="size-4" />
            {status === "submitted" ? s.resubmit : s.submitProject}
          </Button>
          <span className="text-sm text-ink-muted" role="status">
            {unsaved ? s.unsaved : `${s.recordStatus[status]} · ${fmt(s.lastSaved, { when: relativeTime(dict, savedAt) })}`}
          </span>
          <Button variant="ghost" className="ml-auto text-danger" onClick={remove} disabled={busy !== null}>
            <Trash2 aria-hidden className="size-4" />
            {s.deleteProject}
          </Button>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}

/** Starts a project from a brief and opens the workspace. */
export function StartProjectButton({ templateId, title, label }: { templateId: string; title: string; label: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col">
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await api<{ project: { id: string } }>("/api/labs/stem/projects", { body: { templateId, title } });
            router.push(`/labs/stem/projects/${res.project.id}`);
          } catch (e) {
            setError(errorMessage(dict, e));
            setBusy(false);
          }
        }}
        data-testid={`start-project-${templateId}`}
      >
        {busy ? dict.labs.stem.starting : label}
      </Button>
      {error ? <span className="mt-1 text-xs text-danger">{error}</span> : null}
    </span>
  );
}
