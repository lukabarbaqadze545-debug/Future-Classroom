"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

/** Hand in a written answer, a link and/or one of the student's own works. */
export function HandIn({
  assignmentId,
  works,
  needsWork,
  initial,
  resubmit,
}: {
  assignmentId: string;
  works: { id: string; title: string }[] | null;
  needsWork: boolean;
  initial: { text: string; link: string; workRef: string | null };
  resubmit: boolean;
}) {
  const { dict } = useI18n();
  const a = dict.labs.assignments;
  const router = useRouter();
  const [text, setText] = useState(initial.text);
  const [link, setLink] = useState(initial.link);
  const [workRef, setWorkRef] = useState(initial.workRef ?? works?.[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const workTitle = works?.find((w) => w.id === workRef)?.title ?? "";

  return (
    <div className="space-y-4" data-testid="hand-in">
      {works ? (
        works.length ? (
          <Field label={a.chooseWork}>
            {(ids) => (
              <Select {...ids} value={workRef} onChange={(e) => setWorkRef(e.target.value)} data-testid="choose-work">
                {works.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : (
          <Notice tone="info">{a.noWorks}</Notice>
        )
      ) : null}
      <Field label={a.yourResponse}>{(ids) => <Textarea {...ids} rows={4} placeholder={a.responsePlaceholder} value={text} onChange={(e) => setText(e.target.value)} data-testid="response-text" />}</Field>
      <Field label={a.link}>{(ids) => <Input {...ids} type="url" placeholder={a.linkPlaceholder} value={link} onChange={(e) => setLink(e.target.value)} />}</Field>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Button
        size="lg"
        disabled={busy || (needsWork && !workRef) || (!works && !text.trim() && !link.trim())}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await api(`/api/assignments/${assignmentId}/submit`, { body: { workRef: works ? workRef || null : null, response: { text, link, workTitle } } });
            router.refresh();
          } catch (e) {
            setError(errorMessage(dict, e));
          } finally {
            setBusy(false);
          }
        }}
        data-testid="hand-in-button"
      >
        <Send aria-hidden className="size-4" />
        {resubmit ? dict.labs.common.resubmit : a.handIn}
      </Button>
    </div>
  );
}
