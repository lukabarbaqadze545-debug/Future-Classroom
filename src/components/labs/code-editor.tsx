"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/components/ui/cn";

/**
 * A dependable plain-text code editor: line numbers, Tab indents, Enter keeps
 * the indentation (and adds a level after ':' or '{'). No external editor
 * library, so it works on every school computer and screen reader.
 */
export function CodeEditor({
  value,
  onChange,
  label,
  readOnly,
  minRows = 14,
  className,
  id,
}: {
  value: string;
  onChange?: (value: string) => void;
  label: string;
  readOnly?: boolean;
  minRows?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lines = Math.max(minRows, value.split("\n").length);

  const replaceSelection = (text: string, start: number, end: number, cursor: number) => {
    const el = ref.current!;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange?.(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = cursor;
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const el = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = el;
    if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Escape moves focus out; Tab indents inside the editor.
      event.preventDefault();
      replaceSelection("    ", start, end, start + 4);
    } else if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const leading = value.slice(lineStart).match(/^ {1,4}/)?.[0].length ?? 0;
      if (leading) {
        onChange?.(value.slice(0, lineStart) + value.slice(lineStart + leading));
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = Math.max(lineStart, start - leading);
        });
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const line = value.slice(lineStart, start);
      let indent = line.match(/^\s*/)?.[0] ?? "";
      if (/[:{]\s*$/.test(line)) indent += "    ";
      replaceSelection(`\n${indent}`, start, end, start + 1 + indent.length);
    } else if (event.key === "Escape") {
      el.blur();
    }
  };

  return (
    <div className={cn("flex overflow-hidden rounded-xl border border-line-strong bg-[#0f172a] font-mono text-[14px] leading-6 text-slate-100", className)}>
      <div ref={gutterRef} aria-hidden className="shrink-0 overflow-hidden bg-[#0b1224] px-2 py-3 text-right text-slate-500 select-none">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        id={id}
        ref={ref}
        aria-label={label}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        rows={lines}
        wrap="off"
        className="min-w-0 flex-1 resize-y bg-transparent px-3 py-3 text-slate-100 caret-sky-300 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-sky-400/60"
        data-testid="code-editor"
      />
    </div>
  );
}

/** Read-only code block for statements and "predict the output" problems. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <pre aria-label={label} className="overflow-x-auto rounded-xl bg-[#0f172a] p-4 font-mono text-[14px] leading-6 text-slate-100">
      <code>{code.replace(/\n$/, "")}</code>
    </pre>
  );
}
