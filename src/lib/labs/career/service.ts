import "server-only";
import { z } from "zod";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { portfolioSkillCounts } from "@/lib/services/portfolio";
import { FIELD_IDS } from "./careers";
import { SKILL_IDS, SKILLS } from "./skills";
import { canViewWork } from "@/lib/services/classes";

/*
 * University research cards hold time-sensitive facts (requirements, fees,
 * deadlines). Every card records where the facts came from and when they
 * were last checked, and the UI always says so.
 */

const httpsUrl = z
  .string()
  .trim()
  .max(600)
  .default("")
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Links must start with http:// or https://");

export const DEGREES = ["foundation", "bachelor", "master", "vocational", "other"] as const;

export const universitySchema = z.object({
  university: z.string().trim().min(1).max(200),
  country: z.string().trim().max(80).default(""),
  city: z.string().trim().max(80).default(""),
  program: z.string().trim().max(200).default(""),
  degree: z.enum(DEGREES).default("bachelor"),
  language: z.string().trim().max(80).default(""),
  fieldId: z.enum(FIELD_IDS).nullable().default(null),
  admission: z.string().trim().max(3000).default(""),
  tuition: z.string().trim().max(1000).default(""),
  scholarships: z.string().trim().max(2000).default(""),
  deadlines: z.string().trim().max(1000).default(""),
  website: httpsUrl,
  sourceUrl: httpsUrl,
  notes: z.string().trim().max(3000).default(""),
  interest: z.number().int().min(0).max(3).default(0),
});
export type UniversityInput = z.infer<typeof universitySchema>;

