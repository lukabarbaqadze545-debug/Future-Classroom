import type { Locale } from "@/lib/i18n/config";

/**
 * Built-in laboratory content is written in both languages side by side, so
 * a translation can never silently go missing (the type requires both).
 */
export type L = { en: string; ka: string };

export function l(en: string, ka: string): L {
  return { en, ka };
}

export function tr(value: L | string, locale: Locale): string {
  return typeof value === "string" ? value : value[locale] || value.en;
}

/** Teacher-written content is single-language; store it for both locales. */
export function same(text: string): L {
  return { en: text, ka: text };
}
