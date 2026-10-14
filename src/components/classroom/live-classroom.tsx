"use client";

import { useCallback, useEffect, useState } from "react";
import { Hand, MessageSquare, Pause, Play, Send, WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { areaOf, isPlatformPath, type Area } from "@/lib/classroom/areas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

type Status = "active" | "idle" | "away" | "offline";
interface Student {
  id: string;
  displayName: string;
  username: string;
  status: Status;
  path: string | null;
  title: string;
  pageSince: number | null;
  lastSeen: number | null;
  help: { raisedAt: number; note: string; ackAt: number | null } | null;
  locked: boolean;
  unreadMessages: number;
}
export interface LiveState {
  class: { id: string; name: string };
  at: number;
  students: Student[];
  counts: Record<Status, number> & { help: number; locked: number; total: number };
}
interface Activity {
  student: Student;
  visits: { path: string; title: string; startedAt: number; endedAt: number }[];
  work: { kind: string; subject: string; topic: string; correct: boolean | null; at: number }[];
  messages: { text: string; at: number; deliveredAt: number | null; readAt: number | null }[];
}

const POLL_MS = 4000;
const TONES: Record<Status, "success" | "warn" | "neutral"> = { active: "success", idle: "warn", away: "warn", offline: "neutral" };
const DOT: Record<Status, string> = { active: "bg-success", idle: "bg-warn", away: "bg-warn", offline: "bg-ink-subtle/50" };
const PRESETS: { area: Area; path: string }[] = [
  { area: "subjects", path: "/subjects" },
  { area: "library", path: "/library" },
  { area: "assistant", path: "/learning-assistant" },
  { area: "programming", path: "/labs/programming" },
  { area: "stem", path: "/labs/stem" },
  { area: "research", path: "/labs/research" },
  { area: "critical", path: "/labs/critical-thinking" },
  { area: "career", path: "/career" },
];

type Dialogs = { kind: "pause" | "message" | "open"; ids: string[] | null } | null;

/** The teacher's live view of a class: who is where, who needs help, and controls for the whole class or chosen students. */
export function LiveClassroom({ classId, initial }: { classId: string; initial: LiveState }) {
  const { dict, locale } = useI18n();
  const c = dict.classroom;
  const [state, setState] = useState(initial);
  const [lost, setLost] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [detail, setDetail] = useState<Activity | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [preset, setPreset] = useState(PRESETS[1].path);
  const [custom, setCustom] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await api<LiveState>(`/api/classroom/${classId}`);
      setState(next);
      setLost(false);
      if (detailId) setDetail(await api<Activity>(`/api/classroom/${classId}/students/${detailId}`));
    } catch {
      setLost(true);
    }
  }, [classId, detailId]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Times are shown relative to the server's clock, as of the last update.
  const ago = (ts: number) => relativeTime(dict, ts, state.at);
  const clock = (ts: number) => new Date(ts).toLocaleTimeString(locale === "ka" ? "ka-GE" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  const students = state.students;
  const targetIds = selected.size ? [...selected] : null;
  const targetLabel = targetIds ? fmtCount(c.target.chosen, targetIds.length) : c.target.whole;
  const nameOf = (id: string) => students.find((s) => s.id === id)?.displayName ?? "";

  async function control(body: Record<string, unknown>, done: (n: number) => string) {
    setBusy(true);
    setError(null);
    try {
      const { count } = await api<{ count: number }>(`/api/classroom/${classId}/control`, { body });
      setNotice(done(count));
      setDialog(null);
      setText("");
      setCustom("");
      await refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
    }
  }
  async function help(studentId: string, action: "ack" | "resolve") {
    try {
      await api(`/api/classroom/${classId}/help`, { body: { studentId, action } });
    } finally {
      await refresh();
    }
  }
  function unlock(ids: string[] | null) {
    void control({ action: "unlock", studentIds: ids }, (n) => fmtCount(c.resumed, n));
  }
  async function showDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    try {
      setDetail(await api<Activity>(`/api/classroom/${classId}/students/${id}`));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }
  function closeDetail() {
    setDetailId(null);
    setDetail(null);
  }
  function openDialog(kind: "pause" | "message" | "open", ids: string[] | null) {
    closeDetail();
    setError(null);
    setText("");
    setDialog({ kind, ids });
  }

  const customPath = custom.trim();
  const customInvalid = customPath !== "" && !isPlatformPath(customPath);
  const areaLabel = (path: string | null) => (path ? c.areas[areaOf(path)] : c.noPage);
  const allSelected = students.length > 0 && selected.size === students.length;

  return (
    <div className="space-y-5" data-testid="live-classroom">
      {lost ? (
        <Notice tone="warn" className="flex items-center gap-2">
          <WifiOff aria-hidden className="size-4 shrink-0" />
          {c.connectionLost}
        </Notice>
      ) : null}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2" data-testid="live-summary" role="status" aria-live="polite">
        {(["active", "idle", "away", "offline"] as const).map((k) => (
          <Badge key={k} tone={TONES[k]} className="gap-1.5" dot>
            {fmt(c.summary[k], { n: state.counts[k] })}
          </Badge>
        ))}
        {state.counts.help ? (
          <Badge tone="danger" className="gap-1.5">
            <Hand aria-hidden className="size-3.5" />
            {fmt(c.summary.help, { n: state.counts.help })}
          </Badge>
        ) : null}
        <span className="ml-auto text-xs text-ink-subtle">{c.updating}</span>
      </div>

      {/* Controls */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <label className="flex items-center gap-2 pr-2 text-sm">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)))}
            className="size-5 accent-[var(--color-brand)]"
            data-testid="live-select-all"
          />
          {c.selectAll}
        </label>
        <span className="text-sm text-ink-muted" data-testid="live-target">
          {targetLabel}
        </span>
        {selected.size ? (
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            {c.clearSelection}
          </Button>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openDialog("message", targetIds)} disabled={!students.length} data-testid="live-message">
            <MessageSquare aria-hidden className="size-4" />
            {c.actions.message}
          </Button>
          <Button variant="secondary" onClick={() => openDialog("open", targetIds)} disabled={!students.length} data-testid="live-open">
            <Send aria-hidden className="size-4" />
            {c.actions.openPage}
          </Button>
          <Button variant="secondary" onClick={() => unlock(targetIds)} disabled={!students.length || busy} data-testid="live-resume">
            <Play aria-hidden className="size-4" />
            {c.actions.resume}
          </Button>
          <Button onClick={() => openDialog("pause", targetIds)} disabled={!students.length} data-testid="live-pause">
            <Pause aria-hidden className="size-4" />
            {c.actions.pause}
          </Button>
        </div>
      </Card>

      {notice ? (
        <p role="status" className="rounded-xl bg-success-soft px-4 py-2 text-sm font-medium text-success" data-testid="live-notice">
          {notice}
        </p>
      ) : null}
      {error && !dialog ? <Notice tone="danger">{error}</Notice> : null}

      {/* Students */}
      {students.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-testid="live-students">
          {students.map((s) => (
            <li key={s.id} data-testid="live-student" data-name={s.displayName} data-status={s.status} data-help={s.help ? "yes" : "no"} data-locked={s.locked ? "yes" : "no"}>
              <Card className={`flex h-full flex-col gap-2 p-4 ${s.help ? "border-danger/50 bg-danger-soft/40" : ""}`}>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.id)) next.delete(s.id);
                        else next.add(s.id);
                        return next;
                      })
                    }
                    aria-label={fmt(c.selectStudent, { name: s.displayName })}
                    className="mt-1 size-5 shrink-0 accent-[var(--color-brand)]"
                    data-testid="live-select"
                  />
                  <button type="button" onClick={() => void showDetail(s.id)} className="min-w-0 flex-1 rounded-lg text-left hover:text-brand" data-testid="live-detail">
                    <span className="block truncate font-semibold">{s.displayName}</span>
                  </button>
                  <span className="mt-1.5 flex shrink-0 items-center gap-1.5 text-xs text-ink-muted" title={c.statusHint[s.status]}>
                    <span aria-hidden className={`size-2.5 rounded-full ${DOT[s.status]}`} />
                    {c.status[s.status]}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium" data-testid="live-page">
                    {areaLabel(s.status === "offline" && !s.path ? null : s.path)}
                  </p>
                  {s.title && s.path && s.title !== areaLabel(s.path) ? <p className="truncate text-ink-muted">{s.title}</p> : null}
                  <p className="text-xs text-ink-subtle">{s.status === "offline" ? (s.lastSeen ? fmt(c.lastSeen, { time: ago(s.lastSeen) }) : "") : s.pageSince ? fmt(c.pageSince, { time: ago(s.pageSince) }) : ""}</p>
                </div>
                {s.locked || s.unreadMessages ? (
                  <div className="flex flex-wrap gap-1.5">
                    {s.locked ? <Badge tone="brand">{c.locked}</Badge> : null}
                    {s.unreadMessages ? <Badge tone="neutral">{c.unreadMessage}</Badge> : null}
                  </div>
                ) : null}
                {s.help ? (
                  <div className="mt-auto rounded-xl border border-danger/30 bg-surface p-2.5 text-sm">
                    <p className="flex items-center gap-1.5 font-semibold text-danger">
                      <Hand aria-hidden className="size-4" />
                      {c.needsHelp} · {ago(s.help.raisedAt)}
                    </p>
                    {s.help.note ? (
                      <p className="mt-1">
                        <span className="text-ink-muted">{c.helpNoteLabel}: </span>
                        {s.help.note}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.help.ackAt ? (
                        <Badge tone="success">{c.helpAcked}</Badge>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => void help(s.id, "ack")} data-testid="live-help-ack">
                          {c.helpAck}
                        </Button>
                      )}
                      <Button size="sm" onClick={() => void help(s.id, "resolve")} data-testid="live-help-done">
                        {c.helpDone}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{c.noStudents}</p>
      )}
      <p className="text-xs text-ink-subtle">{c.scope}</p>

      {/* Pause */}
      <Dialog
        open={dialog?.kind === "pause"}
        onClose={() => setDialog(null)}
        title={c.pauseDialog.title}
        description={`${c.pauseDialog.description} (${dialog?.ids ? fmtCount(c.target.chosen, dialog.ids.length) : c.target.whole})`}
        closeLabel={c.detail.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {c.cancel}
            </Button>
            <Button disabled={busy} onClick={() => void control({ action: "lock", studentIds: dialog?.ids ?? null, message: text.trim() }, (n) => fmtCount(c.paused2, n))} data-testid="confirm-pause">
              {c.pauseDialog.confirm}
            </Button>
          </>
        }
      >
        <Field label={c.pauseDialog.messageLabel}>{(ids) => <Input {...ids} value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder={c.pauseDialog.messagePlaceholder} data-testid="pause-message" />}</Field>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Dialog>

      {/* Message */}
      <Dialog
        open={dialog?.kind === "message"}
        onClose={() => setDialog(null)}
        title={c.messageDialog.title}
        description={`${c.messageDialog.description} (${dialog?.ids ? (dialog.ids.length === 1 ? nameOf(dialog.ids[0]) : fmtCount(c.target.chosen, dialog.ids.length)) : c.target.whole})`}
        closeLabel={c.detail.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {c.cancel}
            </Button>
            <Button disabled={busy || !text.trim()} onClick={() => void control({ action: "message", studentIds: dialog?.ids ?? null, text: text.trim() }, (n) => fmtCount(c.sent, n))} data-testid="confirm-message">
              <Send aria-hidden className="size-4" />
              {c.messageDialog.confirm}
            </Button>
          </>
        }
      >
        <Field label={c.messageDialog.label}>{(ids) => <Textarea {...ids} rows={3} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={c.messageDialog.placeholder} data-testid="message-text" />}</Field>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Dialog>

      {/* Open a page */}
      <Dialog
        open={dialog?.kind === "open"}
        onClose={() => setDialog(null)}
        title={c.openDialog.title}
        description={`${c.openDialog.description} (${dialog?.ids ? (dialog.ids.length === 1 ? nameOf(dialog.ids[0]) : fmtCount(c.target.chosen, dialog.ids.length)) : c.target.whole})`}
        closeLabel={c.detail.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {c.cancel}
            </Button>
            <Button
              disabled={busy || customInvalid}
              onClick={() => void control({ action: "open", studentIds: dialog?.ids ?? null, path: customPath || preset }, (n) => fmtCount(c.sent, n))}
              data-testid="confirm-open"
            >
              {c.openDialog.confirm}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={c.openDialog.presetLabel}>
            {(ids) => (
              <Select {...ids} value={preset} onChange={(e) => setPreset(e.target.value)} data-testid="open-preset">
                {PRESETS.map((p) => (
                  <option key={p.path} value={p.path}>
                    {c.areas[p.area]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={c.openDialog.custom} error={customInvalid ? c.openDialog.invalid : undefined}>
            {(ids) => <Input {...ids} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={c.openDialog.customPlaceholder} data-testid="open-custom" />}
          </Field>
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Dialog>

      {/* One student */}
      <Dialog
        open={detailId !== null}
        onClose={closeDetail}
        title={detail ? fmt(c.detail.title, { name: detail.student.displayName }) : "…"}
        closeLabel={c.detail.close}
        className="w-[min(680px,calc(100vw-32px))]"
        footer={
          detail ? (
            <>
              <Button variant="secondary" onClick={() => openDialog("message", [detail.student.id])} data-testid="detail-message">
                <MessageSquare aria-hidden className="size-4" />
                {fmt(c.detail.sendTo, { name: detail.student.displayName })}
              </Button>
              <Button variant="secondary" onClick={() => openDialog("open", [detail.student.id])}>
                <Send aria-hidden className="size-4" />
                {fmt(c.detail.openOne, { name: detail.student.displayName })}
              </Button>
              {detail.student.locked ? (
                <Button variant="secondary" onClick={() => { const id = detail.student.id; closeDetail(); unlock([id]); }}>
                  <Play aria-hidden className="size-4" />
                  {c.detail.resumeOne}
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => openDialog("pause", [detail.student.id])}>
                  <Pause aria-hidden className="size-4" />
                  {c.detail.pauseOne}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {detail ? (
          <div className="space-y-5 text-sm" data-testid="student-detail">
            <section>
              <h3 className="mb-1.5 font-semibold">{c.detail.pagesTitle}</h3>
              {detail.visits.length ? (
                <ol className="divide-y divide-line rounded-xl border border-line" data-testid="detail-pages">
                  {detail.visits.map((v, i) => {
                    const minutes = Math.max(1, Math.round((v.endedAt - v.startedAt) / 60_000));
                    return (
                      <li key={`${v.startedAt}-${i}`} className="flex items-baseline gap-3 px-3 py-2">
                        <span className="w-12 shrink-0 tabular-nums text-ink-subtle">{clock(v.startedAt)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="font-medium">{c.areas[areaOf(v.path)]}</span>
                          {v.title && v.title !== c.areas[areaOf(v.path)] ? <span className="block truncate text-ink-muted">{v.title}</span> : null}
                        </span>
                        <span className="shrink-0 text-ink-subtle">{fmt(c.detail.minutes, { n: minutes })}</span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-ink-muted">{c.detail.noPages}</p>
              )}
            </section>
            <section>
              <h3 className="mb-1.5 font-semibold">{c.detail.workTitle}</h3>
              {detail.work.length ? (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {detail.work.map((w, i) => (
                    <li key={i} className="flex items-baseline gap-3 px-3 py-2">
                      <span className="w-12 shrink-0 tabular-nums text-ink-subtle">{clock(w.at)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{c.detail.kinds[w.kind as keyof typeof c.detail.kinds] ?? w.kind}</span>
                        <span className="block truncate text-ink-muted">{w.topic}</span>
                      </span>
                      {w.correct !== null ? <Badge tone={w.correct ? "success" : "warn"}>{w.correct ? c.detail.correct : c.detail.incorrect}</Badge> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-muted">{c.detail.noWork}</p>
              )}
            </section>
            <section>
              <h3 className="mb-1.5 font-semibold">{c.detail.messagesTitle}</h3>
              {detail.messages.length ? (
                <ul className="space-y-1.5">
                  {detail.messages.map((m, i) => (
                    <li key={i} className="rounded-xl bg-muted px-3 py-2">
                      <p>{m.text}</p>
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        {clock(m.at)} · {m.readAt ? c.detail.read : m.deliveredAt ? c.detail.delivered : c.detail.sent}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-muted">{c.detail.noMessages}</p>
              )}
            </section>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">…</p>
        )}
      </Dialog>
    </div>
  );
}
