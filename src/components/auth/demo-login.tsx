"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, Presentation } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { api, errorMessage } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

export function DemoLoginButtons({ className, size = "lg" }: { className?: string; size?: "md" | "lg" }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<"teacher" | "student" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const signIn = async (role: "teacher" | "student") => {
    setBusy(role);
    setError(null);
    try {
      const { redirect } = await api<{ redirect: string }>("/api/auth/demo", { body: { role } });
      router.push(redirect);
      router.refresh();
    } catch (e) {
      setError(errorMessage(dict, e));
      setBusy(null);
    }
  };
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size={size} onClick={() => signIn("teacher")} disabled={busy !== null} data-testid="demo-teacher">
          <Presentation aria-hidden className="size-5" />
          {busy === "teacher" ? dict.common.loading : dict.landing.demoTeacher}
        </Button>
        <Button size={size} variant="secondary" onClick={() => signIn("student")} disabled={busy !== null} data-testid="demo-student">
          <GraduationCap aria-hidden className="size-5" />
          {busy === "student" ? dict.common.loading : dict.landing.demoStudent}
        </Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
