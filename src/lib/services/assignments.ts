import "server-only";
import { z } from "zod";
import { getDb, now, parseJson } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";
import { ASSIGNMENT_KINDS, AUTO_CHECKED_KINDS, OPEN_WORK_KINDS, type AssignmentKind } from "@/lib/labs/registry";

/*
 * Assignments connect the teacher to every laboratory. An assignment points
 * at one item (kind + refId) or is a custom task. Each recipient has a status
 * that the labs update automatically (recordLabProgress) or that the student
 * changes by handing in work (submitWork). Teachers review and give feedback.
 */

export type RecipientStatus = "assigned" | "in_progress" | "submitted" | "completed" | "reviewed" | "revision";

export interface AssignmentRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  kind: AssignmentKind;
  refId: string | null;
  title: string;
  instructions: string;
  dueAt: number | null;
  classId: string | null;
  className: string | null;
  archived: boolean;
  createdAt: number;
}

export const responseSchema = z.object({
  text: z.string().trim().max(8000).default(""),
  link: z.string().trim().max(500).default(""),
  workTitle: z.string().trim().max(200).default(""),
});
export type WorkResponse = z.infer<typeof responseSchema>;

export interface RecipientRecord {
  assignmentId: string;
  studentId: string;
  studentName: string;
  status: RecipientStatus;
  workRef: string | null;
  score: number | null;
  maxScore: number | null;
  response: WorkResponse;
  submittedAt: number | null;
  feedback: string;
  feedbackAt: number | null;
  updatedAt: number;
}

interface AssignmentRow {
  id: string;
  teacher_id: string;
  teacher_name: string;
  kind: AssignmentKind;
  ref_id: string | null;
  title: string;
  instructions: string;
  due_at: number | null;
  class_id: string | null;
  class_name: string | null;
  archived: number;
  created_at: number;
}

interface RecipientRow {
  assignment_id: string;
  student_id: string;
  student_name: string;
  status: RecipientStatus;
  work_ref: string | null;
  score: number | null;
  max_score: number | null;
  response: string;
  submitted_at: number | null;
  feedback: string;
  feedback_at: number | null;
  updated_at: number;
}

const SELECT_ASSIGNMENT = `SELECT a.*, u.display_name AS teacher_name, c.name AS class_name FROM assignments a
  JOIN users u ON u.id = a.teacher_id LEFT JOIN classes c ON c.id = a.class_id`;
const SELECT_RECIPIENT = `SELECT r.*, u.display_name AS student_name FROM assignment_recipients r JOIN users u ON u.id = r.student_id`;

function toAssignment(row: AssignmentRow): AssignmentRecord {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    kind: row.kind,
    refId: row.ref_id,
    title: row.title,
    instructions: row.instructions,
    dueAt: row.due_at,
    classId: row.class_id,
    className: row.class_name,
    archived: row.archived === 1,
    createdAt: row.created_at,
  };
}

function toRecipient(row: RecipientRow): RecipientRecord {
  const response = responseSchema.safeParse(parseJson(row.response, {}));
  return {
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    studentName: row.student_name,
    status: row.status,
    workRef: row.work_ref,
    score: row.score,
    maxScore: row.max_score,
    response: response.success ? response.data : { text: "", link: "", workTitle: "" },
    submittedAt: row.submitted_at,
    feedback: row.feedback,
    feedbackAt: row.feedback_at,
    updatedAt: row.updated_at,
  };
}