export interface UniversityCard extends UniversityInput {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerRole: string;
  shared: boolean;
  checkedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface CardRow {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_role: string;
  shared: number;
  data: string;
  checked_at: number | null;
  created_at: number;
  updated_at: number;
}

const SELECT_CARD = "SELECT c.*, u.display_name AS owner_name, u.role AS owner_role FROM university_cards c JOIN users u ON u.id = c.owner_id";

function toCard(row: CardRow): UniversityCard | null {
  const parsed = universitySchema.safeParse(parseJson(row.data, {}));
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerRole: row.owner_role,
    shared: row.shared === 1,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A year-old check is flagged as possibly out of date. */
export const STALE_AFTER_MS = 365 * 24 * 60 * 60 * 1000;

export function isStale(card: Pick<UniversityCard, "checkedAt">, at = Date.now()): boolean {
  return card.checkedAt === null || at - card.checkedAt > STALE_AFTER_MS;
}

export function listOwnCards(userId: string): UniversityCard[] {
  return (getDb().prepare(`${SELECT_CARD} WHERE c.owner_id = ? ORDER BY c.updated_at DESC`).all(userId) as CardRow[]).map(toCard).filter((c): c is UniversityCard => c !== null);
}

/** Cards teachers have shared with all students. */
export function listSharedCards(): UniversityCard[] {
  return (getDb().prepare(`${SELECT_CARD} WHERE c.shared = 1 ORDER BY c.updated_at DESC`).all() as CardRow[]).map(toCard).filter((c): c is UniversityCard => c !== null);
}

export function getCardFor(id: string, viewer: CurrentUser): UniversityCard {
  const row = getDb().prepare(`${SELECT_CARD} WHERE c.id = ?`).get(id) as CardRow | undefined;
  const card = row ? toCard(row) : null;
  if (!card || (!card.shared && !canViewWork(viewer, card.ownerId))) throw new ApiError(404, "not_found");
  return card;
}

export function createCard(user: CurrentUser, raw: UniversityInput, options: { shared?: boolean; checkedAt?: number | null; id?: string; at?: number } = {}): UniversityCard {
  const data = universitySchema.parse(raw);
  const count = getDb().prepare("SELECT COUNT(*) AS n FROM university_cards WHERE owner_id = ?").get(user.id) as { n: number };
  if (count.n >= 60) throw new ApiError(400, "invalid_input", "Too many cards.");
  const id = options.id ?? newId();
  const at = options.at ?? now();
  const shared = options.shared && user.role !== "student" ? 1 : 0;
  getDb()
    .prepare("INSERT INTO university_cards (id, owner_id, shared, data, checked_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, user.id, shared, JSON.stringify(data), options.checkedAt === undefined ? at : options.checkedAt, at, at);
  return getCardFor(id, user);
}

export function updateCard(id: string, user: CurrentUser, raw: UniversityInput, options: { shared?: boolean; checked?: boolean } = {}): UniversityCard {
  const card = getCardFor(id, user);
  if (card.ownerId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  const data = universitySchema.parse(raw);
  const shared = options.shared === undefined ? card.shared : options.shared && user.role !== "student";
  getDb()
    .prepare("UPDATE university_cards SET data = ?, shared = ?, checked_at = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(data), shared ? 1 : 0, options.checked ? now() : card.checkedAt, now(), id);
  return getCardFor(id, user);
}

export function deleteCard(id: string, user: CurrentUser): void {
  const card = getCardFor(id, user);
  if (card.ownerId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  getDb().prepare("DELETE FROM university_cards WHERE id = ?").run(id);
}

/** A student saves their own editable copy of a teacher's shared card. */
export function copyCard(id: string, user: CurrentUser): UniversityCard {
  const card = getCardFor(id, user);
  // Parsing keeps only the card's content; the check date travels with it.
  return createCard(user, universitySchema.parse(card), { checkedAt: card.checkedAt });
}

// ---------------------------------------------------------------- Skills

export function skillRatings(userId: string): Map<string, number> {
  const rows = getDb().prepare("SELECT skill_id, level FROM skill_ratings WHERE user_id = ?").all(userId) as { skill_id: string; level: number }[];
  return new Map(rows.map((r) => [r.skill_id, r.level]));
}

export function setSkillRating(userId: string, skillId: string, level: number | null, at = now()): void {
  if (!(SKILL_IDS as readonly string[]).includes(skillId)) throw new ApiError(400, "invalid_input");
  if (level === null) {
    getDb().prepare("DELETE FROM skill_ratings WHERE user_id = ? AND skill_id = ?").run(userId, skillId);
    return;
  }
  if (!Number.isInteger(level) || level < 1 || level > 4) throw new ApiError(400, "invalid_input");
  getDb()
    .prepare("INSERT INTO skill_ratings (user_id, skill_id, level, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, skill_id) DO UPDATE SET level = excluded.level, updated_at = excluded.updated_at")
    .run(userId, skillId, level, at);
}

/** Self-rating next to the evidence the portfolio actually contains. */
export function skillProfile(userId: string) {
  const ratings = skillRatings(userId);
  const evidence = portfolioSkillCounts(userId);
  return SKILLS.map((s) => ({ id: s.id, name: s.name, group: s.group, level: ratings.get(s.id) ?? null, evidence: evidence.get(s.id) ?? 0 }));
}

// ---------------------------------------------------------------- Development goals

export const goalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  why: z.string().trim().max(1000).default(""),
  skillId: z.enum(SKILL_IDS).nullable().default(null),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .default(null),
  steps: z.array(z.object({ text: z.string().trim().min(1).max(300), done: z.boolean().default(false) })).max(10).default([]),
  reflection: z.string().trim().max(2000).default(""),
});
export type GoalInput = z.infer<typeof goalSchema>;

export interface Goal extends GoalInput {
  id: string;
  status: "active" | "done";
  updatedAt: number;
}

export function listGoals(userId: string): Goal[] {
  const rows = getDb().prepare("SELECT * FROM development_goals WHERE user_id = ? ORDER BY status, updated_at DESC").all(userId) as {
    id: string;
    data: string;
    status: "active" | "done";
    updated_at: number;
  }[];
  return rows
    .map((row) => {
      const parsed = goalSchema.safeParse(parseJson(row.data, {}));
      return parsed.success ? { ...parsed.data, id: row.id, status: row.status, updatedAt: row.updated_at } : null;
    })
    .filter((g): g is Goal => g !== null);
}

function ownGoal(id: string, userId: string) {
  const row = getDb().prepare("SELECT user_id FROM development_goals WHERE id = ?").get(id) as { user_id: string } | undefined;
  if (!row || row.user_id !== userId) throw new ApiError(404, "not_found");
}

export function createGoal(user: CurrentUser, raw: GoalInput, options: { id?: string; at?: number; status?: "active" | "done" } = {}): Goal {
  const data = goalSchema.parse(raw);
  const count = getDb().prepare("SELECT COUNT(*) AS n FROM development_goals WHERE user_id = ?").get(user.id) as { n: number };
  if (count.n >= 40) throw new ApiError(400, "invalid_input", "Too many goals.");
  const id = options.id ?? newId();
  const at = options.at ?? now();
  getDb().prepare("INSERT INTO development_goals (id, user_id, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, user.id, JSON.stringify(data), options.status ?? "active", at, at);
  return listGoals(user.id).find((g) => g.id === id)!;
}

export function updateGoal(id: string, user: CurrentUser, raw: GoalInput, status: "active" | "done"): Goal {
  ownGoal(id, user.id);
  const data = goalSchema.parse(raw);
  getDb().prepare("UPDATE development_goals SET data = ?, status = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(data), status, now(), id);
  return listGoals(user.id).find((g) => g.id === id)!;
}

export function deleteGoal(id: string, user: CurrentUser): void {
  ownGoal(id, user.id);
  getDb().prepare("DELETE FROM development_goals WHERE id = ?").run(id);
}

export function careerProgress(userId: string) {
  const goals = listGoals(userId);
  return {
    universities: listOwnCards(userId).length,
    activeGoals: goals.filter((g) => g.status === "active").length,
    doneGoals: goals.filter((g) => g.status === "done").length,
    ratedSkills: skillRatings(userId).size,
  };
}
