"use client";

import { useState } from "react";
import { Eye, EyeOff, Lightbulb, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import type { PublicChallenge } from "@/lib/daily/pick";
import { cn } from "@/components/ui/cn";
import { PresentButton, PresentShell } from "./present-shell";

/** Today's challenge for the whole class on the board: the teacher reveals hints, then the answer. */
export function PresentDaily({ challenge, answer, explanation, hints }: { challenge: PublicChallenge; answer: string; explanation: string; hints: string[] }) {
  const { dict } = useI18n();
  const p = dict.present;
  const [revealed, setRevealed] = useState(false);
  const [shown, setShown] = useState(0);
  const [question, ...codeLines] = challenge.prompt.split("\n\n");
  const code = codeLines.join("\n\n");

  return (
    <PresentShell
      top={
        <p className="truncate text-xl font-semibold opacity-70">
          {fmt(dict.today.challenge.title, { n: challenge.number })} · {dict.today.weekdays[challenge.weekday - 1]} · {dict.today.themes[challenge.theme]}
        </p>
      }
      controls={(theme) => (
        <>
          <PresentButton theme={theme} onClick={() => setShown((n) => n + 1)} disabled={shown >= hints.length || revealed} data-testid="present-daily-hint">
            <Lightbulb aria-hidden className="size-6" />
            {p.daily.hint}
          </PresentButton>
          <PresentButton theme={theme} variant="primary" onClick={() => setRevealed((v) => !v)} data-testid="present-daily-reveal">
            {revealed ? <EyeOff aria-hidden className="size-6" /> : <Eye aria-hidden className="size-6" />}
            {revealed ? p.daily.hide : p.daily.reveal}
          </PresentButton>
          <PresentButton theme={theme} href="/teacher">
            <LogOut aria-hidden className="size-6" />
            <span className="sr-only">{p.exit}</span>
          </PresentButton>
        </>
      )}
    >
      {(theme) => {
        const dark = theme === "dark";
        return (
          <div className="fc-fade-in mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8" data-testid="present-daily">
            <div>
              <h1 className="text-[clamp(28px,4.2vw,68px)] leading-tight font-semibold wrap-break-word whitespace-pre-line">{question}</h1>
              {code ? (
                <pre className={cn("mt-6 overflow-x-auto rounded-3xl px-6 py-5 font-mono text-[clamp(18px,2.2vw,34px)] leading-relaxed", dark ? "bg-white/10 text-white" : "bg-ink text-white")}>{code}</pre>
              ) : null}
            </div>

            {challenge.type === "choice" ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {challenge.options.map((option, i) => {
                  const right = revealed && option.text === answer;
                  return (
                    <li
                      key={option.id}
                      data-right={right}
                      className={cn(
                        "flex items-center gap-4 rounded-3xl border-2 px-5 py-4 text-[clamp(20px,2.4vw,38px)] leading-snug transition-all",
                        right ? "border-success bg-success-soft text-ink" : dark ? "border-white/20" : "border-line",
                        revealed && !right && "opacity-40",
                      )}
                    >
                      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl font-bold", right ? "bg-success text-[#04140c]" : dark ? "bg-white/10" : "bg-muted")}>{String.fromCharCode(65 + i)}</span>
                      <span className="min-w-0 wrap-break-word">{option.text}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {shown > 0 && !revealed ? (
              <ol className="space-y-3" data-testid="present-daily-hints">
                {hints.slice(0, shown).map((hint, i) => (
                  <li key={i} className={cn("fc-fade-in rounded-2xl px-5 py-3 text-[clamp(18px,1.8vw,28px)]", dark ? "bg-warn/20" : "bg-warn-soft")}>
                    <span className="font-semibold">{fmt(p.daily.hintN, { n: i + 1 })}:</span> {hint}
                  </li>
                ))}
              </ol>
            ) : null}

            {revealed ? (
              <div className="fc-fade-in space-y-3" data-testid="present-daily-answer">
                <p className="text-[clamp(24px,3vw,48px)] font-semibold text-success">{fmt(p.daily.answer, { answer })}</p>
                {explanation ? (
                  <p className={cn("text-[clamp(18px,1.9vw,30px)] leading-relaxed whitespace-pre-line", dark ? "text-white/80" : "text-ink-muted")}>
                    <span className="font-semibold">{p.daily.why}:</span> {explanation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      }}
    </PresentShell>
  );
}
