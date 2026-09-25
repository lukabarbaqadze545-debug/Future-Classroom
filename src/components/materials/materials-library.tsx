"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Download, Eye, FileText, Link2, Pencil, Search, Trash2, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt, fmtCount, relativeTime } from "@/lib/i18n/config";
import { api, errorMessage } from "@/lib/client/api";
import { GRADES, MATERIAL_VISIBILITIES, SUBJECTS, type Subject } from "@/lib/domain/catalog";
import type { MaterialRecord } from "@/lib/services/materials";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { EmptyState, Spinner } from "@/components/ui/misc";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface LessonOption {
  id: string;
  title: string;
}

function MetaFields({ material }: { material?: MaterialRecord }) {
  const { dict } = useI18n();
  const m = dict.teacher.materials;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={m.titleLabel} className="sm:col-span-2">
        {(ids) => <Input {...ids} name="title" defaultValue={material?.title} maxLength={160} required={Boolean(material)} />}
      </Field>
      <Field label={dict.teacher.create.subject}>
        {(ids) => (
          <Select {...ids} name="subject" defaultValue={material?.subject ?? "mathematics"}>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {dict.subjects[s]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={m.grade}>
        {(ids) => (
          <Select {...ids} name="grade" defaultValue={material?.grade ?? ""}>
            <option value="">{m.anyGrade}</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {fmt(dict.common.grade, { n: g })}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={m.author} optionalLabel={dict.common.optional}>
        {(ids) => <Input {...ids} name="author" defaultValue={material?.author} maxLength={120} />}
      </Field>
      <Field label={m.visibility}>
        {(ids) => (
          <Select {...ids} name="visibility" defaultValue={material?.visibility ?? "students"}>
            {MATERIAL_VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {dict.visibility[v]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={m.tags} hint={m.tagsHelp} optionalLabel={dict.common.optional} className="sm:col-span-2">
        {(ids) => <Input {...ids} name="tags" defaultValue={material?.tags.join(", ")} maxLength={300} />}
      </Field>
    </div>
  );
}

export function MaterialsLibrary({ initial, currentUserId, lessons, isAdmin }: { initial: MaterialRecord[]; currentUserId: string; lessons: LessonOption[]; isAdmin: boolean }) {
  const { dict } = useI18n();
  const m = dict.teacher.materials;
  const [materials, setMaterials] = useState(initial);
  const [subject, setSubject] = useState<Subject | "">("");
  const [grade, setGrade] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ material: MaterialRecord; chunks: { page: number | null; content: string }[] } | null>(null);
  const [editing, setEditing] = useState<MaterialRecord | null>(null);
  const [deleting, setDeleting] = useState<MaterialRecord | null>(null);
  const [assignLesson, setAssignLesson] = useState(lessons[0]?.id ?? "");
  const [assigned, setAssigned] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subject) params.set("subject", subject);
      if (grade) params.set("grade", grade);
      if (query.trim()) params.set("q", query.trim());
      const { materials: next } = await api<{ materials: MaterialRecord[] }>(`/api/materials?${params}`);
      setMaterials(next);
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setLoading(false);
    }
  }, [dict, grade, query, subject]);

  // Debounced search as the teacher types or changes filters.
  useEffect(() => {
    const id = setTimeout(() => void load(), 250);
    return () => clearTimeout(id);
  }, [load]);

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploading(true);
    setError(null);
    try {
      await api("/api/materials", { form: new FormData(event.currentTarget) });
      setUploadOpen(false);
      await load();
    } catch (e) {
      setError(errorMessage(dict, e));
    } finally {
      setUploading(false);
    }
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    try {
      await api(`/api/materials/${editing.id}`, {
        method: "PATCH",
        body: {
          title: String(data.get("title")),
          subject: String(data.get("subject")),
          grade: data.get("grade") ? Number(data.get("grade")) : null,
          author: String(data.get("author") ?? ""),
          visibility: String(data.get("visibility")),
          tags: String(data.get("tags") ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
      setEditing(null);
      await load();
    } catch (e) {
      setError(errorMessage(dict, e));
    }
  };

  const openPreview = async (material: MaterialRecord) => {
    setAssigned(null);
    const { preview: chunks } = await api<{ preview: { page: number | null; content: string }[] }>(`/api/materials/${material.id}`);
    setPreview({ material, chunks });
  };

  return (
    <div className="space-y-5">
      <Notice tone="info">{m.ragNote}</Notice>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <label htmlFor="material-search" className="sr-only">
            {dict.common.search}
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle" />
          <Input id="material-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={m.searchPlaceholder} className="pl-10" type="search" />
        </div>
        <Select aria-label={dict.teacher.create.subject} value={subject} onChange={(e) => setSubject(e.target.value as Subject | "")} className="lg:w-56">
          <option value="">{dict.common.allSubjects}</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {dict.subjects[s]}
            </option>
          ))}
        </Select>
        <Select aria-label={m.grade} value={grade} onChange={(e) => setGrade(e.target.value)} className="lg:w-40">
          <option value="">{dict.common.allGrades}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {fmt(dict.common.grade, { n: g })}
            </option>
          ))}
        </Select>
        <Button onClick={() => setUploadOpen(true)} size="lg">
          <Upload aria-hidden className="size-5" />
          {m.upload}
        </Button>
      </div>

      {loading ? <Spinner label={dict.common.loading} /> : null}

      {materials.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => {
            const own = material.ownerId === currentUserId || isAdmin;
            return (
              <li key={material.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3">
                  <FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div className="min-w-0">
                    <h3 className="font-semibold">{material.title}</h3>
                    <p className="text-sm text-ink-muted">
                      {dict.subjects[material.subject]}
                      {material.grade ? ` · ${fmt(dict.common.grade, { n: material.grade })}` : ""}
                      {material.author ? ` · ${material.author}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={material.visibility === "students" ? "brand" : "neutral"}>{dict.visibility[material.visibility]}</Badge>
                  <Badge tone={material.textStatus === "indexed" ? "success" : "warn"} dot>
                    {material.textStatus === "indexed" ? m.indexed : material.textStatus === "no_text" ? m.noText : m.failed}
                  </Badge>
                  {material.tags.map((tag) => (
                    <Badge key={tag}>#{tag}</Badge>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-subtle">
                  {material.fileName} · {formatSize(material.sizeBytes)}
                  {material.textStatus === "indexed" ? ` · ${fmtCount(m.passages, material.chunkCount)}` : ""} · {relativeTime(dict, material.createdAt)}
                </p>
                <p className="text-xs text-ink-subtle">{own && material.ownerId === currentUserId ? m.yours : fmt(m.uploadedBy, { name: material.ownerName })}</p>
                <div className="mt-auto flex flex-wrap gap-1 pt-4">
                  <Button variant="ghost" size="sm" onClick={() => void openPreview(material)}>
                    <Eye aria-hidden className="size-4" />
                    {dict.common.preview}
                  </Button>
                  <ButtonLink href={`/api/materials/${material.id}/file`} variant="ghost" size="sm" prefetch={false}>
                    <Download aria-hidden className="size-4" />
                    {dict.common.download}
                  </ButtonLink>
                  {own ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(material)} aria-label={`${dict.common.edit}: ${material.title}`}>
                        <Pencil aria-hidden className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(material)} aria-label={`${dict.common.delete}: ${material.title}`}>
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : !loading ? (
        <EmptyState title={m.empty} />
      ) : null}

      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={m.upload}
        closeLabel={dict.common.close}
        className="w-[min(640px,calc(100vw-32px))]"
      >
        <form onSubmit={upload} className="space-y-4">
          <Field label={m.file} hint={m.fileHelp}>
            {(ids) => <input {...ids} type="file" name="file" required accept=".pdf,.docx,.txt,.md" className="block w-full rounded-xl border border-line-strong bg-surface p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-brand-ink" />}
          </Field>
          <MetaFields />
          <p className="text-xs text-ink-subtle">{m.noTextHelp}</p>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? m.uploading : m.upload}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={dict.common.edit} closeLabel={dict.common.close} className="w-[min(640px,calc(100vw-32px))]">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-4">
            <MetaFields material={editing} />
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                {dict.common.cancel}
              </Button>
              <Button type="submit">{dict.common.save}</Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={preview !== null} onClose={() => setPreview(null)} title={preview?.material.title ?? m.previewTitle} closeLabel={dict.common.close} className="w-[min(760px,calc(100vw-32px))]">
        {preview ? (
          <div className="space-y-4">
            {preview.chunks.length ? (
              <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl border border-line bg-muted/40 p-4">
                {preview.chunks.map((chunk, i) => (
                  <p key={i} className="fc-prose text-sm">
                    {chunk.page ? <span className="mr-1 font-semibold text-ink-subtle">[{fmt(dict.student.library.page, { n: chunk.page })}]</span> : null}
                    {chunk.content}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">{m.previewEmpty}</p>
            )}
            {lessons.length ? (
              <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-end">
                <Field label={dict.teacher.editor.linkMaterials} className="flex-1">
                  {(ids) => (
                    <Select {...ids} value={assignLesson} onChange={(e) => setAssignLesson(e.target.value)}>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await api(`/api/lessons/${assignLesson}/materials`, { body: { materialId: preview.material.id } });
                      setAssigned(assignLesson);
                    } catch (e) {
                      setError(errorMessage(dict, e));
                    }
                  }}
                >
                  <Link2 aria-hidden className="size-4" />
                  {dict.teacher.editor.linkMaterials}
                </Button>
              </div>
            ) : null}
            {assigned ? <Notice tone="success">{dict.common.saved}</Notice> : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={dict.common.delete}
        description={m.deleteConfirm}
        closeLabel={dict.common.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {dict.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await api(`/api/materials/${deleting.id}`, { method: "DELETE" });
                  setDeleting(null);
                  await load();
                } catch (e) {
                  setError(errorMessage(dict, e));
                }
              }}
            >
              {dict.common.delete}
            </Button>
          </>
        }
      />
    </div>
  );
}
