import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { rateLimit } from "@/lib/http/rate-limit";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { addClassMembers, getClassForTeacher } from "@/lib/services/classes";
import { createStudentAccounts } from "@/lib/services/accounts";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  studentIds: z.array(z.string().max(40)).max(200).default([]),
  /** Names of students who have no account yet: accounts are created with temporary passwords. */
  newStudents: z.array(z.string().trim().min(1).max(40)).max(60).default([]),
});

export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { id } = await params;
  getClassForTeacher(id, user);
  const input = await readJson(req, schema);
  if (input.newStudents.length) rateLimit(`accounts:${user.id}`, 200, 60 * 60_000, input.newStudents.length);
  const created = createStudentAccounts(input.newStudents);
  const cls = addClassMembers(id, user, [...input.studentIds, ...created.map((c) => c.id)]);
  return json({ class: cls, created }, { status: 201 });
});
