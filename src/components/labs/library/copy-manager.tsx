"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, formatDate } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { LibraryCopy } from "@/lib/labs/library/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

/** Staff tool: printed copies, their shelves, loans and returns. */
export function CopyManager({ resourceId, initial, students }: { resourceId: string; initial: LibraryCopy[]; students: { id: string; name: string }[] }) {
  const { dict, locale } = useI18n();
  const b = dict.labs.library;
  const m = b.manage;
  const [copies, setCopies] = useState(initial);
  const [shelf, setShelf] = useState("");
  const [lending, setLending] = useState<{ id: string; borrower: string; due: string } | null>(null);
  const [error, setError] = useState("");

  const update = async (id: string, body: Record<string, unknown>) => {
    setError("");
    try {
      const res = await api<{ copy: LibraryCopy }>(`/api/library/copies/${id}`, { method: "PUT", body });
      setCopies((list) => list.map((c) => (c.id === id ? res.copy : c)));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };

  return (
    <div className="space-y-4">
      {copies.length ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {copies.map((c) => (
            <li key={c.id} className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-semibold">{c.code}</span>
                <span className="text-sm text-ink-muted">{c.shelf}</span>
                <Badge tone={c.status === "available" ? "success" : c.status === "on_loan" ? "warn" : c.status === "missing" ? "danger" : "neutral"}>{b.copyStatus[c.status]}</Badge>
              </div>
              {c.status === "on_loan" ? (
                <p className="text-sm text-ink-muted">
                  {c.borrowerName ? fmt(b.borrowedBy, { name: c.borrowerName }) : null}
                  {c.dueAt ? ` · ${fmt(b.dueBack, { date: formatDate(locale, c.dueAt) })}` : null}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {c.status === "available" ? (
                  <Button size="sm" variant="secondary" onClick={() => setLending({ id: c.id, borrower: "", due: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) })}>
                    {m.lend}
                  </Button>
                ) : null}
                {c.status === "on_loan" ? (
                  <Button size="sm" variant="secondary" onClick={() => update(c.id, { status: "available" })}>
                    {m.return}
                  </Button>
                ) : null}
                {c.status === "missing" ? (
                  <Button size="sm" variant="secondary" onClick={() => update(c.id, { status: "available" })}>
                    {m.markFound}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => update(c.id, { status: "missing" })}>
                    {m.markMissing}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  aria-label={`${m.deleteCopy} ${c.code}`}
                  onClick={async () => {
                    if (!window.confirm(dict.labs.common.deleteConfirm)) return;
                    await api(`/api/library/copies/${c.id}`, { method: "DELETE" });
                    setCopies((list) => list.filter((x) => x.id !== c.id));
                  }}
                >
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </div>
              {lending?.id === c.id ? (
                <div className="flex flex-wrap items-end gap-2 rounded-xl bg-muted/60 p-3">
                  <label className="text-sm">
                    <span className="mb-1 block font-medium">{m.lendTo}</span>
                    <Select value={lending.borrower} onChange={(e) => setLending({ ...lending, borrower: e.target.value })}>
                      <option value="">{m.chooseStudent}</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium">{m.due}</span>
                    <Input type="date" value={lending.due} onChange={(e) => setLending({ ...lending, due: e.target.value })} />
                  </label>
                  <Button
                    size="sm"
                    disabled={!lending.borrower}
                    onClick={async () => {
                      await update(c.id, { status: "on_loan", borrowerId: lending.borrower, dueAt: lending.due ? new Date(`${lending.due}T15:00:00`).getTime() : null });
                      setLending(null);
                    }}
                  >
                    {m.lend}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setLending(null)}>
                    {dict.common.cancel}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{b.noCopies}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Input aria-label={b.shelf} placeholder={m.shelfPlaceholder} value={shelf} onChange={(e) => setShelf(e.target.value)} className="max-w-xs" />
        <Button
          variant="secondary"
          onClick={async () => {
            setError("");
            try {
              const res = await api<{ copy: LibraryCopy }>(`/api/library/resources/${resourceId}/copies`, { body: { shelf } });
              setCopies((list) => [...list, res.copy]);
              setShelf("");
            } catch (e) {
              setError(errorMessage(dict, e));
            }
          }}
        >
          <Plus aria-hidden className="size-4" />
          {m.addCopy}
        </Button>
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
