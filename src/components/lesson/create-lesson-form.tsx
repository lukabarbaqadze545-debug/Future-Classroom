"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { PenLine, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { CONTENT_LANGUAGES, DIFFICULTIES, GRADES, SUBJECTS, type Subject } from "@/lib/domain/catalog";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/misc";

interface MaterialOption {
  id: string;
  title: string;
  subject: Subject;
}

type Source = { kind: "ai"; model: string } | { kind: "template"; reason: "ai_offline" | "ai_failed"; curated: boolean };

export function CreateLessonForm({ aiAvailable, materials, builtInTopics }: { aiAvailable: boolean; materials: MaterialOption[]; builtInTopics: string }) {
  const { dict, locale } = useI18n();
  const c = dict.teacher.create;
  const router = useRouter();
  const [subject, setSubject] = useState<Subject>("mathematics");
  const [grade, setGrade] = useState(11);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(45);
  const [objective, setObjective] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("standard");
  const [language, setLanguage] = useState<(typeof CONTENT_LANGUAGES)[number]>(locale);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<"generate" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subjectMaterials = useMemo(() => materials.filter((m) => m.subject === subject), [materials, subject]);

  const generate = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("generate");
    setError(null);
    try {
      const { lessonId, source } = await api<{ lessonId: string; source: Source }>("/api/lessons/generate", {
        body: { subject, grade, topic, durationMin: duration, objective, difficulty, language, materialIds: selected.filter((id) => subjectMaterials.some((m) => m.id === id)) },
      });
      const notice = source.kind === "ai" ? "ai" : source.reason === "ai_failed" ? "ai_failed" : source.curated ? "curated" : "outline";
      router.push(`/teacher/lessons/${lessonId}?generated=${notice}`);
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(null);
    }
  };

  const manual = async () => {
    setBusy("manual");
    setError(null);
    try {
      const { lesson } = await api<{ lesson: { id: string } }>("/api/lessons", {
        body: { meta: { title: topic || dict.teacher.lessons.new, subject, grade, topic: topic || dict.teacher.lessons.new, durationMin: duration, objective, difficulty, language } },
      });
      router.push(`/teacher/lessons/${lesson.id}`);
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(null);
    }
  };

  if (busy === "generate") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center" role="status" aria-live="polite">
        <Spinner className="size-8 text-brand" />
        <p className="mt-4 text-lg font-semibold">{c.generating}</p>
        {aiAvailable ? <p className="mt-1 max-w-md text-sm text-ink-muted">{c.generatingAI}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={generate} className="space-y-6">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {!aiAvailable ? (
        <Notice tone="info" title={dict.ai.offline}>
          {c.aiOffline} {fmt(c.builtInTopics, { topics: builtInTopics })}
        </Notice>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={c.subject}>
          {(ids) => (
            <Select {...ids} value={subject} onChange={(e) => setSubject(e.target.value as Subject)} data-testid="lesson-subject">
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {dict.subjects[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={c.grade}>
          {(ids) => (
            <Select {...ids} value={grade} onChange={(e) => setGrade(Number(e.target.value))} data-testid="lesson-grade">
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {fmt(dict.common.grade, { n: g })}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label={c.topic}>
        {(ids) => <Input {...ids} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={c.topicPlaceholder} required minLength={2} maxLength={160} className="h-12 text-base" data-testid="lesson-topic" />}
      </Field>
      <Field label={c.objective} optionalLabel={dict.common.optional}>
        {(ids) => <Textarea {...ids} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder={c.objectivePlaceholder} rows={2} maxLength={600} />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={c.duration}>
          {(ids) => <Input {...ids} type="number" min={10} max={240} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 45)} />}
        </Field>
        <Field label={c.difficulty}>
          {(ids) => (
            <Select {...ids} value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {dict.difficulty[d]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={c.contentLanguage}>
          {(ids) => (
            <Select {...ids} value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
              {CONTENT_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {dict.contentLanguages[l]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">{c.materials}</legend>
        <p className="mb-2 text-xs text-ink-subtle">{c.materialsHelp}</p>
        {subjectMaterials.length ? (
          <div className="space-y-2 rounded-xl border border-line p-3">
            {subjectMaterials.map((m) => (
              <Checkbox key={m.id} className="flex" label={m.title} checked={selected.includes(m.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, m.id] : selected.filter((id) => id !== m.id))} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{c.noMaterials}</p>
        )}
      </fieldset>
      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={busy !== null || topic.trim().length < 2} data-testid="generate-lesson">
          <Sparkles aria-hidden className="size-5" />
          {c.generate}
        </Button>
        <Button variant="ghost" size="lg" onClick={manual} disabled={busy !== null}>
          <PenLine aria-hidden className="size-5" />
          {c.manual}
        </Button>
      </div>
    </form>
  );
}
