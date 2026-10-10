"use client";

import { AlertTriangle, Bug, Clock, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { cn } from "@/components/ui/cn";
import { inline } from "./text";

export interface DiagnosticLike {
  code: string;
  message: string;
  args: Record<string, string | number>;
  line: number;
  kind?: "syntax" | "semantic" | "runtime" | "limit" | "unsupported";
}

/** The program's problem, said in the visitor's language, with the line it is about. */
export function DiagnosticView({ diagnostic, source, className }: { diagnostic: DiagnosticLike; source?: string; className?: string }) {
  const { dict } = useI18n();
  const t = dict.courses.cppErrors;
  const messages = t.messages as Record<string, string>;
  const kind = diagnostic.kind ?? "semantic";
  const template = messages[diagnostic.code];
  const text = template ? fmt(template, diagnostic.args) : t.fallback;
  const sourceLine = source && diagnostic.line > 0 ? source.split("\n")[diagnostic.line - 1] : undefined;
  const Icon = kind === "limit" ? Clock : kind === "unsupported" ? Info : kind === "runtime" ? Bug : AlertTriangle;
  const tone = kind === "unsupported" ? "border-brand/20 bg-brand-soft/50" : "border-danger/25 bg-danger-soft";
  return (
    <div role="alert" data-testid="diagnostic" data-code={diagnostic.code} className={cn("rounded-xl border px-4 py-3 text-sm", tone, className)}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden className="mt-0.5 size-4.5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            {t.kind[kind]}
            {diagnostic.line > 0 ? ` · ${fmt(t.line, { n: diagnostic.line })}` : ""}
          </p>
          <p className="leading-relaxed text-ink">{inline(text)}</p>
          {sourceLine !== undefined && sourceLine.trim() ? <pre className="overflow-x-auto rounded-lg bg-[#0a0a0d] px-3 py-2 font-mono text-[13px] text-slate-100">{sourceLine}</pre> : null}
          {!template || diagnostic.message ? (
            <details className="text-xs text-ink-subtle">
              <summary className="cursor-pointer">{t.technical}</summary>
              <p className="mt-1 font-mono break-words">{diagnostic.message}</p>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}
