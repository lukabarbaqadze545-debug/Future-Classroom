import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser, STAFF_ROLES } from "@/lib/auth/session";
import { sendMessage, sendToPage, setLocked } from "@/lib/services/classroom";

const students = z.array(z.string().max(40)).min(1).max(100).nullable().default(null);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("lock"), studentIds: students, message: z.string().max(200).default("") }),
  z.object({ action: z.literal("unlock"), studentIds: students }),
  z.object({ action: z.literal("open"), studentIds: students, path: z.string().min(1).max(300) }),
  z.object({ action: z.literal("message"), studentIds: students, text: z.string().min(1).max(500) }),
]);

/** Lock or unlock screens, send students to a page, or send a message — to the class or chosen students. */
export const POST = handler(async (req, { params }: { params: Promise<{ classId: string }> }) => {
  const user = await requireApiUser(STAFF_ROLES);
  const { classId } = await params;
  const body = await readJson(req, schema);
  const count =
    body.action === "lock" || body.action === "unlock"
      ? setLocked(classId, user, body.studentIds, body.action === "lock", body.action === "lock" ? body.message : "")
      : body.action === "open"
        ? sendToPage(classId, user, body.studentIds, body.path)
        : sendMessage(classId, user, body.studentIds, body.text);
  return json({ count });
});
