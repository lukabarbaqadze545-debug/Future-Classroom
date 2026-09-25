"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Radio, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { BridgeItem, BridgeLab } from "@/lib/labs/session-bridge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

const ORDER: BridgeLab[] = ["critical", "programming", "simulation", "challenge", "experiment"];

export function SessionPicker({ items, initial }: { items: BridgeItem[]; initial: string[] }) {
  const { dict } = useI18n();
  const b = dict.labs.bridge;
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initial.filter((k) => items.some((i) => i.key === k)));
  const [q, setQ] = useState("");
  const [title, setTitle] = useState(items.find((i) => i.key === initial[0])?.title ?? "");
  const [classLabel, setClassLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const count = selected.reduce((s, k) => s + (items.find((i) => i.key === k)?.count ?? 0), 0);
  const filtered = useMemo(() => items.filter((i) => !q || i.title.toLowerCase().includes(q.toLowerCase())), [items, q]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle" />
          <Input type="search" aria-label={b.search} placeholder={b.search} value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" />
        </div>
        {ORDER.map((lab) => {
          const group = filtered.filter((i) => i.lab === lab);
          if (!group.length) return null;
          return (
            <Card key={lab} className="p-5">
              <h2 className="mb-3 font-semibold">{b.groups[lab]}</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {group.map((i) => (
                  <li key={i.key}>
                    <Checkbox
                      label={
                        <span>
                          {i.title} <span className="text-ink-subtle">· {fmtCount(b.activities, i.count)}</span>
                        </span>
                      }
                      checked={selected.includes(i.key)}
                      onChange={() => {
                        setSelected((list) => (list.includes(i.key) ? list.filter((k) => k !== i.key) : [...list, i.key]));
                        if (!title) setTitle(i.title);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <Card className="h-fit space-y-4 p-5 lg:sticky lg:top-20">
        <h2 className="font-semibold">
          {b.selected} · {fmtCount(b.activities, count)}
        </h2>
        {selected.length ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {selected.map((k) => (
              <li key={k}>{items.find((i) => i.key === k)?.title}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-muted">{b.none}</p>
        )}
        <Field label={b.sessionTitle}>{(ids) => <Input {...ids} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} data-testid="bridge-title" />}</Field>
        <Field label={b.classLabel}>{(ids) => <Input {...ids} value={classLabel} maxLength={30} onChange={(e) => setClassLabel(e.target.value)} />}</Field>
        {count > 30 ? <Notice tone="warn">{b.tooMany}</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button
          size="lg"
          className="w-full"
          disabled={busy || !selected.length || !title.trim() || count > 30}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const res = await api<{ sessionId: string }>("/api/sessions/labs", { body: { items: selected, title, classLabel } });
              router.push(`/teacher/sessions/${res.sessionId}`);
            } catch (e) {
              setError(errorMessage(dict, e));
              setBusy(false);
            }
          }}
          data-testid="bridge-start"
        >
          <Radio aria-hidden className="size-5" />
          {busy ? b.starting : b.start}
        </Button>
        <p className="text-xs text-ink-subtle">{b.note}</p>
      </Card>
    </div>
  );
}
