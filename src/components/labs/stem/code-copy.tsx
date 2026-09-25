"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "../code-editor";

export function CopyableCode({ code, label }: { code: string; label: string }) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          <Copy aria-hidden className="size-4" />
          {copied ? dict.labs.stem.copied : dict.labs.stem.copyCode}
        </Button>
      </div>
      <CodeBlock code={code} label={label} />
    </div>
  );
}
