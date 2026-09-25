"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dict } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{dict.errors.generic}</h1>
      <p className="mt-2 text-ink-muted">{dict.errors.internal}</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>{dict.common.retry}</Button>
        <ButtonLink href="/" variant="secondary">
          {dict.nav.home}
        </ButtonLink>
      </div>
    </main>
  );
}
