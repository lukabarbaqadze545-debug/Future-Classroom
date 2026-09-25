"use client";

import { useRef, useState } from "react";
import { FileText, Paperclip, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export interface AttachmentView {
  id: string;
  fileName: string;
  isImage: boolean;
  sizeBytes: number;
}

/** Photos and documents on a piece of work. Files are served only to the owner and staff. */
export function AttachmentPanel({
  targetKind,
  targetId,
  initial,
  canEdit,
  title,
}: {
  targetKind: "stem_project" | "stem_record" | "portfolio" | "research" | "assignment";
  targetId: string;
  initial: AttachmentView[];
  canEdit: boolean;
  title?: string;
}) {
  const { dict } = useI18n();
  const c = dict.labs.common;
  const [files, setFiles] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("targetKind", targetKind);
    form.set("targetId", targetId);
    try {
      const res = await api<{ attachment: AttachmentView }>("/api/attachments", { form });
      setFiles((f) => [...f, res.attachment]);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!window.confirm(c.deleteConfirm)) return;
    try {
      await api(`/api/attachments/${id}`, { method: "DELETE" });
      setFiles((f) => f.filter((x) => x.id !== id));
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  }

  return (
    <section className="space-y-3" aria-label={title ?? c.attachments}>
      <h3 className="font-semibold">{title ?? c.attachments}</h3>
      {files.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f) => (
            <li key={f.id} className="group relative overflow-hidden rounded-xl border border-line bg-surface">
              <a href={`/api/attachments/${f.id}`} target="_blank" rel="noreferrer" className="block">
                {f.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private, auth-checked files; next/image cannot optimise them
                  <img src={`/api/attachments/${f.id}`} alt={f.fileName} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-3 text-center text-sm text-ink-muted">
                    <FileText aria-hidden className="size-8" />
                    <span className="line-clamp-2 break-all">{f.fileName}</span>
                  </span>
                )}
              </a>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="absolute top-1.5 right-1.5 inline-flex size-9 items-center justify-center rounded-lg bg-surface/90 text-danger shadow-sm hover:bg-danger-soft"
                  aria-label={`${c.delete}: ${f.fileName}`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{c.noAttachments}</p>
      )}
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={input}
            type="file"
            className="sr-only"
            id={`attach-${targetKind}-${targetId}`}
            accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button variant="secondary" size="sm" disabled={busy || files.length >= 12} onClick={() => input.current?.click()}>
            <Paperclip aria-hidden className="size-4" />
            {busy ? c.uploading : c.attach}
          </Button>
          <span className="text-xs text-ink-subtle">{c.attachHelp}</span>
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </section>
  );
}
