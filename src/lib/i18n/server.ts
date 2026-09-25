import "server-only";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dictionaries, isLocale, type Locale } from "./config";
import type { Dictionary } from "./en";

/**
 * UI locale: the user's own choice (cookie) first, then the school's default
 * (DEFAULT_LANGUAGE), then whichever of Georgian and English the browser
 * lists first. Georgian is the fallback: the platform is built for Georgian
 * schools.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  const school = process.env.DEFAULT_LANGUAGE?.trim();
  if (isLocale(school)) return school;
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.split(";")[0].trim().toLowerCase().slice(0, 2);
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}

/** Metadata for a page whose browser-tab title comes from the dictionary. */
export async function pageTitle(pick: (pages: Dictionary["meta"]["pages"]) => string): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: pick(dict.meta.pages) };
}
