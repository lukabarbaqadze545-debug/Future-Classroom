import { handler, json } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { copyCard } from "@/lib/labs/career/service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler(async (_req, { params }: Ctx) => {
  const user = await requireApiUser(["student"]);
  return json({ card: copyCard((await params).id, user) }, { status: 201 });
});
