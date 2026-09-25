import { en, type Dictionary } from "./en";
import { ka } from "./ka";

export const LOCALES = ["en", "ka"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "fc_locale";

export const dictionaries: Record<Locale, Dictionary> = { en, ka };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ka";
}

/** Replaces {placeholders} in a translated string. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** A count-dependent string, e.g. { one: "{n} student", other: "{n} students" }. */
export type Plural = { one: string; other: string };

/** Picks the singular or plural form and fills in {n}. */
export function fmtCount(entry: Plural, n: number, extra: Record<string, string | number> = {}): string {
  return fmt(n === 1 ? entry.one : entry.other, { n, ...extra });
}

/** "3 days ago" style labels from a timestamp. */
export function relativeTime(dict: Dictionary, timestamp: number, nowMs = Date.now()): string {
  const diff = Math.max(0, nowMs - timestamp);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return dict.common.justNow;
  if (minutes < 60) return fmt(dict.common.minutesAgo, { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return fmt(dict.common.hoursAgo, { n: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return dict.common.yesterday;
  return fmt(dict.common.daysAgo, { n: days });
}

export function formatDate(locale: Locale, timestamp: number): string {
  return new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(timestamp);
}

export function formatDateTime(locale: Locale, timestamp: number): string {
  return new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}
