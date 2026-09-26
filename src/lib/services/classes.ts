import "server-only";
import { getDb, now } from "@/lib/db";
import { newId } from "@/lib/domain/ids";
import { ApiError } from "@/lib/http/errors";
import type { CurrentUser } from "@/lib/auth/session";

export interface ClassRecord {
  id: string;
  teacherId: string;
  name: string;
  createdAt: number;
  members: { id: string; displayName: string; username: string }[];
}

export interface StudentSummary {
  id: string;
  displayName: string;
  username: string;
}

/** All student accounts (teachers pick class members from this list). */
export function listStudents(): StudentSummary[] {
  return getDb()
    .prepare("SELECT id, display_name AS displayName, username FROM users WHERE role = 'student' ORDER BY display_name COLLATE NOCASE")
    .all() as StudentSummary[];
}

export function getStudent(id: string): StudentSummary | null {
  return (
    (getDb().prepare("SELECT id, display_name AS displayName, username FROM users WHERE id = ? AND role = 'student'").get(id) as
      | StudentSummary
      | undefined) ?? null
  );
}

function membersOf(classId: string) {
  return getDb()
    .prepare(
      `SELECT u.id, u.display_name AS displayName, u.username FROM class_members m JOIN users u ON u.id = m.student_id
        WHERE m.class_id = ? ORDER BY u.display_name COLLATE NOCASE`,
    )
    .all(classId) as ClassRecord["members"];
}

export function listClassesForTeacher(teacherId: string): ClassRecord[] {
  const rows = getDb().prepare("SELECT id, teacher_id, name, created_at FROM classes WHERE teacher_id = ? ORDER BY name COLLATE NOCASE").all(teacherId) as {
    id: string;
    teacher_id: string;
    name: string;
    created_at: number;
  }[];
  return rows.map((r) => ({ id: r.id, teacherId: r.teacher_id, name: r.name, createdAt: r.created_at, members: membersOf(r.id) }));
}

export function getClassForTeacher(id: string, user: CurrentUser): ClassRecord {
  const row = getDb().prepare("SELECT id, teacher_id, name, created_at FROM classes WHERE id = ?").get(id) as
    | { id: string; teacher_id: string; name: string; created_at: number }
    | undefined;
  if (!row) throw new ApiError(404, "not_found");
  if (row.teacher_id !== user.id && user.role !== "admin") throw new ApiError(403, "forbidden");
  return { id: row.id, teacherId: row.teacher_id, name: row.name, createdAt: row.created_at, members: membersOf(row.id) };
}

export function createClass(user: CurrentUser, name: string, studentIds: string[] = [], id = newId()): ClassRecord {
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new ApiError(400, "invalid_input");
  getDb().prepare("INSERT INTO classes (id, teacher_id, name, created_at) VALUES (?, ?, ?, ?)").run(id, user.id, clean, now());
  setClassMembers(id, user, studentIds);
  return getClassForTeacher(id, user);
}

export function renameClass(id: string, user: CurrentUser, name: string): ClassRecord {
  getClassForTeacher(id, user);
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new ApiError(400, "invalid_input");
  getDb().prepare("UPDATE classes SET name = ? WHERE id = ?").run(clean, id);
  return getClassForTeacher(id, user);
}

export function setClassMembers(id: string, user: CurrentUser, studentIds: string[]): ClassRecord {
  getClassForTeacher(id, user);
  const db = getDb();
  const insert = db.prepare("INSERT OR IGNORE INTO class_members (class_id, student_id) SELECT ?, id FROM users WHERE id = ? AND role = 'student'");
  db.transaction(() => {
    db.prepare("DELETE FROM class_members WHERE class_id = ?").run(id);
    for (const studentId of new Set(studentIds)) insert.run(id, studentId);
  })();
  return getClassForTeacher(id, user);
}

export function deleteClass(id: string, user: CurrentUser): void {
  getClassForTeacher(id, user);
  getDb().prepare("DELETE FROM classes WHERE id = ?").run(id);
}

/** Classes a student belongs to, with the teacher's name. */
export function listClassesForStudent(studentId: string) {
  return getDb()
    .prepare(
      `SELECT c.id, c.name, u.display_name AS teacherName FROM class_members m JOIN classes c ON c.id = m.class_id
         JOIN users u ON u.id = c.teacher_id WHERE m.student_id = ? ORDER BY c.name COLLATE NOCASE`,
    )
    .all(studentId) as { id: string; name: string; teacherName: string }[];
}

/** Students a teacher works with: members of their classes plus everyone they assigned work to. */
export function listStudentsForTeacher(teacherId: string): StudentSummary[] {
  return getDb()
    .prepare(
      `SELECT DISTINCT u.id, u.display_name AS displayName, u.username FROM users u
        WHERE u.role = 'student' AND (
          u.id IN (SELECT m.student_id FROM class_members m JOIN classes c ON c.id = m.class_id WHERE c.teacher_id = ?)
          OR u.id IN (SELECT r.student_id FROM assignment_recipients r JOIN assignments a ON a.id = r.assignment_id WHERE a.teacher_id = ?)
        ) ORDER BY u.display_name COLLATE NOCASE`,
    )
    .all(teacherId, teacherId) as StudentSummary[];
}

/** Adds students to a class without touching the other members. */
export function addClassMembers(id: string, user: CurrentUser, studentIds: string[]): ClassRecord {
  getClassForTeacher(id, user);
  const insert = getDb().prepare("INSERT OR IGNORE INTO class_members (class_id, student_id) SELECT ?, id FROM users WHERE id = ? AND role = 'student'");
  getDb().transaction(() => {
    for (const studentId of new Set(studentIds)) insert.run(id, studentId);
  })();
  return getClassForTeacher(id, user);
}

