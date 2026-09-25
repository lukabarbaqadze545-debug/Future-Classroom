import { cookies } from "next/headers";
import { z } from "zod";
import { handler, json, readJson } from "@/lib/http/api";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

export const POST = handler(async (req) => {
  const { locale } = await readJson(req, z.object({ locale: z.enum(["en", "ka"]) }));
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return json({ locale });
});
