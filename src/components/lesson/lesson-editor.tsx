"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Copy, Eye, MonitorPlay, Plus, Save, Trash2, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { clientId } from "@/lib/client/ids";
import { CONTENT_LANGUAGES, DIFFICULTIES, GRADES, SUBJECTS } from "@/lib/domain/catalog";
import type { Activity, LessonContent, LessonMeta, Section } from "@/lib/domain/schemas";
import type { LessonRecord } from "@/lib/services/lessons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { ListEditor } from "./list-editor";
import { SectionEditor } from "./section-editor";
import { ActivityEditor } from "./activity-editor";
import { ItemToolbar } from "./item-toolbar";
import { StartSessionButton } from "@/components/teacher/start-session-dialog";
import { ReviewBadge } from "@/components/lesson/review-badge";

type TabId = "overview" | "structure" | "activities" | "extras" | "materials";

export interface EditorMaterial {
  id: string;
  title: string;
  subject: string;
  textStatus: string;
}

export interface EditorQuiz {
  id: string;
  title: string;
  status: "draft" | "published";
  questionCount: number;
}

export type GenerationNotice = "ai" | "curated" | "outline" | "ai_failed" | null;

function metaOf(lesson: LessonRecord): LessonMeta {
  const { title, subject, grade, topic, durationMin, objective, difficulty, language } = lesson;
  return { title, subject, grade, topic, durationMin, objective, difficulty, language };
}

