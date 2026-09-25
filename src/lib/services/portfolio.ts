import "server-only";
import { z } from "zod";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { SKILL_IDS } from "@/lib/labs/career/skills";

/*
 * The portfolio collects evidence of a student's work: projects, certificates,
 * competitions, research, programming achievements, presentations, STEM
 * projects, volunteering and reflections. Items can be written by hand or
 * created from work in a laboratory (source_kind + source_id).
 */

export const PORTFOLIO_CATEGORIES = [
  "project",
  "programming",
  "stem",
  "research",
  "competition",
  "certificate",
  "presentation",
  "volunteer",
  "reflection",
  "other",
] as const;
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO_SOURCES = ["programming", "stem_project", "stem_record", "research"] as const;
export type PortfolioSource = (typeof PORTFOLIO_SOURCES)[number];

export const portfolioItemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(PORTFOLIO_CATEGORIES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().max(4000).default(""),
  link: z
    .string()
    .trim()
    .max(500)
    .default("")
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Links must start with http:// or https://"),
  evidence: z.string().trim().max(2000).default(""),
  skills: z.array(z.enum(SKILL_IDS)).max(8).default([]),
  reflection: z.string().trim().max(4000).default(""),
});
export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;

export interface PortfolioItem extends PortfolioItemInput {
  id: string;
  userId: string;
  sourceKind: PortfolioSource | null;
  sourceId: string | null;
  createdAt: number;
  updatedAt: number;
}

interface Row {
  id: string;
  user_id: string;
  title: string;
  category: PortfolioCategory;
  data: string;
  item_date: string;
  source_kind: PortfolioSource | null;
  source_id: string | null;
  created_at: number;
  updated_at: number;
}

function toItem(row: Row): PortfolioItem {
  const data = parseJson<Partial<PortfolioItemInput>>(row.data, {});
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    date: row.item_date,
    description: data.description ?? "",
    link: data.link ?? "",
    evidence: data.evidence ?? "",
    skills: (data.skills ?? []).filter((s): s is PortfolioItemInput["skills"][number] => (SKILL_IDS as readonly string[]).includes(s)),
    reflection: data.reflection ?? "",
    sourceKind: row.source_kind,
    sourceId: row.source_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listPortfolio(userId: string): PortfolioItem[] {
  return (getDb().prepare("SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY item_date DESC, created_at DESC").all(userId) as Row[]).map(toItem);
}

/** Owners and staff may see an item. */
export function getPortfolioItem(id: string, viewer: CurrentUser): PortfolioItem {
  const row = getDb().prepare("SELECT * FROM portfolio_items WHERE id = ?").get(id) as Row | undefined;
  if (!row || (row.user_id !== viewer.id && viewer.role === "student")) throw new ApiError(404, "not_found");
  return toItem(row);
}

export function findPortfolioItemBySource(userId: string, kind: PortfolioSource, sourceId: string): PortfolioItem | null {
  const row = getDb().prepare("SELECT * FROM portfolio_items WHERE user_id = ? AND source_kind = ? AND source_id = ?").get(userId, kind, sourceId) as Row | undefined;
  return row ? toItem(row) : null;
}

function dataOf(input: PortfolioItemInput) {
  return JSON.stringify({ description: input.description, link: input.link, evidence: input.evidence, skills: input.skills, reflection: input.reflection });
}

export function createPortfolioItem(
  user: CurrentUser,
  raw: PortfolioItemInput,
  source?: { kind: PortfolioSource; id: string },
  options: { id?: string; createdAt?: number } = {},
): PortfolioItem {
  const input = portfolioItemSchema.parse(raw);
  const count = getDb().prepare("SELECT COUNT(*) AS n FROM portfolio_items WHERE user_id = ?").get(user.id) as { n: number };
  if (count.n >= 300) throw new ApiError(400, "invalid_input", "The portfolio is full.");
  const id = options.id ?? newId();
  const at = options.createdAt ?? now();
  getDb()
    .prepare(
      "INSERT INTO portfolio_items (id, user_id, title, category, data, item_date, source_kind, source_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, user.id, input.title, input.category, dataOf(input), input.date, source?.kind ?? null, source?.id ?? null, at, at);
  return getPortfolioItem(id, user);
}

export function updatePortfolioItem(id: string, user: CurrentUser, raw: PortfolioItemInput): PortfolioItem {
  const item = getPortfolioItem(id, user);
  if (item.userId !== user.id) throw new ApiError(403, "forbidden");
  const input = portfolioItemSchema.parse(raw);
  getDb()
    .prepare("UPDATE portfolio_items SET title = ?, category = ?, data = ?, item_date = ?, updated_at = ? WHERE id = ?")
    .run(input.title, input.category, dataOf(input), input.date, now(), id);
  return getPortfolioItem(id, user);
}

export function deletePortfolioItem(id: string, user: CurrentUser): void {
  const item = getPortfolioItem(id, user);
  if (item.userId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  getDb().prepare("DELETE FROM portfolio_items WHERE id = ?").run(id);
}

/** How often each skill is evidenced in the portfolio. */
export function portfolioSkillCounts(userId: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of listPortfolio(userId)) for (const s of item.skills) counts.set(s, (counts.get(s) ?? 0) + 1);
  return counts;
}

export function todayIso(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10);
}
