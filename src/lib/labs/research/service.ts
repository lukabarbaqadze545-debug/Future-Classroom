import "server-only";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { recordLabProgress } from "@/lib/services/assignments";
import { datasetSchema, noteSchema, projectDataSchema, sourceSchema, type DatasetInput, type NoteInput, type ResearchProjectData, type SourceInput } from "./model";

export interface ResearchProject {
  id: string;
  userId: string;
  userName: string;
  title: string;
  subject: string;
  data: ResearchProjectData;
  status: "draft" | "submitted";
  createdAt: number;
  updatedAt: number;
}

export interface ResearchSource extends SourceInput {
  id: string;
  createdAt: number;
}

export interface ResearchNote extends NoteInput {
  id: string;
  createdAt: number;
}

export interface ResearchDataset extends DatasetInput {
  id: string;
  updatedAt: number;
}

interface ProjectRow {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  subject: string;
  data: string;
  status: "draft" | "submitted";
  created_at: number;
  updated_at: number;
}

const SELECT_PROJECT = "SELECT p.*, u.display_name AS user_name FROM research_projects p JOIN users u ON u.id = p.user_id";

function toProject(row: ProjectRow): ResearchProject {
  const parsed = projectDataSchema.safeParse(parseJson(row.data, {}));
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    title: row.title,
    subject: row.subject,
    data: parsed.success ? parsed.data : projectDataSchema.parse({}),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createResearchProject(user: CurrentUser, input: { title: string; subject: string; data?: Partial<ResearchProjectData> }, options: { id?: string; at?: number } = {}): ResearchProject {
  const count = getDb().prepare("SELECT COUNT(*) AS n FROM research_projects WHERE user_id = ?").get(user.id) as { n: number };
  if (count.n >= 30) throw new ApiError(400, "invalid_input", "Too many research projects.");
  const id = options.id ?? newId();
  const at = options.at ?? now();
  getDb()
    .prepare("INSERT INTO research_projects (id, user_id, title, subject, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)")
    .run(id, user.id, input.title.trim().slice(0, 160), input.subject.trim().slice(0, 80), JSON.stringify(projectDataSchema.parse(input.data ?? {})), at, at);
  if (user.role === "student") recordLabProgress(user.id, "research", null, { status: "in_progress", workRef: id });
  return getResearchProjectFor(id, user);
}

/** Owners and staff may open a project. */
export function getResearchProjectFor(id: string, viewer: CurrentUser): ResearchProject {
  const row = getDb().prepare(`${SELECT_PROJECT} WHERE p.id = ?`).get(id) as ProjectRow | undefined;
  if (!row || (row.user_id !== viewer.id && viewer.role === "student")) throw new ApiError(404, "not_found");
  return toProject(row);
}

function requireOwner(id: string, user: CurrentUser): ResearchProject {
  const project = getResearchProjectFor(id, user);
  if (project.userId !== user.id) throw new ApiError(403, "forbidden");
  return project;
}

export function listResearchProjects(userId: string): ResearchProject[] {
  return (getDb().prepare(`${SELECT_PROJECT} WHERE p.user_id = ? ORDER BY p.updated_at DESC`).all(userId) as ProjectRow[]).map(toProject);
}

/** For teachers: every student's research, newest first. */
export function listAllStudentResearch(): ResearchProject[] {
  return (getDb().prepare(`${SELECT_PROJECT} WHERE u.role = 'student' ORDER BY p.updated_at DESC LIMIT 200`).all() as ProjectRow[]).map(toProject);
}

export function updateResearchProject(id: string, user: CurrentUser, input: { title?: string; subject?: string; data: unknown; submit?: boolean }): ResearchProject {
  const project = requireOwner(id, user);
  const data = projectDataSchema.parse(input.data);
  const status = input.submit ? "submitted" : project.status;
  getDb()
    .prepare("UPDATE research_projects SET title = ?, subject = ?, data = ?, status = ?, updated_at = ? WHERE id = ?")
    .run(
      (input.title ?? project.title).trim().slice(0, 160) || project.title,
      (input.subject ?? project.subject).trim().slice(0, 80),
      JSON.stringify(data),
      status,
      now(),
      id,
    );
  if (input.submit && user.role === "student") recordLabProgress(user.id, "research", null, { status: "submitted", workRef: id });
  return getResearchProjectFor(id, user);
}

export function deleteResearchProject(id: string, user: CurrentUser): void {
  const project = getResearchProjectFor(id, user);
  if (project.userId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  getDb().prepare("DELETE FROM research_projects WHERE id = ?").run(id);
}

function touch(projectId: string) {
  getDb().prepare("UPDATE research_projects SET updated_at = ? WHERE id = ?").run(now(), projectId);
}

// ---------------------------------------------------------------- Sources, notes, datasets

export function listSources(projectId: string): ResearchSource[] {
  return (getDb().prepare("SELECT * FROM research_sources WHERE project_id = ? ORDER BY created_at").all(projectId) as { id: string; data: string; created_at: number }[])
    .map((row) => {
      const parsed = sourceSchema.safeParse(parseJson(row.data, {}));
      return parsed.success ? { ...parsed.data, id: row.id, createdAt: row.created_at } : null;
    })
    .filter((s): s is ResearchSource => s !== null);
}

export function listNotes(projectId: string): ResearchNote[] {
  return (
    getDb().prepare("SELECT * FROM research_notes WHERE project_id = ? ORDER BY created_at").all(projectId) as {
      id: string;
      source_id: string | null;
      kind: NoteInput["kind"];
      content: string;
      page: string;
      stance: NoteInput["stance"];
      created_at: number;
    }[]
  ).map((row) => ({ id: row.id, kind: row.kind, content: row.content, sourceId: row.source_id, page: row.page, stance: row.stance, createdAt: row.created_at }));
}

export function listDatasets(projectId: string): ResearchDataset[] {
  return (getDb().prepare("SELECT * FROM research_datasets WHERE project_id = ? ORDER BY created_at").all(projectId) as { id: string; data: string; updated_at: number }[])
    .map((row) => {
      const parsed = datasetSchema.safeParse(parseJson(row.data, {}));
      return parsed.success ? { ...parsed.data, id: row.id, updatedAt: row.updated_at } : null;
    })
    .filter((d): d is ResearchDataset => d !== null);
}

export type ResearchCollection = "sources" | "notes" | "datasets";

const LIMITS: Record<ResearchCollection, number> = { sources: 60, notes: 300, datasets: 10 };
const TABLES: Record<ResearchCollection, string> = { sources: "research_sources", notes: "research_notes", datasets: "research_datasets" };

export function addItem(projectId: string, user: CurrentUser, collection: ResearchCollection, raw: unknown, options: { id?: string; at?: number } = {}) {
  requireOwner(projectId, user);
  const db = getDb();
  const count = db.prepare(`SELECT COUNT(*) AS n FROM ${TABLES[collection]} WHERE project_id = ?`).get(projectId) as { n: number };
  if (count.n >= LIMITS[collection]) throw new ApiError(400, "invalid_input", "Limit reached.");
  const id = options.id ?? newId();
  const at = options.at ?? now();
  if (collection === "sources") {
    const data = sourceSchema.parse(raw);
    db.prepare("INSERT INTO research_sources (id, project_id, data, created_at) VALUES (?, ?, ?, ?)").run(id, projectId, JSON.stringify(data), at);
  } else if (collection === "notes") {
    const data = noteSchema.parse(raw);
    assertSourceInProject(projectId, data.sourceId);
    db.prepare("INSERT INTO research_notes (id, project_id, source_id, kind, content, page, stance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
      id,
      projectId,
      data.sourceId,
      data.kind,
      data.content,
      data.page,
      data.kind === "evidence" ? (data.stance ?? "neutral") : null,
      at,
    );
  } else {
    const data = datasetSchema.parse(raw);
    db.prepare("INSERT INTO research_datasets (id, project_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(id, projectId, JSON.stringify(normaliseDataset(data)), at, at);
  }
  touch(projectId);
  return id;
}

function normaliseDataset(data: DatasetInput): DatasetInput {
  return { ...data, rows: data.rows.map((row) => data.columns.map((_, i) => row[i] ?? "")) };
}

function assertSourceInProject(projectId: string, sourceId: string | null) {
  if (!sourceId) return;
  const row = getDb().prepare("SELECT 1 FROM research_sources WHERE id = ? AND project_id = ?").get(sourceId, projectId);
  if (!row) throw new ApiError(400, "invalid_input", "Unknown source.");
}

function projectOfItem(collection: ResearchCollection, itemId: string): string {
  const row = getDb().prepare(`SELECT project_id FROM ${TABLES[collection]} WHERE id = ?`).get(itemId) as { project_id: string } | undefined;
  if (!row) throw new ApiError(404, "not_found");
  return row.project_id;
}

export function updateItem(collection: ResearchCollection, itemId: string, user: CurrentUser, raw: unknown) {
  const projectId = projectOfItem(collection, itemId);
  requireOwner(projectId, user);
  const db = getDb();
  if (collection === "sources") {
    db.prepare("UPDATE research_sources SET data = ? WHERE id = ?").run(JSON.stringify(sourceSchema.parse(raw)), itemId);
  } else if (collection === "notes") {
    const data = noteSchema.parse(raw);
    assertSourceInProject(projectId, data.sourceId);
    db.prepare("UPDATE research_notes SET kind = ?, content = ?, source_id = ?, page = ?, stance = ? WHERE id = ?").run(
      data.kind,
      data.content,
      data.sourceId,
      data.page,
      data.kind === "evidence" ? (data.stance ?? "neutral") : null,
      itemId,
    );
  } else {
    db.prepare("UPDATE research_datasets SET data = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(normaliseDataset(datasetSchema.parse(raw))), now(), itemId);
  }
  touch(projectId);
}

export function deleteItem(collection: ResearchCollection, itemId: string, user: CurrentUser) {
  const projectId = projectOfItem(collection, itemId);
  requireOwner(projectId, user);
  getDb().prepare(`DELETE FROM ${TABLES[collection]} WHERE id = ?`).run(itemId);
  touch(projectId);
}

export function getResearchBundle(id: string, viewer: CurrentUser) {
  const project = getResearchProjectFor(id, viewer);
  return { project, sources: listSources(id), notes: listNotes(id), datasets: listDatasets(id) };
}

/** How far a project has come through the workflow (for progress and teacher overviews). */
export function researchStepStatus(bundle: ReturnType<typeof getResearchBundle>) {
  const d = bundle.project.data;
  return {
    question: d.question.trim().length > 10,
    hypothesis: d.hypothesis.trim().length > 10,
    sources: bundle.sources.length >= 2,
    notes: bundle.notes.some((n) => n.kind !== "evidence"),
    evidence: bundle.notes.some((n) => n.kind === "evidence"),
    data: bundle.datasets.some((ds) => ds.rows.length > 0),
    analysis: d.analysis.trim().length > 20,
    findings: d.findings.some((f) => f.trim()),
    conclusion: d.conclusion.trim().length > 20,
    presentation: d.keyMessage.trim().length > 5,
  };
}

export function researchProgress(userId: string) {
  const projects = listResearchProjects(userId);
  const sources = getDb()
    .prepare("SELECT COUNT(*) AS n FROM research_sources s JOIN research_projects p ON p.id = s.project_id WHERE p.user_id = ?")
    .get(userId) as { n: number };
  return { projects: projects.length, submitted: projects.filter((p) => p.status === "submitted").length, sources: sources.n };
}
