"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { KeyRound, Printer, UserMinus, UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

interface Person {
  id: string;
  displayName: string;
  username: string;
}

interface Credentials {
  displayName: string;
  username: string;
  password: string;
}

/** Students of one class: add (existing accounts or new ones), remove, give a new password. */
export function ClassRoster({ classId, className, members, others, signInUrl }: { classId: string; className: string; members: Person[]; others: Person[]; signInUrl: string }) {
  const { dict } = useI18n();
  const c = dict.labs.classes;
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "remove" | "password"; person: Person } | null>(null);
  const [slips, setSlips] = useState<Credentials[]>([]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return others.filter((o) => !q || o.displayName.toLowerCase().includes(q) || o.username.toLowerCase().includes(q));
  }, [others, query]);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const newStudents = names.split("\n").map((n) => n.trim()).filter(Boolean);
      const res = await api<{ created: Credentials[] }>(`/api/classes/${classId}/members`, { body: { studentIds: [...selected], newStudents } });
      if (res.created.length) setSlips(res.created);
      setAdding(false);
      setSelected(new Set());
      setNames("");
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  const act = async () => {
    if (!confirm) return;
    setBusy(true);
    setError(null);
    try {
      if (confirm.kind === "remove") {
        await api(`/api/classes/${classId}/members/${confirm.person.id}`, { method: "DELETE" });
      } else {
        const { password } = await api<{ password: string }>(`/api/classes/${classId}/members/${confirm.person.id}/password`, { body: {} });
        setSlips([{ displayName: confirm.person.displayName, username: confirm.person.username, password }]);
      }
      setConfirm(null);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {slips.length ? (
        <section className="fc-print-slips rounded-2xl border-2 border-brand/30 bg-surface p-5" data-testid="credential-slips">
          <div className="no-print mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{c.credentialsTitle}</h2>
              <p className="text-sm text-ink-muted">{c.credentialsLead}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer aria-hidden className="size-4" />
                {c.printSlips}
              </Button>
              <Button variant="ghost" onClick={() => setSlips([])}>
                {dict.common.close}
              </Button>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
            {slips.map((s) => (
              <li key={s.username} className="break-inside-avoid rounded-xl border border-dashed border-line-strong p-4">
                <p className="font-semibold">{s.displayName}</p>
                <p className="text-sm text-ink-muted">{className} · {signInUrl}</p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 font-mono text-[15px]">
                  <dt className="text-ink-muted">{dict.auth.username}</dt>
                  <dd data-testid="slip-username">{s.username}</dd>
                  <dt className="text-ink-muted">{dict.auth.password}</dt>
                  <dd data-testid="slip-password">{s.password}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Card>
        <CardHeader
          title={`${c.members} (${members.length})`}
          action={
            <Button size="sm" onClick={() => setAdding(true)} data-testid="add-students">
              <UserPlus aria-hidden className="size-4" />
              {c.addStudents}
            </Button>
          }
        />
        {members.length ? (
          <ul className="divide-y divide-line" data-testid="class-members">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
                <Link href={`/teacher/students/${m.id}`} className="min-w-0 font-medium hover:text-brand hover:underline">
                  {m.displayName} <span className="text-sm font-normal text-ink-subtle">@{m.username}</span>
                </Link>
                <span className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: "password", person: m })}>
                    <KeyRound aria-hidden className="size-4" />
                    {c.resetPassword}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: "remove", person: m })} aria-label={`${c.remove}: ${m.displayName}`}>
                    <UserMinus aria-hidden className="size-4" />
                    <span className="hidden sm:inline">{c.remove}</span>
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-5 text-sm text-ink-muted">{c.noMyStudents}</p>
        )}
      </Card>

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title={c.addStudents}
        closeLabel={dict.common.close}
        className="w-[min(720px,calc(100vw-32px))]"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {dict.common.cancel}
            </Button>
            <Button onClick={add} disabled={busy || (!selected.size && !names.trim())} data-testid="confirm-add-students">
              {busy ? c.adding : c.add}
            </Button>
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">{c.existingAccounts}</p>
            {others.length ? (
              <>
                <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search} aria-label={c.search} className="mb-2" />
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
                  {shown.map((o) => (
                    <Checkbox
                      key={o.id}
                      label={`${o.displayName} · @${o.username}`}
                      checked={selected.has(o.id)}
                      onChange={(e) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(o.id);
                          else next.delete(o.id);
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-muted">{c.noOtherStudents}</p>
            )}
          </div>
          <Field label={c.newAccounts} hint={c.newAccountsHelp}>
            {(ids) => <Textarea {...ids} rows={8} value={names} onChange={(e) => setNames(e.target.value)} placeholder={c.newAccountsPlaceholder} data-testid="new-student-names" />}
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === "remove" ? c.remove : c.resetPassword}
        description={confirm ? fmt(confirm.kind === "remove" ? c.removeConfirm : c.resetConfirm, { name: confirm.person.displayName, class: className }) : ""}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {dict.common.cancel}
            </Button>
            <Button variant={confirm?.kind === "remove" ? "danger" : "primary"} onClick={act} disabled={busy} data-testid="confirm-roster-action">
              {confirm?.kind === "remove" ? c.remove : c.resetPassword}
            </Button>
          </>
        }
      />
    </div>
  );
}
