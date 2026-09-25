import { z } from "zod";
import { SUBJECTS } from "@/lib/domain/catalog";

/*
 * School Library catalogue. Every digital version is legitimate: created by
 * the school, in the public domain, openly licensed, provided with
 * permission, or an external link to the publisher's own free copy.
 */

export const LIBRARY_KINDS = ["book", "textbook", "guide", "worksheet", "reference", "website", "video"] as const;
export const LIBRARY_CATEGORIES = ["science", "mathematics", "computing", "languages", "literature", "history", "arts", "careers", "reference"] as const;
export const LIBRARY_LANGUAGES = ["ka", "en", "ru", "other"] as const;
export const LICENSES = ["school", "public_domain", "cc_by", "cc_by_sa", "cc_by_nc", "cc_by_nc_sa", "permission", "link_only", "physical_only"] as const;
export type LibraryLicense = (typeof LICENSES)[number];

const localized = z.object({ en: z.string().max(4000), ka: z.string().max(4000) });
const url = z
  .string()
  .trim()
  .max(600)
  .default("")
  .refine((v) => v === "" || /^https:\/\//i.test(v), "Links must start with https://");

export const ACTIVITY_LINK_KINDS = ["programming", "critical", "experiment", "simulation", "challenge", "research"] as const;

export const resourceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  authors: z.string().trim().max(300).default(""),
  kind: z.enum(LIBRARY_KINDS).default("book"),
  categories: z.array(z.enum(LIBRARY_CATEGORIES)).max(4).default([]),
  subjects: z.array(z.enum(SUBJECTS)).max(4).default([]),
  gradeFrom: z.number().int().min(1).max(12).nullable().default(null),
  gradeTo: z.number().int().min(1).max(12).nullable().default(null),
  language: z.enum(LIBRARY_LANGUAGES).default("ka"),
  description: localized,
  year: z.string().trim().max(20).default(""),
  publisher: z.string().trim().max(200).default(""),
  isbn: z.string().trim().max(20).default(""),
  license: z.enum(LICENSES).default("physical_only"),
  licenseNote: z.string().trim().max(400).default(""),
  digitalUrl: url,
  supplementary: z.array(z.object({ title: z.string().trim().min(1).max(200), url })).max(8).default([]),
  exercises: z.array(z.object({ kind: z.enum(ACTIVITY_LINK_KINDS), id: z.string().max(40) })).max(8).default([]),
});
export type ResourceInput = z.infer<typeof resourceSchema>;

export const COPY_STATUSES = ["available", "on_loan", "reference", "missing"] as const;
export type CopyStatus = (typeof COPY_STATUSES)[number];

export const READING_STATUSES = ["want", "reading", "finished"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];
