"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

export function NewResearchForm() {
  const { dict } = useI18n();
  const r = dict.labs.research;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const res = await api<{ project: { id: string } }>("/api/labs/research/projects", { body: { title, subject } });
          router.push(`/labs/research/${res.project.id}`);
        } catch (err) {
          setError(errorMessage(dict, err));
          setBusy(false);
        }
      }}
    >
      <Field label={r.projectTitle}>{(ids) => <Input {...ids} required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} data-testid="research-title" />}</Field>
      <Field label={r.subject}>{(ids) => <Input {...ids} maxLength={80} placeholder={r.subjectPlaceholder} value={subject} onChange={(e) => setSubject(e.target.value)} />}</Field>
      <Button type="submit" disabled={busy || !title.trim()} data-testid="create-research">
        {r.create}
      </Button>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </form>
  );
}
