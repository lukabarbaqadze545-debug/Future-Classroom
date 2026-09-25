import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { ApiError } from "@/lib/http/errors";
import { requireApiUser } from "@/lib/auth/session";
import { getProblemOrThrow } from "@/lib/labs/programming/service";

const schema = z.object({ problemId: z.string().max(40), index: z.number().int().min(0).max(10) });

/** Hints are revealed one at a time, so they are never part of the page data. */
export const POST = handler(async (req) => {
  await requireApiUser();
  const { problemId, index } = await readJson(req, schema);
  const problem = getProblemOrThrow(problemId);
  const hint = problem.hints[index];
  if (!hint) throw new ApiError(404, "not_found");
  return json({ hint, total: problem.hints.length });
});
