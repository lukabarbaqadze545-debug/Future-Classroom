import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { requireApiUser } from "@/lib/auth/session";
import { saveExperimentRecord } from "@/lib/labs/stem/service";
import { findExperiment } from "@/lib/labs/stem/experiments";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ data: z.unknown(), submit: z.boolean().default(false) });

/** Saves (or submits) a student's experiment record: prediction, data table, observations, reflection. */
export const POST = handler(async (req, { params }: Ctx) => {
  const user = await requireApiUser();
  const { data, submit } = await readJson(req, schema);
  const { id } = await params;
  const record = saveExperimentRecord(user, id, data, submit);
  // Expected results are revealed once the student's own record is submitted.
  return json({ record, expected: record.status === "submitted" ? (findExperiment(id)?.expected ?? null) : null });
});