export function LessonEditor({
  lesson,
  aiAvailable,
  materials,
  quizzes,
  notice,
  curatedTopics,
}: {
  lesson: LessonRecord;
  aiAvailable: boolean;
  materials: EditorMaterial[];
  quizzes: EditorQuiz[];
  notice: GenerationNotice;
  curatedTopics: string;
}) {
  const { dict } = useI18n();
  const e = dict.teacher.editor;
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [meta, setMeta] = useState<LessonMeta>(() => metaOf(lesson));
  const [content, setContent] = useState<LessonContent>(lesson.content);
  const [materialIds, setMaterialIds] = useState<string[]>(lesson.materialIds);
  const [status, setStatus] = useState(lesson.status);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number>(lesson.updatedAt);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [regen, setRegen] = useState<{ part: "section" | "activity"; id: string } | null>(null);
  const [regenInstruction, setRegenInstruction] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const [undo, setUndo] = useState<{ id: string; section?: Section; activity?: Activity } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quizBusy, setQuizBusy] = useState(false);

  const updateMeta = (patch: Partial<LessonMeta>) => {
    setMeta((m) => ({ ...m, ...patch }));
    setDirty(true);
  };
  const updateContent = useCallback((patch: Partial<LessonContent>) => {
    setContent((c) => ({ ...c, ...patch }));
    setDirty(true);
  }, []);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const cleaned: LessonContent = {
        ...content,
        objectives: content.objectives.map((o) => o.trim()).filter(Boolean),
        discussionQuestions: content.discussionQuestions.map((o) => o.trim()).filter(Boolean),
        assessment: content.assessment.map((o) => o.trim()).filter(Boolean),
        homework: content.homework.map((o) => o.trim()).filter(Boolean),
        sources: content.sources.map((o) => o.trim()).filter(Boolean),
        sections: content.sections.map((s) => ({ ...s, title: s.title.trim() || e.emptySection })),
        activities: content.activities
          .filter((a) => a.prompt.trim())
          .map((a) => ({ ...a, acceptedAnswers: a.acceptedAnswers.map((x) => x.trim()).filter(Boolean), hints: a.hints.map((h) => h.trim()) })),
      };
      const { lesson: saved } = await api<{ lesson: LessonRecord }>(`/api/lessons/${lesson.id}`, { method: "PUT", body: { meta: { ...meta, title: meta.title.trim() || meta.topic }, content: cleaned, materialIds } });
      setContent(saved.content);
      setMeta(metaOf(saved));
      setSavedAt(saved.updatedAt);
      setDirty(false);
      return true;
    } catch (err) {
      setError(`${e.saveFailed} (${errorMessage(dict, err)})`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [content, dict, e.emptySection, e.saveFailed, lesson.id, materialIds, meta]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const moveItem = <T,>(items: T[], index: number, delta: number): T[] => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(Math.max(0, Math.min(next.length, index + delta)), 0, item);
    return next;
  };

  const runRegenerate = async () => {
    if (!regen) return;
    setRegenBusy(true);
    setError(null);
    try {
      const result = await api<{ section?: Section; activity?: Activity }>(`/api/lessons/${lesson.id}/regenerate`, {
        body: { part: regen.part, partId: regen.id, instruction: regenInstruction, meta, content },
      });
      if (result.section) {
        setUndo({ id: regen.id, section: content.sections.find((s) => s.id === regen.id) });
        updateContent({ sections: content.sections.map((s) => (s.id === regen.id ? result.section! : s)) });
      }
      if (result.activity) {
        setUndo({ id: regen.id, activity: content.activities.find((a) => a.id === regen.id) });
        updateContent({ activities: content.activities.map((a) => (a.id === regen.id ? result.activity! : a)) });
      }
      setExpanded(regen.id);
      setRegen(null);
      setRegenInstruction("");
    } catch (err) {
      setError(errorMessage(dict, err));
    } finally {
      setRegenBusy(false);
    }
  };

  const doUndo = () => {
    if (!undo) return;
    if (undo.section) updateContent({ sections: content.sections.map((s) => (s.id === undo.id ? undo.section! : s)) });
    if (undo.activity) updateContent({ activities: content.activities.map((a) => (a.id === undo.id ? undo.activity! : a)) });
    setUndo(null);
  };

  const changeStatus = async (next: "draft" | "published") => {
    if (dirty && !(await save())) return;
    try {
      await api(`/api/lessons/${lesson.id}/status`, { body: { status: next, reviewed } });
      setStatus(next);
      setPublishOpen(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(dict, err));
    }
  };

  const createQuiz = async () => {
    if (dirty && !(await save())) return;
    setQuizBusy(true);
    try {
      const { quizId } = await api<{ quizId: string }>(`/api/lessons/${lesson.id}/quiz`, { body: {} });
      router.push(`/teacher/quizzes/${quizId}?generated=1`);
    } catch (err) {
      setError(errorMessage(dict, err));
      setQuizBusy(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/api/lessons/${lesson.id}`, { method: "DELETE" });
      setDirty(false);
      router.push("/teacher/lessons");
      router.refresh();
    } catch (err) {
      setError(errorMessage(dict, err));
    }
  };

  const duplicate = async () => {
    try {
      const { lesson: copy } = await api<{ lesson: { id: string } }>(`/api/lessons/${lesson.id}/duplicate`, { body: {} });
      router.push(`/teacher/lessons/${copy.id}`);
    } catch (err) {
      setError(errorMessage(dict, err));
    }
  };

  const totalMinutes = useMemo(() => content.sections.reduce((sum, s) => sum + s.minutes, 0), [content.sections]);
  const originTone = lesson.origin === "ai" ? "ai" : lesson.origin === "template" ? "brand" : "neutral";

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link href="/teacher/lessons" className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" />
            {e.backToLessons}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{meta.title || meta.topic}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <Badge tone={status === "published" ? "success" : "neutral"} dot>
              {dict.status[status]}
            </Badge>
            <Badge tone={originTone}>{dict.origin[lesson.origin]}</Badge>
            <Link href={`/teacher/lessons/${lesson.id}/preview`} className="rounded-full hover:opacity-80" title={dict.review.preview} data-testid="editor-review-status">
              <ReviewBadge status={lesson.reviewStatus} />
            </Link>
            <span>{dict.subjects[meta.subject]}</span>·<span>{fmt(dict.common.grade, { n: meta.grade })}</span>·<span>{fmt(dict.common.minutes, { n: meta.durationMin })}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/teacher/lessons/${lesson.id}/preview`} variant="secondary" data-testid="editor-preview">
            <Eye aria-hidden className="size-4" />
            {dict.review.preview}
          </ButtonLink>
          <ButtonLink href={`/present/lesson/${lesson.id}`} variant="secondary">
            <MonitorPlay aria-hidden className="size-4" />
            {e.present}
          </ButtonLink>
          <StartSessionButton
            lessonId={lesson.id}
            size="md"
            disabledReason={content.activities.length === 0 ? e.noActivities : null}
            beforeStart={async () => (dirty ? save() : true)}
          />
        </div>
      </div>

      {/* Generation / review notices */}
      <div className="space-y-2">
        {notice === "ai" || (lesson.origin === "ai" && status === "draft") ? <Notice tone="ai" title={dict.origin.ai}>{dict.ai.reviewNotice}</Notice> : null}
        {notice === "curated" ? <Notice tone="info">{dict.ai.templateCuratedNotice}</Notice> : null}
        {notice === "outline" ? <Notice tone="warn">{fmt(dict.ai.templateOutlineNotice, { topics: curatedTopics })}</Notice> : null}
        {notice === "ai_failed" ? <Notice tone="warn">{dict.ai.failedNotice}</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </div>

      <Tabs
        className="mt-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: e.tabs.overview },
          { id: "structure", label: e.tabs.structure, badge: <Badge>{content.sections.length}</Badge> },
          { id: "activities", label: e.tabs.activities, badge: <Badge>{content.activities.length}</Badge> },
          { id: "extras", label: e.tabs.extras },
          { id: "materials", label: e.tabs.materials },
        ]}
      />

      <div className="mt-5">
        {tab === "overview" ? (
          <Card className="space-y-5 p-5 sm:p-6">
            <Field label={e.titleLabel}>{(ids) => <Input {...ids} value={meta.title} onChange={(ev) => updateMeta({ title: ev.target.value })} maxLength={160} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label={dict.teacher.create.subject}>
                {(ids) => (
                  <Select {...ids} value={meta.subject} onChange={(ev) => updateMeta({ subject: ev.target.value as LessonMeta["subject"] })}>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {dict.subjects[s]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={dict.teacher.create.grade}>
                {(ids) => (
                  <Select {...ids} value={meta.grade} onChange={(ev) => updateMeta({ grade: Number(ev.target.value) })}>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {fmt(dict.common.grade, { n: g })}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={e.topic}>{(ids) => <Input {...ids} value={meta.topic} onChange={(ev) => updateMeta({ topic: ev.target.value })} maxLength={160} />}</Field>
              <Field label={dict.teacher.create.duration}>
                {(ids) => <Input {...ids} type="number" min={10} max={240} value={meta.durationMin} onChange={(ev) => updateMeta({ durationMin: Math.max(10, Math.min(240, Number(ev.target.value) || 45)) })} />}
              </Field>
              <Field label={dict.teacher.create.difficulty}>
                {(ids) => (
                  <Select {...ids} value={meta.difficulty} onChange={(ev) => updateMeta({ difficulty: ev.target.value as LessonMeta["difficulty"] })}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {dict.difficulty[d]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={dict.teacher.create.contentLanguage}>
                {(ids) => (
                  <Select {...ids} value={meta.language} onChange={(ev) => updateMeta({ language: ev.target.value as LessonMeta["language"] })}>
                    {CONTENT_LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {dict.contentLanguages[l]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Field label={e.objective}>{(ids) => <Textarea {...ids} value={meta.objective} rows={2} onChange={(ev) => updateMeta({ objective: ev.target.value })} />}</Field>
            <ListEditor label={e.objectives} items={content.objectives} onChange={(objectives) => updateContent({ objectives })} addLabel={e.addObjective} />
          </Card>
        ) : null}

        {tab === "structure" ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">{fmt(dict.common.minutes, { n: totalMinutes })} / {fmt(dict.common.minutes, { n: meta.durationMin })}</p>
            {content.sections.map((section, index) => {
              const open = expanded === section.id;
              return (
                <Card key={section.id} className={open ? "ring-2 ring-brand/15" : undefined}>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setExpanded(open ? null : section.id)} aria-expanded={open}>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-ink-muted">{index + 1}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{section.title || e.emptySection}</span>
                        <span className="text-sm text-ink-muted">
                          {dict.sectionKinds[section.kind]} · {fmt(dict.common.minutes, { n: section.minutes })}
                        </span>
                      </span>
                    </button>
                    <ItemToolbar
                      index={index}
                      count={content.sections.length}
                      aiAvailable={aiAvailable}
                      onMove={(delta) => updateContent({ sections: moveItem(content.sections, index, delta) })}
                      onDelete={() => updateContent({ sections: content.sections.filter((s) => s.id !== section.id) })}
                      onRegenerate={() => setRegen({ part: "section", id: section.id })}
                      regenerateLabel={dict.ai.regenerateSection}
                      onUndo={undo?.id === section.id ? doUndo : null}
                    />
                  </div>
                  {open ? (
                    <div className="border-t border-line px-4 py-4 sm:px-5">
                      <SectionEditor section={section} onChange={(next) => updateContent({ sections: content.sections.map((s) => (s.id === section.id ? next : s)) })} />
                    </div>
                  ) : section.body ? (
                    <p className="line-clamp-2 px-5 pb-3 text-sm text-ink-muted">{section.body}</p>
                  ) : null}
                </Card>
              );
            })}
            <Button
              variant="secondary"
              onClick={() => {
                const id = clientId("s");
                updateContent({ sections: [...content.sections, { id, kind: "explanation", title: "", body: "", minutes: 5, visual: null }] });
                setExpanded(id);
              }}
            >
              <Plus aria-hidden className="size-4" />
              {e.addSection}
            </Button>
          </div>
        ) : null}

        {tab === "activities" ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">{e.activitiesLead}</p>
            {content.activities.map((activity, index) => {
              const open = expanded === activity.id;
              return (
                <Card key={activity.id} className={open ? "ring-2 ring-brand/15" : undefined} data-testid="activity-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setExpanded(open ? null : activity.id)} aria-expanded={open}>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-sm font-semibold text-brand-ink">{index + 1}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{activity.title || activity.prompt || e.untitledActivity}</span>
                        <span className="text-sm text-ink-muted">
                          {dict.activityTypes[activity.type]}
                          {activity.hints.length ? ` · ${fmtCount(e.hintCount, activity.hints.length)}` : ""}
                        </span>
                      </span>
                    </button>
                    <ItemToolbar
                      index={index}
                      count={content.activities.length}
                      aiAvailable={aiAvailable}
                      onMove={(delta) => updateContent({ activities: moveItem(content.activities, index, delta) })}
                      onDelete={() => updateContent({ activities: content.activities.filter((a) => a.id !== activity.id) })}
                      onRegenerate={() => setRegen({ part: "activity", id: activity.id })}
                      regenerateLabel={dict.ai.regenerateActivity}
                      onUndo={undo?.id === activity.id ? doUndo : null}
                    />
                  </div>
                  {open ? (
                    <div className="border-t border-line px-4 py-4 sm:px-5">
                      <ActivityEditor activity={activity} onChange={(next) => updateContent({ activities: content.activities.map((a) => (a.id === activity.id ? next : a)) })} />
                    </div>
                  ) : (
                    <p className="line-clamp-2 px-5 pb-3 text-sm text-ink-muted">{activity.prompt}</p>
                  )}
                </Card>
              );
            })}
            <Button
              variant="secondary"
              onClick={() => {
                const id = clientId("a");
                updateContent({
                  activities: [
                    ...content.activities,
                    { id, type: "short_answer", title: "", prompt: "", options: [], correctOptionIds: [], acceptedAnswers: [], hints: [], solution: "", allowSolution: true, explanation: "", timeLimitSec: null },
                  ],
                });
                setExpanded(id);
              }}
            >
              <Plus aria-hidden className="size-4" />
              {e.addActivity}
            </Button>
          </div>
        ) : null}

        {tab === "extras" ? (
          <Card className="space-y-6 p-5 sm:p-6">
            <ListEditor label={e.discussionQuestions} items={content.discussionQuestions} onChange={(discussionQuestions) => updateContent({ discussionQuestions })} />
            <ListEditor label={e.assessment} items={content.assessment} onChange={(assessment) => updateContent({ assessment })} />
            <ListEditor label={e.homework} items={content.homework} onChange={(homework) => updateContent({ homework })} />
            <Field label={e.teacherNotes}>{(ids) => <Textarea {...ids} rows={4} value={content.teacherNotes} onChange={(ev) => updateContent({ teacherNotes: ev.target.value })} />}</Field>
            <div>
              <ListEditor label={e.sources} items={content.sources} onChange={(sources) => updateContent({ sources })} rows={1} />
              <p className="mt-1 text-xs text-ink-subtle">{e.sourcesHelp}</p>
            </div>
          </Card>
        ) : null}

        {tab === "materials" ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="font-semibold">{e.linkedMaterials}</h2>
              {materials.length ? (
                <div className="mt-3 space-y-2">
                  {materials.map((m) => (
                    <Checkbox
                      key={m.id}
                      className="flex"
                      label={
                        <span>
                          {m.title} <span className="text-ink-subtle">· {dict.subjects[m.subject as LessonMeta["subject"]] ?? m.subject}</span>
                        </span>
                      }
                      checked={materialIds.includes(m.id)}
                      onChange={(ev) => {
                        setMaterialIds(ev.target.checked ? [...materialIds, m.id] : materialIds.filter((id) => id !== m.id));
                        setDirty(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">{e.noLinkedMaterials}</p>
              )}
              <ButtonLink href="/teacher/materials" variant="ghost" size="sm" className="mt-3">
                <Upload aria-hidden className="size-4" />
                {dict.teacher.dashboard.uploadMaterial}
              </ButtonLink>
            </Card>
            <Card className="p-5 sm:p-6">
              <h2 className="font-semibold">{e.linkedQuizzes}</h2>
              {quizzes.length ? (
                <ul className="mt-3 divide-y divide-line">
                  {quizzes.map((q) => (
                    <li key={q.id} className="flex items-center justify-between gap-2 py-2">
                      <Link href={`/teacher/quizzes/${q.id}`} className="font-medium text-brand hover:underline">
                        {q.title}
                      </Link>
                      <span className="text-sm text-ink-muted">
                        {fmtCount(dict.teacher.quizzes.questions, q.questionCount)} · {dict.status[q.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button variant="secondary" className="mt-3" onClick={createQuiz} disabled={quizBusy}>
                <ClipboardList aria-hidden className="size-4" />
                {quizBusy ? e.generatingQuiz : e.generateQuiz}
              </Button>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Danger zone */}
      <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-5">
        <Button variant="ghost" onClick={duplicate}>
          <Copy aria-hidden className="size-4" />
          {dict.teacher.lessons.duplicate}
        </Button>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden className="size-4" />
          {e.deleteLesson}
        </Button>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-ink-muted" aria-live="polite">
            {dirty ? <span className="font-medium text-warn">{dict.common.unsaved}</span> : fmt(e.savedAt, { when: relativeTime(dict, savedAt) })}
          </p>
          <div className="flex gap-2">
            {status === "published" ? (
              <Button variant="ghost" onClick={() => changeStatus("draft")}>
                {e.unpublish}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => (lesson.origin === "ai" ? setPublishOpen(true) : changeStatus("published"))} data-testid="publish-lesson">
                {e.publish}
              </Button>
            )}
            <Button onClick={save} disabled={saving || !dirty} data-testid="save-lesson">
              <Save aria-hidden className="size-4" />
              {saving ? dict.common.saving : dirty ? dict.common.save : dict.common.saved}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={regen !== null}
        onClose={() => setRegen(null)}
        title={regen?.part === "section" ? dict.ai.regenerateSection : dict.ai.regenerateActivity}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRegen(null)}>
              {dict.common.cancel}
            </Button>
            <Button onClick={runRegenerate} disabled={regenBusy}>
              {regenBusy ? dict.ai.regenerating : dict.ai.regenerate}
            </Button>
          </>
        }
      >
        <Field label={dict.ai.regeneratePrompt}>
          {(ids) => <Textarea {...ids} rows={2} value={regenInstruction} onChange={(ev) => setRegenInstruction(ev.target.value)} placeholder={dict.ai.regeneratePlaceholder} maxLength={500} />}
        </Field>
        <p className="mt-3 text-xs text-ink-subtle">{dict.ai.reviewNotice}</p>
      </Dialog>

      <Dialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title={e.publish}
        description={e.publishConfirmAI}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button onClick={() => changeStatus("published")} disabled={!reviewed}>
              {e.publish}
            </Button>
          </>
        }
      >
        <Checkbox label={e.publishConfirmCheck} checked={reviewed} onChange={(ev) => setReviewed(ev.target.checked)} />
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={e.deleteLesson}
        description={dict.teacher.lessons.deleteConfirm}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button variant="danger" onClick={remove}>
              {dict.common.delete}
            </Button>
          </>
        }
      />
    </div>
  );
}
