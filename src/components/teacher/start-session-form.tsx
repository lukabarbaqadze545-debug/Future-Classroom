"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Play, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import type { SessionLessonOption } from "@/lib/services/lessons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/components/ui/cn";

/** Choose a lesson, a class and the activities, then open the live console. */
export function StartSessionForm({
  lessons,
  classes,
  initialLessonId,
  initialClassId,
}: {
  lessons: SessionLessonOption[];
  classes: { id: string; name: string; size: number }[];
  initialLessonId: string | null;
  initialClassId: string | null;
}) {
  const { dict } = useI18n();
  const n = dict.newSession;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [lessonId, setLessonId] = useState<string | null>(initialLessonId);
  const [classId, setClassId] = useState(initialClassId ?? classes[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lesson = lessons.find((l) => l.id === lessonId) ?? null;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((l) => !q || l.title.toLowerCase().includes(q) || dict.subjects[l.subject].toLowerCase().includes(q));
  }, [lessons, query, dict]);

  const start = async () => {
    if (!lesson) {
      setError(n.chooseLesson);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const activityIds = lesson.activities.filter((a) => !excluded.has(a.id)).map((a) => a.id);
      const { sessionId } = await api<{ sessionId: string }>("/api/sessions", { body: { lessonId: lesson.id, classId: classId || null, classLabel: classId ? "" : label, activityIds } });
      router.push(`/teacher/sessions/${sessionId}`);
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  };

  const group = (mine: boolean) => shown.filter((l) => l.mine === mine);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="p-5">
        {lesson ? (
          <div data-testid="chosen-lesson">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink-muted">{dict.subjects[lesson.subject]} · {fmt(dict.common.grade, { n: lesson.grade })}</p>
                <h2 className="text-xl font-semibold">{lesson.title}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLessonId(null)}>
                {n.changeLesson}
              </Button>
            </div>
            {lesson.reviewStatus !== "ready" ? <Notice tone="info" className="mt-4">{n.notReady}</Notice> : null}
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-medium">{n.activities}</legend>
              <div className="space-y-2">
                {lesson.activities.map((a, i) => (
                  <Checkbox
                    key={a.id}
                    label={`${i + 1}. ${a.label}`}
                    checked={!excluded.has(a.id)}
                    onChange={(e) =>
                      setExcluded((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.delete(a.id);
                        else next.add(a.id);
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <div>
            <label className="relative block">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle" />
              <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={n.search} aria-label={n.search} className="pl-11" data-testid="session-lesson-search" />
            </label>
            {shown.length ? (
              [true, false].map((mine) =>
                group(mine).length ? (
                  <section key={String(mine)} className="mt-5">
                    <h2 className="mb-2 text-sm font-semibold text-ink-muted">{mine ? n.myLessons : n.otherLessons}</h2>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {group(mine).map((l) => (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setLessonId(l.id);
                              setExcluded(new Set());
                            }}
                            className={cn("flex h-full w-full flex-col items-start rounded-xl border border-line p-3 text-left hover:border-brand/40 hover:bg-brand-soft/30")}
                            data-testid="session-lesson-option"
                          >
                            <span className="text-xs text-ink-subtle">{dict.subjects[l.subject]} · {fmt(dict.common.grade, { n: l.grade })}</span>
                            <span className="font-medium">{l.title}</span>
                            <span className="mt-1 text-xs text-ink-muted">{fmtCount(dict.teacher.lessons.activities, l.activities.length)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null,
              )
            ) : (
              <p className="mt-5 text-sm text-ink-muted">{n.noLessons}</p>
            )}
          </div>
        )}
      </Card>

      <Card className="h-fit space-y-4 p-5">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Field label={n.class}>
          {(ids) => (
            <Select {...ids} value={classId} onChange={(e) => setClassId(e.target.value)} data-testid="session-class">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.size})
                </option>
              ))}
              <option value="">{n.noClass}</option>
            </Select>
          )}
        </Field>
        {classId ? null : (
          <Field label={dict.teacher.editor.classLabel}>
            {(ids) => <Input {...ids} value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} placeholder={dict.teacher.editor.classLabelPlaceholder} />}
          </Field>
        )}
        {lesson ? (
          <p className="text-sm text-ink-muted">
            <Badge>{fmtCount(dict.teacher.lessons.activities, lesson.activities.length - excluded.size)}</Badge>
          </p>
        ) : null}
        <Button size="xl" className="w-full" onClick={start} disabled={busy || !lesson || excluded.size === lesson.activities.length} data-testid="start-session-confirm">
          <Play aria-hidden className="size-6" />
          {n.start}
        </Button>
      </Card>
    </div>
  );
}
