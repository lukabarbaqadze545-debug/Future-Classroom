import type { ContentLanguage, Difficulty } from "@/lib/domain/catalog";
import type { AssignmentKind } from "@/lib/labs/registry";
import type { ItemRef } from "./subjects";

/** What students can do with an item — used for filters and counts. */
export const ACTIVITY_KINDS = ["lesson", "quiz", "coding", "simulation", "experiment", "exercise", "project", "reading", "career"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export type ItemStatus = "done" | "started" | null;

/** A catalogue reference resolved to something a page can show and link to. */
export interface ResolvedItem {
  key: string;
  source: ItemRef["kind"];
  kinds: ActivityKind[];
  title: string;
  href: string;
  difficulty: Difficulty | null;
  /** Language of the content when it differs from the reader's. */
  language: ContentLanguage | null;
  lessonId: string | null;
  lessonOwnerId: string | null;
  quizId: string | null;
  /** For teachers: how to assign it (kind + ref). */
  assign: { kind: AssignmentKind; ref: string } | null;
  /** For teachers: item key for a live lab session, if it can run as one. */
  sessionKey: string | null;
  status: ItemStatus;
}
