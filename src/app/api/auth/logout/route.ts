import { NextResponse } from "next/server";
import { handler } from "@/lib/http/api";
import { destroyAuthSession } from "@/lib/auth/session";

export const POST = handler(async (req) => {
  await destroyAuthSession();
  return NextResponse.redirect(new URL("/", req.url), 303);
});
