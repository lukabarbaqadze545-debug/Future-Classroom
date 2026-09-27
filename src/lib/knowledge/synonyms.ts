import { contentTerms } from "./language";

/**
 * Bilingual school vocabulary: groups of words that mean the same thing.
 *
 * A Georgian question should find an English handout and the reverse, and
 * „binary search" should reach a Georgian text that only says „ორობითი
 * ძებნა". Stemming cannot do that; a stated equivalence can. Forms are
 * matched after stemming, so one form per inflection family is enough.
 *
 * Only true equivalents belong here. An association ("heat" and "entropy")
 * would pull in passages about something else.
 */
export const SYNONYM_GROUPS: string[][] = [
  // Physics
  ["force", "ძალა"],
  ["mass", "მასა"],
  ["acceleration", "აჩქარება"],
  ["velocity", "speed", "სიჩქარე"],
  ["inertia", "ინერცია"],
  ["gravity", "gravitation", "გრავიტაცია", "მიზიდულობა"],
  ["weight", "წონა"],
  ["friction", "ხახუნი"],
  ["energy", "ენერგია"],
  ["kinetic energy", "კინეტიკური ენერგია"],
  ["potential energy", "პოტენციური ენერგია"],
  ["pressure", "წნევა"],
  ["momentum", "იმპულსი"],
  ["wave", "ტალღა"],
  ["frequency", "სიხშირე"],
  ["wavelength", "ტალღის სიგრძე"],
  ["amplitude", "ამპლიტუდა"],
  ["light", "სინათლე"],
  ["reflection", "არეკვლა"],
  ["refraction", "გარდატეხა"],
  ["lens", "ლინზა"],
  ["sound", "ბგერა"],
  ["electric current", "დენი", "ელექტრული დენი"],
  ["voltage", "ძაბვა"],
  ["resistance", "წინაღობა"],
  ["circuit", "წრედი"],
  ["magnet", "მაგნიტი"],
  ["temperature", "ტემპერატურა"],
  ["heat", "სითბო"],
  ["relativity", "ფარდობითობა"],
  ["quantum", "კვანტური"],
  ["black hole", "შავი ხვრელი"],
  ["newton", "ნიუტონი"],
  ["law", "კანონი"],
  // Chemistry
  ["atom", "ატომი"],
  ["molecule", "მოლეკულა"],
  ["element", "ელემენტი"],
  ["compound", "ნაერთი"],
  ["chemical reaction", "reaction", "ქიმიური რეაქცია", "რეაქცია"],
  ["acid", "მჟავა"],
  ["periodic table", "პერიოდული ცხრილი"],
  ["electron", "ელექტრონი"],
  ["proton", "პროტონი"],
  ["neutron", "ნეიტრონი"],
  ["entropy", "ენტროპია"],
  // Biology and geography
  ["cell", "უჯრედი"],
  ["photosynthesis", "ფოტოსინთეზი"],
  ["ecosystem", "ეკოსისტემა"],
  ["food chain", "კვებითი ჯაჭვი"],
  ["predator", "მტაცებელი"],
  ["species", "სახეობა"],
  ["dna", "დნმ"],
  ["gene", "გენი"],
  ["evolution", "ევოლუცია"],
  ["natural selection", "ბუნებრივი გადარჩევა"],
  ["climate", "კლიმატი"],
  ["forest", "ტყე"],
  ["river", "მდინარე"],
  ["mountain", "მთა"],
  // Mathematics
  ["equation", "განტოლება"],
  ["quadratic equation", "კვადრატული განტოლება"],
  ["discriminant", "დისკრიმინანტი"],
  ["root", "ფესვი"],
  ["function", "ფუნქცია"],
  ["graph", "გრაფიკი"],
  ["fraction", "წილადი"],
  ["percentage", "percent", "პროცენტი"],
  ["probability", "ალბათობა"],
  ["statistics", "სტატისტიკა"],
  ["average", "mean", "საშუალო"],
  ["median", "მედიანა"],
  ["triangle", "სამკუთხედი"],
  ["angle", "კუთხე"],
  ["area", "ფართობი"],
  ["volume", "მოცულობა"],
  ["derivative", "წარმოებული"],
  ["prime number", "მარტივი რიცხვი"],
  ["vector", "ვექტორი"],
  ["matrix", "მატრიცა"],
  ["theorem", "თეორემა"],
  ["proof", "დამტკიცება"],
  // Computing
  ["algorithm", "ალგორითმი"],
  ["binary search", "ორობითი ძებნა", "ბინარული ძებნა"],
  ["sorting", "დალაგება"],
  ["recursion", "რეკურსია"],
  ["variable", "ცვლადი"],
  ["loop", "ციკლი"],
  ["data structure", "მონაცემთა სტრუქტურა"],
  ["array", "მასივი"],
  ["program", "პროგრამა"],
  ["programming", "პროგრამირება"],
  ["internet", "ინტერნეტი"],
  ["password", "პაროლი"],
  ["encryption", "დაშიფვრა"],
  ["cryptography", "კრიპტოგრაფია"],
  ["cybersecurity", "კიბერუსაფრთხოება"],
  ["machine learning", "მანქანური სწავლება"],
  ["neural network", "ნეირონული ქსელი"],
  ["artificial intelligence", "ხელოვნური ინტელექტი"],
  ["binary", "ორობითი"],
  // Reasoning and research
  ["logic", "ლოგიკა"],
  ["argument", "არგუმენტი"],
  ["premise", "წანამძღვარი"],
  ["conclusion", "დასკვნა"],
  ["evidence", "მტკიცებულება"],
  ["hypothesis", "ჰიპოთეზა"],
  ["experiment", "ექსპერიმენტი", "ცდა"],
  ["source", "წყარო"],
  ["bias", "მიკერძოება"],
  ["fallacy", "ლოგიკური შეცდომა"],
  ["ethics", "ეთიკა"],
  ["justice", "სამართლიანობა"],
  ["free will", "თავისუფალი ნება"],
  ["truth", "ჭეშმარიტება"],
  ["knowledge", "ცოდნა"],
  ["consciousness", "ცნობიერება"],
  ["definition", "განმარტება"],
  ["example", "მაგალითი"],
  ["history", "ისტორია"],
];

export interface ExpandedTerm {
  term: string;
  /** Relative weight in scoring: typed terms 1, equivalents less. */
  weight: number;
  /** The query stem this term stands for (itself for typed terms). */
  source: string;
}

interface Group {
  forms: string[][];
}

let groups: Group[] | null = null;

function index(): Group[] {
  groups ??= SYNONYM_GROUPS.map((forms) => ({ forms: forms.map((f) => contentTerms(f)).filter((f) => f.length > 0) }));
  return groups;
}

function containsSequence(haystack: readonly string[], needle: readonly string[]): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/** Query stems plus their equivalents from the synonym table. */
export function expandTerms(queryTerms: readonly string[]): ExpandedTerm[] {
  const out = new Map<string, ExpandedTerm>();
  for (const term of queryTerms) out.set(term, { term, weight: 1, source: term });
  for (const group of index()) {
    const hit = group.forms.find((form) => containsSequence(queryTerms, form) >= 0);
    if (!hit) continue;
    for (const form of group.forms) {
      if (form === hit) continue;
      for (const term of form) {
        if (out.has(term)) continue;
        out.set(term, { term, weight: 0.7, source: hit[hit.length - 1] });
      }
    }
  }
  return [...out.values()];
}