export function removeClassMember(id: string, user: CurrentUser, studentId: string): ClassRecord {
  getClassForTeacher(id, user);
  getDb().prepare("DELETE FROM class_members WHERE class_id = ? AND student_id = ?").run(id, studentId);
  return getClassForTeacher(id, user);
}

/** Whether a teacher works with this student (one of their classes, or work they assigned). */
export function teacherHasStudent(teacherId: string, studentId: string): boolean {
  return Boolean(
    getDb()
      .prepare(
        `SELECT 1 FROM class_members m JOIN classes c ON c.id = m.class_id WHERE c.teacher_id = ? AND m.student_id = ?
          UNION SELECT 1 FROM assignment_recipients r JOIN assignments a ON a.id = r.assignment_id WHERE a.teacher_id = ? AND r.student_id = ?
          LIMIT 1`,
      )
      .get(teacherId, studentId, teacherId, studentId),
  );
}

/** Staff may open a student's profile when they teach the student; administrators always. */
export function canViewStudent(user: CurrentUser, studentId: string): boolean {
  if (user.role === "admin") return true;
  if (user.role === "teacher") return teacherHasStudent(user.id, studentId);
  return user.id === studentId;
}

/** Owners see their own work; teachers see the work of students they teach; administrators see all. */
export function canViewWork(viewer: CurrentUser, ownerId: string): boolean {
  return ownerId === viewer.id || canViewStudent(viewer, ownerId);
}

export interface ClassProgressRow {
  id: string;
  displayName: string;
  username: string;
  assignmentsDone: number;
  assignmentsTotal: number;
  overdue: number;
  toReview: number;
  sessionsAttended: number;
  sessionAnswers: number;
  sessionCorrect: number;
  sessionGraded: number;
  quizAveragePercent: number | null;
  lastActiveAt: number | null;
}

/**
 * The class at a glance: per student, the teacher's assignments, the live
 * lessons run for this class and quiz results. Everything is read from
 * stored records; nothing is estimated.
 */
export function classProgress(id: string, user: CurrentUser) {
  const cls = getClassForTeacher(id, user);
  const db = getDb();
  const timestamp = now();
  const sessions = db
    .prepare(
      `SELECT s.id, s.title, s.status, s.created_at, s.started_at, s.ended_at,
              (SELECT COUNT(*) FROM session_activities a WHERE a.session_id = s.id AND a.launched_at IS NOT NULL) AS launched
         FROM classroom_sessions s WHERE s.class_id = ? ORDER BY s.created_at DESC`,
    )
    .all(id) as { id: string; title: string; status: string; created_at: number; started_at: number | null; ended_at: number | null; launched: number }[];
  const assignments = db
    .prepare(
      `SELECT a.id, a.title, a.kind, a.due_at, a.created_at,
              (SELECT COUNT(*) FROM assignment_recipients r WHERE r.assignment_id = a.id) AS total,
              (SELECT COUNT(*) FROM assignment_recipients r WHERE r.assignment_id = a.id AND r.status IN ('submitted','completed','reviewed')) AS done
         FROM assignments a WHERE a.class_id = ? AND a.archived = 0 ORDER BY a.created_at DESC`,
    )
    .all(id) as { id: string; title: string; kind: string; due_at: number | null; created_at: number; total: number; done: number }[];

  const recipientRows = db.prepare(
    `SELECT r.status, a.due_at FROM assignment_recipients r JOIN assignments a ON a.id = r.assignment_id
      WHERE a.teacher_id = ? AND a.archived = 0 AND r.student_id = ?`,
  );
  const sessionRows = db.prepare(
    `SELECT p.session_id, r.id AS response_id, r.is_correct FROM session_participants p
       JOIN classroom_sessions s ON s.id = p.session_id
       LEFT JOIN responses r ON r.participant_id = p.id
      WHERE s.class_id = ? AND p.user_id = ?`,
  );
  const quizRow = db.prepare("SELECT AVG(CAST(score AS REAL) / NULLIF(max_score, 0)) AS avg FROM quiz_attempts WHERE student_id = ?");
  const lastActive = db.prepare("SELECT MAX(created_at) AS at FROM learning_events WHERE user_id = ?");

  const students: ClassProgressRow[] = cls.members.map((m) => {
    const recipients = recipientRows.all(user.role === "admin" ? cls.teacherId : user.id, m.id) as { status: string; due_at: number | null }[];
    const rows = sessionRows.all(id, m.id) as { session_id: string; response_id: string | null; is_correct: number | null }[];
    const answers = rows.filter((a) => a.response_id !== null);
    const graded = answers.filter((a) => a.is_correct !== null);
    const quiz = quizRow.get(m.id) as { avg: number | null };
    return {
      id: m.id,
      displayName: m.displayName,
      username: m.username,
      assignmentsTotal: recipients.length,
      assignmentsDone: recipients.filter((r) => ["submitted", "completed", "reviewed"].includes(r.status)).length,
      toReview: recipients.filter((r) => r.status === "submitted").length,
      overdue: recipients.filter((r) => r.due_at !== null && r.due_at < timestamp && ["assigned", "in_progress", "revision"].includes(r.status)).length,
      sessionsAttended: new Set(rows.map((a) => a.session_id)).size,
      sessionAnswers: answers.length,
      sessionGraded: graded.length,
      sessionCorrect: graded.filter((a) => a.is_correct === 1).length,
      quizAveragePercent: quiz.avg === null ? null : Math.round(quiz.avg * 100),
      lastActiveAt: (lastActive.get(m.id) as { at: number | null }).at,
    };
  });
  return { class: cls, students, sessions, assignments };
}
