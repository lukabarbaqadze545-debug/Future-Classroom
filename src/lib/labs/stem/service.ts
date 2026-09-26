import "server-only";
import { z } from "zod";
import { getDb, now, parseJson } from "@/lib/db";
import { withoutUnits } from "@/lib/domain/grading";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { recordLabProgress } from "@/lib/services/assignments";
import type { L } from "../localized";
import { ELECTRONICS_CHALLENGES } from "./electronics";
import { EXPERIMENTS, findExperiment } from "./experiments";
import { GRAVITY, ROBOT_LEVEL, SPRING_SAMPLE, leastSquares, projectile, runRobot, sumSquaredErrors } from "./physics";
import { findTemplate, PROJECT_TEMPLATES } from "./projects";
import { ROBOTICS_CHALLENGES } from "./robotics";
import { SIMULATIONS, findSimulation } from "./simulations";
import type { ChallengeSet, StemItem } from "./types";
import { canViewWork } from "@/lib/services/classes";

/*
 * STEM records (experiments, simulation and challenge answers) and
 * engineering projects. Answer keys stay here; students get results after
 * submitting.
 */

export const CHALLENGE_SETS: ChallengeSet[] = [...ELECTRONICS_CHALLENGES, ...ROBOTICS_CHALLENGES];

export function findChallengeSet(id: string) {
  return CHALLENGE_SETS.find((c) => c.id === id) ?? null;
}

// ---------------------------------------------------------------- Checking

export type StudentItem = ReturnType<typeof toStudentItems>[number];

/** Items without answers, tolerances or explanations. */
export function toStudentItems(items: StemItem[]) {
  return items.map((item) =>
    item.type === "choice"
      ? { type: item.type, id: item.id, prompt: item.prompt, options: item.options, unit: "", task: null, params: {} as Record<string, number> }
      : item.type === "numeric"
        ? { type: item.type, id: item.id, prompt: item.prompt, options: [], unit: item.unit, task: null, params: {} as Record<string, number> }
        : { type: item.type, id: item.id, prompt: item.prompt, options: [], unit: "", task: item.task, params: item.params },
  );
}

export interface StemItemResult {
  id: string;
  correct: boolean;
  explanation: L;
  /** The expected answer (choice id or number), revealed after submitting. */
  expected: string | number | null;
  /** For tasks: what the student's setup produced, e.g. the landing distance. */
  measured: number | null;
}

export interface StemCheckResult {
  score: number;
  max: number;
  items: StemItemResult[];
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = withoutUnits(value).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(cleaned)) {
    const fraction = cleaned.match(/^([-+]?\d+)\/(\d+)$/);
    return fraction && Number(fraction[2]) !== 0 ? Number(fraction[1]) / Number(fraction[2]) : null;
  }
  return Number(cleaned);
}

const taskSchemas = {
  projectile_target: z.object({ angle: z.number().min(0).max(90), speed: z.number().min(0).max(100), gravity: z.number().positive().default(GRAVITY.earth), height: z.number().min(0).default(0) }),
  circuit_current: z.object({ voltage: z.number(), r1: z.number().positive().max(10000), r2: z.number().positive().max(10000), mode: z.enum(["series", "parallel"]) }),
  fit_line: z.object({ slope: z.number(), intercept: z.number() }),
  robot_goal: z.object({ program: z.array(z.object({ command: z.enum(["forward", "left", "right"]), times: z.number().int().min(1).max(9) })).max(30) }),
};