export const createAssignmentSchema = z.object({
  kind: z.enum(ASSIGNMENT_KINDS),
  refId: z.string().trim().max(80).nullable().default(null),
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(4000).default(""),
  dueAt: z.number().int().positive().nullable().default(null),
  classId: z.string().max(40).nullable().default(null),
  studentIds: z.array(z.string().max(40)).max(200).default([]),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

/** Kinds that need a specific item; the others can point at "any work of this type". */
const NEEDS_REF: readonly AssignmentKind[] = ["programming", "experiment", "simulation", "stem_challenge", "critical", "library", "lesson", "quiz"];

export function createAssignment(user: CurrentUser, raw: CreateAssignmentInput, options: { id?: string; createdAt?: number } = {}): AssignmentRecord {
  const input = createAssignmentSchema.parse(raw);
  if (NEEDS_REF.includes(input.kind) && !input.refId) throw new ApiError(400, "invalid_input", "Choose an item to assign.");
  const db = getDb();
  const recipients = new Set(input.studentIds);
  if (input.classId) {
    const cls = db.prepare("SELECT teacher_id FROM classes WHERE id = ?").get(input.classId) as { teacher_id: string } | undefined;
    if (!cls || (cls.teacher_id !== user.id && user.role !== "admin")) throw new ApiError(403, "forbidden");
    for (const row of db.prepare("SELECT student_id FROM class_members WHERE class_id = ?").all(input.classId) as { student_id: string }[]) {
      recipients.add(row.student_id);
    }
  }
  const valid = [...recipients].filter((id) => db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'student'").get(id));
  if (valid.length === 0) throw new ApiError(400, "invalid_input", "Choose a class or at least one student.");
  const id = options.id ?? newId();
  const timestamp = options.createdAt ?? now();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO assignments (id, teacher_id, kind, ref_id, title, instructions, due_at, class_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, user.id, input.kind, input.refId, input.title, input.instructions, input.dueAt, input.classId, timestamp);
    const insert = db.prepare("INSERT INTO assignment_recipients (assignment_id, student_id, status, updated_at) VALUES (?, ?, 'assigned', ?)");
    for (const studentId of valid) insert.run(id, studentId, timestamp);
  })();
  // Work finished before the assignment existed still counts.
  for (const studentId of valid) backfillFromExistingWork(id, input.kind, input.refId, studentId);
  return getAssignment(id)!;
}

export function getAssignment(id: string): AssignmentRecord | null {
  const row = getDb().prepare(`${SELECT_ASSIGNMENT} WHERE a.id = ?`).get(id) as AssignmentRow | undefined;
  return row ? toAssignment(row) : null;
}

function requireOwn(id: string, user: CurrentUser): AssignmentRecord {
  const assignment = getAssignment(id);
  if (!assignment) throw new ApiError(404, "not_found");
  if (assignment.teacherId !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  return assignment;
}

export function listRecipients(assignmentId: string): RecipientRecord[] {
  return (getDb().prepare(`${SELECT_RECIPIENT} WHERE r.assignment_id = ? ORDER BY u.display_name COLLATE NOCASE`).all(assignmentId) as RecipientRow[]).map(
    toRecipient,
  );
}

const DONE: RecipientStatus[] = ["submitted", "completed", "reviewed"];

export function isOverdue(assignment: Pick<AssignmentRecord, "dueAt">, status: RecipientStatus, at = now()): boolean {
  return assignment.dueAt !== null && assignment.dueAt < at && !DONE.includes(status);
}

export function listAssignmentsForTeacher(teacherId: string, includeArchived = false) {
  const rows = getDb()
    .prepare(`${SELECT_ASSIGNMENT} WHERE a.teacher_id = ? ${includeArchived ? "" : "AND a.archived = 0"} ORDER BY COALESCE(a.due_at, a.created_at) DESC`)
    .all(teacherId) as AssignmentRow[];
  return rows.map((row) => {
    const assignment = toAssignment(row);
    const recipients = listRecipients(assignment.id);
    return {
      ...assignment,
      total: recipients.length,
      done: recipients.filter((r) => DONE.includes(r.status)).length,
      toReview: recipients.filter((r) => r.status === "submitted").length,
      overdue: recipients.filter((r) => isOverdue(assignment, r.status)).length,
    };
  });
}

export function getAssignmentForTeacher(id: string, user: CurrentUser) {
  const assignment = requireOwn(id, user);
  return { assignment, recipients: listRecipients(id) };
}

export function listAssignmentsForStudent(studentId: string) {
  const rows = getDb()
    .prepare(
      `${SELECT_ASSIGNMENT} JOIN assignment_recipients r ON r.assignment_id = a.id
        WHERE r.student_id = ? AND a.archived = 0 ORDER BY (a.due_at IS NULL), a.due_at, a.created_at DESC`,
    )
    .all(studentId) as AssignmentRow[];
  const getRecipient = getDb().prepare(`${SELECT_RECIPIENT} WHERE r.assignment_id = ? AND r.student_id = ?`);
  return rows.map((row) => {
    const assignment = toAssignment(row);
    const recipient = toRecipient(getRecipient.get(assignment.id, studentId) as RecipientRow);
    return { ...assignment, recipient, overdue: isOverdue(assignment, recipient.status) };
  });
}

export function getAssignmentForStudent(id: string, studentId: string) {
  const assignment = getAssignment(id);
  const row = getDb().prepare(`${SELECT_RECIPIENT} WHERE r.assignment_id = ? AND r.student_id = ?`).get(id, studentId) as RecipientRow | undefined;
  if (!assignment || !row || assignment.archived) throw new ApiError(404, "not_found");
  const recipient = toRecipient(row);
  return { assignment, recipient, overdue: isOverdue(assignment, recipient.status) };
}

/** Open assignments of a kind for a student (used by labs to offer "hand in to…"). */
export function openAssignmentsFor(studentId: string, kind: AssignmentKind, refId?: string | null) {
  return listAssignmentsForStudent(studentId).filter(
    (a) => a.kind === kind && (refId === undefined || a.refId === null || a.refId === refId) && a.recipient.status !== "reviewed",
  );
}

function updateRecipient(assignmentId: string, studentId: string, patch: Partial<{ status: RecipientStatus; workRef: string | null; score: number | null; maxScore: number | null; response: WorkResponse; submittedAt: number | null }>) {
  const sets: string[] = [];
  const params: unknown[] = [];
  const map: Record<string, string> = { status: "status", workRef: "work_ref", score: "score", maxScore: "max_score", submittedAt: "submitted_at" };
  for (const [key, column] of Object.entries(map)) {
    if (key in patch) {
      sets.push(`${column} = ?`);
      params.push((patch as Record<string, unknown>)[key]);
    }
  }
  if (patch.response) {
    sets.push("response = ?");
    params.push(JSON.stringify(patch.response));
  }
  sets.push("updated_at = ?");
  params.push(now(), assignmentId, studentId);
  getDb().prepare(`UPDATE assignment_recipients SET ${sets.join(", ")} WHERE assignment_id = ? AND student_id = ?`).run(...params);
}

/**
 * Called by the labs whenever a student makes progress on an item. Finds the
 * student's active assignments for that item and moves them forward — never
 * backwards (a reviewed assignment stays reviewed; a best score is kept).
 */
export function recordLabProgress(
  studentId: string,
  kind: AssignmentKind,
  refId: string | null,
  progress: { status: "in_progress" | "completed" | "submitted"; workRef?: string | null; score?: number | null; maxScore?: number | null },
): number {
  const rows = getDb()
    .prepare(
      `SELECT r.*, '' AS student_name, a.kind, a.ref_id FROM assignment_recipients r JOIN assignments a ON a.id = r.assignment_id
        WHERE r.student_id = ? AND a.kind = ? AND a.archived = 0 AND (a.ref_id IS ? OR a.ref_id = ? OR a.ref_id IS NULL)`,
    )
    .all(studentId, kind, refId, refId) as (RecipientRow & { kind: string; ref_id: string | null })[];
  let changed = 0;
  for (const row of rows) {
    if (row.ref_id !== null && row.ref_id !== refId) continue;
    const current = row.status;
    if (current === "reviewed") continue;
    const patch: Parameters<typeof updateRecipient>[2] = {};
    if (progress.status === "in_progress") {
      if (current !== "assigned") continue;
      patch.status = "in_progress";
    } else {
      patch.status = progress.status;
      patch.submittedAt = now();
    }
    if (progress.workRef !== undefined) patch.workRef = progress.workRef;
    if (progress.score !== undefined && progress.score !== null) {
      const better = row.score === null || (progress.maxScore ? progress.score / progress.maxScore : 0) >= (row.max_score ? row.score / row.max_score : 0);
      if (better) {
        patch.score = progress.score;
        patch.maxScore = progress.maxScore ?? null;
      } else if (current === "completed") {
        continue;
      }
    }
    updateRecipient(row.assignment_id, studentId, patch);
    changed += 1;
  }
  return changed;
}

/** A student hands in their own work (a project, portfolio item or a written answer). */
export function submitWork(assignmentId: string, student: CurrentUser, input: { workRef?: string | null; response?: Partial<WorkResponse> }) {
  const { assignment, recipient } = getAssignmentForStudent(assignmentId, student.id);
  if (recipient.status === "reviewed") throw new ApiError(409, "conflict", "This work has already been reviewed.");
  if (AUTO_CHECKED_KINDS.includes(assignment.kind)) throw new ApiError(400, "invalid_input", "This assignment is checked automatically in the lab.");
  const response = responseSchema.parse({ ...recipient.response, ...input.response });
  if (OPEN_WORK_KINDS.includes(assignment.kind) && assignment.kind !== "custom" && !input.workRef && !recipient.workRef) {
    throw new ApiError(400, "invalid_input", "Choose which of your works to hand in.");
  }
  if (assignment.kind === "custom" && !response.text && !response.link) throw new ApiError(400, "invalid_input", "Write an answer or add a link.");
  updateRecipient(assignmentId, student.id, {
    status: "submitted",
    workRef: input.workRef ?? recipient.workRef,
    response,
    submittedAt: now(),
  });
  return getAssignmentForStudent(assignmentId, student.id);
}

/** Marks an assignment as started when the student opens it. */
export function markStarted(assignmentId: string, studentId: string): void {
  getDb()
    .prepare("UPDATE assignment_recipients SET status = 'in_progress', updated_at = ? WHERE assignment_id = ? AND student_id = ? AND status = 'assigned'")
    .run(now(), assignmentId, studentId);
}

export const reviewSchema = z.object({
  feedback: z.string().trim().max(4000).default(""),
  status: z.enum(["reviewed", "revision"]),
});

export function reviewWork(assignmentId: string, studentId: string, teacher: CurrentUser, input: z.infer<typeof reviewSchema>) {
  requireOwn(assignmentId, teacher);
  const parsed = reviewSchema.parse(input);
  const exists = getDb().prepare("SELECT 1 FROM assignment_recipients WHERE assignment_id = ? AND student_id = ?").get(assignmentId, studentId);
  if (!exists) throw new ApiError(404, "not_found");
  getDb()
    .prepare("UPDATE assignment_recipients SET status = ?, feedback = ?, feedback_by = ?, feedback_at = ?, updated_at = ? WHERE assignment_id = ? AND student_id = ?")
    .run(parsed.status, parsed.feedback, teacher.id, now(), now(), assignmentId, studentId);
  return listRecipients(assignmentId).find((r) => r.studentId === studentId)!;
}

export function updateAssignment(id: string, user: CurrentUser, patch: { title?: string; instructions?: string; dueAt?: number | null; archived?: boolean }) {
  requireOwn(id, user);
  const current = getAssignment(id)!;
  getDb()
    .prepare("UPDATE assignments SET title = ?, instructions = ?, due_at = ?, archived = ? WHERE id = ?")
    .run(
      (patch.title ?? current.title).trim().slice(0, 160) || current.title,
      (patch.instructions ?? current.instructions).slice(0, 4000),
      patch.dueAt === undefined ? current.dueAt : patch.dueAt,
      (patch.archived ?? current.archived) ? 1 : 0,
      id,
    );
  return getAssignment(id)!;
}

export function deleteAssignment(id: string, user: CurrentUser): void {
  requireOwn(id, user);
  getDb().prepare("DELETE FROM assignments WHERE id = ?").run(id);
}

/**
 * When an assignment is created after the student already did the work
 * (e.g. solved the problem last week), count it straight away.
 */
function backfillFromExistingWork(assignmentId: string, kind: AssignmentKind, refId: string | null, studentId: string): void {
  if (!refId) return;
  const db = getDb();
  let done: { score?: number; max?: number; workRef?: string } | null = null;
  if (kind === "programming") {
    const row = db
      .prepare("SELECT id FROM programming_submissions WHERE user_id = ? AND problem_id = ? AND verdict IN ('accepted','correct') ORDER BY created_at DESC LIMIT 1")
      .get(studentId, refId) as { id: string } | undefined;
    if (row) done = { workRef: row.id, score: 1, max: 1 };
  } else if (kind === "critical") {
    const row = db
      .prepare("SELECT id, score, max_score FROM ct_attempts WHERE user_id = ? AND exercise_id = ? ORDER BY CAST(score AS REAL) / MAX(max_score, 1) DESC LIMIT 1")
      .get(studentId, refId) as { id: string; score: number; max_score: number } | undefined;
    if (row) done = { workRef: row.id, score: row.score, max: row.max_score };
  } else if (kind === "quiz") {
    const row = db
      .prepare("SELECT id, score, max_score FROM quiz_attempts WHERE student_id = ? AND quiz_id = ? ORDER BY CAST(score AS REAL) / MAX(max_score, 1) DESC LIMIT 1")
      .get(studentId, refId) as { id: string; score: number; max_score: number } | undefined;
    if (row) done = { workRef: row.id, score: row.score, max: row.max_score };
  } else if (kind === "simulation" || kind === "stem_challenge") {
    const row = db
      .prepare("SELECT id, score, max_score FROM stem_records WHERE user_id = ? AND item_kind = ? AND item_id = ?")
      .get(studentId, kind === "simulation" ? "simulation" : "challenge", refId) as { id: string; score: number | null; max_score: number | null } | undefined;
    if (row) done = { workRef: row.id, score: row.score ?? undefined, max: row.max_score ?? undefined };
  } else if (kind === "library") {
    const row = db.prepare("SELECT 1 FROM reading_progress WHERE user_id = ? AND resource_id = ? AND status = 'finished'").get(studentId, refId);
    if (row) done = { workRef: refId };
  }
  if (done) {
    updateRecipient(assignmentId, studentId, { status: "completed", workRef: done.workRef ?? null, score: done.score ?? null, maxScore: done.max ?? null, submittedAt: now() });
  }
}

/** Work status across all of a student's assignments (for profiles and dashboards). */
export function assignmentStats(studentId: string) {
  const list = listAssignmentsForStudent(studentId);
  return {
    total: list.length,
    done: list.filter((a) => DONE.includes(a.recipient.status)).length,
    overdue: list.filter((a) => a.overdue).length,
    toDo: list.filter((a) => !DONE.includes(a.recipient.status)).length,
  };
}
