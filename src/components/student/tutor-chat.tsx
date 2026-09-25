"use client";

import { useRef, useState, type FormEvent } from "react";
import { Bot, Send, Trash2, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Hint-first study tutor. The student picks how much help they want; the
 * level is sent with every question. Nothing is stored on the server.
 */
export function TutorChat({ lessonId, aiAvailable }: { lessonId: string | null; aiAvailable: boolean }) {
  const { dict } = useI18n();
  const t = dict.student.tutor;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  if (!aiAvailable) {
    return (
      <Notice tone="info" title={t.offlineTitle}>
        {t.offlineText}
      </Notice>
    );
  }

  const send = async (text: string, helpLevel = level) => {
    const content = text.trim();
    if (!content) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const { reply } = await api<{ reply: string }>("/api/tutor", { body: { lessonId, helpLevel, messages: next.slice(-12) } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(`${t.errorReply} (${errorMessage(dict, e)})`);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  return (
    <div className="space-y-4">
      <p className="text-ink-muted">{t.lead}</p>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t.helpLevel}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {t.levels.map((label, i) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={level === i + 1}
              onClick={() => setLevel(i + 1)}
              className={cn("h-10 rounded-xl border px-3 text-sm font-medium transition-colors", level === i + 1 ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-surface text-ink-muted hover:bg-muted")}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="min-h-48 space-y-3 rounded-2xl border border-line bg-surface p-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-brand text-white" : "bg-ai-soft text-ai")} aria-hidden>
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </span>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", m.role === "user" ? "bg-brand-soft" : "bg-muted")}>
              <p className="sr-only">{m.role === "user" ? t.you : t.tutor}:</p>
              <p className="fc-prose">{m.content}</p>
            </div>
          </div>
        ))}
        {busy ? <Spinner label={t.thinking} /> : null}
        {messages.length > 0 && messages[messages.length - 1].role === "assistant" && level < 5 && !busy ? (
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              const nextLevel = Math.min(5, level + 1);
              setLevel(nextLevel);
              const lastQuestion = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
              void send(`${t.moreHelp}: ${lastQuestion}`, nextLevel);
            }}
          >
            {t.moreHelp}
          </Button>
        ) : null}
        <div ref={endRef} />
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          aria-label={t.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder={t.placeholder}
          rows={2}
          maxLength={2000}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit" size="lg" disabled={busy || !input.trim()}>
            <Send aria-hidden className="size-4" />
            {t.send}
          </Button>
          {messages.length ? (
            <Button variant="ghost" size="lg" onClick={() => setMessages([])} aria-label={t.clear}>
              <Trash2 aria-hidden className="size-4" />
            </Button>
          ) : null}
        </div>
      </form>
      <p className="text-xs text-ink-subtle">{t.privacy}</p>
    </div>
  );
}
