"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/components/ui/cn";

const LABELS = { en: "English", ka: "ქართული" } as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const change = (next: "en" | "ka") => {
    if (next === locale) return;
    startTransition(async () => {
      await fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) });
      router.refresh();
    });
  };
  return (
    <div role="group" aria-label={dict.common.language} className={cn("inline-flex items-center rounded-lg border border-line bg-surface p-0.5", pending && "opacity-60", className)}>
      <Languages aria-hidden className="mx-1.5 size-4 text-ink-subtle" />
      {(["ka", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => change(code)}
          aria-pressed={locale === code}
          className={cn("h-8 rounded-md px-2.5 text-xs font-semibold transition-colors", locale === code ? "bg-ink text-white" : "text-ink-muted hover:bg-muted")}
        >
          {code === "ka" ? "ქარ" : "EN"}
          <span className="sr-only"> — {LABELS[code]}</span>
        </button>
      ))}
    </div>
  );
}
