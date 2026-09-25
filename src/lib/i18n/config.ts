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

/*
 * Dates are formatted with our own month names rather than Intl: browsers ship
 * different locale data (some have no Georgian at all), and a server/browser
 * difference would break hydration of client components.
 */
const MONTHS: Record<Locale, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ka: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "5 Sep 2026" / "5 სექ. 2026" */
export function formatDate(locale: Locale, timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getDate()} ${MONTHS[locale][d.getMonth()]}${locale === "ka" ? "." : ""} ${d.getFullYear()}`;
}

/** "5 Sep, 09:07" / "5 სექ, 09:07" */
export function formatDateTime(locale: Locale, timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getDate()} ${MONTHS[locale][d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
