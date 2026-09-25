"use client";

import { useMemo } from "react";
import { LineChart } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { SECTION_KINDS } from "@/lib/domain/catalog";
import type { Section } from "@/lib/domain/schemas";
import { compileExpression } from "@/lib/domain/math-expression";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FunctionPlot } from "@/components/charts/function-plot";

export function SectionEditor({ section, onChange }: { section: Section; onChange: (section: Section) => void }) {
  const { dict } = useI18n();
  const e = dict.teacher.editor;
  const set = <K extends keyof Section>(key: K, value: Section[K]) => onChange({ ...section, [key]: value });
  const graphValid = useMemo(() => {
    if (!section.visual) return true;
    try {
      compileExpression(section.visual.expression);
      return section.visual.xMax > section.visual.xMin;
    } catch {
      return false;
    }
  }, [section.visual]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px_110px]">
        <Field label={e.sectionTitle}>{(ids) => <Input {...ids} value={section.title} onChange={(ev) => set("title", ev.target.value)} maxLength={160} />}</Field>
        <Field label={e.sectionKind}>
          {(ids) => (
            <Select {...ids} value={section.kind} onChange={(ev) => set("kind", ev.target.value as Section["kind"])}>
              {SECTION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {dict.sectionKinds[k]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={e.sectionMinutes}>
          {(ids) => <Input {...ids} type="number" min={0} max={240} value={section.minutes} onChange={(ev) => set("minutes", Math.max(0, Math.min(240, Number(ev.target.value) || 0)))} />}
        </Field>
      </div>
      <Field label={e.sectionBody}>{(ids) => <Textarea {...ids} value={section.body} rows={Math.min(16, Math.max(5, section.body.split("\n").length + 1))} onChange={(ev) => set("body", ev.target.value)} />}</Field>

      {section.visual ? (
        <div className="rounded-xl border border-line bg-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_110px_110px]">
            <Field label={e.graphExpression} error={graphValid ? undefined : e.graphInvalid}>
              {(ids) => <Input {...ids} value={section.visual!.expression} onChange={(ev) => set("visual", { ...section.visual!, expression: ev.target.value })} className="font-mono" />}
            </Field>
            <Field label={e.graphXMin}>
              {(ids) => <Input {...ids} type="number" value={section.visual!.xMin} onChange={(ev) => set("visual", { ...section.visual!, xMin: Number(ev.target.value) })} />}
            </Field>
            <Field label={e.graphXMax}>
              {(ids) => <Input {...ids} type="number" value={section.visual!.xMax} onChange={(ev) => set("visual", { ...section.visual!, xMax: Number(ev.target.value) })} />}
            </Field>
          </div>
          <Field label={e.graphCaption} className="mt-3">
            {(ids) => <Input {...ids} value={section.visual!.caption} onChange={(ev) => set("visual", { ...section.visual!, caption: ev.target.value })} maxLength={200} />}
          </Field>
          {graphValid ? <FunctionPlot className="mt-3 max-w-lg" {...section.visual} /> : null}
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => set("visual", null)}>
            {e.removeGraph}
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => set("visual", { type: "function_plot", expression: "x^2", xMin: -5, xMax: 5, caption: "" })}>
          <LineChart aria-hidden className="size-4" />
          {e.addGraph}
        </Button>
      )}
    </div>
  );
}
