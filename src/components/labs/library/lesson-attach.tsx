"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

/** Staff: attach this library resource to one of their lessons (students then see it in the lesson). */
export function LessonAttach({ resourceId, lessons, initial }: { resourceId: string; lessons: { id: string; title: string }[]; initial: { id: string; title: string; teacherId: string }[] }) {
  const { dict } = useI18n();
  const b = dict.labs.library;
  const [attached, setAttached] = useState(initial);
  const [choice, setChoice] = useState("");
  const [error, setError] = useState("");
  const change = async (lessonId: string, on: boolean) => {
    setError("");
    try {
      const res = await api<{ lessons: typeof initial }>(`/api/library/resources/${resourceId}/lessons`, { body: { lessonId, attached: on } });
      setAttached(res.lessons);
      setChoice("");
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };
  const mine = new Set(lessons.map((l) => l.id));
  return (
    <div className="space-y-3">
      {attached.length ? (
        <ul className="space-y-1.5">
          {attached.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
              <Link href={`/teacher/lessons/${l.id}`} className="font-medium text-brand hover:underline">
                {l.title}
              </Link>
              {mine.has(l.id) ? (
                <Button variant="ghost" size="sm" onClick={() => change(l.id, false)}>
                  {b.detach}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {lessons.length ? (
        <div className="flex flex-wrap gap-2">
          <Select aria-label={b.attachToLesson} value={choice} onChange={(e) => setChoice(e.target.value)} className="max-w-sm">
            <option value="">{b.chooseLesson}</option>
            {lessons
              .filter((l) => !attached.some((a) => a.id === l.id))
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
          </Select>
          <Button variant="secondary" disabled={!choice} onClick={() => change(choice, true)} data-testid="attach-lesson">
            {b.attach}
          </Button>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
