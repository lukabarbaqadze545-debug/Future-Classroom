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
