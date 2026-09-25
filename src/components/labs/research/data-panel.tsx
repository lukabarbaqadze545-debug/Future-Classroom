"use client";

import { useState } from "react";
import { ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { DatasetInput } from "@/lib/labs/research/model";
import type { ResearchDataset } from "@/lib/labs/research/service";
import { countValues, describe, toNumbers } from "@/lib/labs/research/stats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { DatasetChart, defaultChart, type ChartSpec } from "./dataset-chart";

const round = (v: number) => String(Math.round(v * 100) / 100);

/** Parses pasted spreadsheet text. The first row becomes headers if it is mostly non-numeric. */
export function parsePasted(text: string): { header: string[] | null; rows: string[][] } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length) return { header: null, rows: [] };
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const rows = lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, "")));
  const first = rows[0];
  const numeric = first.filter((c) => toNumbers([c]).length).length;
  return numeric < first.length / 2 ? { header: first, rows: rows.slice(1) } : { header: null, rows };
}

function newDataset(name: string): DatasetInput {
  return { name, description: "", collection: "", columns: [{ name: "A", type: "text" }, { name: "B", type: "number" }], rows: [["", ""]] };
}

export function DataPanel({ projectId, datasets, onChange, readOnly }: { projectId: string; datasets: ResearchDataset[]; onChange: (d: ResearchDataset[]) => void; readOnly: boolean }) {
  const { dict } = useI18n();
  const d = dict.labs.research.data;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError("");
    try {
      const res = await api<{ datasets: ResearchDataset[] }>(`/api/labs/research/projects/${projectId}/items`, { body: { collection: "datasets", data: newDataset(`${d.name} ${datasets.length + 1}`) } });
      onChange(res.datasets);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-ink-muted">{d.lead}</p>
      {datasets.length ? (
        datasets.map((ds) => (
          <DatasetEditor
            key={ds.id}
            dataset={ds}
            readOnly={readOnly}
            onSaved={(next) => onChange(datasets.map((x) => (x.id === ds.id ? { ...x, ...next } : x)))}
            onDeleted={() => onChange(datasets.filter((x) => x.id !== ds.id))}
          />
        ))
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-ink-muted">{d.empty}</p>
      )}
      {!readOnly ? (
        <Button onClick={create} disabled={busy || datasets.length >= 10} data-testid="add-dataset">
          <Plus aria-hidden className="size-4" />
          {d.add}
        </Button>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}

function DatasetEditor({ dataset, readOnly, onSaved, onDeleted }: { dataset: ResearchDataset; readOnly: boolean; onSaved: (d: DatasetInput) => void; onDeleted: () => void }) {
  const { dict } = useI18n();
  const d = dict.labs.research.data;
  const [draft, setDraft] = useState<DatasetInput>({ name: dataset.name, description: dataset.description, collection: dataset.collection, columns: dataset.columns, rows: dataset.rows });
  const [dirty, setDirty] = useState(false);
  const [paste, setPaste] = useState<string | null>(null);
  const [spec, setSpec] = useState<ChartSpec | null>(() => defaultChart(dataset));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (patch: Partial<DatasetInput>) => {
    setDraft((x) => ({ ...x, ...patch }));
    setDirty(true);
  };
  const numberCols = draft.columns.map((c, i) => ({ c, i })).filter((x) => x.c.type === "number");
  const textCols = draft.columns.map((c, i) => ({ c, i })).filter((x) => x.c.type === "text");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api(`/api/labs/research/items/datasets/${dataset.id}`, { method: "PUT", body: { data: draft } });
      setDirty(false);
      onSaved(draft);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(dict.labs.common.deleteConfirm)) return;
    try {
      await api(`/api/labs/research/items/datasets/${dataset.id}`, { method: "DELETE" });
      onDeleted();
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  function importPasted() {
    const parsed = parsePasted(paste ?? "");
    if (!parsed.rows.length && !parsed.header) return;
    const width = Math.min(12, Math.max(parsed.header?.length ?? 0, ...parsed.rows.map((r) => r.length)));
    const columns = Array.from({ length: width }, (_, i) => {
      const values = parsed.rows.map((r) => r[i] ?? "").filter((v) => v.trim());
      const numeric = values.length > 0 && toNumbers(values).length === values.length;
      return { name: parsed.header?.[i]?.slice(0, 80) || String.fromCharCode(65 + i), type: numeric ? ("number" as const) : ("text" as const) };
    });
    update({ columns, rows: parsed.rows.slice(0, 500).map((r) => columns.map((_, i) => (r[i] ?? "").slice(0, 200))) });
    setSpec(defaultChart({ ...draft, columns, rows: parsed.rows }));
    setPaste(null);
  }

  return (
    <Card className="overflow-hidden" data-testid="dataset">
      <fieldset disabled={readOnly} className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={d.name}>{(ids) => <Input {...ids} value={draft.name} maxLength={160} onChange={(e) => update({ name: e.target.value })} />}</Field>
          <Field label={d.description}>{(ids) => <Input {...ids} value={draft.description} onChange={(e) => update({ description: e.target.value })} />}</Field>
          <Field label={d.collection}>{(ids) => <Input {...ids} value={draft.collection} onChange={(e) => update({ collection: e.target.value })} />}</Field>
        </div>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                {draft.columns.map((c, i) => (
                  <th key={i} scope="col" className="px-2 py-2 text-left align-top">
                    <input
                      aria-label={`${d.columnName} ${i + 1}`}
                      value={c.name}
                      maxLength={80}
                      onChange={(e) => update({ columns: draft.columns.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                      className="h-9 w-full rounded-lg border border-line bg-surface px-2 font-semibold"
                    />
                    <select
                      aria-label={`${d.columnType} ${i + 1}`}
                      value={c.type}
                      onChange={(e) => update({ columns: draft.columns.map((x, j) => (j === i ? { ...x, type: e.target.value as "number" | "text" } : x)) })}
                      className="mt-1 h-8 w-full rounded-lg border border-line bg-surface px-1 text-xs"
                    >
                      <option value="text">{d.types.text}</option>
                      <option value="number">{d.types.number}</option>
                    </select>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {draft.rows.map((row, r) => (
                <tr key={r} className="border-t border-line">
                  {draft.columns.map((c, i) => (
                    <td key={i} className="px-2 py-1">
                      <input
                        aria-label={`${c.name} ${r + 1}`}
                        value={row[i] ?? ""}
                        maxLength={200}
                        inputMode={c.type === "number" ? "decimal" : undefined}
                        onChange={(e) => update({ rows: draft.rows.map((x, k) => (k === r ? draft.columns.map((_, j) => (j === i ? e.target.value : (x[j] ?? ""))) : x)) })}
                        className="h-9 w-full rounded-lg border border-line bg-surface px-2 tabular-nums"
                      />
                    </td>
                  ))}
                  <td className="px-1">
                    <button type="button" aria-label={d.removeRow} onClick={() => update({ rows: draft.rows.filter((_, k) => k !== r) })} className="inline-flex size-9 items-center justify-center rounded-lg text-ink-subtle hover:bg-muted hover:text-danger">
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => update({ rows: [...draft.rows, draft.columns.map(() => "")] })} disabled={draft.rows.length >= 500}>
              <Plus aria-hidden className="size-4" />
              {d.addRow}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => update({ columns: [...draft.columns, { name: String.fromCharCode(65 + draft.columns.length), type: "number" }], rows: draft.rows.map((r) => [...r, ""]) })} disabled={draft.columns.length >= 12}>
              <Plus aria-hidden className="size-4" />
              {d.addColumn}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPaste("")}>
              <ClipboardPaste aria-hidden className="size-4" />
              {d.paste}
            </Button>
          </div>
        ) : null}
        {paste !== null ? (
          <div className="space-y-2 rounded-xl bg-muted/50 p-3">
            <p className="text-sm text-ink-muted">{d.pasteHelp}</p>
            <Textarea aria-label={d.paste} rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} className="font-mono" data-testid="paste-data" />
            <div className="flex gap-2">
              <Button size="sm" onClick={importPasted} data-testid="import-data">
                {d.import}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPaste(null)}>
                {dict.common.cancel}
              </Button>
            </div>
          </div>
        ) : null}
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={busy || !dirty} data-testid="save-dataset">
              {busy ? dict.common.saving : d.save}
            </Button>
            <span className="text-sm text-ink-muted">{dirty ? dict.labs.research.unsaved : fmtCount(d.rows, draft.rows.length)}</span>
            <Button variant="ghost" className="ml-auto text-danger" onClick={remove}>
              <Trash2 aria-hidden className="size-4" />
              {d.delete}
            </Button>
          </div>
        ) : null}
      </fieldset>
      {error ? <Notice tone="danger" className="mx-5 mb-4">{error}</Notice> : null}

      <div className="grid gap-5 border-t border-line bg-muted/30 p-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0">
          <h3 className="mb-2 font-semibold">{d.stats}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="py-1 pr-2 font-medium" scope="col" />
                  {(["n", "mean", "median", "min", "max", "sd"] as const).map((k) => (
                    <th key={k} scope="col" className="py-1 pr-2 font-medium">
                      {d[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numberCols.map(({ c, i }) => {
                  const s = describe(toNumbers(draft.rows.map((r) => r[i] ?? "")));
                  return (
                    <tr key={i} className="border-t border-line tabular-nums">
                      <th scope="row" className="py-1.5 pr-2 text-left font-medium">
                        {c.name}
                      </th>
                      {s ? [s.n, s.mean, s.median, s.min, s.max, s.sd].map((v, k) => <td key={k} className="py-1.5 pr-2">{round(v)}</td>) : <td colSpan={6}>—</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {textCols.map(({ c, i }) => (
            <p key={i} className="mt-2 text-sm">
              <span className="font-medium">{c.name}: </span>
              {countValues(draft.rows.map((r) => r[i] ?? ""))
                .slice(0, 8)
                .map((x) => `${x.value} (${x.count})`)
                .join(", ") || "—"}
            </p>
          ))}
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="mr-auto font-semibold">{d.chart}</h3>
            <Select
              aria-label={d.chart}
              className="h-10 w-auto"
              value={spec?.type ?? ""}
              onChange={(e) => {
                const type = e.target.value;
                const t = textCols[0]?.i ?? 0;
                const n1 = numberCols[0]?.i ?? 0;
                const n2 = numberCols[1]?.i ?? n1;
                setSpec(type === "counts" ? { type: "counts", column: t } : type === "means" ? { type: "means", group: t, value: n1 } : type === "scatter" ? { type: "scatter", x: n1, y: n2 } : null);
              }}
            >
              <option value="counts">{d.chartTypes.counts}</option>
              <option value="means">{d.chartTypes.means}</option>
              <option value="scatter">{d.chartTypes.scatter}</option>
            </Select>
            {spec?.type === "counts" ? <ColumnSelect label={d.groupColumn} value={spec.column} columns={draft.columns} onChange={(v) => setSpec({ type: "counts", column: v })} /> : null}
            {spec?.type === "means" ? (
              <>
                <ColumnSelect label={d.groupColumn} value={spec.group} columns={draft.columns} onChange={(v) => setSpec({ ...spec, group: v })} />
                <ColumnSelect label={d.valueColumn} value={spec.value} columns={draft.columns} onChange={(v) => setSpec({ ...spec, value: v })} />
              </>
            ) : null}
            {spec?.type === "scatter" ? (
              <>
                <ColumnSelect label={d.xColumn} value={spec.x} columns={draft.columns} onChange={(v) => setSpec({ ...spec, x: v })} />
                <ColumnSelect label={d.yColumn} value={spec.y} columns={draft.columns} onChange={(v) => setSpec({ ...spec, y: v })} />
              </>
            ) : null}
          </div>
          {spec ? <DatasetChart dataset={draft} spec={spec} /> : null}
        </div>
      </div>
    </Card>
  );
}

function ColumnSelect({ label, value, columns, onChange }: { label: string; value: number; columns: DatasetInput["columns"]; onChange: (v: number) => void }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-10 rounded-lg border border-line-strong bg-surface px-2">
        {columns.map((c, i) => (
          <option key={i} value={i}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
