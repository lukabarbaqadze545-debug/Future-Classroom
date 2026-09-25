"use client";

import { useState } from "react";
import { BookMarked, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { SOURCE_TYPES, type SourceInput } from "@/lib/labs/research/model";
import { QUALITY_CHECKS, sourceQuality } from "@/lib/labs/research/quality";
import { formatReference, sortReferences } from "@/lib/labs/research/citation";
import type { ResearchSource } from "@/lib/labs/research/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";

export interface LibraryOption {
  id: string;
  title: string;
  authors: string;
  year: string;
  publisher: string;
  url: string;
  type: SourceInput["type"];
}

const EMPTY: SourceInput = {
  type: "website",
  title: "",
  authors: "",
  organisation: "",
  year: "",
  publisher: "",
  url: "",
  accessed: "",
  primary: "unsure",
  authorKnown: "unsure",
  recent: "unsure",
  evidenceShown: "unsure",
  balanced: "unsure",
  corroborated: "unsure",
  libraryResourceId: null,
  notes: "",
};

export function referenceLabels(dict: ReturnType<typeof useI18n>["dict"]) {
  return { accessed: dict.labs.research.sources.accessedLabel, noDate: dict.labs.research.sources.noDate };
}

export function SourcesPanel({
  projectId,
  sources,
  onChange,
  library,
  readOnly,
}: {
  projectId: string;
  sources: ResearchSource[];
  onChange: (sources: ResearchSource[]) => void;
  library: LibraryOption[];
  readOnly: boolean;
}) {
  const { dict } = useI18n();
  const r = dict.labs.research.sources;
  const [editing, setEditing] = useState<{ id: string | null; data: SourceInput } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const labels = referenceLabels(dict);
  const references = sortReferences(sources.map((s) => ({ id: s.id, reference: formatReference(s, labels) })));

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      if (editing.id) {
        await api(`/api/labs/research/items/sources/${editing.id}`, { method: "PUT", body: { data: editing.data } });
        onChange(sources.map((s) => (s.id === editing.id ? { ...s, ...editing.data } : s)));
      } else {
        const res = await api<{ sources: ResearchSource[] }>(`/api/labs/research/projects/${projectId}/items`, { body: { collection: "sources", data: editing.data } });
        onChange(res.sources);
      }
      setEditing(null);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(dict.labs.common.deleteConfirm)) return;
    try {
      await api(`/api/labs/research/items/sources/${id}`, { method: "DELETE" });
      onChange(sources.filter((s) => s.id !== id));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  const set = (patch: Partial<SourceInput>) => setEditing((e) => (e ? { ...e, data: { ...e.data, ...patch } } : e));

  return (
    <div className="space-y-5">
      {sources.length ? (
        <ul className="space-y-3" data-testid="source-list">
          {sources.map((s) => {
            const q = sourceQuality(s);
            return (
              <li key={s.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-sm text-ink-muted">
                        {r.types[s.type]}
                        {s.authors || s.organisation ? ` · ${s.authors || s.organisation}` : ""}
                        {s.year ? ` · ${s.year}` : ""}
                        {s.primary !== "unsure" ? ` · ${r.primaryShort[s.primary]}` : ""}
                      </p>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer noopener" className="text-sm break-all text-brand hover:underline">
                          {s.url}
                        </a>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={q.level === "strong" ? "success" : q.level === "moderate" ? "brand" : q.level === "weak" ? "danger" : "warn"}>{r.levels[q.level]}</Badge>
                      {!readOnly ? (
                        <>
                          <Button variant="ghost" size="sm" aria-label={r.edit} onClick={() => setEditing({ id: s.id, data: { ...EMPTY, ...s } })}>
                            <Pencil aria-hidden className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label={r.delete} onClick={() => remove(s.id)}>
                            <Trash2 aria-hidden className="size-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {q.warnings.length ? (
                    <p className="mt-2 text-sm text-danger">
                      {r.warningLead} {q.warnings.map((w) => r.checks[w]).join(" ")}
                    </p>
                  ) : null}
                  {s.notes ? <p className="mt-2 text-sm whitespace-pre-line">{s.notes}</p> : null}
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-ink-muted">{r.empty}</p>
      )}

      {!readOnly && !editing ? (
        <Button onClick={() => setEditing({ id: null, data: { ...EMPTY, accessed: new Date().toISOString().slice(0, 10) } })} data-testid="add-source">
          <Plus aria-hidden className="size-4" />
          {r.add}
        </Button>
      ) : null}

      {editing ? (
        <Card className="space-y-4 border-lab-research/30 p-5" data-testid="source-form">
          <h3 className="font-semibold">{editing.id ? r.edit : r.add}</h3>
          {library.length ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-lab-library/5 p-3">
              <BookMarked aria-hidden className="size-4 text-lab-library" />
              <Select
                aria-label={r.fromLibrary}
                className="max-w-md"
                value=""
                onChange={(e) => {
                  const item = library.find((l) => l.id === e.target.value);
                  if (item) set({ title: item.title, authors: item.authors, year: item.year, publisher: item.publisher, url: item.url, type: item.type, libraryResourceId: item.id });
                }}
              >
                <option value="">{r.fromLibrary}…</option>
                {library.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={r.type}>
              {(ids) => (
                <Select {...ids} value={editing.data.type} onChange={(e) => set({ type: e.target.value as SourceInput["type"] })}>
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {r.types[t]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={r.title} className="md:col-span-2">
              {(ids) => <Input {...ids} required value={editing.data.title} maxLength={300} onChange={(e) => set({ title: e.target.value })} data-testid="source-title" />}
            </Field>
            <Field label={r.authors}>{(ids) => <Input {...ids} value={editing.data.authors} onChange={(e) => set({ authors: e.target.value })} />}</Field>
            <Field label={r.organisation}>{(ids) => <Input {...ids} value={editing.data.organisation} onChange={(e) => set({ organisation: e.target.value })} />}</Field>
            <Field label={r.year}>{(ids) => <Input {...ids} value={editing.data.year} onChange={(e) => set({ year: e.target.value })} />}</Field>
            <Field label={r.publisher}>{(ids) => <Input {...ids} value={editing.data.publisher} onChange={(e) => set({ publisher: e.target.value })} />}</Field>
            <Field label={r.url}>{(ids) => <Input {...ids} type="url" inputMode="url" placeholder="https://" value={editing.data.url} onChange={(e) => set({ url: e.target.value })} />}</Field>
            <Field label={r.accessed}>{(ids) => <Input {...ids} type="date" value={editing.data.accessed} onChange={(e) => set({ accessed: e.target.value })} />}</Field>
          </div>
          <Field label={r.primary}>
            {(ids) => (
              <Select {...ids} value={editing.data.primary} onChange={(e) => set({ primary: e.target.value as SourceInput["primary"] })}>
                {(["primary", "secondary", "unsure"] as const).map((p) => (
                  <option key={p} value={p}>
                    {r.primaryOptions[p]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset className="space-y-3 rounded-xl border border-line p-4">
            <legend className="px-1 font-medium">{r.checklist}</legend>
            <p className="text-sm text-ink-muted">{r.checklistLead}</p>
            {QUALITY_CHECKS.map((check) => (
              <div key={check} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[15px]">{r.checks[check]}</span>
                <div role="radiogroup" aria-label={r.checks[check]} className="inline-flex shrink-0 rounded-xl border border-line-strong p-1">
                  {(["yes", "no", "unsure"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={editing.data[check] === a}
                      onClick={() => set({ [check]: a } as Partial<SourceInput>)}
                      className={cn("h-9 rounded-lg px-3 text-sm font-medium", editing.data[check] === a ? "bg-lab-research text-white" : "text-ink-muted hover:bg-muted")}
                    >
                      {r.answers[a]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-sm font-semibold">{r.levels[sourceQuality(editing.data).level]}</p>
          </fieldset>
          <Field label={r.notes}>{(ids) => <Textarea {...ids} rows={2} value={editing.data.notes} onChange={(e) => set({ notes: e.target.value })} />}</Field>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy || !editing.data.title.trim()} data-testid="save-source">
              {r.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {r.cancel}
            </Button>
          </div>
        </Card>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {references.length ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">{r.bibliography}</h3>
              <p className="text-sm text-ink-muted">{r.bibliographyLead}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(references.map((x) => x.reference).join("\n"));
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <Copy aria-hidden className="size-4" />
              {copied ? r.copied : r.copy}
            </Button>
          </div>
          <ol className="mt-3 space-y-2 pl-6 text-[15px] [&>li]:-indent-6 [&>li]:pl-6" data-testid="bibliography">
            {references.map((x) => (
              <li key={x.id} className="break-words">
                {x.reference}
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </div>
  );
}
