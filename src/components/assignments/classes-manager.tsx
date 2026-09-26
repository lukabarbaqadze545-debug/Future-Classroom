"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

interface ClassView {
  id: string;
  name: string;
  memberIds: string[];
}

/** Create classes and choose their students; assignments can then target a whole class. */
export function ClassesManager({ initial, students }: { initial: ClassView[]; students: { id: string; name: string }[] }) {
  const { dict } = useI18n();
  const c = dict.labs.classes;
  const router = useRouter();
  const [classes, setClasses] = useState(initial);
  const [editing, setEditing] = useState<{ id: string | null; name: string; members: Set<string> } | null>(null);
  const [error, setError] = useState("");

  async function save() {
    if (!editing) return;
    setError("");
    try {
      const body = { name: editing.name, studentIds: [...editing.members] };
      if (editing.id) {
        await api(`/api/classes/${editing.id}`, { method: "PUT", body });
        setClasses((list) => list.map((x) => (x.id === editing.id ? { ...x, name: editing.name, memberIds: [...editing.members] } : x)));
      } else {
        const res = await api<{ class: { id: string } }>("/api/classes", { body });
        // A new class opens on its own page, where students are added.
        router.push(`/teacher/classes/${res.class.id}`);
        return;
      }
      setEditing(null);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  return (
    <div className="space-y-4">
      {classes.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {classes.map((cls) => (
            <li key={cls.id}>
              <Card className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link href={`/teacher/classes/${cls.id}`} className="font-semibold hover:text-brand hover:underline" data-testid="class-link">
                    {cls.name}
                  </Link>
                  <p className="text-sm text-ink-muted">{fmtCount(c.membersCount, cls.memberIds.length)}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-subtle">
                    {cls.memberIds
                      .map((id) => students.find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label={dict.labs.common.edit} onClick={() => setEditing({ id: cls.id, name: cls.name, members: new Set(cls.memberIds) })}>
                    <Pencil aria-hidden className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={dict.labs.common.delete}
                    onClick={async () => {
                      if (!window.confirm(c.deleteConfirm)) return;
                      await api(`/api/classes/${cls.id}`, { method: "DELETE" });
                      setClasses((list) => list.filter((x) => x.id !== cls.id));
                    }}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{c.noClasses}</p>
      )}
      {editing ? (
        <Card className="space-y-4 p-5">
          <Field label={c.name}>{(ids) => <Input {...ids} required maxLength={80} placeholder={c.namePlaceholder} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />}</Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{c.members}</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {students.map((s) => (
                <Checkbox
                  key={s.id}
                  label={s.name}
                  checked={editing.members.has(s.id)}
                  onChange={() => {
                    const next = new Set(editing.members);
                    if (next.has(s.id)) next.delete(s.id);
                    else next.add(s.id);
                    setEditing({ ...editing, members: next });
                  }}
                />
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button onClick={save} disabled={!editing.name.trim()}>
              {c.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {dict.common.cancel}
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setEditing({ id: null, name: "", members: new Set() })}>
          <Plus aria-hidden className="size-4" />
          {c.new}
        </Button>
      )}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
