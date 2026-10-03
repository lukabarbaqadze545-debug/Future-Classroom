import type { ResourceInput } from "@/lib/labs/library/model";
import type { Subject } from "@/lib/domain/catalog";

/**
 * Books that ship with the platform and are installed in every school's
 * library at start-up, with the book itself as the school's digital copy
 * (searchable in the Learning Assistant). Files live in content/books/: the
 * .docx students open and the .md text extracted from it
 * (scripts/extract-book-text.ts).
 */
export interface BuiltInBook {
  /** Library resource id; the school copy is material `book-<key>`. */
  id: string;
  key: string;
  file: string;
  subject: Subject;
  tags: string[];
  resource: Partial<ResourceInput> & Pick<ResourceInput, "title" | "description">;
}

export const BUILT_IN_BOOKS: BuiltInBook[] = [
  {
    id: "lib-business-courses",
    key: "business-courses",
    file: "business-courses.docx",
    subject: "entrepreneurship",
    tags: ["ბიზნესი", "მარკეტინგი", "ფინანსები"],
    resource: {
      title: "Business courses",
      kind: "textbook",
      categories: ["careers"],
      subjects: ["entrepreneurship", "economics"],
      gradeFrom: 9,
      gradeTo: 12,
      language: "ka",
      year: "2026",
      license: "permission",
      description: {
        en: "A practical course in business, sales, marketing and financial thinking — from an idea to a working enterprise. Every new idea is first explained simply, with examples and exercises. In Georgian.",
        ka: "პრაქტიკული კურსი ბიზნესის, გაყიდვების, მარკეტინგისა და ფინანსური აზროვნების შესახებ — იდეიდან წარმატებულ საწარმომდე. ყოველი ახალი ცნება ჯერ მარტივად აიხსნება, მაგალითებითა და სავარჯიშოებით.",
      },
    },
  },
  {
    id: "lib-cpp-code-to-olympiad-1",
    key: "cpp-code-to-olympiad-1",
    file: "cpp-from-code-to-olympiad-1.docx",
    subject: "computer_science",
    tags: ["C++", "ალგორითმები", "ოლიმპიადა"],
    resource: {
      title: "C++: From Code to Olympiad, Vol. 1",
      kind: "textbook",
      categories: ["computing"],
      subjects: ["computer_science"],
      gradeFrom: 8,
      gradeTo: 12,
      language: "ka",
      license: "permission",
      description: {
        en: "Volume I of a complete guide to C++, algorithms, data structures and competitive programming, from the very first program to olympiad thinking — for beginners preparing for the Georgian National Olympiad in Informatics (GEOI). In Georgian.",
        ka: "სრული სახელმძღვანელოს პირველი ტომი C++-ის, ალგორითმების, მონაცემთა სტრუქტურებისა და კონკურენტული პროგრამირების შესახებ — პირველი პროგრამიდან ოლიმპიურ აზროვნებამდე. დამწყებთათვის, ვინც ინფორმატიკის ეროვნულ ოლიმპიადას (GEOI) ემზადება.",
      },
    },
  },
  {
    id: "lib-cpp-problems-1",
    key: "cpp-problems-1",
    file: "cpp-problems-1.docx",
    subject: "computer_science",
    tags: ["C++", "ამოცანები", "ალგორითმები", "ოლიმპიადა"],
    resource: {
      title: "189 Problems in C++, Vol. 1",
      kind: "book",
      categories: ["computing"],
      subjects: ["computer_science"],
      gradeFrom: 8,
      gradeTo: 12,
      language: "ka",
      year: "2026",
      license: "school",
      description: {
        en: "A collection of 189 C++ problems in 15 chapters, from the first program to olympiad-style topics: input and output, conditions, loops, numbers, functions, arrays, strings, matrices, tracing and debugging, complexity and brute force, sorting and searching, STL, recursion, greedy algorithms and dynamic programming, graphs. Each problem has examples, three hints of growing detail and a solution that was compiled and tested. In Georgian.",
        ka: "189 ამოცანა C++-ში 15 თავად დაყოფილი, პირველი პროგრამიდან ოლიმპიურ თემებამდე: შეყვანა-გამოტანა, პირობები, ციკლები, რიცხვები, ფუნქციები, მასივები, სტრიქონები, მატრიცები, ვარაუდი და შეცდომის პოვნა, სირთულე და გადარჩევა, დახარისხება და ძებნა, STL, რეკურსია, სიხარბე და დინამიური პროგრამირება, გრაფები. ყოველ ამოცანას აქვს მაგალითები, სამი მზარდი მინიშნება და ამოხსნა, რომელიც კომპილირებულია და გამოცდილია.",
      },
    },
  },
  {
    id: "lib-english-spanish-dictionary-1",
    key: "english-spanish-dictionary-1",
    file: "english-spanish-learning-dictionary-1.docx",
    subject: "english",
    tags: ["English", "Spanish", "vocabulary", "CEFR"],
    resource: {
      title: "English–Spanish Learning Dictionary, Vol. 1 (words 1–2,000)",
      kind: "reference",
      categories: ["languages", "reference"],
      subjects: ["english"],
      gradeFrom: 5,
      gradeTo: 12,
      language: "en",
      license: "permission",
      description: {
        en: "A learner's dictionary of the 2,000 most useful English words (CEFR A1–C1) with Spanish translations: pronunciation, part of speech, a plain-English definition, an example sentence with its Spanish translation, collocations and usage notes, plus a study tracker and review checklist. In English and Spanish.",
        ka: "ინგლისური ენის 2 000 ყველაზე სასარგებლო სიტყვის (CEFR A1–C1) სასწავლო ლექსიკონი ესპანური თარგმანით: გამოთქმა, მეტყველების ნაწილი, მარტივი განმარტება, მაგალითი ესპანური თარგმანით, კოლოკაციები და გამოყენების შენიშვნები; თან ახლავს სწავლის ტრეკერი და გამეორების ჩეკლისტი. ინგლისურად და ესპანურად.",
      },
    },
  },
];
