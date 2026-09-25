"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

export function DuplicateLessonButton({ lessonId }: { lessonId: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { lesson } = await api<{ lesson: { id: string } }>(`/api/lessons/${lessonId}/duplicate`, { body: {} });
          router.push(`/teacher/lessons/${lesson.id}`);
        } catch {
          setBusy(false);
        }
      }}
    >
      <Copy aria-hidden className="size-4" />
      {dict.teacher.lessons.duplicate}
    </Button>
  );
}
