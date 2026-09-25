"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { SUBJECTS, GRADES } from "@/lib/domain/catalog";
import { LIBRARY_CATEGORIES, LIBRARY_KINDS, LIBRARY_LANGUAGES, LICENSES, type ResourceInput } from "@/lib/labs/library/model";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";

const EMPTY: ResourceInput = {
  title: "",
  authors: "",
  kind: "book",
  categories: [],
  subjects: [],
  gradeFrom: null,
  gradeTo: null,
  language: "ka",
  description: { en: "", ka: "" },
  year: "",
  publisher: "",
  isbn: "",
  license: "physical_only",
  licenseNote: "",
  digitalUrl: "",
  supplementary: [],
  exercises: [],
};

export function ResourceForm({ id, initial, initialMaterialId, materials }: { id?: string; initial?: ResourceInput; initialMaterialId?: string | null; materials: { id: string; title: string }[] }) {
  const { dict } = useI18n();
  const b = dict.labs.library;
  const f = b.form;
  const router = useRouter();
  const [form, setForm] = useState<ResourceInput>(initial ?? EMPTY);
  const [materialId, setMaterialId] = useState<string>(initialMaterialId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof ResourceInput>(key: K, value: ResourceInput[K]) => setForm((x) => ({ ...x, [key]: value }));
  const toggle = <T extends string>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { resource: form, materialId: materialId || null };
      const res = await api<{ resource: { id: string } }>(id ? `/api/library/resources/${id}` : "/api/library/resources", { method: id ? "PUT" : "POST", body });
      router.push(`/library/${res.resource.id}`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(dict, err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <Field label={f.title}>{(ids) => <Input {...ids} required maxLength={300} value={form.title} onChange={(e) => set("title", e.target.value)} />}</Field>
        <Field label={f.authors}>{(ids) => <Input {...ids} maxLength={300} value={form.authors} onChange={(e) => set("authors", e.target.value)} />}</Field>
        <Field label={f.kind}>
          {(ids) => (
            <Select {...ids} value={form.kind} onChange={(e) => set("kind", e.target.value as ResourceInput["kind"])}>
              {LIBRARY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {b.kinds[k]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={f.language}>
          {(ids) => (
            <Select {...ids} value={form.language} onChange={(e) => set("language", e.target.value as ResourceInput["language"])}>
              {LIBRARY_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {b.languages[l]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={f.gradeFrom}>
          {(ids) => (
            <Select {...ids} value={form.gradeFrom ?? ""} onChange={(e) => set("gradeFrom", e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={f.gradeTo}>
          {(ids) => (
            <Select {...ids} value={form.gradeTo ?? ""} onChange={(e) => set("gradeTo", e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm font-medium">{f.categories}</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {LIBRARY_CATEGORIES.map((c) => (
              <Checkbox key={c} label={b.categories[c]} checked={form.categories.includes(c)} onChange={() => set("categories", toggle(form.categories, c).slice(0, 4))} />
            ))}
          </div>
        </fieldset>
        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm font-medium">{f.subjects}</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SUBJECTS.map((s) => (
              <Checkbox key={s} label={dict.subjects[s]} checked={form.subjects.includes(s)} onChange={() => set("subjects", toggle(form.subjects, s).slice(0, 4))} />
            ))}
          </div>
        </fieldset>
        <Field label={f.descriptionKa}>{(ids) => <Textarea {...ids} rows={3} value={form.description.ka} onChange={(e) => set("description", { ...form.description, ka: e.target.value })} />}</Field>
        <Field label={f.descriptionEn}>{(ids) => <Textarea {...ids} rows={3} value={form.description.en} onChange={(e) => set("description", { ...form.description, en: e.target.value })} />}</Field>
        <Field label={f.year}>{(ids) => <Input {...ids} value={form.year} onChange={(e) => set("year", e.target.value)} />}</Field>
        <Field label={f.publisher}>{(ids) => <Input {...ids} value={form.publisher} onChange={(e) => set("publisher", e.target.value)} />}</Field>
        <Field label={f.isbn}>{(ids) => <Input {...ids} value={form.isbn} onChange={(e) => set("isbn", e.target.value)} />}</Field>
      </Card>
      <Card className="space-y-4 p-5">
        <Notice tone="warn">{f.licenseHelp}</Notice>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={f.license}>
            {(ids) => (
              <Select {...ids} value={form.license} onChange={(e) => set("license", e.target.value as ResourceInput["license"])}>
                {LICENSES.map((l) => (
                  <option key={l} value={l}>
                    {b.licenses[l]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.licenseNote}>{(ids) => <Input {...ids} value={form.licenseNote} onChange={(e) => set("licenseNote", e.target.value)} />}</Field>
          <Field label={f.digitalUrl}>{(ids) => <Input {...ids} type="url" placeholder="https://" value={form.digitalUrl} disabled={form.license === "physical_only"} onChange={(e) => set("digitalUrl", e.target.value)} />}</Field>
          <Field label={f.material}>
            {(ids) => (
              <Select {...ids} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                <option value="">{f.noMaterial}</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{f.supplementary}</legend>
          {form.supplementary.map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
              <Input aria-label={f.linkTitle} placeholder={f.linkTitle} value={s.title} onChange={(e) => set("supplementary", form.supplementary.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <Input aria-label={dict.common.url} placeholder="https://" value={s.url} onChange={(e) => set("supplementary", form.supplementary.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <Button variant="ghost" aria-label={dict.common.remove} onClick={() => set("supplementary", form.supplementary.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => set("supplementary", [...form.supplementary, { title: "", url: "" }])} disabled={form.supplementary.length >= 8}>
            <Plus aria-hidden className="size-4" />
            {f.addLink}
          </Button>
        </fieldset>
      </Card>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div className="flex flex-wrap justify-between gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? dict.common.saving : f.save}
        </Button>
        {id ? (
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm(dict.labs.common.deleteConfirm)) return;
              await api(`/api/library/resources/${id}`, { method: "DELETE" });
              router.push("/library");
              router.refresh();
            }}
          >
            <Trash2 aria-hidden className="size-4" />
            {f.delete}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
