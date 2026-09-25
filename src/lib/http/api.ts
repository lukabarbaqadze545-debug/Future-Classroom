import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "./errors";

/**
 * Wraps a route handler with consistent error handling and a same-origin
 * check for state-changing requests (defence in depth on top of SameSite
 * cookies).
 */
export function handler<Ctx>(fn: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // Non-browser clients (tests, scripts) do not send Origin.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new ApiError(403, "bad_origin");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(403, "bad_origin");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_input",
          message: "Some fields are missing or invalid.",
          fields: error.issues.slice(0, 10).map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400 },
    );
  }
  console.error("[api] unexpected error", error);
  return NextResponse.json({ error: { code: "internal", message: "Something went wrong." } }, { status: 500 });
}

export async function readJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "invalid_input", "Request body must be JSON.");
  }
  return schema.parse(body);
}

export function json<T>(data: T, init?: ResponseInit): Response {
  return NextResponse.json(data, init);
}

export function clientKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
