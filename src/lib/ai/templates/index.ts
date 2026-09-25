import type { LessonContent } from "@/lib/domain/schemas";
import type { ContentLanguage, Subject } from "@/lib/domain/catalog";
import { discussion, exitTicket, section, shortAnswer } from "./builders";
import { quadraticEn } from "./quadratic-en";
import { quadraticKa } from "./quadratic-ka";
import { ecosystemsEn, newtonEn } from "./science-en";
import { algorithmsEn, mapReadingEn } from "./other-en";
import type { CuratedLesson } from "./types";

export type { CuratedLesson } from "./types";

export const CURATED_LESSONS: CuratedLesson[] = [quadraticEn, quadraticKa, newtonEn, algorithmsEn, ecosystemsEn, mapReadingEn];

/**
 * Finds a hand-written lesson for the requested topic. Prefers the requested
 * language and subject; returns null when nothing matches.
 */
export function findCuratedLesson(topic: string, subject: Subject, language: ContentLanguage): CuratedLesson | null {
  const candidates = CURATED_LESSONS.filter((lesson) => lesson.subject === subject && lesson.match.test(topic));
  return candidates.find((lesson) => lesson.language === language) ?? null;
}

export function curatedTopicsFor(language: ContentLanguage): { subject: Subject; title: string }[] {
  return CURATED_LESSONS.filter((l) => l.language === language).map((l) => ({ subject: l.subject, title: l.title }));
}

/**
 * A structured outline for topics without a built-in lesson. Every text is an
 * instruction to the teacher, never invented subject content.
 */
export function buildOutline(input: {
  topic: string;
  durationMin: number;
  objective: string;
  language: ContentLanguage;
}): LessonContent {
  const { topic, language } = input;
  const minutes = (share: number) => Math.max(3, Math.round(input.durationMin * share));
  if (language === "ka") {
    return {
      objectives: [input.objective || `მოსწავლეებს შეუძლიათ ახსნან თემის „${topic}“ ძირითადი იდეა.`, "ჩაწერეთ მეორე, გაზომვადი მიზანი."],
      sections: [
        section("s1", "introduction", "შესავალი და მოტივაცია", minutes(0.1), `დაიწყეთ კითხვით ან მაგალითით, რომელიც თემას „${topic}“ მოსწავლეების ყოველდღიურ ცხოვრებასთან აკავშირებს.`),
        section("s2", "explanation", "ძირითადი ახსნა", minutes(0.3), `ჩაწერეთ თემის „${topic}“ მთავარი ცნებები, განმარტებები და ერთი მარტივი მაგალითი. შეამოწმეთ ფაქტები სახელმძღვანელოსთან.`),
        section("s3", "example", "ამოხსნილი მაგალითი", minutes(0.2), "დაამატეთ ნაბიჯ-ნაბიჯ ამოხსნილი მაგალითი, რომელსაც კლასთან ერთად განიხილავთ."),
        section("s4", "practice", "პრაქტიკა", minutes(0.3), "მოსწავლეები ასრულებენ ქვემოთ მოცემულ აქტივობებს. მოამზადეთ მინიშნებები თითოეულისთვის."),
        section("s5", "summary", "შეჯამება", minutes(0.1), "სამი მთავარი დასკვნა, რომელიც მოსწავლეებმა უნდა დაიმახსოვრონ."),
      ],
      activities: [
        shortAnswer("a1", `ჩაწერეთ კითხვა, რომელიც ამოწმებს თემის „${topic}“ ძირითად ცნებას.`, [], { title: "გაგების შემოწმება" }),
        discussion("a2", `რატომ არის „${topic}“ მნიშვნელოვანი? მოიყვანეთ ერთი მაგალითი.`, { title: "დისკუსია" }),
        exitTicket("a3", "რა ისწავლე დღეს? რა დარჩა გაურკვეველი?", { title: "გასასვლელი ბარათი" }),
      ],
      discussionQuestions: [`სად ვხვდებით თემას „${topic}“ ყოველდღიურ ცხოვრებაში?`],
      assessment: ["განსაზღვრეთ, როგორ შეამოწმებთ, მიაღწიეს თუ არა მოსწავლეებმა მიზნებს."],
      homework: ["დაამატეთ საშინაო დავალება."],
      teacherNotes: "ეს არის სტრუქტურირებული მონახაზი, რომელიც ხელოვნური ინტელექტის გარეშე შეიქმნა. შეავსეთ შინაარსი თქვენი სახელმძღვანელოს მიხედვით.",
      sources: [],
    };
  }
  return {
    objectives: [input.objective || `Students can explain the key idea of ${topic}.`, "Add a second, measurable objective."],
    sections: [
      section("s1", "introduction", "Hook and prior knowledge", minutes(0.1), `Open with a question or example that connects ${topic} to students' everyday experience.`),
      section("s2", "explanation", "Core explanation", minutes(0.3), `Write the main concepts, definitions and one simple example for ${topic}. Check facts against the class textbook.`),
      section("s3", "example", "Worked example", minutes(0.2), "Add a step-by-step worked example to go through with the class."),
      section("s4", "practice", "Practice", minutes(0.3), "Students complete the activities below. Prepare hints for each one."),
      section("s5", "summary", "Summary", minutes(0.1), "List the three key takeaways students should remember."),
    ],
    activities: [
      shortAnswer("a1", `Write a question that checks the core idea of ${topic}.`, [], { title: "Check for understanding" }),
      discussion("a2", `Why does ${topic} matter? Give one example.`, { title: "Discussion" }),
      exitTicket("a3", "What did you learn today? What is still unclear?", { title: "Exit ticket" }),
    ],
    discussionQuestions: [`Where do we meet ${topic} in everyday life?`],
    assessment: ["Decide how you will check that students reached the objectives."],
    homework: ["Add a homework task."],
    teacherNotes: "This is a structured outline created without AI. Fill in the content from your textbook or curriculum.",
    sources: [],
  };
}
