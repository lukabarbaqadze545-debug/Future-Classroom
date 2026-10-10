"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { Notice } from "@/components/ui/notice";
import { useLocalDraft } from "@/components/labs/use-local-draft";
import { DiagnosticView } from "./diagnostic-view";
import { ProgramRunner } from "./program-runner";
import { useCppRunner } from "./use-cpp-runner";
import type { Diagnostic } from "@/lib/cpp";

/** A free editor: any C++ program, any input, no account. */
export function Playground({ template }: { template: string }) {
  const { dict } = useI18n();
  const t = dict.courses.playground;
  const [code] = useLocalDraft("course:playground", template);
  const runner = useCppRunner();
  const [problem, setProblem] = useState<Diagnostic | null | undefined>(undefined);

  async function checkOnly() {
    const r = await runner.check(code);
    setProblem(r === "failed" ? undefined : r);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t.title} description={t.lead} />
      <ProgramRunner draftKey="course:playground" initial={template} minRows={18} showInput testId="playground" />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={checkOnly} data-testid="check-errors">
          {t.check}
        </Button>
      </div>
      {problem === null ? <Notice tone="success">{t.noErrors}</Notice> : problem ? <DiagnosticView diagnostic={problem} source={code} /> : null}
      <Notice tone="info" title={t.supports}>
        <span className="flex gap-2">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{t.supportsText}</span>
        </span>
      </Notice>
    </div>
  );
}