function checkTask(item: Extract<StemItem, { type: "task" }>, raw: unknown): { correct: boolean; measured: number | null } {
  switch (item.task) {
    case "projectile_target": {
      const a = taskSchemas.projectile_target.safeParse(raw);
      if (!a.success) return { correct: false, measured: null };
      // The challenge is set on Earth from ground level; other settings are measured but not accepted.
      const range = projectile(a.data.speed, a.data.angle, a.data.height, a.data.gravity).range;
      const onEarthFromGround = Math.abs(a.data.gravity - GRAVITY.earth) < 0.01 && a.data.height === 0;
      return { correct: onEarthFromGround && Math.abs(range - item.params.target) <= item.params.tolerance, measured: Math.round(range * 10) / 10 };
    }
    case "circuit_current": {
      const a = taskSchemas.circuit_current.safeParse(raw);
      if (!a.success) return { correct: false, measured: null };
      const series = a.data.mode === "series";
      const total = series ? a.data.r1 + a.data.r2 : (a.data.r1 * a.data.r2) / (a.data.r1 + a.data.r2);
      const current = a.data.voltage / total;
      const ok = Math.abs(a.data.voltage - item.params.voltage) < 1e-9 && series === (item.params.series === 1) && Math.abs(current - item.params.current) <= item.params.tolerance;
      return { correct: ok, measured: Math.round(current * 1000) / 1000 };
    }
    case "fit_line": {
      const a = taskSchemas.fit_line.safeParse(raw);
      if (!a.success) return { correct: false, measured: null };
      const best = leastSquares(SPRING_SAMPLE).sse;
      const sse = sumSquaredErrors(SPRING_SAMPLE, a.data.slope, a.data.intercept);
      return { correct: sse <= best * item.params.factor, measured: Math.round(sse * 100) / 100 };
    }
    case "robot_goal": {
      const a = taskSchemas.robot_goal.safeParse(raw);
      if (!a.success) return { correct: false, measured: null };
      const run = runRobot(ROBOT_LEVEL, a.data.program);
      return { correct: run.reached && a.data.program.length <= item.params.maxSteps, measured: a.data.program.length };
    }
  }
}

export function checkItems(items: StemItem[], answers: Record<string, unknown>): StemCheckResult {
  const results = items.map((item): StemItemResult => {
    const given = answers[item.id];
    if (item.type === "choice") return { id: item.id, correct: given === item.correct, explanation: item.explanation, expected: item.correct, measured: null };
    if (item.type === "numeric") {
      const value = parseNumber(given);
      return { id: item.id, correct: value !== null && Math.abs(value - item.answer) <= item.tolerance, explanation: item.explanation, expected: Math.round(item.answer * 1000) / 1000, measured: null };
    }
    const task = checkTask(item, given);
    return { id: item.id, correct: task.correct, explanation: item.explanation, expected: null, measured: task.measured };
  });
  return { score: results.filter((r) => r.correct).length, max: results.length, items: results };
}

// ---------------------------------------------------------------- Records

export type RecordKind = "experiment" | "simulation" | "challenge";

export interface StemRecord {
  id: string;
  userId: string;
  userName: string;
  itemKind: RecordKind;
  itemId: string;
  data: Record<string, unknown>;
  status: "draft" | "submitted";
  score: number | null;
  maxScore: number | null;
  createdAt: number;
  updatedAt: number;
}

interface RecordRow {
  id: string;
  user_id: string;
  user_name: string;
  item_kind: RecordKind;
  item_id: string;
  data: string;
  status: "draft" | "submitted";
  score: number | null;
  max_score: number | null;
  created_at: number;
  updated_at: number;
}

const SELECT_RECORD = "SELECT r.*, u.display_name AS user_name FROM stem_records r JOIN users u ON u.id = r.user_id";

