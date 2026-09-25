"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import type { Answer } from "@/lib/domain/schemas";
import type { ActivityType } from "@/lib/domain/catalog";
import { Input, Textarea } from "@/components/ui/form";
import { cn } from "@/components/ui/cn";

/**
 * Answer area for an activity. Options render as a large radio group that
 * works with mouse, touch and keyboard (arrow keys + space).
 */
export function AnswerInput({
  type,
  options,
  value,
  onChange,
  disabled,
  correctOptionIds = [],
  labelId,
  onSubmit,
}: {
  type: ActivityType;
  options: { id: string; text: string }[];
  value: Answer;
  onChange: (answer: Answer) => void;
  disabled?: boolean;
  correctOptionIds?: string[];
  labelId?: string;
  onSubmit?: () => void;
}) {
  const { dict } = useI18n();
  if (type === "multiple_choice" || type === "poll") {
    return (
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid gap-3 sm:grid-cols-2"
        onKeyDown={(event) => {
          // WAI-ARIA radio group: arrow keys move and select.
          const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
          if (disabled || !keys.includes(event.key)) return;
          event.preventDefault();
          const current = options.findIndex((o) => value.optionIds.includes(o.id));
          const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
          const next = options[(current + delta + options.length) % options.length];
          onChange({ optionIds: [next.id], text: "" });
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]");
          buttons[options.indexOf(next)]?.focus();
        }}
      >
        {options.map((option, index) => {
          const selected = value.optionIds.includes(option.id);
          const correct = correctOptionIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (value.optionIds.length === 0 && index === 0) ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange({ optionIds: [option.id], text: "" })}
              className={cn(
                "flex min-h-16 items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left text-[17px] transition-colors",
                selected ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-line-strong hover:bg-muted/40",
                correct && "border-success bg-success-soft",
                disabled && !selected && "opacity-70",
              )}
              data-testid="answer-option"
            >
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-base font-semibold uppercase", selected ? "bg-brand text-white" : "bg-muted text-ink-muted", correct && "bg-success text-white")}>
                {correct ? <Check aria-hidden className="size-5" /> : option.id}
              </span>
              <span className="font-medium">{option.text}</span>
            </button>
          );
        })}
      </div>
    );
  }
  if (type === "discussion" || type === "exit_ticket") {
    return (
      <Textarea
        aria-labelledby={labelId}
        value={value.text}
        onChange={(e) => onChange({ optionIds: [], text: e.target.value })}
        rows={5}
        maxLength={2000}
        placeholder={dict.session.discussionPlaceholder}
        disabled={disabled}
        className="text-[17px]"
        data-testid="answer-text"
      />
    );
  }
  return (
    <Input
      aria-labelledby={labelId}
      value={value.text}
      onChange={(e) => onChange({ optionIds: [], text: e.target.value })}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }}
      maxLength={200}
      placeholder={dict.session.answerPlaceholder}
      disabled={disabled}
      autoComplete="off"
      spellCheck={false}
      className="h-14 text-xl"
      data-testid="answer-text"
    />
  );
}
