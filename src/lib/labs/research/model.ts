import { z } from "zod";

/*
 * Research Lab data model. Sources are only ever entered by people (or
 * copied from the school library catalogue) — the platform never invents
 * a source, a quotation or a citation.
 */

export const RESEARCH_STEPS = ["question", "hypothesis", "sources", "notes", "evidence", "data", "analysis", "findings", "conclusion", "presentation"] as const;
export type ResearchStep = (typeof RESEARCH_STEPS)[number];

export const QUESTION_TYPES = ["descriptive", "comparative", "causal", "evaluative"] as const;

export const projectDataSchema = z.object({
  topic: z.string().max(300).default(""),
  question: z.string().max(600).default(""),
  questionType: z.enum(QUESTION_TYPES).default("descriptive"),
  why: z.string().max(3000).default(""),
  scope: z.string().max(1000).default(""),
  subQuestions: z.array(z.string().max(400)).max(6).default([]),
  hypothesis: z.string().max(2000).default(""),
  independent: z.string().max(300).default(""),
  dependent: z.string().max(300).default(""),
  controlled: z.string().max(600).default(""),
  method: z.string().max(4000).default(""),
  analysis: z.string().max(6000).default(""),
  findings: z.array(z.string().max(1000)).max(8).default([]),
  conclusion: z.string().max(6000).default(""),
  limitations: z.string().max(3000).default(""),
  nextSteps: z.string().max(3000).default(""),
  audience: z.string().max(300).default(""),
  keyMessage: z.string().max(600).default(""),
});
export type ResearchProjectData = z.infer<typeof projectDataSchema>;

export const SOURCE_TYPES = ["book", "article", "website", "report", "interview", "dataset", "video", "other"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

const yesNo = z.enum(["yes", "no", "unsure"]).default("unsure");

export const sourceSchema = z.object({
  type: z.enum(SOURCE_TYPES).default("website"),
  title: z.string().trim().min(1).max(300),
  authors: z.string().trim().max(300).default(""),
  organisation: z.string().trim().max(200).default(""),
  year: z.string().trim().max(20).default(""),
  publisher: z.string().trim().max(200).default(""),
  url: z
    .string()
    .trim()
    .max(600)
    .default("")
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "Links must start with http:// or https://"),
  accessed: z.string().trim().max(20).default(""),
  primary: z.enum(["primary", "secondary", "unsure"]).default("unsure"),
  /** Source-quality checklist, answered by the student. */
  authorKnown: yesNo,
  recent: yesNo,
  evidenceShown: yesNo,
  balanced: yesNo,
  corroborated: yesNo,
  libraryResourceId: z.string().max(40).nullable().default(null),
  notes: z.string().max(2000).default(""),
});
export type SourceInput = z.infer<typeof sourceSchema>;

export const NOTE_KINDS = ["note", "quote", "evidence"] as const;
export const STANCES = ["supports", "contradicts", "neutral"] as const;

export const noteSchema = z.object({
  kind: z.enum(NOTE_KINDS),
  content: z.string().trim().min(1).max(4000),
  sourceId: z.string().max(40).nullable().default(null),
  page: z.string().trim().max(40).default(""),
  stance: z.enum(STANCES).nullable().default(null),
});
export type NoteInput = z.infer<typeof noteSchema>;

export const datasetSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(""),
  collection: z.string().max(2000).default(""),
  columns: z.array(z.object({ name: z.string().trim().min(1).max(80), type: z.enum(["number", "text"]) })).min(1).max(12),
  rows: z.array(z.array(z.string().max(200)).max(12)).max(500),
});
export type DatasetInput = z.infer<typeof datasetSchema>;
