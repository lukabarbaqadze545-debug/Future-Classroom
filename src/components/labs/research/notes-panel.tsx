"use client";

import { useState } from "react";
import { Quote, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { NoteInput } from "@/lib/labs/research/model";
import type { ResearchNote, ResearchSource } from "@/lib/labs/research/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";

/** "— Author (Year), p. 12": attribution is always shown with a quotation. */
export function attribution(source: ResearchSource | undefined, page: string, noDate: string) {
  if (!source) return "";
  const who = source.authors || source.organisation || source.title;
  return `— ${who} (${source.year || noDate})${page ? `, ${page}` : ""}`;
}

export function NotesPanel({
  projectId,
  mode,
  notes,
  sources,
  onChange,
  readOnly,
}: {
  projectId: string;
  mode: "notes" | "evidence";
  notes: ResearchNote[];
  sources: ResearchSource[];
  onChange: (notes: ResearchNote[]) => void;
  readOnly: boolean;
}) {
  const { dict } = useI18n();
  const n = dict.labs.research.notes;
  const e = dict.labs.research.evidence;
  const [kind, setKind] = useState<NoteInput["kind"]>(mode === "evidence" ? "evidence" : "note");
  const [content, setContent] = useState("");
  const [sourceId, setSourceId] = useState<string>("");
  const [page, setPage] = useState("");
  const [stance, setStance] = useState<NonNullable<NoteInput["stance"]>>("supports");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shown = notes.filter((x) => (mode === "evidence" ? x.kind === "evidence" : x.kind !== "evidence"));
  const sourceOf = (id: string | null) => sources.find((s) => s.id === id);
  const counts = { supports: 0, contradicts: 0, neutral: 0 };
  for (const x of notes) if (x.kind === "evidence") counts[x.stance ?? "neutral"] += 1;
  const quoteWithoutSource = kind === "quote" && !sourceId;

  async function add() {
    setBusy(true);
    setError("");
    try {
      const res = await api<{ notes: ResearchNote[] }>(`/api/labs/research/projects/${projectId}/items`, {
        body: { collection: "notes", data: { kind, content, sourceId: sourceId || null, page, stance: kind === "evidence" ? stance : null } },
      });
      onChange(res.notes);
      setContent("");
      setPage("");
    } catch (err) {
      setError(errorMessage(dict, err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/labs/research/items/notes/${id}`, { method: "DELETE" });
      onChange(notes.filter((x) => x.id !== id));
    } catch (err) {
      setError(errorMessage(dict, err));
    }
  }

  return (
    <div className="space-y-5">
      {mode === "evidence" ? (
        <>
          <p className="text-[15px] text-ink-muted">{e.lead}</p>
          <p className="font-medium tabular-nums">{fmt(e.count, counts)}</p>
          {counts.supports > 0 && counts.contradicts === 0 ? <Notice tone="warn">{e.oneSided}</Notice> : null}
        </>
      ) : null}

      {mode === "evidence" ? (
        shown.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {(["supports", "contradicts", "neutral"] as const).map((st) => (
              <Card key={st} className="p-4">
                <h3 className={cn("mb-2 font-semibold", st === "supports" ? "text-success" : st === "contradicts" ? "text-danger" : "text-ink-muted")}>{n.stances[st]}</h3>
                <ul className="space-y-2">
                  {shown
                    .filter((x) => (x.stance ?? "neutral") === st)
                    .map((x) => (
                      <NoteItem key={x.id} note={x} source={sourceOf(x.sourceId)} onDelete={readOnly ? undefined : () => remove(x.id)} />
                    ))}
                </ul>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{e.none}</p>
        )
      ) : shown.length ? (
        <ul className="space-y-2">
          {shown.map((x) => (
            <NoteItem key={x.id} note={x} source={sourceOf(x.sourceId)} onDelete={readOnly ? undefined : () => remove(x.id)} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{n.empty}</p>
      )}

      {!readOnly ? (
        <Card className="space-y-3 p-4">
          {mode === "notes" ? (
            <div role="radiogroup" aria-label={n.kinds.note} className="inline-flex rounded-xl border border-line-strong p-1">
              {(["note", "quote"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn("h-9 rounded-lg px-3.5 text-sm font-semibold", kind === k ? "bg-lab-research text-white" : "text-ink-muted hover:bg-muted")}>
                  {n.kinds[k]}
                </button>
              ))}
            </div>
          ) : null}
          <Textarea
            aria-label={n.content}
            rows={3}
            value={content}
            onChange={(ev) => setContent(ev.target.value)}
            placeholder={kind === "quote" ? n.quotePlaceholder : kind === "evidence" ? n.evidencePlaceholder : n.notePlaceholder}
            data-testid={`${mode}-content`}
          />
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <Select aria-label={n.source} value={sourceId} onChange={(ev) => setSourceId(ev.target.value)} data-testid={`${mode}-source`}>
              <option value="">{n.noSource}</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
            <Input aria-label={n.page} placeholder={n.page} value={page} maxLength={40} onChange={(ev) => setPage(ev.target.value)} />
          </div>
          {kind === "evidence" ? (
            <div role="radiogroup" aria-label={n.stance} className="flex flex-wrap gap-2">
              {(["supports", "contradicts", "neutral"] as const).map((st) => (
                <button key={st} type="button" role="radio" aria-checked={stance === st} onClick={() => setStance(st)} className={cn("h-10 rounded-xl border px-3.5 text-sm font-medium", stance === st ? "border-lab-research bg-lab-research text-white" : "border-line-strong hover:bg-muted")}>
                  {n.stances[st]}
                </button>
              ))}
            </div>
          ) : null}
          {quoteWithoutSource ? <p className="text-sm text-warn">{n.quoteNeedsSource}</p> : null}
          <Button onClick={add} disabled={busy || !content.trim() || quoteWithoutSource} data-testid={`add-${mode}`}>
            {n.add}
          </Button>
        </Card>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}

function NoteItem({ note, source, onDelete }: { note: ResearchNote; source: ResearchSource | undefined; onDelete?: () => void }) {
  const { dict } = useI18n();
  const n = dict.labs.research.notes;
  return (
    <li className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-[15px]">
          {note.kind === "quote" ? (
            <blockquote className="flex gap-2 italic">
              <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-lab-research" />
              <span>“{note.content}”</span>
            </blockquote>
          ) : (
            <p className="whitespace-pre-line">{note.content}</p>
          )}
          <p className="mt-1 text-xs text-ink-muted">
            {note.kind !== "evidence" ? <Badge className="mr-1.5">{n.kinds[note.kind]}</Badge> : null}
            {source ? attribution(source, note.page, dict.labs.research.sources.noDate) : n.noSource}
          </p>
        </div>
        {onDelete ? (
          <Button variant="ghost" size="sm" aria-label={n.delete} onClick={onDelete}>
            <Trash2 aria-hidden className="size-4" />
          </Button>
        ) : null}
      </div>
    </li>
  );
}
