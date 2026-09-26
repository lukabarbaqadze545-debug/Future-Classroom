"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, FlaskConical, Pencil, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmtCount, formatDate } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr } from "@/lib/labs/localized";
import { SKILLS, type SkillId } from "@/lib/labs/career/skills";
import type { PortfolioItem, PortfolioItemInput } from "@/lib/services/portfolio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Tabs } from "@/components/ui/tabs";
import { AttachmentPanel, type AttachmentView } from "../shared/attachment-panel";

const CATEGORIES = ["project", "programming", "stem", "research", "competition", "certificate", "presentation", "volunteer", "reflection", "other"] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PortfolioManager({ initial, attachments }: { initial: PortfolioItem[]; attachments: Record<string, AttachmentView[]> }) {
  const { dict, locale } = useI18n();
  const p = dict.labs.career.portfolio;
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"all" | (typeof CATEGORIES)[number]>("all");
  const [editing, setEditing] = useState<{ id: string | null; data: PortfolioItemInput } | null>(null);
  const [error, setError] = useState("");
  const set = (patch: Partial<PortfolioItemInput>) => setEditing((e) => (e ? { ...e, data: { ...e.data, ...patch } } : e));
  const shown = items.filter((i) => filter === "all" || i.category === filter);
  const used = CATEGORIES.filter((c) => items.some((i) => i.category === c));

  async function save() {
    if (!editing) return;
    setError("");
    try {
      if (editing.id) {
        const res = await api<{ item: PortfolioItem }>(`/api/portfolio/${editing.id}`, { method: "PUT", body: editing.data });
        setItems((list) => list.map((x) => (x.id === editing.id ? res.item : x)));
      } else {
        const res = await api<{ item: PortfolioItem }>("/api/portfolio", { body: editing.data });
        setItems((list) => [res.item, ...list]);
      }
      setEditing(null);
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={setFilter} tabs={[{ id: "all" as const, label: p.all }, ...used.map((c) => ({ id: c, label: p.categories[c] }))]} />
        {!editing ? (
          <Button onClick={() => setEditing({ id: null, data: { title: "", category: "project", date: today(), description: "", link: "", evidence: "", skills: [], reflection: "" } })} data-testid="add-portfolio-item">
            <Plus aria-hidden className="size-4" />
            {p.add}
          </Button>
        ) : null}
      </div>
      {editing ? (
        <Card className="space-y-4 border-lab-career/30 p-5" data-testid="portfolio-form">
          <h2 className="font-semibold">{editing.id ? p.edit : p.add}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={p.fields.title} className="md:col-span-3">
              {(ids) => <Input {...ids} required maxLength={160} value={editing.data.title} onChange={(e) => set({ title: e.target.value })} data-testid="portfolio-title" />}
            </Field>
            <Field label={p.fields.category}>
              {(ids) => (
                <Select {...ids} value={editing.data.category} onChange={(e) => set({ category: e.target.value as PortfolioItemInput["category"] })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {p.categories[c]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={p.fields.date}>{(ids) => <Input {...ids} type="date" required value={editing.data.date} onChange={(e) => set({ date: e.target.value })} />}</Field>
            <Field label={p.fields.link}>{(ids) => <Input {...ids} type="url" placeholder="https://" value={editing.data.link} onChange={(e) => set({ link: e.target.value })} />}</Field>
          </div>
          <Field label={p.fields.description}>{(ids) => <Textarea {...ids} rows={3} value={editing.data.description} onChange={(e) => set({ description: e.target.value })} />}</Field>
          <Field label={p.fields.evidence}>{(ids) => <Input {...ids} value={editing.data.evidence} onChange={(e) => set({ evidence: e.target.value })} />}</Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{p.fields.skills}</legend>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => {
                const on = editing.data.skills.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ skills: on ? editing.data.skills.filter((x) => x !== s.id) : ([...editing.data.skills, s.id].slice(0, 8) as SkillId[]) })}
                    className={`h-9 rounded-full border px-3 text-sm ${on ? "border-lab-career bg-lab-career text-white" : "border-line-strong hover:bg-muted"}`}
                  >
                    {tr(s.name, locale)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field label={p.fields.reflection}>{(ids) => <Textarea {...ids} rows={3} value={editing.data.reflection} onChange={(e) => set({ reflection: e.target.value })} />}</Field>
          {editing.id ? <AttachmentPanel targetKind="portfolio" targetId={editing.id} initial={attachments[editing.id] ?? []} canEdit title={p.files} /> : null}
          <div className="flex gap-2">
            <Button onClick={save} disabled={!editing.data.title.trim()} data-testid="save-portfolio-item">
              {p.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {p.cancel}
            </Button>
          </div>
        </Card>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <p className="text-sm text-ink-muted">{fmtCount(p.items, shown.length)}</p>
      {shown.length ? (
        <ul className="space-y-3" data-testid="portfolio-list">
          {shown.map((item) => (
            <li key={item.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{p.categories[item.category]}</Badge>
                      <span className="text-sm text-ink-muted">{formatDate(locale, new Date(`${item.date}T12:00:00`).getTime())}</span>
                      {item.sourceKind ? (
                        <Badge tone="neutral">
                          <FlaskConical aria-hidden className="size-3" />
                          {p.fromLab}
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 text-lg font-semibold">{item.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" aria-label={p.edit} onClick={() => setEditing({ id: item.id, data: { title: item.title, category: item.category, date: item.date, description: item.description, link: item.link, evidence: item.evidence, skills: item.skills, reflection: item.reflection } })}>
                      <Pencil aria-hidden className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={p.delete}
                      onClick={async () => {
                        if (!window.confirm(dict.labs.common.deleteConfirm)) return;
                        await api(`/api/portfolio/${item.id}`, { method: "DELETE" });
                        setItems((list) => list.filter((x) => x.id !== item.id));
                      }}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                </div>
                {item.description ? <p className="mt-2 text-[15px] whitespace-pre-line">{item.description}</p> : null}
                {item.reflection ? <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-sm whitespace-pre-line">{item.reflection}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.skills.map((s) => (
                    <Badge key={s}>{tr(SKILLS.find((k) => k.id === s)!.name, locale)}</Badge>
                  ))}
                  {item.evidence.startsWith("/") ? (
                    <Link href={item.evidence} className="text-sm font-medium text-brand hover:underline">
                      {p.openWork}
                    </Link>
                  ) : item.evidence ? (
                    <span className="text-sm text-ink-muted">{item.evidence}</span>
                  ) : null}
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
                      <ExternalLink aria-hidden className="size-3.5" />
                      {item.link.replace(/^https?:\/\//, "").slice(0, 40)}
                    </a>
                  ) : null}
                  {(attachments[item.id]?.length ?? 0) > 0 ? <Badge tone="neutral">{`${p.files}: ${attachments[item.id].length}`}</Badge> : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-muted">{p.empty}</p>
      )}
    </div>
  );
}
