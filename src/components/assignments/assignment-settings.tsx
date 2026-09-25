"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function AssignmentSettings({ id, archived }: { id: string; archived: boolean }) {
  const { dict } = useI18n();
  const a = dict.labs.assignments;
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={async () => {
          try {
            await api(`/api/assignments/${id}`, { method: "PUT", body: { archived: !archived } });
            router.refresh();
          } catch (e) {
            setError(errorMessage(dict, e));
          }
        }}
      >
        {archived ? <ArchiveRestore aria-hidden className="size-4" /> : <Archive aria-hidden className="size-4" />}
        {archived ? a.unarchive : a.archive}
      </Button>
      <Button
        variant="ghost"
        className="text-danger"
        onClick={async () => {
          if (!window.confirm(a.deleteConfirm)) return;
          await api(`/api/assignments/${id}`, { method: "DELETE" });
          router.push("/teacher/assignments");
          router.refresh();
        }}
      >
        <Trash2 aria-hidden className="size-4" />
        {dict.labs.common.delete}
      </Button>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </div>
  );
}
