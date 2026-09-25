"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CalendarCheck, Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, formatDate } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { tr } from "@/lib/labs/localized";
import { FIELDS, type FieldId } from "@/lib/labs/career/careers";
import type { UniversityCard, UniversityInput } from "@/lib/labs/career/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

const DEGREES = ["foundation", "bachelor", "master", "vocational", "other"] as const;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function empty(fieldId: FieldId | null): UniversityInput {
  return { university: "", country: "", city: "", program: "", degree: "bachelor", language: "", fieldId, admission: "", tuition: "", scholarships: "", deadlines: "", website: "", sourceUrl: "", notes: "", interest: 0 };
}

export function UniversityCards({ own, shared, staff, initialField, now }: { own: UniversityCard[]; shared: UniversityCard[]; staff: boolean; initialField: FieldId | null; now: number }) {
  const { dict, locale } = useI18n();
  const u = dict.labs.career.universities;
  const router = useRouter();
  const [cards, setCards] = useState(own);
  const [editing, setEditing] = useState<{ id: string | null; data: UniversityInput; shared: boolean } | null>(initialField ? { id: null, data: empty(initialField), shared: false } : null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const set = (patch: Partial<UniversityInput>) => setEditing((e) => (e ? { ...e, data: { ...e.data, ...patch } } : e));

  async function save() {
    if (!editing) return;
    setError("");
    try {
      if (editing.id) {
        const res = await api<{ card: UniversityCard }>(`/api/career/universities/${editing.id}`, { method: "PUT", body: { card: editing.data, shared: editing.shared, checked: false } });
        setCards((list) => list.map((c) => (c.id === editing.id ? res.card : c)));
      } else {
        const res = await api<{ card: UniversityCard }>("/api/career/universities", { body: { card: editing.data, shared: editing.shared } });
        setCards((list) => [res.card, ...list]);
      }
      setEditing(null);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  async function markChecked(card: UniversityCard) {
    const { id, ...rest } = card;
    try {
      const res = await api<{ card: UniversityCard }>(`/api/career/universities/${id}`, { method: "PUT", body: { card: rest, checked: true } });
      setCards((list) => list.map((c) => (c.id === id ? res.card : c)));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  const view = (card: UniversityCard, mine: boolean) => {
    const stale = card.checkedAt === null || now - card.checkedAt > YEAR_MS;
    const field = card.fieldId ? FIELDS.find((f) => f.id === card.fieldId) : null;
    return (
      <Card key={card.id} className="flex h-full flex-col p-5" data-testid="university-card">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold">{card.university}</h3>
            <p className="text-sm text-ink-muted">
              {[card.program, u.degrees[card.degree], [card.city, card.country].filter(Boolean).join(", "), card.language].filter(Boolean).join(" · ")}
            </p>
            {field ? <p className="text-xs text-ink-subtle">{tr(field.name, locale)}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {card.shared ? <Badge tone="brand">{u.sharedBadge}</Badge> : null}
            {card.interest ? <Badge tone="success">{u.interest[card.interest]}</Badge> : null}
          </div>
        </div>
        <dl className="mt-3 grid gap-2 text-sm">
          {(["admission", "tuition", "scholarships", "deadlines"] as const).map((k) =>
            card[k] ? (
              <div key={k}>
                <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{u.fields[k]}</dt>
                <dd className="whitespace-pre-line">{card[k]}</dd>
              </div>
            ) : null,
          )}
          {card.notes ? (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{u.fields.notes}</dt>
              <dd className="whitespace-pre-line">{card.notes}</dd>
            </div>
          ) : null}
        </dl>
        <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${stale ? "bg-warn-soft text-warn" : "bg-muted text-ink-muted"}`}>
          <p className="flex items-center gap-1.5 font-medium">
            {stale ? <AlertTriangle aria-hidden className="size-4" /> : <CalendarCheck aria-hidden className="size-4" />}
            {card.checkedAt ? fmt(u.checkedOn, { date: formatDate(locale, card.checkedAt) }) : u.notChecked}
          </p>
          <p className="mt-0.5 text-xs">{card.checkedAt !== null && stale ? u.stale : u.timeSensitiveShort}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {card.website ? (
            <a href={card.website} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand hover:bg-brand-soft">
              <ExternalLink aria-hidden className="size-4" />
              {u.officialSite}
            </a>
          ) : null}
          {card.sourceUrl && card.sourceUrl !== card.website ? (
            <a href={card.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-muted hover:bg-muted">
              <ExternalLink aria-hidden className="size-4" />
              {u.source}
            </a>
          ) : null}
          {mine ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => markChecked(card)}>
                <CalendarCheck aria-hidden className="size-4" />
                {u.markChecked}
              </Button>
              <Button variant="ghost" size="sm" aria-label={u.edit} onClick={() => setEditing({ id: card.id, data: { ...card }, shared: card.shared })}>
                <Pencil aria-hidden className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={u.delete}
                onClick={async () => {
                  if (!window.confirm(dict.labs.common.deleteConfirm)) return;
                  await api(`/api/career/universities/${card.id}`, { method: "DELETE" });
                  setCards((list) => list.filter((c) => c.id !== card.id));
                }}
              >
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </>
          ) : !staff ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={copied === card.id}
              onClick={async () => {
                try {
                  const res = await api<{ card: UniversityCard }>(`/api/career/universities/${card.id}/copy`, { body: {} });
                  setCards((list) => [res.card, ...list]);
                  setCopied(card.id);
                } catch (e) {
                  setError(errorMessage(dict, e));
                }
              }}
            >
              <Copy aria-hidden className="size-4" />
              {copied === card.id ? u.copied : u.copy}
            </Button>
          ) : null}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Notice tone="warn">{dict.labs.career.timeSensitive}</Notice>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">{u.mine}</h2>
          {!editing ? (
            <Button onClick={() => setEditing({ id: null, data: empty(null), shared: false })} data-testid="add-university">
              <Plus aria-hidden className="size-4" />
              {u.add}
            </Button>
          ) : null}
        </div>
        {editing ? (
          <Card className="space-y-4 border-lab-career/30 p-5" data-testid="university-form">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label={u.fields.university}>{(ids) => <Input {...ids} required value={editing.data.university} onChange={(e) => set({ university: e.target.value })} data-testid="uni-name" />}</Field>
              <Field label={u.fields.program}>{(ids) => <Input {...ids} value={editing.data.program} onChange={(e) => set({ program: e.target.value })} data-testid="uni-program" />}</Field>
              <Field label={u.fields.degree}>
                {(ids) => (
                  <Select {...ids} value={editing.data.degree} onChange={(e) => set({ degree: e.target.value as UniversityInput["degree"] })}>
                    {DEGREES.map((d) => (
                      <option key={d} value={d}>
                        {u.degrees[d]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={u.fields.country}>{(ids) => <Input {...ids} value={editing.data.country} onChange={(e) => set({ country: e.target.value })} />}</Field>
              <Field label={u.fields.city}>{(ids) => <Input {...ids} value={editing.data.city} onChange={(e) => set({ city: e.target.value })} />}</Field>
              <Field label={u.fields.language}>{(ids) => <Input {...ids} value={editing.data.language} onChange={(e) => set({ language: e.target.value })} />}</Field>
              <Field label={u.fields.field}>
                {(ids) => (
                  <Select {...ids} value={editing.data.fieldId ?? ""} onChange={(e) => set({ fieldId: (e.target.value || null) as FieldId | null })}>
                    <option value="">—</option>
                    {FIELDS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {tr(f.name, locale)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={u.fields.interest}>
                {(ids) => (
                  <Select {...ids} value={editing.data.interest} onChange={(e) => set({ interest: Number(e.target.value) })}>
                    {u.interest.map((label, i) => (
                      <option key={i} value={i}>
                        {label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Notice tone="info">{u.timeSensitiveShort}</Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={u.fields.admission}>{(ids) => <Textarea {...ids} rows={3} value={editing.data.admission} onChange={(e) => set({ admission: e.target.value })} />}</Field>
              <Field label={u.fields.tuition}>{(ids) => <Textarea {...ids} rows={3} value={editing.data.tuition} onChange={(e) => set({ tuition: e.target.value })} />}</Field>
              <Field label={u.fields.scholarships}>{(ids) => <Textarea {...ids} rows={3} value={editing.data.scholarships} onChange={(e) => set({ scholarships: e.target.value })} />}</Field>
              <Field label={u.fields.deadlines}>{(ids) => <Textarea {...ids} rows={3} value={editing.data.deadlines} onChange={(e) => set({ deadlines: e.target.value })} />}</Field>
              <Field label={u.fields.website}>{(ids) => <Input {...ids} type="url" placeholder="https://" value={editing.data.website} onChange={(e) => set({ website: e.target.value })} />}</Field>
              <Field label={u.fields.sourceUrl}>{(ids) => <Input {...ids} type="url" placeholder="https://" value={editing.data.sourceUrl} onChange={(e) => set({ sourceUrl: e.target.value })} />}</Field>
            </div>
            <Field label={u.fields.notes}>{(ids) => <Textarea {...ids} rows={3} value={editing.data.notes} onChange={(e) => set({ notes: e.target.value })} />}</Field>
            {staff ? <Checkbox label={u.share} checked={editing.shared} onChange={(e) => setEditing({ ...editing, shared: e.target.checked })} /> : null}
            <div className="flex gap-2">
              <Button onClick={save} disabled={!editing.data.university.trim()} data-testid="save-university">
                {u.save}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                {u.cancel}
              </Button>
            </div>
          </Card>
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {cards.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((c) => view(c, true))}</div> : <p className="text-sm text-ink-muted">{u.empty}</p>}
      </section>
      {!staff ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{u.shared}</h2>
          <p className="text-sm text-ink-muted">{u.sharedLead}</p>
          {shared.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shared.map((c) => view(c, false))}</div> : <p className="text-sm text-ink-muted">{u.emptyShared}</p>}
        </section>
      ) : null}
    </div>
  );
}
