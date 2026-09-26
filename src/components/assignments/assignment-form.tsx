"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { ASSIGNMENT_KINDS, type AssignmentKind } from "@/lib/labs/registry";
import type { AssignableItem } from "@/lib/labs/assignment-items";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

const OPTIONAL_REF: AssignmentKind[] = ["stem_project", "research", "portfolio", "custom"];

export function AssignmentForm({
  items,
  classes,
  students,
  initialKind,
  initialRef,
  initialClassId = null,
}: {
  items: Record<AssignmentKind, AssignableItem[]>;
  classes: { id: string; name: string; memberIds: string[] }[];
  students: { id: string; name: string }[];
  initialKind: AssignmentKind;
  initialRef: string | null;
  initialClassId?: string | null;
}) {
  const { dict } = useI18n();
  const a = dict.labs.assignments;
  const router = useRouter();
  const [kind, setKind] = useState<AssignmentKind>(initialKind);
  const [refId, setRefId] = useState<string>(initialRef ?? "");
  const initialTitle = items[initialKind].find((i) => i.id === initialRef)?.title ?? "";
  const [title, setTitle] = useState(initialTitle);
  const [titleTouched, setTitleTouched] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [due, setDue] = useState("");
  const [classId, setClassId] = useState(initialClassId ?? classes[0]?.id ?? "");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = items[kind];
  const needsRef = !OPTIONAL_REF.includes(kind);
  const classMembers = useMemo(() => new Set(classes.find((c) => c.id === classId)?.memberIds ?? []), [classes, classId]);
  const recipients = new Set([...picked, ...classMembers]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api<{ assignment: { id: string } }>("/api/assignments", {
        body: {
          kind,
          refId: refId || null,
          title,
          instructions,
          dueAt: due ? new Date(due).getTime() : null,
          classId: classId || null,
          studentIds: [...picked],
        },
      });
      router.push(`/teacher/assignments/${res.assignment.id}`);
    } catch (err) {
      setError(errorMessage(dict, err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <Field label={a.kind}>
          {(ids) => (
            <Select
              {...ids}
              value={kind}
              onChange={(e) => {
                const next = e.target.value as AssignmentKind;
                setKind(next);
                setRefId("");
                if (!titleTouched) setTitle("");
              }}
              data-testid="assignment-kind"
            >
              {ASSIGNMENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {a.kinds[k]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {options.length ? (
          <Field label={a.item}>
            {(ids) => (
              <Select
                {...ids}
                required={needsRef}
                value={refId}
                onChange={(e) => {
                  setRefId(e.target.value);
                  if (!titleTouched) setTitle(options.find((o) => o.id === e.target.value)?.title ?? "");
                }}
                data-testid="assignment-item"
              >
                <option value="">{needsRef ? a.chooseItem : a.anyItem}</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.group ? `${o.group} · ` : ""}
                    {o.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <p className="self-end pb-2 text-sm text-ink-muted">{kind === "custom" ? "" : a.anyItem}</p>
        )}
        <Field label={a.titleLabel} className="md:col-span-2">
          {(ids) => (
            <Input
              {...ids}
              required
              maxLength={160}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
              data-testid="assignment-title"
            />
          )}
        </Field>
        <Field label={a.instructions} className="md:col-span-2">
          {(ids) => <Textarea {...ids} rows={4} placeholder={a.instructionsPlaceholder} value={instructions} onChange={(e) => setInstructions(e.target.value)} />}
        </Field>
        <Field label={a.dueAt} hint={a.noDue}>
          {(ids) => <Input {...ids} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />}
        </Field>
      </Card>
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">{a.recipients}</h2>
        <Field label={a.class}>
          {(ids) => (
            <Select {...ids} value={classId} onChange={(e) => setClassId(e.target.value)} data-testid="assignment-class">
              <option value="">{a.noClass}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({fmtCount(dict.labs.classes.membersCount, c.memberIds.length)})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{a.students}</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {students.map((s) => (
              <Checkbox
                key={s.id}
                label={s.name}
                checked={recipients.has(s.id)}
                disabled={classMembers.has(s.id)}
                onChange={() =>
                  setPicked((set) => {
                    const next = new Set(set);
                    if (next.has(s.id)) next.delete(s.id);
                    else next.add(s.id);
                    return next;
                  })
                }
              />
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-ink-muted">{fmtCount(dict.labs.classes.membersCount, recipients.size)}</p>
      </Card>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Button type="submit" size="lg" disabled={busy || !title.trim() || recipients.size === 0 || (needsRef && !refId)} data-testid="create-assignment">
        {busy ? a.creating : a.create}
      </Button>
    </form>
  );
}
