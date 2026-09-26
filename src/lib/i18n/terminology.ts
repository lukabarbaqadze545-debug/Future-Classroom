/**
 * Georgian terminology used across the interface and the built-in content.
 *
 * Write new Georgian text with these terms so the platform speaks with one
 * voice. Where a natural Georgian word exists, it is used; widely used
 * international terms (STEM, Python, AI in short labels) stay as they are.
 * `avoid` lists wordings that must not appear in Georgian text — a unit test
 * (tests/unit/terminology.test.ts) checks every dictionary and every built-in
 * Georgian text against it.
 *
 * Style: address students with "შენ" and teachers with "თქვენ"; keep
 * sentences short; prefer active verbs ("შეამოწმე", "დაამატე") over
 * nominal bureaucratic phrasing ("შემოწმების განხორციელება").
 */
export interface Term {
  en: string;
  ka: string;
  /** When and how to use it. */
  note?: string;
  /** Wordings to avoid (substrings; matched case-insensitively). */
  avoid?: string[];
}

export const TERMS: Record<string, Term> = {
  // --- Navigation and workflow -------------------------------------------
  dashboard: { en: "Dashboard", ka: "მთავარი გვერდი", note: "Short nav label: „მთავარი“.", avoid: ["დაშბორდ", "მთავარი პანელი"] },
  lesson: { en: "Lesson", ka: "გაკვეთილი" },
  subject: { en: "Subject", ka: "საგანი" },
  topic: { en: "Topic", ka: "თემა" },
  assignment: { en: "Assignment", ka: "დავალება", note: "Homework: „საშინაო დავალება“." },
  exercise: { en: "Exercise", ka: "სავარჯიშო" },
  problem: { en: "Problem (maths, programming)", ka: "ამოცანა" },
  quiz: { en: "Quiz", ka: "ქვიზი", note: "Short self-check quiz. „ტესტი“ is kept for programming test cases." },
  testCase: { en: "Test (programming)", ka: "ტესტი" },
  hint: { en: "Hint", ka: "მინიშნება" },
  solution: { en: "Solution", ka: "ამოხსნა" },
  answer: { en: "Answer", ka: "პასუხი" },
  check: { en: "Check", ka: "შემოწმება" },
  trueFalse: { en: "True / False (quiz options)", ka: "მართალია / მცდარია", note: "Feedback on an answer: „სწორია“ / „არასწორია“." },
  qrCode: { en: "QR code", ka: "QR-კოდი", avoid: ["QR კოდ"] },
  handIn: { en: "Hand in", ka: "ჩაბარება", note: "Handing in an assignment. Sending an answer: „გაგზავნა“." },
  feedback: { en: "Feedback", ka: "უკუკავშირი", note: "A teacher's written comment: „მასწავლებლის კომენტარი“ also works.", avoid: ["ფიდბექ", "ფიდბეკ"] },
  progress: { en: "Progress", ka: "პროგრესი" },
  materials: { en: "Materials", ka: "სასწავლო მასალები" },
  resources: { en: "Resources", ka: "რესურსები" },
  classroomSession: { en: "Classroom session", ka: "საკლასო სესია", note: "A live lesson where students join with a code." },
  joinCode: { en: "Join code", ka: "შესვლის კოდი" },
  grade: { en: "Grade (year)", ka: "კლასი", note: "„მე-9 კლასი“; „კლასი“ is also a group of students — the context makes it clear." },
  draft: { en: "Draft", ka: "მონახაზი", avoid: ["დრაფტ"] },
  publish: { en: "Publish", ka: "გამოქვეყნება" },
  deadline: { en: "Due date", ka: "ვადა", note: "Overdue: „ვადაგადაცილებული“.", avoid: ["დედლაინ"] },
  link: { en: "Link", ka: "ბმული", avoid: ["ლინკ"] },
  upload: { en: "Upload", ka: "ატვირთვა", avoid: ["აპლოუდ"] },
  download: { en: "Download", ka: "ჩამოტვირთვა", avoid: ["დაუნლოუდ"] },
  click: { en: "Click / tap", ka: "დააჭირე", avoid: ["დააკლიკ", "კლიკავ"] },
  settings: { en: "Settings", ka: "პარამეტრები", avoid: ["სეტინგ"] },
  features: { en: "Features", ka: "შესაძლებლობები", avoid: ["ფუნქციონალ"] },
  user: { en: "User", ka: "მომხმარებელი", avoid: ["იუზერ"] },
  bookmark: { en: "Bookmark", ka: "სანიშნე" },
  contentReview: { en: "Content review", ka: "შინაარსის შემოწმება", note: "Teachers checking a lesson before classroom use." },
  classroomReady: { en: "Classroom ready", ka: "საკლასოდ მზა" },

  // --- Laboratories --------------------------------------------------------
  laboratory: { en: "Laboratory", ka: "ლაბორატორია" },
  programmingLab: { en: "Programming Laboratory", ka: "პროგრამირების ლაბორატორია" },
  stemLab: { en: "STEM Laboratory", ka: "STEM ლაბორატორია" },
  researchLab: { en: "Research Laboratory", ka: "კვლევითი ლაბორატორია" },
  criticalLab: { en: "Critical Thinking Laboratory", ka: "კრიტიკული აზროვნების ლაბორატორია" },
  library: { en: "School Library", ka: "სასკოლო ბიბლიოთეკა" },
  career: { en: "Career & University", ka: "კარიერა და უნივერსიტეტი" },
  portfolio: { en: "Portfolio", ka: "პორტფოლიო" },
  experiment: { en: "Experiment", ka: "ექსპერიმენტი", note: "„ცდა“ is fine in running text („ცდის ჩატარება“)." },
  simulation: { en: "Simulation", ka: "სიმულაცია" },
  input: { en: "Input", ka: "შემავალი მონაცემები" },
  output: { en: "Output", ka: "გამომავალი მონაცემები", note: "What a program printed: „გამონატანი“." },
  dataStructures: { en: "Data structures", ka: "მონაცემთა სტრუქტურები" },
  algorithm: { en: "Algorithm", ka: "ალგორითმი" },
  edgeCase: { en: "Edge case", ka: "ზღვრული შემთხვევა", avoid: ["კიდური შემთხვევ"] },

  // --- Research and critical thinking -------------------------------------
  research: { en: "Research", ka: "კვლევა" },
  researchProject: { en: "Research project", ka: "კვლევითი პროექტი" },
  researchQuestion: { en: "Research question", ka: "საკვლევი კითხვა", avoid: ["კვლევითი კითხვ", "კვლევით კითხვ"] },
  hypothesis: { en: "Hypothesis", ka: "ჰიპოთეზა" },
  source: { en: "Source", ka: "წყარო" },
  evidence: { en: "Evidence", ka: "მტკიცებულება" },
  claim: { en: "Claim", ka: "მტკიცება", note: "An opinion to be justified: „მოსაზრება“." },
  argument: { en: "Argument", ka: "არგუმენტი" },
  debate: { en: "Debate", ka: "დებატები", note: "Plural in headings and running text; „დებატის თემა“ in compounds." },
  counterargument: { en: "Counterargument", ka: "კონტრარგუმენტი" },
  assumption: { en: "Assumption", ka: "დაშვება" },
  fallacy: { en: "Logical fallacy", ka: "ლოგიკური შეცდომა" },
  bias: { en: "Cognitive bias", ka: "კოგნიტური მიკერძოება", avoid: ["კოგნიტიურ"] },
  misinformation: { en: "Misinformation", ka: "მცდარი ინფორმაცია", note: "Deliberately false: „დეზინფორმაცია“." },
  fakeNews: { en: "Fake news", ka: "ყალბი ამბები", avoid: ["ფეიკ"] },
  mediaLiteracy: { en: "Media literacy", ka: "მედიაწიგნიერება" },
  citation: { en: "Citation / reference", ka: "ციტირება / ბიბლიოგრაფიული მითითება" },
  bibliography: { en: "Bibliography", ka: "ბიბლიოგრაფია" },

  // --- Units --------------------------------------------------------------------
  units: {
    en: "SI units in Georgian text",
    ka: "მ, სმ, კმ, წმ, წთ, სთ, კგ, გ, ნ, ჯ, ვტ, ვ, ა, მ/წმ, მ/წმ², კმ/სთ",
    note: "Georgian textbooks write units in Georgian; Ω and °C stay as symbols. Letters in formulas (F = m · a) stay Latin. Electronics-lab component markings (5 V, 10 kΩ) stay as printed on parts. Decimal comma: 3,6.",
    avoid: ["m/s", "km/h"],
  },

  // --- Money ------------------------------------------------------------------
  currency: { en: "Georgian lari (GEL)", ka: "ლარი (₾)", note: "Write amounts as „25 ლარი“ or „25 ₾“." },

  // --- Tone -------------------------------------------------------------------
  aforementioned: { en: "(bureaucratic phrasing)", ka: "—", note: "Say what you mean directly.", avoid: ["აღნიშნულ", "ზემოაღნიშნულ", "განხორციელდ", "განახორციელ"] },
};

/** Every avoided wording with the term that replaces it. */
export const AVOIDED: { wording: string; use: string }[] = Object.values(TERMS).flatMap((term) => (term.avoid ?? []).map((wording) => ({ wording, use: term.ka })));
