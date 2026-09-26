"use client";

import { useI18n } from "@/lib/i18n/client";
import type { ReviewStatus } from "@/lib/domain/review";
import { Badge, type Tone } from "@/components/ui/badge";

const TONE: Record<ReviewStatus, Tone> = { draft: "neutral", technical: "brand", language: "brand", subject: "brand", ready: "success" };

/** Content review state of a lesson. Staff pages only. */
export function ReviewBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  const { dict } = useI18n();
  return (
    <Badge tone={TONE[status]} dot className={className}>
      {dict.review.status[status]}
    </Badge>
  );
}
