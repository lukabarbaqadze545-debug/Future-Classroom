"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CircleCheck, CircleDot, ClipboardList, Eye, Radio } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { DIFFICULTIES, type Difficulty } from "@/lib/domain/catalog";
import { ACTIVITY_KINDS, type ActivityKind, type ResolvedItem } from "@/lib/content/subject-kinds";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { DuplicateLessonButton } from "@/components/lesson/duplicate-button";
import { cn } from "@/components/ui/cn";

export interface Viewer {
  id: string;
  staff: boolean;
}

/** Where a lesson opens for this viewer: students read it, teachers edit their own or preview others'. */
export function itemHref(item: ResolvedItem, viewer: Viewer): string {
  if (item.source !== "lesson" || !item.lessonId || !viewer.staff) return item.href;
  return item.lessonOwnerId === viewer.id ? `/teacher/lessons/${item.lessonId}` : `/present/lesson/${item.lessonId}`;
}

export function StatusIcon({ status }: { status: ResolvedItem["status"] }) {
  const { dict } = useI18n();
  if (status === "done") return <CircleCheck aria-label={dict.subjectCatalog.status.done} className="size-5 shrink-0 text-success" />;
  if (status === "started") return <CircleDot aria-label={dict.subjectCatalog.status.started} className="size-5 shrink-0 text-brand" />;
  return <span aria-hidden className="size-5 shrink-0 rounded-full border-2 border-line-strong" />;
}

export function ItemRow({ item, viewer, prefix }: { item: ResolvedItem; viewer: Viewer; prefix?: ReactNode }) {
  const { dict } = useI18n();
  const c = dict.subjectCatalog;
  const ownLesson = item.lessonOwnerId === viewer.id;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3" data-testid="subject-item">
      {prefix}
      {viewer.staff ? null : <StatusIcon status={item.status} />}
      <div className="min-w-0 flex-1 basis-56">
        <Link href={itemHref(item, viewer)} className="font-medium text-ink hover:text-brand hover:underline" lang={item.language ?? undefined}>
          {item.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
          <span>{c.sources[item.source]}</span>
          {item.quizId ? <span>· {c.withQuiz}</span> : null}
          {item.difficulty ? <span>· {dict.difficulty[item.difficulty]}</span> : null}
          {item.language ? <Badge className="ml-0.5">{dict.contentLanguages[item.language]}</Badge> : null}
        </p>
      </div>
      {viewer.staff ? (
        <div className="flex flex-wrap items-center gap-1">
          {item.source === "lesson" && item.lessonId && !ownLesson ? (
            <>
              <Link href={`/present/lesson/${item.lessonId}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-muted hover:bg-muted hover:text-ink">
                <Eye aria-hidden className="size-4" />
                {c.preview}
              </Link>
              <DuplicateLessonButton lessonId={item.lessonId} />
            </>
          ) : null}
          {item.assign ? (
            <Link href={`/teacher/assignments/new?kind=${item.assign.kind}&ref=${encodeURIComponent(item.assign.ref)}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
              <ClipboardList aria-hidden className="size-4" />
              {dict.labs.common.assign}
            </Link>
          ) : null}
          {item.sessionKey ? (
            <Link href={`/teacher/sessions/labs?add=${encodeURIComponent(item.sessionKey)}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
              <Radio aria-hidden className="size-4" />
              {c.runInClass}
            </Link>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/** A subject's topics with filters by activity type and difficulty. */
export function SubjectExplorer({ topics, viewer }: { topics: { id: string; name: string; items: ResolvedItem[] }[]; viewer: Viewer }) {
  const { dict } = useI18n();
  const c = dict.subjectCatalog;
  const [kind, setKind] = useState<ActivityKind | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const all = topics.flatMap((t) => t.items);
  const kinds = ACTIVITY_KINDS.filter((k) => all.some((i) => i.kinds.includes(k)));
  const difficulties = DIFFICULTIES.filter((d) => all.some((i) => i.difficulty === d));
  const shown = useMemo(
    () => topics.map((t) => ({ ...t, items: t.items.filter((i) => (!kind || i.kinds.includes(kind)) && (!difficulty || i.difficulty === difficulty)) })).filter((t) => t.items.length),
    [topics, kind, difficulty],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Select aria-label={c.activity} value={kind} onChange={(e) => setKind(e.target.value as ActivityKind | "")} className="w-auto min-w-48" data-testid="explorer-kind">
          <option value="">{c.anyActivity}</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {c.kinds[k]}
            </option>
          ))}
        </Select>
        {difficulties.length > 1 ? (
          <Select aria-label={c.difficulty} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | "")} className="w-auto min-w-48">
            <option value="">{c.anyDifficulty}</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {dict.difficulty[d]}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
      {shown.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {shown.map((topic) => (
            <section key={topic.id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]" aria-labelledby={`topic-${topic.id}`}>
              <h3 id={`topic-${topic.id}`} className="border-b border-line bg-muted/40 px-4 py-3 font-semibold">
                {topic.name}
              </h3>
              <ul className={cn("divide-y divide-line")}>
                {topic.items.map((item) => (
                  <ItemRow key={item.key} item={item} viewer={viewer} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-muted">
          <p>{c.noResults}</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              setKind("");
              setDifficulty("");
            }}
          >
            {c.clearFilters}
          </Button>
        </div>
      )}
    </div>
  );
}