function toRecord(row: RecordRow): StemRecord {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    itemKind: row.item_kind,
    itemId: row.item_id,
    data: parseJson(row.data, {}),
    status: row.status,
    score: row.score,
    maxScore: row.max_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getRecord(userId: string, kind: RecordKind, itemId: string): StemRecord | null {
  const row = getDb().prepare(`${SELECT_RECORD} WHERE r.user_id = ? AND r.item_kind = ? AND r.item_id = ?`).get(userId, kind, itemId) as RecordRow | undefined;
  return row ? toRecord(row) : null;
}

export function getRecordFor(id: string, viewer: CurrentUser): StemRecord {
  const row = getDb().prepare(`${SELECT_RECORD} WHERE r.id = ?`).get(id) as RecordRow | undefined;
  if (!row || !canViewWork(viewer, row.user_id)) throw new ApiError(404, "not_found");
  return toRecord(row);
}

export function listRecords(userId: string): StemRecord[] {
  return (getDb().prepare(`${SELECT_RECORD} WHERE r.user_id = ? ORDER BY r.updated_at DESC`).all(userId) as RecordRow[]).map(toRecord);
}

function upsertRecord(user: CurrentUser, kind: RecordKind, itemId: string, data: unknown, status: "draft" | "submitted", score: number | null, max: number | null, at = now()): StemRecord {
  const existing = getRecord(user.id, kind, itemId);
  const db = getDb();
  if (existing) {
    db.prepare("UPDATE stem_records SET data = ?, status = ?, score = ?, max_score = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(data), status, score, max, at, existing.id);
    return getRecord(user.id, kind, itemId)!;
  }
  db.prepare("INSERT INTO stem_records (id, user_id, item_kind, item_id, data, status, score, max_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    newId(),
    user.id,
    kind,
    itemId,
    JSON.stringify(data),
    status,
    score,
    max,
    at,
    at,
  );
  return getRecord(user.id, kind, itemId)!;
}

export const experimentRecordSchema = z.object({
  prediction: z.string().max(4000).default(""),
  table: z.array(z.array(z.string().max(200)).max(8)).max(30).default([]),
  observations: z.string().max(6000).default(""),
  conclusion: z.string().max(6000).default(""),
  reflection: z.array(z.string().max(4000)).max(6).default([]),
});
export type ExperimentRecordData = z.infer<typeof experimentRecordSchema>;

export function saveExperimentRecord(user: CurrentUser, experimentId: string, raw: unknown, submit: boolean, options: { at?: number } = {}): StemRecord {
  if (!findExperiment(experimentId)) throw new ApiError(404, "not_found");
  const data = experimentRecordSchema.parse(raw);
  if (submit && !data.conclusion.trim() && !data.observations.trim()) throw new ApiError(400, "invalid_input", "Write your observations or conclusion before submitting.");
  const existing = getRecord(user.id, "experiment", experimentId);
  const status = submit ? "submitted" : (existing?.status ?? "draft");
  const record = upsertRecord(user, "experiment", experimentId, data, status, null, null, options.at);
  if (user.role === "student") recordLabProgress(user.id, "experiment", experimentId, submit ? { status: "submitted", workRef: record.id } : { status: "in_progress", workRef: record.id });
  return record;
}

/** Simulation challenges and electronics/robotics challenge sets. Keeps the best score. */
export function submitChallenge(user: CurrentUser, kind: "simulation" | "challenge", itemId: string, answers: Record<string, unknown>, options: { at?: number } = {}) {
  const items = kind === "simulation" ? findSimulation(itemId)?.items : findChallengeSet(itemId)?.items;
  if (!items) throw new ApiError(404, "not_found");
  const result = checkItems(items, answers);
  const existing = getRecord(user.id, kind, itemId);
  const keepBest = existing?.score !== null && existing?.score !== undefined && existing.score > result.score;
  const record = keepBest
    ? existing!
    : upsertRecord(user, kind, itemId, { answers, result }, "submitted", result.score, result.max, options.at);
  if (user.role === "student") {
    recordLabProgress(user.id, kind === "simulation" ? "simulation" : "stem_challenge", itemId, { status: "completed", workRef: record.id, score: result.score, maxScore: result.max });
  }
  return { result, best: { score: record.score ?? result.score, max: record.maxScore ?? result.max } };
}

// ---------------------------------------------------------------- Projects

export const projectDataSchema = z.object({
  problem: z.string().max(4000).default(""),
  users: z.string().max(2000).default(""),
  constraints: z.string().max(2000).default(""),
  criteria: z.string().max(2000).default(""),
  research: z.string().max(6000).default(""),
  ideas: z.array(z.string().max(1000)).max(10).default([]),
  solution: z.string().max(4000).default(""),
  justification: z.string().max(4000).default(""),
  design: z.string().max(6000).default(""),
  materials: z.string().max(2000).default(""),
  iterations: z
    .array(z.object({ title: z.string().max(200).default(""), change: z.string().max(2000).default(""), result: z.string().max(2000).default(""), next: z.string().max(2000).default("") }))
    .max(10)
    .default([]),
  results: z.string().max(6000).default(""),
  reflection: z.string().max(6000).default(""),
});
export type ProjectData = z.infer<typeof projectDataSchema>;

export interface StemProject {
  id: string;
  userId: string;
  userName: string;
  templateId: string | null;
  kind: "experiment" | "physical" | "simulation";
  title: string;
  data: ProjectData;
  status: "draft" | "submitted";
  createdAt: number;
  updatedAt: number;
}

interface ProjectRow {
  id: string;
  user_id: string;
  user_name: string;
  template_id: string | null;
  kind: StemProject["kind"];
  title: string;
  data: string;
  status: "draft" | "submitted";
  created_at: number;
  updated_at: number;
}

const SELECT_PROJECT = "SELECT p.*, u.display_name AS user_name FROM stem_projects p JOIN users u ON u.id = p.user_id";

function toProject(row: ProjectRow): StemProject {
  const parsed = projectDataSchema.safeParse(parseJson(row.data, {}));
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    templateId: row.template_id,
    kind: row.kind,
    title: row.title,
    data: parsed.success ? parsed.data : projectDataSchema.parse({}),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProject(user: CurrentUser, templateId: string | null, title: string, options: { id?: string; at?: number; data?: Partial<ProjectData> } = {}): StemProject {
  const template = templateId ? findTemplate(templateId) : null;
  if (templateId && !template) throw new ApiError(404, "not_found");
  const count = getDb().prepare("SELECT COUNT(*) AS n FROM stem_projects WHERE user_id = ?").get(user.id) as { n: number };
  if (count.n >= 50) throw new ApiError(400, "invalid_input", "Too many projects.");
  const id = options.id ?? newId();
  const at = options.at ?? now();
  getDb()
    .prepare("INSERT INTO stem_projects (id, user_id, template_id, kind, title, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)")
    .run(id, user.id, template?.id ?? null, template?.mode ?? "physical", title.trim().slice(0, 160) || "Project", JSON.stringify(projectDataSchema.parse(options.data ?? {})), at, at);
  if (user.role === "student") recordLabProgress(user.id, "stem_project", template?.id ?? null, { status: "in_progress", workRef: id });
  return getProjectFor(id, user);
}

export function getProjectFor(id: string, viewer: CurrentUser): StemProject {
  const row = getDb().prepare(`${SELECT_PROJECT} WHERE p.id = ?`).get(id) as ProjectRow | undefined;
  if (!row || !canViewWork(viewer, row.user_id)) throw new ApiError(404, "not_found");
  return toProject(row);
}

export function listProjects(userId: string): StemProject[] {
  return (getDb().prepare(`${SELECT_PROJECT} WHERE p.user_id = ? ORDER BY p.updated_at DESC`).all(userId) as ProjectRow[]).map(toProject);
}

export function updateProject(id: string, user: CurrentUser, input: { title?: string; data: unknown; submit?: boolean }): StemProject {
  const project = getProjectFor(id, user);
  if (project.userId !== user.id) throw new ApiError(403, "forbidden");
  const data = projectDataSchema.parse(input.data);
  const status = input.submit ? "submitted" : project.status;
  getDb()
    .prepare("UPDATE stem_projects SET title = ?, data = ?, status = ?, updated_at = ? WHERE id = ?")
    .run((input.title ?? project.title).trim().slice(0, 160) || project.title, JSON.stringify(data), status, now(), id);
  if (input.submit && user.role === "student") recordLabProgress(user.id, "stem_project", project.templateId, { status: "submitted", workRef: id });
  return getProjectFor(id, user);
}

export function deleteProject(id: string, user: CurrentUser): void {
  const project = getProjectFor(id, user);
  if (project.userId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  getDb().prepare("DELETE FROM stem_projects WHERE id = ?").run(id);
}

// ---------------------------------------------------------------- Progress

export function stemProgress(userId: string) {
  const records = listRecords(userId);
  const projects = listProjects(userId);
  return {
    experiments: records.filter((r) => r.itemKind === "experiment" && r.status === "submitted").length,
    experimentsTotal: EXPERIMENTS.length,
    simulations: records.filter((r) => r.itemKind === "simulation").length,
    simulationsTotal: SIMULATIONS.length,
    challenges: records.filter((r) => r.itemKind === "challenge").length,
    challengesTotal: CHALLENGE_SETS.length,
    projects: projects.length,
    projectsSubmitted: projects.filter((p) => p.status === "submitted").length,
    templatesTotal: PROJECT_TEMPLATES.length,
  };
}

/** For teachers: who has worked on an item. */
export function itemClassRecords(kind: RecordKind, itemId: string): StemRecord[] {
  return (
    getDb().prepare(`${SELECT_RECORD} WHERE r.item_kind = ? AND r.item_id = ? AND u.role = 'student' ORDER BY r.updated_at DESC`).all(kind, itemId) as RecordRow[]
  ).map(toRecord);
}
