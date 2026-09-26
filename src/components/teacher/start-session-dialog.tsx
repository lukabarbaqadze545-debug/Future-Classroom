"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";

/**
 * Opens the "start a lesson in class" page (choose the class and activities
 * there). From the lesson editor, unsaved edits are saved first.
 */
export function StartSessionButton({
  lessonId,
  classId,
  size = "lg",
  variant = "primary",
  label,
  disabledReason,
  beforeStart,
}: {
  lessonId?: string;
  classId?: string | null;
  size?: "md" | "lg" | "xl";
  variant?: "primary" | "secondary";
  label?: string;
  disabledReason?: string | null;
  /** Runs before leaving the page (e.g. saving unsaved lesson edits); false cancels. */
  beforeStart?: () => Promise<boolean>;
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    if (beforeStart && !(await beforeStart())) {
      setBusy(false);
      return;
    }
    const params = new URLSearchParams();
    if (lessonId) params.set("lesson", lessonId);
    if (classId) params.set("class", classId);
    router.push(`/teacher/sessions/new${params.size ? `?${params}` : ""}`);
  };
  return (
    <Button size={size} variant={variant} onClick={open} disabled={busy || Boolean(disabledReason)} title={disabledReason ?? undefined} data-testid="start-session">
      <Play aria-hidden className="size-5" />
      {label ?? dict.teacher.editor.startSession}
    </Button>
  );
}
