"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

interface LessonOption {
  id: string;
  title: string;
  grade: number;
  activities?: { id: string; label: string }[];
}

/**
 * Starts a live classroom session. Used from the dashboard (choose a lesson)
 * and from the lesson editor (choose which activities to include).
 */
export function StartSessionButton({
  lessons,
  fixedLessonId,
  size = "lg",
  variant = "primary",
  label,
  disabledReason,
  beforeStart,
}: {
  lessons: LessonOption[];
  fixedLessonId?: string;
  size?: "md" | "lg" | "xl";
  variant?: "primary" | "secondary";
  label?: string;
  disabledReason?: string | null;
  /** Runs before the session is created (e.g. saving unsaved lesson edits). */
  beforeStart?: () => Promise<boolean>;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lessonId, setLessonId] = useState(fixedLessonId ?? lessons[0]?.id ?? "");
  const [classLabel, setClassLabel] = useState("");
  const lesson = lessons.find((l) => l.id === lessonId);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      if (beforeStart && !(await beforeStart())) {
        setBusy(false);
        return;
      }
      const activityIds = lesson?.activities?.filter((a) => !excluded.has(a.id)).map((a) => a.id);
      const { sessionId } = await api<{ sessionId: string }>("/api/sessions", { body: { lessonId, classLabel, activityIds } });
      router.push(`/teacher/sessions/${sessionId}`);
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(false);
    }
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)} disabled={lessons.length === 0 || Boolean(disabledReason)} title={disabledReason ?? undefined} data-testid="start-session">
        <Play aria-hidden className="size-5" />
        {label ?? dict.teacher.editor.startSession}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={dict.teacher.editor.startSession}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button onClick={start} disabled={busy || !lessonId} data-testid="confirm-start-session">
              {busy ? dict.teacher.editor.startingSession : dict.teacher.editor.startSession}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {!fixedLessonId ? (
            <Field label={dict.nav.lessons}>
              {(ids) => (
                <Select {...ids} value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} · {dict.common.grade.replace("{n}", String(l.grade))}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : null}
          <Field label={dict.teacher.editor.classLabel}>
            {(ids) => <Input {...ids} value={classLabel} onChange={(e) => setClassLabel(e.target.value)} placeholder={dict.teacher.editor.classLabelPlaceholder} maxLength={30} />}
          </Field>
          {lesson?.activities?.length ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{dict.teacher.editor.sessionActivities}</legend>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-line p-3">
                {lesson.activities.map((a) => (
                  <Checkbox
                    key={a.id}
                    className="flex"
                    label={a.label}
                    checked={!excluded.has(a.id)}
                    onChange={(e) => {
                      const next = new Set(excluded);
                      if (e.target.checked) next.delete(a.id);
                      else next.add(a.id);
                      setExcluded(next);
                    }}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
