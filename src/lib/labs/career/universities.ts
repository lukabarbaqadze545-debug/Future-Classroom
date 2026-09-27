import type { Locale } from "@/lib/i18n/config";
import { l, tr, type L } from "../localized";
import type { FieldId } from "./careers";

/*
 * University guide: universities in Georgia and abroad for computer science,
 * medicine and the arts, with how to get in, what it costs and how to pay
 * for it — written for a student finishing school in Georgia.
 *
 * Every fact here was checked on the date in CHECKED against the sources
 * listed with it. Fees, grants and rules change every year (Georgia changed
 * its whole funding system in 2025–2026), so the interface shows the date,
 * warns when it is more than a year old, and always points to the official
 * page. Where a current figure could not be confirmed, the entry says how
 * the cost works and links the official page instead of printing a number.
 *
 * To update: re-check each entry against its sources, edit it, and change
 * CHECKED.
 */

export const CHECKED = "2026-09-27";

export const GUIDE_FIELDS = ["cs", "medicine", "art"] as const;
export type GuideField = (typeof GUIDE_FIELDS)[number];

export const REGIONS = ["georgia", "europe", "north_america", "asia"] as const;
export type Region = (typeof REGIONS)[number];

/** The closest field of study in the career explorer, for "save to my cards". */
export const CAREER_FIELD: Record<GuideField, FieldId | null> = { cs: "computer_science", medicine: "medicine_health", art: "architecture_design" };

export interface Source {
  label: string;
  url: string;
}

export interface UniversityGuide {
  id: string;
  name: L;
  /** Common short name, if there is one. */
  short: L | string;
  country: L;
  city: L;
  region: Region;
  kind: "public" | "private";
  website: string;
  fields: GuideField[];
  languages: L;
  summary: L;
  /** Why it is (or is not) a good place for each of its fields. */
  strengths: Partial<Record<GuideField, L>>;
  /** How a student from a Georgian school gets in, step by step. */
  admission: L[];
  /** What studying costs a Georgian citizen. */
  tuition: L;
  /** Grants, scholarships and fee waivers. */
  funding: L[];
  deadlines: L;
  /** What to weigh before choosing it. */
  considerations: L[];
  sources: Source[];
}

/* ------------------------------ shared texts ------------------------------ */

const GE_STATE_TUITION = l(
  "Free for Georgian citizens from 2026–27: the state pays in full for the first two semesters; from the third semester 50% is guaranteed and the other 50% is kept if you earned at least 80% of the required credits in the previous semester. Lose it, and you can win it back by catching up on credits.",
  "2026–2027 სასწავლო წლიდან საქართველოს მოქალაქისთვის უფასოა: პირველ ორ სემესტრს სახელმწიფო სრულად აფინანსებს; მესამე სემესტრიდან 50% გარანტირებულია, დანარჩენი 50% კი შენარჩუნდება, თუ წინა სემესტრში საჭირო კრედიტების მინიმუმ 80% დააგროვე. თუ ეს ნაწილი დაკარგე, კრედიტების აღდგენის შემდეგ ისევ დაგიბრუნდება.",
);

const GE_UNE = l(
  "Register for the Unified National Exams in spring (in 2026: 6 April – 11 May) and choose the programmes you want, in order of preference.",
  "გაზაფხულზე დარეგისტრირდი ერთიან ეროვნულ გამოცდებზე (2026 წელს — 6 აპრილიდან 11 მაისამდე) და უპირატესობის მიხედვით აირჩიე სასურველი პროგრამები.",
);

const GE_EXAMS = l(
  "Sit the exams in July (in 2026: 2–22 July). Which subjects count, and how many places a programme has, is listed in the programme catalogue of the National Assessment and Examinations Center (naec.ge).",
  "გამოცდები ივლისშია (2026 წელს — 2–22 ივლისი). რომელი საგნები ითვლება და რამდენი ადგილია თითოეულ პროგრამაზე, ეროვნული შეფასებისა და გამოცდების ცენტრის (naec.ge) პროგრამების კატალოგშია მითითებული.",
);

const GE_DEADLINES = l(
  "Registration in spring, exams in July, enrolment in late summer — the exact dates are announced each year by the Ministry and naec.ge.",
  "რეგისტრაცია გაზაფხულზეა, გამოცდები — ივლისში, ჩარიცხვა — ზაფხულის ბოლოს. ზუსტ თარიღებს ყოველწლიურად აცხადებენ სამინისტრო და naec.ge.",
);

const GE_REFORM = l(
  "Georgia's 2025–2026 higher-education reform moved disciplines between state universities (\"one city — one faculty\"). Check that your programme is still offered where you plan to apply.",
  "2025–2026 წლების უმაღლესი განათლების რეფორმამ სახელმწიფო უნივერსიტეტებს შორის მიმართულებები გადაანაწილა („ერთი ქალაქი — ერთი ფაკულტეტი“). გადაამოწმე, რომ სასურველი პროგრამა კვლავ ისწავლება იქ, სადაც აპირებ ჩაბარებას.",
);

const SRC_FREE: Source = { label: "OC Media — state university tuition becomes free (2026)", url: "https://oc-media.org/georgia-to-make-state-university-tuition-free-with-conditions/" };
const SRC_MERIT: Source = { label: "Civil Georgia — merit condition from the third semester", url: "https://civil.ge/archives/746659" };
const SRC_FACULTY: Source = { label: "Civil Georgia — \"one city, one faculty\"", url: "https://civil.ge/archives/721085" };
const SRC_EXAMS: Source = { label: "Georgia Today — 2026 national exam registration", url: "https://georgiatoday.ge/registration-opens-for-georgias-2026-unified-national-and-general-masters-examinations/" };
const SRC_NAEC: Source = { label: "National Assessment and Examinations Center", url: "https://naec.ge/" };
const SRC_PRIVATE: Source = { label: "Sova News — student funding rules after the reform (2026)", url: "https://sovanews.tv/en/2026/05/11/georgia-to-clarify-student-funding-rules-following-university-reform/" };
const SRC_HUNGARICUM: Source = { label: "International Education Center (Georgia) — Stipendium Hungaricum", url: "https://iec.gov.ge/en-us/Programs/2025-2026-ACADEMIC-YEAR/Stipendium-Hungaricum" };
const SRC_TURKIYE: Source = { label: "Türkiye Scholarships (official)", url: "https://www.turkiyeburslari.gov.tr" };
const SRC_DAAD: Source = { label: "DAAD Georgia — scholarship database", url: "https://www.daad-georgia.org/en/find-funding/scholarship-database/" };

const ABROAD_DOCUMENTS = l(
  "Prepare your school certificate with an official translation (and an apostille if the country asks for one), a passport, and the language certificate the programme requires.",
  "მოამზადე სკოლის ატესტატი ოფიციალური თარგმანით (და აპოსტილით, თუ ქვეყანა ამას ითხოვს), პასპორტი და ენის ცოდნის ის სერტიფიკატი, რომელსაც პროგრამა მოითხოვს.",
);

const VISA = l(
  "After admission, apply for a student visa or residence permit; you usually have to show that you can pay for your living costs.",
  "ჩარიცხვის შემდეგ მოითხოვე სასწავლო ვიზა ან ბინადრობის ნებართვა; ჩვეულებრივ, უნდა აჩვენო, რომ საცხოვრებელ ხარჯებს დაფარავ.",
);

/* ------------------------------ universities ------------------------------ */

export const UNIVERSITY_GUIDE: UniversityGuide[] = [
  /* ============================== Georgia ============================== */
  {
    id: "tsu",
    name: l("Ivane Javakhishvili Tbilisi State University", "ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი"),
    short: l("TSU", "თსუ"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "public",
    website: "https://www.tsu.ge",
    fields: ["cs"],
    languages: l("Georgian; the computer science bachelor's is also taught in English", "ქართული; კომპიუტერული მეცნიერების საბაკალავრო პროგრამა ინგლისურადაც ისწავლება"),
    summary: l(
      "Georgia's oldest and largest university. After the 2026 reform it is the main state university in Tbilisi for the exact and natural sciences, humanities, law, economics and social sciences, with the largest admission quota (6,650 places in 2026).",
      "საქართველოს უძველესი და უდიდესი უნივერსიტეტი. 2026 წლის რეფორმის შემდეგ თბილისში ზუსტ და საბუნებისმეტყველო მეცნიერებებს, ჰუმანიტარულ მეცნიერებებს, სამართალს, ეკონომიკასა და სოციალურ მეცნიერებებს ძირითადად ის ასწავლის და მისაღები ადგილების ყველაზე დიდი რაოდენობა აქვს (2026 წელს — 6 650).",
    ),
    strengths: {
      cs: l(
        "A four-year Bachelor of Computer Science (240 ECTS) with Georgian and English tracks, inside a large science faculty — a strong, free option if you want to stay in Georgia.",
        "ოთხწლიანი კომპიუტერული მეცნიერების ბაკალავრიატი (240 ECTS) ქართულ და ინგლისურენოვან ნაკადებად, ზუსტ და საბუნებისმეტყველო მეცნიერებათა ფაკულტეტზე — ძლიერი და უფასო არჩევანი, თუ საქართველოში სწავლა გინდა.",
      ),
    },
    admission: [GE_UNE, GE_EXAMS, l("For the English-taught track, check the extra English requirement on the programme page.", "ინგლისურენოვანი ნაკადისთვის პროგრამის გვერდზე გადაამოწმე ინგლისური ენის დამატებითი მოთხოვნა.")],
    tuition: GE_STATE_TUITION,
    funding: [
      l("Tuition is covered by the state (see above); the university also has its own merit scholarships.", "სწავლის საფასურს სახელმწიფო ფარავს (იხ. ზემოთ); უნივერსიტეტს საკუთარი, აკადემიურ მოსწრებაზე დაფუძნებული სტიპენდიებიც აქვს."),
      l("Exchange semesters abroad depend on the agreements your faculty has in a given year.", "საზღვარგარეთ გაცვლითი სემესტრი დამოკიდებულია იმაზე, რა შეთანხმებები აქვს ფაკულტეტს კონკრეტულ წელს."),
    ],
    deadlines: GE_DEADLINES,
    considerations: [
      GE_REFORM,
      l("Large groups in the first years; much depends on your own initiative (projects, olympiads, internships).", "პირველ კურსებზე ჯგუფები დიდია; ბევრი რამ შენს ინიციატივაზეა დამოკიდებული (პროექტები, ოლიმპიადები, სტაჟირება)."),
    ],
    sources: [{ label: "TSU — Computer Science bachelor (English)", url: "https://computing.tsu.ge/en/careers/1" }, SRC_FREE, SRC_MERIT, SRC_FACULTY, SRC_EXAMS],
  },
  {
    id: "gtu",
    name: l("Georgian Technical University", "საქართველოს ტექნიკური უნივერსიტეტი"),
    short: l("GTU", "სტუ"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "public",
    website: "https://www.gtu.edu.ge/en/",
    fields: ["cs"],
    languages: l("Mostly Georgian", "ძირითადად ქართული"),
    summary: l(
      "Georgia's main engineering university. Under the 2026 reform it keeps engineering and technical disciplines only, with 3,880 admission places in 2026.",
      "საქართველოს მთავარი საინჟინრო უნივერსიტეტი. 2026 წლის რეფორმით მას მხოლოდ საინჟინრო და ტექნიკური მიმართულებები დარჩა; 2026 წელს მისაღები ადგილების რაოდენობა 3 880-ია.",
    ),
    strengths: {
      cs: l(
        "Computing close to hardware: the Faculty of Informatics and Control Systems has departments of artificial intelligence and computer engineering, and a large IT laboratory.",
        "კომპიუტერული მიმართულება აპარატურასთან ახლოს: ინფორმატიკისა და მართვის სისტემების ფაკულტეტზე ხელოვნური ინტელექტისა და კომპიუტერული ინჟინერიის დეპარტამენტები და დიდი IT ლაბორატორიაა.",
      ),
    },
    admission: [GE_UNE, GE_EXAMS],
    tuition: GE_STATE_TUITION,
    funding: [l("Tuition is covered by the state (see above).", "სწავლის საფასურს სახელმწიფო ფარავს (იხ. ზემოთ).")],
    deadlines: GE_DEADLINES,
    considerations: [
      l("Engineering-oriented: choose it if you like electronics, systems and hardware as much as programming.", "საინჟინრო მიმართულებისაა: აირჩიე, თუ ელექტრონიკა, სისტემები და აპარატურა ისევე გაინტერესებს, როგორც პროგრამირება."),
      l("A 2026 plan to merge GTU into TSU was dropped in February 2026 after protests; follow the news for further changes.", "სტუ-ს თსუ-სთან შერწყმის 2026 წლის გეგმა პროტესტის შემდეგ, 2026 წლის თებერვალში, გაუქმდა; შემდგომ ცვლილებებს ადევნე თვალი."),
    ],
    sources: [{ label: "GTU (official)", url: "https://www.gtu.edu.ge/en/" }, { label: "OC Media — merger dropped", url: "https://oc-media.org/georgian-government-drops-university-merger-after-public-backlash/" }, SRC_FREE, SRC_FACULTY],
  },
  {
    id: "iliauni",
    name: l("Ilia State University", "ილიას სახელმწიფო უნივერსიტეტი"),
    short: l("ISU", "ილიაუნი"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "public",
    website: "https://iliauni.edu.ge/en/",
    fields: ["cs"],
    languages: l("Georgian and English (the international computer engineering programme is in English)", "ქართული და ინგლისური (საერთაშორისო კომპიუტერული ინჟინერიის პროგრამა ინგლისურადაა)"),
    summary: l(
      "A research university whose bachelor's programme \"Computer Engineering (International)\" is accredited by ABET, the US engineering accreditor. Since the 2026 reform it may admit only to pedagogy and ABET-accredited STEM programmes — 300 places in total in 2026, down from 3,828.",
      "კვლევითი უნივერსიტეტი, რომლის საბაკალავრო პროგრამა „კომპიუტერული ინჟინერია (საერთაშორისო)“ აკრედიტებულია ABET-ის, ამერიკული საინჟინრო აკრედიტაციის ორგანიზაციის მიერ. 2026 წლის რეფორმის შემდეგ მას მხოლოდ პედაგოგიკასა და ABET-ით აკრედიტებულ STEM პროგრამებზე შეუძლია სტუდენტების მიღება — 2026 წელს 3 828-ის ნაცვლად სულ 300 ადგილი.",
    ),
    strengths: {
      cs: l(
        "An internationally accredited, English-taught computing degree at a state university — rare in Georgia.",
        "საერთაშორისოდ აკრედიტებული, ინგლისურენოვანი ხარისხი კომპიუტერულ მიმართულებაზე, სახელმწიფო უნივერსიტეტში — საქართველოში იშვიათობაა.",
      ),
    },
    admission: [GE_UNE, GE_EXAMS, l("Expect strong competition: very few places were announced for 2026.", "მოელოდე მაღალ კონკურენციას: 2026 წლისთვის ძალიან ცოტა ადგილი გამოცხადდა.")],
    tuition: GE_STATE_TUITION,
    funding: [l("Tuition is covered by the state (see above).", "სწავლის საფასურს სახელმწიფო ფარავს (იხ. ზემოთ).")],
    deadlines: GE_DEADLINES,
    considerations: [
      l("Its programmes were cut sharply in 2026; confirm which ones admit students this year.", "2026 წელს პროგრამები მკვეთრად შემცირდა; გადაამოწმე, რომელ პროგრამებზე მიიღებენ წელს სტუდენტებს."),
      l("Computer Engineering holds ABET accreditation; other computing programmes were still in the accreditation process.", "ABET-ის აკრედიტაცია კომპიუტერულ ინჟინერიას აქვს; კომპიუტერული მიმართულების სხვა პროგრამები ჯერ კიდევ აკრედიტაციის პროცესში იყო."),
    ],
    sources: [
      { label: "Ilia State University — ABET accreditation", url: "https://iliauni.edu.ge/en/siaxleebi-8/axali-ambebi-36/ilia-state-universitys-bachelors-program-receives-abet-accreditation.page" },
      { label: "Georgia Today — 300 places for 2026–27", url: "https://georgiatoday.ge/ilia-state-university-admission-quota-reduced-to-300-students-for-2026-2027/" },
      SRC_FREE,
      SRC_FACULTY,
    ],
  },
  {
    id: "kiu",
    name: l("Kutaisi International University", "ქუთაისის საერთაშორისო უნივერსიტეტი"),
    short: "KIU",
    country: l("Georgia", "საქართველო"),
    city: l("Kutaisi", "ქუთაისი"),
    region: "georgia",
    kind: "public",
    website: "https://www.kiu.edu.ge",
    fields: ["cs"],
    languages: l("English", "ინგლისური"),
    summary: l(
      "A state university on a modern campus in Kutaisi (first students in 2020). Its English-taught BSc in Computer Science was developed with the Technical University of Munich (TUM).",
      "სახელმწიფო უნივერსიტეტი თანამედროვე კამპუსით ქუთაისში (პირველი სტუდენტები 2020 წელს მიიღო). ინგლისურენოვანი კომპიუტერული მეცნიერების ბაკალავრიატი მიუნხენის ტექნიკურ უნივერსიტეტთან (TUM) ერთად შეიქმნა.",
    ),
    strengths: {
      cs: l(
        "A German-designed, English-taught computer science programme on a campus with student housing — close to a European degree without leaving Georgia.",
        "გერმანული მოდელით შექმნილი, ინგლისურენოვანი კომპიუტერული მეცნიერების პროგრამა კამპუსზე, სადაც საცხოვრებელიც არის — ევროპულ განათლებასთან ახლოს, საქართველოს დატოვების გარეშე.",
      ),
    },
    admission: [GE_UNE, GE_EXAMS, l("Check KIU's page for Georgian citizens for the English requirement and any extra steps.", "ინგლისური ენის მოთხოვნა და დამატებითი ნაბიჯები გადაამოწმე KIU-ის გვერდზე საქართველოს მოქალაქეებისთვის.")],
    tuition: l(
      "KIU's page listed 2,250 GEL a year for Georgian citizens before the reform; as a state university it falls under the free-tuition rules from 2026–27 (full funding for two semesters, then 50% guaranteed + 50% for results). Confirm how KIU applies them.",
      "რეფორმამდე KIU-ის გვერდზე საქართველოს მოქალაქისთვის წელიწადში 2 250 ლარი ეწერა; როგორც სახელმწიფო უნივერსიტეტზე, მასზე 2026–2027 წლიდან უფასო სწავლის წესი ვრცელდება (ორი სემესტრი სრული დაფინანსება, შემდეგ 50% გარანტირებული + 50% მოსწრების მიხედვით). გადაამოწმე, როგორ იყენებს ამ წესს KIU.",
    ),
    funding: [l("State funding (see above); ask about campus housing costs.", "სახელმწიფო დაფინანსება (იხ. ზემოთ); იკითხე კამპუსზე ცხოვრების ღირებულებაც.")],
    deadlines: GE_DEADLINES,
    considerations: [l("Everything is in English from the first day: be ready to study technical material in English.", "პირველივე დღიდან ყველაფერი ინგლისურადაა: მზად უნდა იყო, ტექნიკური მასალა ინგლისურად ისწავლო.")],
    sources: [{ label: "KIU — for Georgian citizens", url: "https://www.kiu.edu.ge/index.php?m=411" }, { label: "KIU — admission", url: "https://www.kiu.edu.ge/eng/admission" }, SRC_FREE],
  },
  {
    id: "freeuni",
    name: l("Free University of Tbilisi", "თავისუფალი უნივერსიტეტი"),
    short: l("Free Uni", "თავისუფალი უნივერსიტეტი"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "private",
    website: "https://freeuni.edu.ge",
    fields: ["cs"],
    languages: l("Georgian and English", "ქართული და ინგლისური"),
    summary: l(
      "A private university supported by the Knowledge Fund endowment. Its School of Mathematics and Computer Science (MACS) runs bachelor's programmes in computer science, mathematics and engineering.",
      "კერძო უნივერსიტეტი, რომელსაც „ცოდნის ფონდი“ უჭერს მხარს. მათემატიკისა და კომპიუტერული მეცნიერებების სკოლაში (MACS) კომპიუტერული მეცნიერებების, მათემატიკისა და ინჟინერიის საბაკალავრო პროგრამებია.",
    ),
    strengths: {
      cs: l(
        "An intense, maths-heavy computer science programme with a strong reputation among Georgian IT employers.",
        "ინტენსიური, მათემატიკაზე დაფუძნებული კომპიუტერული მეცნიერების პროგრამა, რომელსაც ქართველ IT დამსაქმებლებში კარგი რეპუტაცია აქვს.",
      ),
    },
    admission: [GE_UNE, GE_EXAMS],
    tuition: l(
      "Tuition is set by the university each year — see its financing page. From 2026 new students at private universities no longer receive the state study grant (the grant system was abolished on 17 December 2025; students already enrolled keep theirs).",
      "სწავლის საფასურს უნივერსიტეტი ყოველწლიურად ადგენს — იხ. დაფინანსების გვერდი. 2026 წლიდან კერძო უნივერსიტეტის ახალი სტუდენტები სახელმწიფო სასწავლო გრანტს აღარ იღებენ (გრანტის სისტემა 2025 წლის 17 დეკემბერს გაუქმდა; უკვე ჩარიცხულებს გრანტი უნარჩუნდებათ).",
    ),
    funding: [
      l("The Knowledge Fund co-finances students' fees and offers its own scholarships — the conditions are on the financing page.", "„ცოდნის ფონდი“ სტუდენტების საფასურს თანადაფინანსებს და საკუთარ სტიპენდიებს გასცემს — პირობები დაფინანსების გვერდზეა."),
    ],
    deadlines: GE_DEADLINES,
    considerations: [
      l("Compare the full cost for four years with a free place at a state university before you decide.", "გადაწყვეტილებამდე ოთხი წლის სრული ღირებულება შეადარე სახელმწიფო უნივერსიტეტის უფასო ადგილს."),
    ],
    sources: [{ label: "Free University — financing for applicants", url: "https://freeuni.edu.ge/ge/freshmen/?entrants=financing" }, { label: "Free University — computer science, mathematics and engineering programmes", url: "https://freeuni.edu.ge/ge/node/351" }, SRC_PRIVATE],
  },
  {
    id: "tsmu",
    name: l("Tbilisi State Medical University", "თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი"),
    short: l("TSMU", "თსსუ"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "public",
    website: "https://tsmu.edu",
    fields: ["medicine"],
    languages: l("Georgian (the English MD programme was for international students)", "ქართული (ინგლისურენოვანი MD პროგრამა უცხოელი სტუდენტებისთვის იყო)"),
    summary: l(
      "Georgia's main state medical university. Under the 2026 reform it is the only state university in Tbilisi that admits to medical programmes. Medicine is a six-year single-cycle degree (360 ECTS).",
      "საქართველოს მთავარი სახელმწიფო სამედიცინო უნივერსიტეტი. 2026 წლის რეფორმით ის თბილისში ერთადერთი სახელმწიფო უნივერსიტეტია, რომელიც სამედიცინო პროგრამებზე იღებს სტუდენტებს. მედიცინა ექვსწლიანი ერთსაფეხურიანი პროგრამაა (360 ECTS).",
    ),
    strengths: {
      medicine: l(
        "The main free route to becoming a doctor in Georgia, with the country's largest teaching hospitals.",
        "საქართველოში ექიმობის მთავარი უფასო გზა, ქვეყნის უდიდესი სასწავლო კლინიკებით.",
      ),
    },
    admission: [GE_UNE, GE_EXAMS, l("Medical programmes are among the most competitive: aim for top results in the required subjects (biology is central).", "სამედიცინო პროგრამები ყველაზე კონკურენტულთა შორისაა: სავალდებულო საგნებში, განსაკუთრებით ბიოლოგიაში, მაღალი შედეგი გჭირდება.")],
    tuition: GE_STATE_TUITION,
    funding: [l("Tuition is covered by the state (see above).", "სწავლის საფასურს სახელმწიფო ფარავს (იხ. ზემოთ).")],
    deadlines: GE_DEADLINES,
    considerations: [
      l("After the six years comes residency (specialisation) — plan for about ten years in total before you work independently as a specialist.", "ექვსი წლის შემდეგ რეზიდენტურა (სპეციალიზაცია) იწყება — დამოუკიდებლად სპეციალისტად მუშაობამდე სულ დაახლოებით ათი წელი გაითვალისწინე."),
      GE_REFORM,
    ],
    sources: [SRC_FACULTY, { label: "Georgia Today — \"one city — one faculty\" admission model", url: "https://georgiatoday.ge/government-introduces-one-city-one-faculty-model-for-state-universities/" }, SRC_FREE, SRC_EXAMS],
  },
  {
    id: "art-academy",
    name: l("Apollon Kutateladze Tbilisi State Academy of Arts", "თბილისის აპოლონ ქუთათელაძის სახელობის სახელმწიფო სამხატვრო აკადემია"),
    short: l("TSAA", "სამხატვრო აკადემია"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "public",
    website: "https://art.edu.ge/en/",
    fields: ["art"],
    languages: l("Georgian", "ქართული"),
    summary: l(
      "Georgia's main school of fine art, design, architecture and art history.",
      "საქართველოს მთავარი სახელოვნებო სასწავლებელი სახვითი ხელოვნების, დიზაინის, არქიტექტურისა და ხელოვნების ისტორიის მიმართულებით.",
    ),
    strengths: {
      art: l(
        "Painting, sculpture, graphic and industrial design and more, taught by practising artists — free at a state university from 2026–27.",
        "ფერწერა, ქანდაკება, გრაფიკული და ინდუსტრიული დიზაინი და სხვა მიმართულებები, რომლებსაც მოქმედი ხელოვანები ასწავლიან — 2026–2027 წლიდან სახელმწიფო უნივერსიტეტში უფასოდ.",
      ),
    },
    admission: [
      l("Pass the Academy's creative tour (შემოქმედებითი ტური) — a practical exam in drawing and composition; register on the Academy's site before the tour.", "ჩააბარე აკადემიის შემოქმედებითი ტური — პრაქტიკული გამოცდა ხატვასა და კომპოზიციაში; ტურამდე დარეგისტრირდი აკადემიის ვებგვერდზე."),
      l("Sit the Unified National Exams in the subjects the programme requires (Georgian, a foreign language, and mathematics, history or visual and applied arts, depending on the programme).", "ჩააბარე ერთიანი ეროვნული გამოცდები იმ საგნებში, რომლებსაც პროგრამა ითხოვს (ქართული, უცხო ენა და — პროგრამის მიხედვით — მათემატიკა, ისტორია ან სახვითი და გამოყენებითი ხელოვნება)."),
    ],
    tuition: GE_STATE_TUITION,
    funding: [l("Tuition is covered by the state (see above). Budget for art materials.", "სწავლის საფასურს სახელმწიფო ფარავს (იხ. ზემოთ). გაითვალისწინე სახატავი მასალების ხარჯიც.")],
    deadlines: l("The creative tour is held before the national exams; watch the Academy's announcements from spring.", "შემოქმედებითი ტური ეროვნულ გამოცდებამდე ტარდება; აკადემიის განცხადებებს გაზაფხულიდან ადევნე თვალი."),
    considerations: [l("Start preparing drawings a year ahead; many applicants take preparatory classes.", "ხატვაში მომზადება სულ მცირე ერთი წლით ადრე დაიწყე; ბევრი აბიტურიენტი მოსამზადებელ კურსებზე დადის.")],
    sources: [{ label: "Academy of Arts — applicant registration", url: "https://art.edu.ge/en/abiturientebstvis/registracia/" }, SRC_FREE, SRC_NAEC],
  },
  {
    id: "tafu",
    name: l("Shota Rustaveli Theatre and Film Georgia State University", "საქართველოს შოთა რუსთაველის თეატრისა და კინოს სახელმწიფო უნივერსიტეტი"),
    short: l("TAFU", "თეატრალური უნივერსიტეტი"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "public",
    website: "https://tafu.edu.ge/en/",
    fields: ["art"],
    languages: l("Georgian", "ქართული"),
    summary: l(
      "One of the oldest drama schools in the world (1923): acting, directing for theatre, film and television, cinematography, choreography, criticism and media.",
      "მსოფლიოს ერთ-ერთი უძველესი სათეატრო სასწავლებელი (1923): სამსახიობო ხელოვნება, თეატრის, კინოსა და ტელევიზიის რეჟისურა, ოპერატორობა, ქორეოგრაფია, კრიტიკა და მედია.",
    ),
    strengths: {
      art: l("The place in Georgia for film and theatre, with a long tradition of Georgian cinema.", "საქართველოში კინოსა და თეატრის მთავარი სასწავლებელი, ქართული კინოს ხანგრძლივი ტრადიციით."),
    },
    admission: [
      l("Pass the creative round for your specialty (auditions for acting, portfolios or tasks for directing and cinematography).", "ჩააბარე შენი სპეციალობის შემოქმედებითი ტური (სამსახიობოზე — მოსმენა, რეჟისურასა და ოპერატორობაზე — პორტფოლიო ან დავალებები)."),
      GE_UNE,
    ],
    tuition: GE_STATE_TUITION,
    funding: [l("Tuition is covered by the state (see above).", "სწავლის საფასურს სახელმწიფო ფარავს (იხ. ზემოთ).")],
    deadlines: GE_DEADLINES,
    considerations: [l("Build a showreel or portfolio early: short films, photographs, scenes you directed.", "შოურილი (ნამუშევრების მოკლე ვიდეო) ან პორტფოლიო ადრევე შექმენი: მოკლემეტრაჟიანი ფილმები, ფოტოები, შენ მიერ დადგმული სცენები.")],
    sources: [{ label: "TAFU (official)", url: "https://tafu.edu.ge/en/" }, SRC_FREE],
  },
  {
    id: "conservatoire",
    name: l("Vano Sarajishvili Tbilisi State Conservatoire", "ვანო სარაჯიშვილის სახელობის თბილისის სახელმწიფო კონსერვატორია"),
    short: l("TSC", "კონსერვატორია"),
    country: l("Georgia", "საქართველო"),
    city: l("Tbilisi", "თბილისი"),
    region: "georgia",
    kind: "public",
    website: "https://tsc.edu.ge/en/",
    fields: ["art"],
    languages: l("Georgian", "ქართული"),
    summary: l("Georgia's leading music university, founded in 1917: performance, composition, conducting and musicology.", "საქართველოს წამყვანი მუსიკალური უნივერსიტეტი, დაარსებული 1917 წელს: შესრულება, კომპოზიცია, დირიჟორობა და მუსიკისმცოდნეობა."),
    strengths: { art: l("The main route in Georgia to a professional career in music.", "საქართველოში მუსიკოსის პროფესიული კარიერის მთავარი გზა.") },
    admission: [
      l("Pass the entrance examinations and auditions for your instrument or specialty (the programme list and requirements are on the admission page).", "ჩააბარე მისაღები გამოცდები და მოსმენა შენი საკრავის ან სპეციალობის მიხედვით (პროგრამები და მოთხოვნები მიღების გვერდზეა)."),
      GE_UNE,
    ],
    tuition: GE_STATE_TUITION,
    funding: [l("Tuition is covered by the state (see above).", "სწავლის საფასურს სახელმწიფო ფარავს (იხ. ზემოთ).")],
    deadlines: GE_DEADLINES,
    considerations: [l("Music schools expect years of prior training: talk to your music teacher about audition repertoire early.", "კონსერვატორიაში ჩასაბარებლად წლების მომზადებაა საჭირო: მოსასმენი რეპერტუარი მუსიკის მასწავლებელთან ადრევე შეათანხმე.")],
    sources: [{ label: "Tbilisi State Conservatoire — admission 2026–2027", url: "https://tsc.edu.ge/en/adm/" }, SRC_FREE],
  },

  /* ============================ North America ============================ */
  {
    id: "mit",
    name: l("Massachusetts Institute of Technology", "მასაჩუსეტსის ტექნოლოგიური ინსტიტუტი"),
    short: "MIT",
    country: l("United States", "აშშ"),
    city: l("Cambridge, Massachusetts", "კემბრიჯი, მასაჩუსეტსი"),
    region: "north_america",
    kind: "private",
    website: "https://www.mit.edu",
    fields: ["cs"],
    languages: l("English", "ინგლისური"),
    summary: l(
      "One of the world's leading universities for computer science and engineering. Admission is extremely selective, but MIT is need-blind for international applicants and meets their full financial need.",
      "მსოფლიოს ერთ-ერთი წამყვანი უნივერსიტეტი კომპიუტერული მეცნიერებისა და ინჟინერიის მიმართულებით. მიღება უაღრესად შერჩევითია, თუმცა MIT უცხოელ აპლიკანტებს ფინანსური მდგომარეობის მიუხედავად განიხილავს და მათ სრულ ფინანსურ საჭიროებას ფარავს.",
    ),
    strengths: {
      cs: l(
        "Top-level teaching and research, and aid that makes it affordable if you are admitted — the strongest option for an exceptional student.",
        "უმაღლესი დონის სწავლება და კვლევა, ხოლო დახმარება მას ხელმისაწვდომს ხდის, თუ ჩაირიცხები — ყველაზე ძლიერი არჩევანი გამორჩეული მოსწავლისთვის.",
      ),
    },
    admission: [
      l("Apply online in the autumn of your final school year (early action or regular action).", "განაცხადი ონლაინ გააგზავნე სკოლის ბოლო წლის შემოდგომაზე (ადრეული ან ჩვეულებრივი ეტაპი)."),
      l("Send school grades, teacher recommendations, essays and standardised test scores as MIT requires; show your projects, olympiads and research.", "გაგზავნე ნიშნები, მასწავლებლების რეკომენდაციები, ესეები და სტანდარტიზებული ტესტის შედეგები, როგორც MIT მოითხოვს; აჩვენე შენი პროექტები, ოლიმპიადები და კვლევა."),
      l("Apply for financial aid at the same time — it does not affect your admission.", "ფინანსურ დახმარებაზე განაცხადი იმავდროულად შეიტანე — ეს ჩარიცხვის შანსზე გავლენას არ ახდენს."),
    ],
    tuition: l(
      "2026–27: tuition US$33,360 per term; total cost of attendance about US$92,760 a year (tuition, housing, food, books, personal costs).",
      "2026–2027: სწავლის საფასური სემესტრში 33 360 აშშ დოლარია; სრული ღირებულება — წელიწადში დაახლოებით 92 760 დოლარი (სწავლა, საცხოვრებელი, კვება, წიგნები, პირადი ხარჯები).",
    ),
    funding: [
      l("Need-based MIT Scholarship: MIT meets 100% of demonstrated need, for international students too.", "საჭიროებაზე დაფუძნებული MIT-ის სტიპენდია: MIT დადასტურებულ ფინანსურ საჭიროებას 100%-ით ფარავს, უცხოელი სტუდენტებისთვისაც."),
      l("Families earning under US$200,000 a year (with typical assets) pay no tuition; under US$100,000, the family is not expected to pay at all.", "ოჯახები, რომელთა წლიური შემოსავალი 200 000 დოლარზე ნაკლებია (ჩვეულებრივი ოდენობის ქონებით), სწავლის საფასურს არ იხდიან; 100 000 დოლარზე ნაკლები შემოსავლისას ოჯახისგან საერთოდ არ მოელიან გადახდას."),
    ],
    deadlines: l("Early action in early November, regular action in early January (check the year's exact dates).", "ადრეული ეტაპი — ნოემბრის დასაწყისში, ჩვეულებრივი — იანვრის დასაწყისში (წლის ზუსტი თარიღები გადაამოწმე)."),
    considerations: [
      l("Only a few percent of applicants are admitted: apply to a range of universities, not only to MIT.", "აპლიკანტების მხოლოდ რამდენიმე პროცენტი ირიცხება: განაცხადი არა მარტო MIT-ში, არამედ რამდენიმე უნივერსიტეტში გააგზავნე."),
    ],
    sources: [
      { label: "MIT — cost of attendance", url: "https://sfs.mit.edu/undergraduate-students/the-cost-of-attendance/coa/" },
      { label: "MIT Admissions — cost and affordability", url: "https://mitadmissions.org/afford/cost-aid-basics/access-affordability/" },
    ],
  },
  {
    id: "toronto",
    name: l("University of Toronto", "ტორონტოს უნივერსიტეტი"),
    short: "U of T",
    country: l("Canada", "კანადა"),
    city: l("Toronto", "ტორონტო"),
    region: "north_america",
    kind: "public",
    website: "https://www.utoronto.ca",
    fields: ["cs", "medicine"],
    languages: l("English", "ინგლისური"),
    summary: l(
      "Canada's largest research university, strong in computer science and artificial intelligence. Its Lester B. Pearson scholarship fully funds a few dozen international students each year.",
      "კანადის უდიდესი კვლევითი უნივერსიტეტი, ძლიერი კომპიუტერულ მეცნიერებასა და ხელოვნურ ინტელექტში. ლესტერ ბ. პირსონის სტიპენდია ყოველწლიურად რამდენიმე ათეულ უცხოელ სტუდენტს სრულად აფინანსებს.",
    ),
    strengths: {
      cs: l("World-class computer science and AI research in a large, international city.", "მსოფლიო დონის კომპიუტერული მეცნიერება და ხელოვნური ინტელექტის კვლევა დიდ, საერთაშორისო ქალაქში."),
      medicine: l(
        "Not a first degree: in Canada you cannot enter medicine straight from school. At Toronto you can apply to the MD programme at the earliest in the third year of a bachelor's degree.",
        "კანადაში მედიცინაზე სკოლიდან პირდაპირ ვერ ჩააბარებ: ტორონტოში MD პროგრამაზე განაცხადის შეტანა ყველაზე ადრე ბაკალავრიატის მესამე წელს შეიძლება.",
      ),
    },
    admission: [
      l("Apply online in the autumn and winter of your final school year with your school grades and an English test (IELTS/TOEFL).", "განაცხადი ონლაინ გააგზავნე სკოლის ბოლო წლის შემოდგომასა და ზამთარში — ნიშნებითა და ინგლისურის ტესტით (IELTS/TOEFL)."),
      l("For the Pearson scholarship, your school must nominate you and deadlines are earlier (autumn).", "პირსონის სტიპენდიისთვის სკოლამ უნდა წარგადგინოს, ვადებიც უფრო ადრეა (შემოდგომა)."),
    ],
    tuition: l(
      "International fees are set by faculty; computer science is in the highest band (tens of thousands of Canadian dollars a year). Look up the exact 2026–27 amount in the Tuition Explorer.",
      "უცხოელების საფასურს ფაკულტეტი ადგენს; კომპიუტერული მეცნიერება ყველაზე მაღალ კატეგორიაშია (წელიწადში ათეულობით ათასი კანადური დოლარი). 2026–2027 წლის ზუსტი თანხა ნახე ოფიციალურ კალკულატორში (Tuition Explorer).",
    ),
    funding: [
      l("Lester B. Pearson International Scholarship: tuition, books, fees and full residence for four years; about 37 scholars a year.", "ლესტერ ბ. პირსონის საერთაშორისო სტიპენდია: სწავლის საფასური, წიგნები, მოსაკრებლები და საცხოვრებელი ოთხი წლის განმავლობაში; წელიწადში დაახლოებით 37 სტიპენდიანტი."),
    ],
    deadlines: l("Pearson nomination and application in autumn; general undergraduate applications by winter (check the exact dates).", "პირსონის ნომინაცია და განაცხადი — შემოდგომაზე; ჩვეულებრივი საბაკალავრო განაცხადი — ზამთრამდე (ზუსტი თარიღები გადაამოწმე)."),
    considerations: [l("Without a scholarship the total cost is very high for most Georgian families.", "სტიპენდიის გარეშე სრული ღირებულება ქართული ოჯახების უმეტესობისთვის ძალიან მაღალია.")],
    sources: [
      { label: "U of T — fees", url: "https://future.utoronto.ca/fees" },
      { label: "U of T — Pearson scholarship", url: "https://future.utoronto.ca/pearson-scholarships" },
      { label: "U of T MD — academic requirements", url: "https://applymd.utoronto.ca/academic-requirements" },
    ],
  },
  {
    id: "risd",
    name: l("Rhode Island School of Design", "როდ-აილენდის დიზაინის სკოლა"),
    short: "RISD",
    country: l("United States", "აშშ"),
    city: l("Providence, Rhode Island", "პროვიდენსი, როდ-აილენდი"),
    region: "north_america",
    kind: "private",
    website: "https://www.risd.edu",
    fields: ["art"],
    languages: l("English", "ინგლისური"),
    summary: l("One of the best-known art and design colleges in the United States: fine arts, illustration, industrial and graphic design, architecture.", "აშშ-ის ერთ-ერთი ყველაზე ცნობილი ხელოვნებისა და დიზაინის კოლეჯი: სახვითი ხელოვნება, ილუსტრაცია, ინდუსტრიული და გრაფიკული დიზაინი, არქიტექტურა."),
    strengths: { art: l("A studio-based education with a strong network in American art and design.", "სახელოსნოზე დაფუძნებული განათლება და ძლიერი კავშირები ამერიკულ ხელოვნებასა და დიზაინში.") },
    admission: [
      l("Apply online with a portfolio of your best recent work, school grades, essays and recommendations.", "განაცხადი ონლაინ გააგზავნე საუკეთესო ბოლოდროინდელი ნამუშევრების პორტფოლიოთი, ნიშნებით, ესეებითა და რეკომენდაციებით."),
      l("Show an English test score (TOEFL, IELTS or similar).", "წარადგინე ინგლისურის ტესტის შედეგი (TOEFL, IELTS ან მსგავსი)."),
    ],
    tuition: l(
      "Very high: more than US$55,000 a year in tuition alone, and about US$85,000 a year with housing and food (2026–27 estimates). Check the official cost page.",
      "ძალიან მაღალი: მხოლოდ სწავლის საფასური წელიწადში 55 000 აშშ დოლარზე მეტია, საცხოვრებლითა და კვებით კი — დაახლოებით 85 000 დოლარი (2026–2027 წლის შეფასება). გადაამოწმე ოფიციალურ გვერდზე.",
    ),
    funding: [l("Some merit and need-based scholarships exist, but international students often receive only partial aid.", "არსებობს აკადემიური და საჭიროებაზე დაფუძნებული სტიპენდიები, თუმცა უცხოელი სტუდენტები ხშირად მხოლოდ ნაწილობრივ დახმარებას იღებენ.")],
    deadlines: l("Early decision in November, regular decision in January–February (check the exact dates).", "ადრეული განაცხადი — ნოემბერში, ჩვეულებრივი — იანვარ-თებერვალში (ზუსტი თარიღები გადაამოწმე)."),
    considerations: [l("Compare with tuition-free art schools in Europe before committing to this cost.", "ამ ხარჯზე დათანხმებამდე შეადარე ევროპის უფასო სახელოვნებო სასწავლებლებს.")],
    sources: [{ label: "RISD — billing and payment", url: "https://sfs.risd.edu/student-accounts/billing-payment" }, { label: "College Board BigFuture — RISD tuition and costs", url: "https://bigfuture.collegeboard.org/colleges/rhode-island-school-of-design/tuition-and-costs" }],
  },

  /* ================================ Europe ================================ */
  {
    id: "oxford",
    name: l("University of Oxford", "ოქსფორდის უნივერსიტეტი"),
    short: "Oxford",
    country: l("United Kingdom", "გაერთიანებული სამეფო"),
    city: l("Oxford", "ოქსფორდი"),
    region: "europe",
    kind: "public",
    website: "https://www.ox.ac.uk",
    fields: ["cs", "medicine"],
    languages: l("English", "ინგლისური"),
    summary: l(
      "A world-leading university taught in small tutorials. Computer science and medicine are both very competitive, with admissions tests and interviews.",
      "მსოფლიოს წამყვანი უნივერსიტეტი, სადაც სწავლება მცირე ჯგუფებში (ტუტორიალებში) მიმდინარეობს. კომპიუტერული მეცნიერებაც და მედიცინაც ძალიან კონკურენტულია — მისაღები ტესტებითა და გასაუბრებით.",
    ),
    strengths: {
      cs: l("Deep, maths-heavy computer science with individual teaching.", "სიღრმისეული, მათემატიკაზე დაფუძნებული კომპიუტერული მეცნიერება ინდივიდუალური სწავლებით."),
      medicine: l("Research-intensive medicine; very few places for international students.", "კვლევაზე ორიენტირებული მედიცინა; უცხოელი სტუდენტებისთვის ძალიან ცოტა ადგილია."),
    },
    admission: [
      l("Apply through UCAS by 15 October of the year before you start (6pm UK time).", "განაცხადი UCAS-ის სისტემით გააგზავნე სწავლის დაწყებამდე წინა წლის 15 ოქტომბრამდე (18:00 დიდი ბრიტანეთის დროით)."),
      l("Take the admissions test: TMUA for computer science courses, UCAT for medicine.", "ჩააბარე მისაღები ტესტი: კომპიუტერული მეცნიერებისთვის — TMUA, მედიცინისთვის — UCAT."),
      l("If shortlisted, attend online interviews in December.", "თუ შემდეგ ეტაპზე გადახვალ, დეკემბერში ონლაინ გასაუბრებაზე მიგიწვევენ."),
    ],
    tuition: l(
      "Overseas students 2026–27: from about £37,000 to about £63,000 a year depending on the course; medicine about £49,400 a year in the first three years and £65,250 in years 4–6, plus living costs.",
      "უცხოელი სტუდენტებისთვის 2026–2027 წელს: წელიწადში დაახლოებით 37 000-დან 63 000 გირვანქა სტერლინგამდე, კურსის მიხედვით; მედიცინა — პირველ სამ წელს წელიწადში დაახლოებით 49 400, მეოთხიდან მეექვსე წლამდე კი 65 250 გირვანქა სტერლინგი, პლუს საცხოვრებელი ხარჯები.",
    ),
    funding: [l("Scholarships for international undergraduates are few and very competitive (see the fees and funding pages).", "უცხოელი ბაკალავრებისთვის სტიპენდია ცოტაა და ძალიან კონკურენტული (იხ. საფასურისა და დაფინანსების გვერდები).")],
    deadlines: l("UCAS: 15 October; admissions tests before that; interviews in December.", "UCAS — 15 ოქტომბერი; მისაღები ტესტები — მანამდე; გასაუბრება — დეკემბერში."),
    considerations: [l("Without a scholarship, a six-year medical degree costs well over £300,000 in fees alone.", "სტიპენდიის გარეშე ექვსწლიანი სამედიცინო განათლების მხოლოდ სწავლის საფასური 300 000 გირვანქა სტერლინგს ბევრად აღემატება.")],
    sources: [
      { label: "Oxford — admissions timeline", url: "https://www.ox.ac.uk/admissions/undergraduate/applying/admissions-timeline" },
      { label: "Oxford — admissions tests", url: "https://www.ox.ac.uk/admissions/undergraduate/applying/guide-for-applicants/admissions-tests" },
      { label: "Oxford — course fees", url: "https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding/course-fees" },
    ],
  },
  {
    id: "ual",
    name: l("University of the Arts London", "ლონდონის ხელოვნების უნივერსიტეტი"),
    short: "UAL",
    country: l("United Kingdom", "გაერთიანებული სამეფო"),
    city: l("London", "ლონდონი"),
    region: "europe",
    kind: "public",
    website: "https://www.arts.ac.uk",
    fields: ["art"],
    languages: l("English", "ინგლისური"),
    summary: l("Europe's largest university for art, design, fashion, communication and performance, with six colleges including Central Saint Martins.", "ევროპის უდიდესი უნივერსიტეტი ხელოვნების, დიზაინის, მოდის, კომუნიკაციისა და საშემსრულებლო ხელოვნების მიმართულებით — ექვსი კოლეჯით, მათ შორის Central Saint Martins-ით."),
    strengths: { art: l("An enormous choice of art and design courses in one of the world's creative capitals.", "ხელოვნებისა და დიზაინის კურსების უზარმაზარი არჩევანი მსოფლიოს ერთ-ერთ შემოქმედებით დედაქალაქში.") },
    admission: [
      l("Apply through UCAS or directly to UAL, depending on the course.", "განაცხადი UCAS-ის სისტემით ან პირდაპირ UAL-ში გააგზავნე, კურსის მიხედვით."),
      l("Submit a portfolio (often digital) and, for many courses, attend an interview.", "წარადგინე პორტფოლიო (ხშირად ციფრული) და, ბევრ კურსზე, გაიარე გასაუბრება."),
      l("Show English at the level the course requires (for example IELTS).", "დაადასტურე ინგლისურის ის დონე, რომელსაც კურსი ითხოვს (მაგალითად, IELTS)."),
    ],
    tuition: l("International undergraduates, 2026–27 intake: £30,890 a year, plus London living costs.", "უცხოელი ბაკალავრებისთვის (2026–2027 წლის მიღება): წელიწადში 30 890 გირვანქა სტერლინგი, პლუს ლონდონში ცხოვრების ხარჯები."),
    funding: [l("Up to 25 scholarships for 2026–27, including a means-tested tuition fee waiver of up to £12,000.", "2026–2027 წლისთვის 25-მდე სტიპენდია, მათ შორის შემოსავალზე დამოკიდებული სწავლის საფასურის შეღავათი 12 000 გირვანქა სტერლინგამდე.")],
    deadlines: l("Most courses: January (UCAS) or rolling direct applications; check each course page.", "კურსების უმეტესობა: იანვარი (UCAS) ან პირდაპირი განაცხადები, რომლებსაც მუდმივად იღებენ; თითოეული კურსის გვერდი გადაამოწმე."),
    considerations: [l("London is one of Europe's most expensive cities to live in.", "ლონდონი ევროპის ერთ-ერთი ყველაზე ძვირი ქალაქია საცხოვრებლად.")],
    sources: [{ label: "UAL — undergraduate tuition fees", url: "https://www.arts.ac.uk/study-at-ual/fees-and-funding/tuition-fees/undergraduate-tuition-fees" }],
  },
  {
    id: "eth",
    name: l("ETH Zurich (Swiss Federal Institute of Technology)", "ციურიხის ფედერალური ტექნოლოგიური ინსტიტუტი (ETH)"),
    short: "ETH",
    country: l("Switzerland", "შვეიცარია"),
    city: l("Zurich", "ციურიხი"),
    region: "europe",
    kind: "public",
    website: "https://ethz.ch/en.html",
    fields: ["cs"],
    languages: l("Bachelor's: mainly German (C1 required); master's: mostly English", "ბაკალავრიატი: ძირითადად გერმანული (საჭიროა C1); მაგისტრატურა: უმეტესად ინგლისური"),
    summary: l(
      "Continental Europe's top technical university, excellent in computer science. Fees are low for the quality, but bachelor's teaching is in German.",
      "კონტინენტური ევროპის საუკეთესო ტექნიკური უნივერსიტეტი, შესანიშნავი კომპიუტერული მეცნიერებით. საფასური ხარისხთან შედარებით დაბალია, თუმცა ბაკალავრიატზე სწავლება გერმანულადაა.",
    ),
    strengths: { cs: l("World-class computer science at a fraction of US or UK fees — if you learn German.", "მსოფლიო დონის კომპიუტერული მეცნიერება აშშ-ისა და დიდი ბრიტანეთის საფასურის მცირე ნაწილად — თუ გერმანული ისწავლე.") },
    admission: [
      l("Check whether your Georgian school certificate gives direct access or requires ETH's entrance examination.", "გადაამოწმე, გაძლევს თუ არა ქართული ატესტატი პირდაპირ დაშვებას, თუ ETH-ის მისაღები გამოცდის ჩაბარება დაგჭირდება."),
      l("Prove German at C1 level (certificate no older than two years).", "დაადასტურე გერმანული C1 დონეზე (სერტიფიკატი ორ წელზე ძველი არ უნდა იყოს)."),
      ABROAD_DOCUMENTS,
    ],
    tuition: l(
      "New bachelor's students with a foreign school certificate pay CHF 2,190 per semester (Swiss-schooled students pay CHF 730), plus Zurich's high living costs.",
      "უცხოური ატესტატით ჩარიცხული ახალი ბაკალავრები სემესტრში 2 190 შვეიცარიულ ფრანკს იხდიან (ვინც ატესტატი შვეიცარიაში მიიღო — 730 ფრანკს), პლუს ციურიხში ცხოვრების მაღალი ხარჯები.",
    ),
    funding: [l("ETH's own excellence scholarships are mainly for master's students; bachelor's students should budget for living costs themselves.", "ETH-ის საკუთარი სტიპენდიები ძირითადად მაგისტრანტებისთვისაა; ბაკალავრმა საცხოვრებელი ხარჯები თავად უნდა გაითვალისწინოს.")],
    deadlines: l("Applications for the autumn semester usually close at the end of April; check the year's dates.", "საშემოდგომო სემესტრის განაცხადების მიღება, ჩვეულებრივ, აპრილის ბოლოს სრულდება; წლის თარიღები გადაამოწმე."),
    considerations: [l("The first year ends with demanding exams that many students fail — expect hard work.", "პირველი წელი რთული გამოცდებით სრულდება, რომლებსაც ბევრი ვერ აბარებს — დიდ შრომას მოელოდე.")],
    sources: [
      { label: "ETH Zurich — tuition fees", url: "https://ethz.ch/students/en/studies/financial/tuition-fees.html" },
      { label: "ETH Zurich — language requirements", url: "https://ethz.ch/en/studies/bachelor/application/non-swiss-matriculation-certificate/language-requirements.html" },
      { label: "ETH Board — fees for foreign students tripled", url: "https://ethrat.ch/en/tuition-fees-for-foreign-nationals-who-move-to-switzerland-to-study-to-be-tripled/" },
    ],
  },
  {
    id: "tum",
    name: l("Technical University of Munich", "მიუნხენის ტექნიკური უნივერსიტეტი"),
    short: "TUM",
    country: l("Germany", "გერმანია"),
    city: l("Munich", "მიუნხენი"),
    region: "europe",
    kind: "public",
    website: "https://www.tum.de/en/",
    fields: ["cs"],
    languages: l("German and English, depending on the programme", "გერმანული და ინგლისური — პროგრამის მიხედვით"),
    summary: l("Germany's leading technical university, strong in informatics and engineering, and the partner behind KIU's computer science programme.", "გერმანიის წამყვანი ტექნიკური უნივერსიტეტი, ძლიერი ინფორმატიკასა და ინჟინერიაში; KIU-ის კომპიუტერული მეცნიერების პროგრამის პარტნიორი."),
    strengths: { cs: l("Excellent informatics with moderate fees compared with the UK or US.", "შესანიშნავი ინფორმატიკა, დიდ ბრიტანეთთან ან აშშ-სთან შედარებით ზომიერი საფასურით.") },
    admission: [
      l("Check the teaching language and entry requirements of the exact programme (many bachelor's programmes are in German).", "გადაამოწმე კონკრეტული პროგრამის სწავლების ენა და მოთხოვნები (ბევრი საბაკალავრო პროგრამა გერმანულადაა)."),
      l("Apply online through TUMonline; some programmes add an aptitude assessment.", "განაცხადი ონლაინ, TUMonline-ის სისტემით გააგზავნე; ზოგ პროგრამაზე დამატებით უნარების შეფასებაა."),
      ABROAD_DOCUMENTS,
    ],
    tuition: l(
      "Non-EU students enrolling from winter semester 2024–25: €2,000 or €3,000 per semester for most bachelor's programmes, plus a semester fee of about €144.",
      "ევროკავშირის გარეთა ქვეყნების სტუდენტებისთვის, ვინც 2024–2025 წლის ზამთრის სემესტრიდან ირიცხება: საბაკალავრო პროგრამების უმეტესობაზე სემესტრში 2 000 ან 3 000 ევრო, პლუს სემესტრული მოსაკრებელი — დაახლოებით 144 ევრო.",
    ),
    funding: [l("TUM offers some scholarships and fee exemptions for excellent students; DAAD mainly funds master's students.", "TUM გამორჩეულ სტუდენტებს ზოგიერთ სტიპენდიასა და საფასურისგან გათავისუფლებას სთავაზობს; DAAD ძირითადად მაგისტრანტებს აფინანსებს.")],
    deadlines: l("For the winter semester, usually by 31 May or 15 July depending on the programme.", "ზამთრის სემესტრისთვის, ჩვეულებრივ, 31 მაისამდე ან 15 ივლისამდე — პროგრამის მიხედვით."),
    considerations: [l("Munich is expensive for housing; start looking for a room early.", "მიუნხენში საცხოვრებელი ძვირია; ოთახის ძებნა ადრე დაიწყე.")],
    sources: [{ label: "TUM — tuition fees for non-EU students", url: "https://www.tum.de/en/studies/fees/tuition" }, SRC_DAAD],
  },
  {
    id: "charite",
    name: l("Charité — Universitätsmedizin Berlin", "შარიტე — ბერლინის საუნივერსიტეტო მედიცინა"),
    short: "Charité",
    country: l("Germany", "გერმანია"),
    city: l("Berlin", "ბერლინი"),
    region: "europe",
    kind: "public",
    website: "https://www.charite.de/en/",
    fields: ["medicine"],
    languages: l("German (C1 required)", "გერმანული (საჭიროა C1)"),
    summary: l("One of Europe's largest university hospitals and medical schools. Medicine is taught in German and costs no tuition — but places for non-EU applicants are very few.", "ევროპის ერთ-ერთი უდიდესი საუნივერსიტეტო კლინიკა და სამედიცინო სკოლა. მედიცინა გერმანულად ისწავლება და სწავლის საფასური არ არის — თუმცა ევროკავშირის გარეთა ქვეყნებიდან აპლიკანტებისთვის ადგილები ძალიან ცოტაა."),
    strengths: { medicine: l("Top-level medicine with no tuition fees, if you master German and have excellent grades.", "მაღალი დონის მედიცინა სწავლის საფასურის გარეშე, თუ გერმანულს კარგად დაეუფლები და შესანიშნავი ნიშნები გაქვს.") },
    admission: [
      l("Prove German at C1 level.", "დაადასტურე გერმანული C1 დონეზე."),
      l("Non-EU applicants apply through uni-assist; about 5% of places are reserved for them and are given by school grades (around 16 places for about 500 applicants).", "ევროკავშირის გარეთა ქვეყნების აპლიკანტები uni-assist-ის სისტემით აგზავნიან განაცხადს; მათთვის ადგილების დაახლოებით 5%-ია დაჯავშნილი და ატესტატის ნიშნების მიხედვით ნაწილდება (დაახლოებით 500 აპლიკანტზე — 16 ადგილი)."),
      ABROAD_DOCUMENTS,
    ],
    tuition: l("No tuition fees; a semester contribution of roughly €300–400, which includes a public transport ticket.", "სწავლის საფასური არ არის; სემესტრული შენატანი დაახლოებით 300–400 ევროა და საზოგადოებრივი ტრანსპორტის ბილეთსაც მოიცავს."),
    funding: [l("Living costs in Berlin must be covered by you (often proven with a blocked account for the visa).", "ბერლინში ცხოვრების ხარჯები თავად უნდა დაფარო (ვიზისთვის ხშირად დაბლოკილი ანგარიშით დასტურდება).")],
    deadlines: l("Check the international applicants page for the winter and summer semester deadlines.", "ზამთრისა და ზაფხულის სემესტრების ვადები უცხოელი აპლიკანტების გვერდზე ნახე."),
    considerations: [l("Only a handful of places: have a plan B (for example a Georgian medical university or Semmelweis).", "ადგილები სულ რამდენიმეა: გქონდეს სარეზერვო გეგმა (მაგალითად, ქართული სამედიცინო უნივერსიტეტი ან ზემელვაისი).")],
    sources: [{ label: "Charité — medicine for international applicants", url: "https://www.charite.de/en/teaching_learning/application_admission/medicine_dentistry_international/" }],
  },
  {
    id: "udk",
    name: l("Berlin University of the Arts", "ბერლინის ხელოვნების უნივერსიტეტი"),
    short: "UdK",
    country: l("Germany", "გერმანია"),
    city: l("Berlin", "ბერლინი"),
    region: "europe",
    kind: "public",
    website: "https://www.udk-berlin.de/en/",
    fields: ["art"],
    languages: l("German (B2–C1 depending on the programme)", "გერმანული (B2–C1 — პროგრამის მიხედვით)"),
    summary: l("One of Europe's largest art universities: fine arts, design, music and performing arts — tuition-free.", "ევროპის ერთ-ერთი უდიდესი სახელოვნებო უნივერსიტეტი: სახვითი ხელოვნება, დიზაინი, მუსიკა და საშემსრულებლო ხელოვნება — სწავლის საფასურის გარეშე."),
    strengths: { art: l("A free, highly regarded art education in one of Europe's art capitals — admission depends on talent, not money.", "უფასო და მაღალი რეპუტაციის სახელოვნებო განათლება ევროპის ერთ-ერთ ხელოვნების დედაქალაქში — მიღება ნიჭზეა დამოკიდებული და არა ფულზე.") },
    admission: [
      l("Apply by the deadline; 3–4 weeks later you are invited to submit an artistic portfolio (digital or on paper).", "განაცხადი ვადაში გააგზავნე; 3–4 კვირის შემდეგ მხატვრული პორტფოლიოს წარდგენას გთხოვენ (ციფრულად ან ქაღალდზე)."),
      l("If the portfolio is selected, take the entrance examination.", "თუ პორტფოლიოს შეარჩევენ, მისაღებ გამოცდაზე მიგიწვევენ."),
      l("Prove German (full C1 for enrolment in most programmes).", "დაადასტურე გერმანული (პროგრამების უმეტესობაზე ჩარიცხვისთვის სრული C1)."),
    ],
    tuition: l("No tuition fees; a semester contribution of about €315 (includes a Berlin transport ticket). Budget €300–1,000 a year for art materials.", "სწავლის საფასური არ არის; სემესტრული შენატანი დაახლოებით 315 ევროა (ბერლინის სატრანსპორტო ბილეთით). სახატავი მასალებისთვის წელიწადში 300–1 000 ევრო გაითვალისწინე."),
    funding: [l("Living costs are yours to cover; look for DAAD or foundation scholarships once enrolled.", "ცხოვრების ხარჯები შენზეა; ჩარიცხვის შემდეგ DAAD-ის ან ფონდების სტიპენდიები მოძებნე.")],
    deadlines: l("The application period and the portfolio and exam dates are published each year in the fine arts application guide.", "განაცხადის პერიოდი, პორტფოლიოსა და გამოცდის თარიღები ყოველწლიურად ქვეყნდება სახვითი ხელოვნების განაცხადის სახელმძღვანელოში."),
    considerations: [l("Very competitive: prepare a strong, personal portfolio, not school exercises.", "ძალიან კონკურენტულია: მოამზადე ძლიერი, პირადი პორტფოლიო და არა სასკოლო სავარჯიშოები.")],
    sources: [{ label: "UdK Berlin — fine arts application guide", url: "https://www.udk-berlin.de/en/application/applicationguide/fine-arts/" }, { label: "UdK Berlin — language requirements", url: "https://www.udk-berlin.de/en/application/language-certificate/" }],
  },
  {
    id: "polimi",
    name: l("Politecnico di Milano", "მილანის პოლიტექნიკური უნივერსიტეტი"),
    short: "PoliMi",
    country: l("Italy", "იტალია"),
    city: l("Milan", "მილანი"),
    region: "europe",
    kind: "public",
    website: "https://www.polimi.it/en",
    fields: ["cs", "art"],
    languages: l("Italian and English, depending on the programme", "იტალიური და ინგლისური — პროგრამის მიხედვით"),
    summary: l("Italy's leading technical university, known worldwide for design and architecture as well as engineering and computer science.", "იტალიის წამყვანი ტექნიკური უნივერსიტეტი, მსოფლიოში ცნობილი დიზაინითა და არქიტექტურით, ასევე ინჟინერიითა და კომპიუტერული მეცნიერებით."),
    strengths: {
      cs: l("Strong computer engineering with fees that depend on family income.", "ძლიერი კომპიუტერული ინჟინერია, საფასურით, რომელიც ოჯახის შემოსავალზეა დამოკიდებული."),
      art: l("One of the best design schools in Europe, in the design capital Milan.", "ევროპის ერთ-ერთი საუკეთესო დიზაინის სკოლა, დიზაინის დედაქალაქ მილანში."),
    },
    admission: [
      l("Take the university's admission test (TOL for engineering, a design-specific test for design) and apply online.", "ჩააბარე უნივერსიტეტის მისაღები ტესტი (ინჟინერიისთვის — TOL, დიზაინისთვის — სპეციალური ტესტი) და განაცხადი ონლაინ გააგზავნე."),
      l("Prove Italian or English at the level the programme requires.", "დაადასტურე იტალიური ან ინგლისური იმ დონეზე, რომელსაც პროგრამა ითხოვს."),
      ABROAD_DOCUMENTS,
    ],
    tuition: l("Bachelor's fees are the same for EU and non-EU students and depend on family income: roughly €900 to €4,000 a year.", "ბაკალავრიატის საფასური ევროკავშირისა და სხვა ქვეყნების სტუდენტებისთვის ერთნაირია და ოჯახის შემოსავალზეა დამოკიდებული: წელიწადში დაახლოებით 900-დან 4 000 ევრომდე."),
    funding: [l("Merit scholarships from the university and regional study grants for low-income students.", "უნივერსიტეტის აკადემიური სტიპენდიები და რეგიონული დახმარება დაბალშემოსავლიანი სტუდენტებისთვის.")],
    deadlines: l("Several application rounds from autumn to spring for the following year; check the calendar.", "მომდევნო წლისთვის განაცხადის რამდენიმე ტურია — შემოდგომიდან გაზაფხულამდე; კალენდარი გადაამოწმე."),
    considerations: [l("Documenting family income from abroad takes time; start early.", "საზღვარგარეთიდან ოჯახის შემოსავლის დადასტურებას დრო სჭირდება; ადრე დაიწყე.")],
    sources: [{ label: "Politecnico di Milano — fees for bachelor's programmes", url: "https://www.polimi.it/en/prospective-students/how-much-does-it-cost/laurea-laurea-magistrale-and-single-cycle-programmes" }],
  },
  {
    id: "aalto",
    name: l("Aalto University", "აალტოს უნივერსიტეტი"),
    short: "Aalto",
    country: l("Finland", "ფინეთი"),
    city: l("Espoo and Helsinki", "ესპო და ჰელსინკი"),
    region: "europe",
    kind: "public",
    website: "https://www.aalto.fi/en",
    fields: ["cs", "art"],
    languages: l("English (for the English-taught bachelor's programmes)", "ინგლისური (ინგლისურენოვან საბაკალავრო პროგრამებზე)"),
    summary: l("A Finnish university combining technology, business, art and design, with English-taught bachelor's programmes and generous scholarships.", "ფინეთის უნივერსიტეტი, სადაც ტექნოლოგია, ბიზნესი, ხელოვნება და დიზაინი ერთადაა — ინგლისურენოვანი საბაკალავრო პროგრამებითა და გულუხვი სტიპენდიებით."),
    strengths: {
      cs: l("Modern computer science in English, in a country known for education and technology.", "თანამედროვე კომპიუტერული მეცნიერება ინგლისურად, განათლებითა და ტექნოლოგიებით ცნობილ ქვეყანაში."),
      art: l("Design and art in English — rare among Europe's strong public universities.", "დიზაინი და ხელოვნება ინგლისურად — ევროპის ძლიერ სახელმწიფო უნივერსიტეტებს შორის იშვიათობა."),
    },
    admission: [
      l("Apply online to the English-taught bachelor's programmes (usually in January), with school grades and an English test.", "განაცხადი ონლაინ გააგზავნე ინგლისურენოვან საბაკალავრო პროგრამებზე (ჩვეულებრივ, იანვარში) — ნიშნებითა და ინგლისურის ტესტით."),
      l("Apply for the scholarship in the same application — there is no separate later round.", "სტიპენდია იმავე განაცხადში მოითხოვე — მისთვის ცალკე, მოგვიანებით ეტაპი არ არის."),
    ],
    tuition: l("Non-EU students: about €12,000–15,000 a year for English-taught bachelor's programmes.", "ევროკავშირის გარეთა ქვეყნების სტუდენტებისთვის ინგლისურენოვანი ბაკალავრიატი წელიწადში დაახლოებით 12 000–15 000 ევრო ღირს."),
    funding: [l("Aalto Excellence Scholarship: a full (100%) or partial (50%) tuition waiver, decided together with admission.", "აალტოს სტიპენდია წარჩინებულთათვის (Excellence Scholarship): სწავლის საფასურისგან სრული (100%) ან ნაწილობრივი (50%) გათავისუფლება, რომელზეც გადაწყვეტილება ჩარიცხვასთან ერთად მიიღება.")],
    deadlines: l("Bachelor's application period usually in January; check the admission services page.", "ბაკალავრიატის განაცხადის პერიოდი, ჩვეულებრივ, იანვარშია; მიღების სამსახურის გვერდი გადაამოწმე."),
    considerations: [l("Winters are long and dark; Helsinki is expensive but safe and well organised.", "ზამთარი გრძელი და ბნელია; ჰელსინკი ძვირია, თუმცა უსაფრთხო და კარგად ორგანიზებული.")],
    sources: [{ label: "Aalto — scholarships and tuition fees", url: "https://www.aalto.fi/en/admission-services/scholarships-and-tuition-fees" }, { label: "Aalto — English-taught bachelor's programmes", url: "https://www.aalto.fi/en/admission-services/apply-to-bachelors-programmes-in-english" }],
  },
  {
    id: "karolinska",
    name: l("Karolinska Institutet", "კაროლინსკას ინსტიტუტი"),
    short: "KI",
    country: l("Sweden", "შვედეთი"),
    city: l("Stockholm", "სტოკჰოლმი"),
    region: "europe",
    kind: "public",
    website: "https://education.ki.se",
    fields: ["medicine"],
    languages: l("Swedish (the medical programme is taught entirely in Swedish)", "შვედური (სამედიცინო პროგრამა მთლიანად შვედურადაა)"),
    summary: l("One of the world's leading medical universities (its Nobel Assembly awards the Nobel Prize in Physiology or Medicine). Its six-year medical programme is in Swedish and very expensive for non-EU students.", "მსოფლიოს ერთ-ერთი წამყვანი სამედიცინო უნივერსიტეტი (ფიზიოლოგიასა და მედიცინაში ნობელის პრემიას სწორედ მისი ასამბლეა ანიჭებს). ექვსწლიანი სამედიცინო პროგრამა შვედურადაა და ევროკავშირის გარეთა ქვეყნების სტუდენტებისთვის ძალიან ძვირია."),
    strengths: { medicine: l("Research medicine at the very top — realistic mainly for master's or PhD study later.", "უმაღლესი დონის კვლევითი მედიცინა — უმეტესად რეალისტური მოგვიანებით, მაგისტრატურისა ან დოქტორანტურისთვის.") },
    admission: [
      l("Prove Swedish at the level of Swedish upper secondary school, plus the required science subjects.", "დაადასტურე შვედური ენის ცოდნა შვედეთის საშუალო სკოლის დონეზე და საჭირო საბუნებისმეტყველო საგნების ცოდნა."),
      l("Apply through the Swedish national admissions system.", "განაცხადი შვედეთის ეროვნული მიღების სისტემით გააგზავნე."),
    ],
    tuition: l("Non-EU citizens: SEK 1,560,000 for the whole six-year medical programme, plus Stockholm living costs.", "ევროკავშირის გარეთა ქვეყნების მოქალაქეებისთვის ექვსწლიანი სამედიცინო პროგრამა სულ 1 560 000 შვედური კრონა ღირს, პლუს სტოკჰოლმში ცხოვრების ხარჯები."),
    funding: [l("Few scholarships at bachelor's level; the Swedish Institute's scholarships are for master's students.", "ბაკალავრიატზე სტიპენდია ცოტაა; შვედეთის ინსტიტუტის სტიპენდიები მაგისტრანტებისთვისაა.")],
    deadlines: l("National application rounds in spring for the autumn semester; check the official FAQ.", "ეროვნული განაცხადის ტურები გაზაფხულზეა საშემოდგომო სემესტრისთვის; ოფიციალური FAQ გადაამოწმე."),
    considerations: [l("For most Georgian students a better plan is medicine at home or in Hungary, then a master's or PhD at KI.", "ქართველი მოსწავლეების უმეტესობისთვის უკეთესი გეგმაა მედიცინა საქართველოში ან უნგრეთში, შემდეგ კი მაგისტრატურა ან დოქტორანტურა KI-ში.")],
    sources: [{ label: "Karolinska Institutet — medical programme FAQ", url: "https://education.ki.se/bachelors-masters-studies/programmes-in-swedish/study-programme-in-medicine/faq-medical-programme" }],
  },
  {
    id: "semmelweis",
    name: l("Semmelweis University", "ზემელვაისის უნივერსიტეტი"),
    short: "Semmelweis",
    country: l("Hungary", "უნგრეთი"),
    city: l("Budapest", "ბუდაპეშტი"),
    region: "europe",
    kind: "public",
    website: "https://semmelweis.hu/admission/",
    fields: ["medicine"],
    languages: l("English, German or Hungarian", "ინგლისური, გერმანული ან უნგრული"),
    summary: l("Hungary's oldest medical university, with a long-established English-taught general medicine programme and the Stipendium Hungaricum scholarship open to Georgians.", "უნგრეთის უძველესი სამედიცინო უნივერსიტეტი, დიდი ხნის ინგლისურენოვანი ზოგადი მედიცინის პროგრამით; ქართველებს Stipendium Hungaricum-ის სტიპენდიაზე განაცხადის შეტანა შეუძლიათ."),
    strengths: { medicine: l("A recognised European medical degree in English — and a real full-scholarship route.", "აღიარებული ევროპული სამედიცინო ხარისხი ინგლისურად — და სრული სტიპენდიის რეალური შესაძლებლობა.") },
    admission: [
      l("Apply online and take the entrance examination (biology and chemistry or physics, plus an interview).", "განაცხადი ონლაინ გააგზავნე და ჩააბარე მისაღები გამოცდა (ბიოლოგია და ქიმია ან ფიზიკა, პლუს გასაუბრება)."),
      l("For the scholarship, apply to Stipendium Hungaricum (medicine is its most competitive field).", "სტიპენდიისთვის განაცხადი Stipendium Hungaricum-ში გააგზავნე (მედიცინა მისი ყველაზე კონკურენტული მიმართულებაა)."),
      ABROAD_DOCUMENTS,
    ],
    tuition: l("Official 2026 tuition table: general medicine in English US$10,450 per semester (US$20,900 a year), plus application and enrolment fees and living costs.", "2026 წლის ოფიციალური ცხრილით: ზოგადი მედიცინა ინგლისურად — სემესტრში 10 450 აშშ დოლარი (წელიწადში 20 900), პლუს განაცხადისა და ჩარიცხვის მოსაკრებლები და ცხოვრების ხარჯები."),
    funding: [
      l("Stipendium Hungaricum (Hungarian government): full tuition, a monthly stipend, a dormitory place and health insurance. Georgian citizens are eligible; the 2026–27 call closed on 15 January 2026. The International Education Center in Tbilisi is the national contact.", "Stipendium Hungaricum (უნგრეთის მთავრობა): სწავლის სრული საფასური, ყოველთვიური სტიპენდია, ადგილი საერთო საცხოვრებელში და ჯანმრთელობის დაზღვევა. საქართველოს მოქალაქეებს განაცხადის შეტანა შეუძლიათ; 2026–2027 წლის კონკურსი 2026 წლის 15 იანვარს დაიხურა. საქართველოში საკონტაქტო უწყება საერთაშორისო განათლების ცენტრია."),
    ],
    deadlines: l("Stipendium Hungaricum: mid-January; self-funded applications usually through spring (check the admission page).", "Stipendium Hungaricum — იანვრის შუა რიცხვები; საკუთარი ხარჯით სწავლის განაცხადები, ჩვეულებრივ, გაზაფხულის განმავლობაში (მიღების გვერდი გადაამოწმე)."),
    considerations: [l("Check how you will get your diploma recognised and licensed in the country where you want to work.", "გადაამოწმე, როგორ აღიარებენ დიპლომს და როგორ მიიღებ ლიცენზიას იმ ქვეყანაში, სადაც მუშაობა გინდა.")],
    sources: [
      { label: "Semmelweis — fees and costs of application and enrolment", url: "https://semmelweis.hu/admission/2025/04/16/fees-and-costs-of-the-application-and-enrollment-procedure-5/" },
      { label: "Stipendium Hungaricum — call for applications 2026–27", url: "https://stipendiumhungaricum.hu/wp-content/uploads/2025/10/BA_MA_OTM_Call_for_Applications_2026_27.pdf" },
      SRC_HUNGARICUM,
    ],
  },
  {
    id: "metu",
    name: l("Middle East Technical University", "ახლო აღმოსავლეთის ტექნიკური უნივერსიტეტი"),
    short: "METU",
    country: l("Türkiye", "თურქეთი"),
    city: l("Ankara", "ანკარა"),
    region: "europe",
    kind: "public",
    website: "https://www.metu.edu.tr",
    fields: ["cs"],
    languages: l("English", "ინგლისური"),
    summary: l("One of Türkiye's strongest technical universities, teaching in English — close to Georgia, and reachable with a full Türkiye Scholarship.", "თურქეთის ერთ-ერთი უძლიერესი ტექნიკური უნივერსიტეტი ინგლისურენოვანი სწავლებით — საქართველოსთან ახლოს და ხელმისაწვდომი თურქეთის სრული სტიპენდიით."),
    strengths: { cs: l("English-taught computer engineering with a good reputation, at low cost or fully funded.", "ინგლისურენოვანი კომპიუტერული ინჟინერია კარგი რეპუტაციით — დაბალ ფასად ან სრული დაფინანსებით.") },
    admission: [
      l("Apply to METU's international admissions with your school results and accepted exam scores (for example SAT) and English proficiency.", "განაცხადი METU-ის საერთაშორისო მიღებაში გააგზავნე — სკოლის შედეგებით, აღიარებული გამოცდის ქულებით (მაგალითად, SAT) და ინგლისურის ცოდნით."),
      l("Or apply to Türkiye Scholarships (Türkiye Bursları) and list METU among your choices.", "ან განაცხადი თურქეთის სტიპენდიაზე (Türkiye Bursları) გააგზავნე და არჩევანში METU მიუთითე."),
    ],
    tuition: l("As a state university its fees for international students are low compared with Western Europe; the exact amount is set every year.", "METU სახელმწიფო უნივერსიტეტია, ამიტომ უცხოელი სტუდენტების საფასური დასავლეთ ევროპასთან შედარებით დაბალია; ზუსტ თანხას ყოველწლიურად ადგენენ."),
    funding: [l("Türkiye Scholarships: tuition, accommodation, a monthly stipend, health insurance and a return flight — open to students from Georgia.", "თურქეთის სტიპენდია: სწავლის საფასური, საცხოვრებელი, ყოველთვიური სტიპენდია, ჯანმრთელობის დაზღვევა და ორმხრივი ავიაბილეთი — საქართველოს მოქალაქეებისთვისაც ხელმისაწვდომია.")],
    deadlines: l("Türkiye Scholarships usually open in January–February; METU's own international rounds run in spring.", "თურქეთის სტიპენდიაზე განაცხადი, ჩვეულებრივ, იანვარ-თებერვალში იხსნება; METU-ის საკუთარი საერთაშორისო ტურები გაზაფხულზეა."),
    considerations: [l("Scholarship holders usually do a year of Turkish language preparation first.", "სტიპენდიანტები, ჩვეულებრივ, ჯერ ერთწლიან თურქული ენის მოსამზადებელ კურსს გადიან.")],
    sources: [{ label: "METU — scholarship opportunities", url: "https://iso.metu.edu.tr/en/scholarship-opportunities" }, SRC_TURKIYE],
  },

  /* ================================= Asia ================================= */
  {
    id: "nus",
    name: l("National University of Singapore", "სინგაპურის ეროვნული უნივერსიტეტი"),
    short: "NUS",
    country: l("Singapore", "სინგაპური"),
    city: l("Singapore", "სინგაპური"),
    region: "asia",
    kind: "public",
    website: "https://nus.edu.sg",
    fields: ["cs"],
    languages: l("English", "ინგლისური"),
    summary: l("Asia's top-ranked university, strong in computing, in a safe, English-speaking city-state with a large tech industry.", "აზიის ერთ-ერთი საუკეთესო უნივერსიტეტი, ძლიერი კომპიუტერული მეცნიერებით — უსაფრთხო, ინგლისურენოვან ქალაქ-სახელმწიფოში დიდი ტექნოლოგიური ინდუსტრიით."),
    strengths: { cs: l("Top computer science with a direct route into Asia's tech jobs.", "უმაღლესი დონის კომპიუტერული მეცნიერება და პირდაპირი გზა აზიის ტექნოლოგიურ სამუშაოებზე.") },
    admission: [
      l("Apply online with your school results and required tests; many courses also consider olympiad and project achievements.", "განაცხადი ონლაინ გააგზავნე სკოლის შედეგებითა და საჭირო ტესტებით; ბევრი პროგრამა ოლიმპიადებსა და პროექტებსაც ითვალისწინებს."),
      l("Apply for the Tuition Grant in the same application if you want the lower fee.", "თუ დაბალი საფასური გინდა, სასწავლო გრანტი (Tuition Grant) იმავე განაცხადში მოითხოვე."),
    ],
    tuition: l(
      "International fees are in the tens of thousands of Singapore dollars a year; with the government Tuition Grant they fall by roughly 30–50% (for example, arts and social sciences 2026–27: S$21,900 with the grant, S$41,800 without). Computing is set separately — see the official fee table.",
      "უცხოელების საფასური წელიწადში ათეულობით ათასი სინგაპურის დოლარია; მთავრობის სასწავლო გრანტით (Tuition Grant) ის დაახლოებით 30–50%-ით მცირდება (მაგალითად, ჰუმანიტარული და სოციალური მეცნიერებები 2026–2027 წელს: გრანტით 21 900, გრანტის გარეშე — 41 800 სინგაპურის დოლარი). კომპიუტერული მეცნიერების საფასური ცალკეა მითითებული — იხ. ოფიციალური ცხრილი.",
    ),
    funding: [
      l("MOE Tuition Grant: in return you work for three years for a Singapore-registered employer after graduating.", "განათლების სამინისტროს სასწავლო გრანტი: სანაცვლოდ, დამთავრების შემდეგ სამი წელი სინგაპურში რეგისტრირებულ დამსაქმებელთან უნდა იმუშაო."),
      l("NUS International Undergraduate Scholarship and need-based financial aid.", "NUS-ის საერთაშორისო სტიპენდია ბაკალავრებისთვის და საჭიროებაზე დაფუძნებული ფინანსური დახმარება."),
    ],
    deadlines: l("Applications for August entry usually close in the first months of the year; check the admissions calendar.", "აგვისტოში დაწყებულ სწავლაზე განაცხადების მიღება, ჩვეულებრივ, წლის პირველ თვეებში სრულდება; მიღების კალენდარი გადაამოწმე."),
    considerations: [l("The three-year work bond is a real commitment — read the terms before accepting the grant.", "სამწლიანი სამუშაო ვალდებულება სერიოზული პირობაა — გრანტის მიღებამდე პირობები წაიკითხე.")],
    sources: [
      { label: "NUS — undergraduate tuition fees", url: "https://www.nus.edu.sg/registrar/docs/default-source/administrative-policies-procedures/ugtuitioncurrent.pdf" },
      { label: "Singapore MOE — Tuition Grant Scheme", url: "https://www.moe.gov.sg/financial-matters/tuition-grant-scheme" },
      { label: "NUS International Undergraduate Scholarship", url: "https://nus.edu.sg/oam/scholarships/scholarships-for-freshmen-singapore-permanent-residents/nus-international-undergraduate-scholarship" },
    ],
  },
  {
    id: "kaist",
    name: l("KAIST (Korea Advanced Institute of Science and Technology)", "KAIST — კორეის მეცნიერებისა და ტექნოლოგიების მოწინავე ინსტიტუტი"),
    short: "KAIST",
    country: l("South Korea", "სამხრეთ კორეა"),
    city: l("Daejeon", "დეჯონი"),
    region: "asia",
    kind: "public",
    website: "https://admission.kaist.ac.kr",
    fields: ["cs"],
    languages: l("English for international undergraduates (most courses at KAIST are in English)", "უცხოელი ბაკალავრებისთვის ინგლისური (KAIST-ში კურსების უმეტესობა ინგლისურადაა)"),
    summary: l("South Korea's leading science and technology university. International undergraduates who are admitted automatically receive the KAIST Scholarship.", "სამხრეთ კორეის წამყვანი მეცნიერებისა და ტექნოლოგიების უნივერსიტეტი. ჩარიცხული უცხოელი ბაკალავრები KAIST-ის სტიპენდიას ავტომატურად იღებენ."),
    strengths: { cs: l("Excellent computer science, taught in English, essentially free for admitted international students.", "შესანიშნავი კომპიუტერული მეცნიერება ინგლისურად, ჩარიცხული უცხოელი სტუდენტებისთვის პრაქტიკულად უფასოდ.") },
    admission: [
      l("Apply online to KAIST's international undergraduate admission with school results, recommendations and English proficiency.", "განაცხადი ონლაინ გააგზავნე KAIST-ის უცხოელ ბაკალავრთა მიღებაზე — სკოლის შედეგებით, რეკომენდაციებითა და ინგლისურის ცოდნით."),
      l("There is no separate scholarship application.", "სტიპენდიისთვის ცალკე განაცხადი საჭირო არ არის."),
    ],
    tuition: l("Covered by the KAIST Scholarship for all eight semesters.", "რვავე სემესტრის საფასურს KAIST-ის სტიპენდია ფარავს."),
    funding: [
      l("KAIST Scholarship: full tuition and a monthly stipend (reported at about KRW 350,000).", "KAIST-ის სტიპენდია: სწავლის სრული საფასური და ყოველთვიური სტიპენდია (დაახლოებით 350 000 კორეული ვონი)."),
      l("Global Korea Scholarship (government): full tuition, a monthly stipend of about KRW 900,000–1,000,000, airfare and insurance; check whether Georgia is on that year's country list.", "კორეის მთავრობის სტიპენდია (GKS): სწავლის სრული საფასური, ყოველთვიური სტიპენდია დაახლოებით 900 000–1 000 000 ვონი, ავიაბილეთი და დაზღვევა; გადაამოწმე, არის თუ არა საქართველო იმ წლის ქვეყნების სიაში."),
    ],
    deadlines: l("International undergraduate rounds usually run from autumn to early winter for spring or autumn entry; check the admission site.", "უცხოელ ბაკალავრთა მიღების ტურები, ჩვეულებრივ, შემოდგომიდან ზამთრის დასაწყისამდე მიმდინარეობს; მიღების ვებგვერდი გადაამოწმე."),
    considerations: [l("Everyday life outside the campus is in Korean: learning some Korean helps a lot.", "კამპუსის გარეთ ყოველდღიური ცხოვრება კორეულადაა: კორეულის ცოტათი მაინც სწავლა ძალიან დაგეხმარება.")],
    sources: [
      { label: "KAIST — admissions", url: "https://admission.kaist.ac.kr" },
      { label: "Korea.net — 2026 Global Korea Scholarship", url: "https://www.korea.net/NewsFocus/Society/view?articleId=278471" },
    ],
  },
];

/* ------------------------------ field guides ------------------------------ */

export interface FieldPath {
  title: L;
  text: L;
  universities: string[];
}

export interface FieldGuide {
  id: GuideField;
  title: L;
  intro: L;
  /** What to compare when choosing. */
  lookFor: L[];
  /** "If this is you, look here" — honest routes rather than a single ranking. */
  paths: FieldPath[];
  bottomLine: L;
}

export const FIELD_GUIDES: FieldGuide[] = [
  {
    id: "cs",
    title: l("Which university for computer science?", "რომელი უნივერსიტეტი ავირჩიო კომპიუტერული მეცნიერებისთვის?"),
    intro: l(
      "There is no single best university — there is a best one for your grades, languages and budget. Computer science is taught well in many places, and what you build during your studies (projects, internships, olympiads) matters as much as the name on the diploma.",
      "ერთი საუკეთესო უნივერსიტეტი არ არსებობს — არსებობს საუკეთესო შენი ნიშნებისთვის, ენებისთვის და ბიუჯეტისთვის. კომპიუტერულ მეცნიერებას ბევრგან კარგად ასწავლიან და სწავლისას შექმნილი ნამუშევრები (პროექტები, სტაჟირება, ოლიმპიადები) დიპლომზე დაწერილ სახელზე არანაკლებ მნიშვნელოვანია.",
    ),
    lookFor: [
      l("How much mathematics and theory the programme has, and how much programming practice.", "რამდენი მათემატიკა და თეორიაა პროგრამაში და რამდენი — პროგრამირების პრაქტიკა."),
      l("Teaching language: can you study technical subjects in it from the first day?", "სწავლების ენა: შეძლებ თუ არა მასზე ტექნიკური საგნების სწავლას პირველივე დღიდან?"),
      l("The full cost for four years (tuition + living), not just the first year.", "ოთხი წლის სრული ღირებულება (სწავლა + ცხოვრება) და არა მარტო პირველი წლისა."),
      l("Internships and companies nearby; where graduates work.", "სტაჟირება და ახლომდებარე კომპანიები; სად მუშაობენ კურსდამთავრებულები."),
    ],
    paths: [
      {
        title: l("Free, in Georgia", "უფასოდ, საქართველოში"),
        text: l(
          "TSU (Georgian or English track) and KIU (English, designed with TUM) are the strongest free options; GTU if you prefer engineering and hardware; Ilia for internationally accredited computer engineering, if you win one of its few places.",
          "თსუ (ქართული ან ინგლისურენოვანი ნაკადი) და KIU (ინგლისურად, TUM-თან ერთად შექმნილი) ყველაზე ძლიერი უფასო არჩევანია; სტუ — თუ ინჟინერია და აპარატურა უფრო გიზიდავს; ილიაუნი — საერთაშორისოდ აკრედიტებული კომპიუტერული ინჟინერიისთვის, თუ მის ერთ-ერთ მცირერიცხოვან ადგილს მოიპოვებ.",
        ),
        universities: ["tsu", "kiu", "gtu", "iliauni"],
      },
      {
        title: l("Private in Georgia, with scholarships", "კერძო, საქართველოში, სტიპენდიებით"),
        text: l("Free University's MACS is demanding and respected by employers; compare its cost after scholarships with a free state place.", "თავისუფალი უნივერსიტეტის MACS მომთხოვნია და დამსაქმებლებიც აფასებენ; სტიპენდიის შემდეგ დარჩენილი ღირებულება უფასო სახელმწიფო ადგილს შეადარე."),
        universities: ["freeuni"],
      },
      {
        title: l("Excellent and affordable in Europe", "შესანიშნავი და ხელმისაწვდომი ევროპაში"),
        text: l(
          "ETH Zurich (German, CHF 2,190 per semester) and TUM (€2,000–3,000 per semester) give top education for moderate fees; Politecnico di Milano charges by family income; Aalto has full scholarships; METU can be fully funded by Türkiye Scholarships.",
          "ციურიხის ETH (გერმანულად, სემესტრში 2 190 ფრანკი) და TUM (სემესტრში 2 000–3 000 ევრო) ზომიერ ფასად უმაღლესი დონის განათლებას იძლევა; მილანის პოლიტექნიკური საფასურს ოჯახის შემოსავლის მიხედვით ადგენს; აალტოს სრული სტიპენდიები აქვს; METU-ში სწავლის სრული დაფინანსება თურქეთის სტიპენდიით შეიძლება.",
        ),
        universities: ["eth", "tum", "polimi", "aalto", "metu"],
      },
      {
        title: l("Full scholarship in Asia", "სრული სტიპენდია აზიაში"),
        text: l("KAIST gives every admitted international undergraduate a full-tuition scholarship; NUS lowers fees with a grant in exchange for three years of work in Singapore.", "KAIST ყველა ჩარიცხულ უცხოელ ბაკალავრს სრული საფასურის სტიპენდიას აძლევს; NUS საფასურს გრანტით ამცირებს — სინგაპურში სამწლიანი მუშაობის სანაცვლოდ."),
        universities: ["kaist", "nus"],
      },
      {
        title: l("The very top — for exceptional applicants", "ყველაზე მაღალი დონე — გამორჩეული აპლიკანტებისთვის"),
        text: l(
          "MIT meets the full financial need of admitted international students, so it can cost less than a private Georgian university — but very few are admitted. Oxford and Toronto are excellent but, apart from rare scholarships (Toronto's Pearson), very expensive.",
          "MIT ჩარიცხული უცხოელი სტუდენტების ფინანსურ საჭიროებას სრულად ფარავს, ამიტომ შეიძლება ქართულ კერძო უნივერსიტეტზე იაფიც დაჯდეს — თუმცა ძალიან ცოტას იღებენ. ოქსფორდი და ტორონტო შესანიშნავია, მაგრამ, იშვიათი სტიპენდიების გარდა (ტორონტოს პირსონის სტიპენდია), ძალიან ძვირია.",
        ),
        universities: ["mit", "oxford", "toronto"],
      },
    ],
    bottomLine: l(
      "A good plan: aim high abroad where aid is generous (MIT, KAIST, Aalto, Türkiye Scholarships), and keep a free place at TSU or KIU as a strong fallback.",
      "კარგი გეგმა: საზღვარგარეთ მაღალი მიზანი დაისახე იქ, სადაც დახმარება გულუხვია (MIT, KAIST, აალტო, თურქეთის სტიპენდია), და სარეზერვოდ თსუ-ში ან KIU-ში უფასო ადგილი გქონდეს.",
    ),
  },
  {
    id: "medicine",
    title: l("Which university for medicine?", "რომელი უნივერსიტეტი ავირჩიო მედიცინისთვის?"),
    intro: l(
      "Medicine is long (six years plus residency), expensive abroad and strictly regulated: where you study decides where you can work as a doctor. Choose the country you want to practise in first, then the university.",
      "მედიცინა ხანგრძლივია (ექვსი წელი და რეზიდენტურა), საზღვარგარეთ ძვირია და მკაცრად რეგულირდება: სადაც ისწავლი, ის განსაზღვრავს, სად შეძლებ ექიმად მუშაობას. ჯერ ის ქვეყანა აირჩიე, სადაც მუშაობა გინდა, შემდეგ — უნივერსიტეტი.",
    ),
    lookFor: [
      l("Is the degree recognised where you want to work, and what licensing exams follow?", "აღიარებულია თუ არა დიპლომი იქ, სადაც მუშაობა გინდა, და რა სალიცენზიო გამოცდები მოჰყვება?"),
      l("Clinical practice: which hospitals, and how early do you work with patients?", "კლინიკური პრაქტიკა: რომელი კლინიკები და რამდენად ადრე იწყებ პაციენტებთან მუშაობას?"),
      l("The language of the patients: in clinical years you speak with them in the local language.", "პაციენტების ენა: კლინიკურ წლებში პაციენტებს ადგილობრივ ენაზე ელაპარაკები."),
      l("Total cost for six years, and the scholarships you can realistically win.", "ექვსი წლის სრული ღირებულება და სტიპენდიები, რომელთა მოპოვებაც რეალურად შეგიძლია."),
    ],
    paths: [
      {
        title: l("Free, in Georgia", "უფასოდ, საქართველოში"),
        text: l("Tbilisi State Medical University is free for Georgian citizens at a state university from 2026–27 and gives the most direct route to work as a doctor in Georgia.", "თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი, როგორც სახელმწიფო უნივერსიტეტი, 2026–2027 წლიდან საქართველოს მოქალაქისთვის უფასოა და საქართველოში ექიმად მუშაობის ყველაზე პირდაპირი გზაა."),
        universities: ["tsmu"],
      },
      {
        title: l("English-taught in Europe, with a real scholarship chance", "ინგლისურად ევროპაში, სტიპენდიის რეალური შანსით"),
        text: l("Semmelweis costs about US$20,900 a year, but Stipendium Hungaricum — open to Georgians — can cover everything; it is very competitive for medicine.", "ზემელვაისი წელიწადში დაახლოებით 20 900 დოლარი ღირს, თუმცა Stipendium Hungaricum — რომელიც ქართველებისთვისაც ხელმისაწვდომია — ყველაფერს დაფარავს; მედიცინაზე კონკურენცია ძალიან მაღალია."),
        universities: ["semmelweis"],
      },
      {
        title: l("Free, in the local language", "უფასოდ, ადგილობრივ ენაზე"),
        text: l("Charité in Berlin has no tuition, but you need German at C1 and top grades for a handful of places reserved for non-EU applicants.", "ბერლინის შარიტეში სწავლის საფასური არ არის, თუმცა ევროკავშირის გარეთა აპლიკანტებისთვის განკუთვნილი რამდენიმე ადგილისთვის გერმანული C1 დონეზე და უმაღლესი ნიშნები გჭირდება."),
        universities: ["charite"],
      },
      {
        title: l("World-leading, but very expensive for a Georgian student", "მსოფლიოს წამყვანი, მაგრამ ქართველი სტუდენტისთვის ძალიან ძვირი"),
        text: l("Oxford and Karolinska are among the best medical schools anywhere, but for a Georgian student the whole course costs more than £340,000 at Oxford and SEK 1,560,000 at Karolinska, before living costs. Many Georgian doctors go there later, for a master's, PhD or research fellowship.", "ოქსფორდი და კაროლინსკა მსოფლიოს საუკეთესო სამედიცინო სკოლებს შორისაა, თუმცა ქართველი სტუდენტისთვის მთელი კურსი ოქსფორდში 340 000 გირვანქა სტერლინგზე მეტი ჯდება, კაროლინსკაში კი — 1 560 000 შვედური კრონა, საცხოვრებელი ხარჯების გარეშე. ბევრი ქართველი ექიმი იქ მოგვიანებით მიდის — მაგისტრატურაზე, დოქტორანტურაზე ან კვლევით სტაჟირებაზე."),
        universities: ["oxford", "karolinska"],
      },
      {
        title: l("USA and Canada: a bachelor's degree first", "აშშ და კანადა: ჯერ ბაკალავრიატი"),
        text: l("In the United States a bachelor's degree is required before medical school, and in Canada you need at least some university study (at Toronto, from the third year of a bachelor's). International places are few and costs very high.", "აშშ-ში სამედიცინო სკოლამდე ბაკალავრის ხარისხია საჭირო, კანადაში კი — სულ მცირე, რამდენიმე წლის საუნივერსიტეტო სწავლა (ტორონტოში — ბაკალავრიატის მესამე წლიდან). უცხოელებისთვის ადგილები ცოტაა, ხარჯები კი ძალიან მაღალი."),
        universities: ["toronto"],
      },
    ],
    bottomLine: l(
      "For most Georgian students the strongest plan is TSMU (free) or Semmelweis with Stipendium Hungaricum, and specialisation or research abroad later.",
      "ქართველი მოსწავლეების უმეტესობისთვის ყველაზე ძლიერი გეგმაა თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი (უფასოდ) ან ზემელვაისი Stipendium Hungaricum-ით, შემდეგ კი სპეციალიზაცია ან კვლევა საზღვარგარეთ.",
    ),
  },
  {
    id: "art",
    title: l("Which university for art, design, film or music?", "რომელი უნივერსიტეტი ავირჩიო ხელოვნებისთვის, დიზაინისთვის, კინოსთვის ან მუსიკისთვის?"),
    intro: l(
      "In the arts your portfolio or audition decides admission far more than exam scores. Some of the best art schools in Europe charge no tuition — the competition is for talent, not money.",
      "ხელოვნებაში მიღებას გამოცდის ქულებზე ბევრად მეტად პორტფოლიო ან მოსმენა განსაზღვრავს. ევროპის ზოგიერთ საუკეთესო სახელოვნებო სასწავლებელში სწავლის საფასური არ არის — კონკურენცია ნიჭზეა და არა ფულზე.",
    ),
    lookFor: [
      l("The teachers and their work: in the arts you learn from people, not buildings.", "პედაგოგები და მათი ნამუშევრები: ხელოვნებაში ადამიანებისგან სწავლობ და არა შენობებისგან."),
      l("Studios and equipment you can actually use (workshops, cameras, instruments).", "სახელოსნოები და აღჭურვილობა, რომლითაც რეალურად ისარგებლებ (სტუდიები, კამერები, საკრავები)."),
      l("What the portfolio or audition must contain, and when.", "რა უნდა იყოს პორტფოლიოში ან მოსმენაზე და როდის."),
      l("Where graduates exhibit, perform or work.", "სად გამოფენენ, გამოდიან ან მუშაობენ კურსდამთავრებულები."),
    ],
    paths: [
      {
        title: l("Free, in Georgia", "უფასოდ, საქართველოში"),
        text: l("The Academy of Arts (fine art and design), the Theatre and Film University and the Conservatoire are state universities, free from 2026–27 after a creative round or audition.", "სამხატვრო აკადემია (სახვითი ხელოვნება და დიზაინი), თეატრისა და კინოს უნივერსიტეტი და კონსერვატორია სახელმწიფო უნივერსიტეტებია — 2026–2027 წლიდან უფასოდ, შემოქმედებითი ტურის ან მოსმენის შემდეგ."),
        universities: ["art-academy", "tafu", "conservatoire"],
      },
      {
        title: l("Tuition-free in Europe, if you learn the language", "უფასოდ ევროპაში, თუ ენას ისწავლი"),
        text: l("UdK Berlin charges only a semester contribution (about €315); you need a strong portfolio and German.", "ბერლინის UdK მხოლოდ სემესტრულ შენატანს (დაახლოებით 315 ევრო) ითხოვს; ძლიერი პორტფოლიო და გერმანული გჭირდება."),
        universities: ["udk"],
      },
      {
        title: l("Design in English, with scholarships or income-based fees", "დიზაინი ინგლისურად, სტიპენდიით ან შემოსავალზე დამოკიდებული საფასურით"),
        text: l("Aalto offers full and half tuition scholarships; Politecnico di Milano, one of Europe's top design schools, charges by family income.", "აალტო სრულ და ნახევარ სტიპენდიებს სთავაზობს; მილანის პოლიტექნიკური, ევროპის ერთ-ერთი საუკეთესო დიზაინის სკოლა, საფასურს ოჯახის შემოსავლის მიხედვით ადგენს."),
        universities: ["aalto", "polimi"],
      },
      {
        title: l("Famous and expensive", "ცნობილი და ძვირი"),
        text: l("UAL (£30,890 a year) and RISD (well over US$55,000 a year) have great networks, but compare the total cost with the free options before deciding.", "UAL (წელიწადში 30 890 გირვანქა სტერლინგი) და RISD (წელიწადში 55 000 დოლარზე ბევრად მეტი) ფართო კავშირებს გაძლევს, თუმცა გადაწყვეტილებამდე სრული ღირებულება უფასო ვარიანტებს შეადარე."),
        universities: ["ual", "risd"],
      },
    ],
    bottomLine: l(
      "Start your portfolio now, apply to a free school at home and to one or two abroad (UdK, Aalto or PoliMi), and treat expensive schools as an option only with a scholarship.",
      "პორტფოლიოს შექმნა ახლავე დაიწყე, განაცხადი საქართველოს უფასო სასწავლებელშიც გააგზავნე და საზღვარგარეთ ერთ-ორშიც (UdK, აალტო ან მილანის პოლიტექნიკური), ძვირი სასწავლებლები კი მხოლოდ სტიპენდიის შემთხვევაში განიხილე.",
    ),
  },
];

/* ---------------------------- general guidance ---------------------------- */

/** How higher education works in Georgia after the 2025–2026 reform. */
export const GEORGIA_2026: { title: L; points: L[]; sources: Source[] } = {
  title: l("Studying in Georgia from 2026", "სწავლა საქართველოში 2026 წლიდან"),
  points: [
    l("Admission to bachelor's programmes is through the Unified National Exams: registration in spring, exams in July.", "ბაკალავრიატზე ჩარიცხვა ერთიანი ეროვნული გამოცდებით ხდება: რეგისტრაცია გაზაფხულზეა, გამოცდები — ივლისში."),
    GE_STATE_TUITION,
    l("The state study grant (100%, 70% or 50% of the fee) was abolished on 17 December 2025. New students at private universities no longer receive state grants; students already enrolled keep theirs.", "სახელმწიფო სასწავლო გრანტი (საფასურის 100%, 70% ან 50%) 2025 წლის 17 დეკემბერს გაუქმდა. კერძო უნივერსიტეტის ახალი სტუდენტები სახელმწიფო გრანტს აღარ იღებენ; უკვე ჩარიცხულებს გრანტი უნარჩუნდებათ."),
    l("\"One city — one faculty\": in Tbilisi, TSU keeps the sciences, humanities, law, economics and social sciences; GTU engineering; the Medical University medicine; Ilia pedagogy and ABET-accredited STEM; the arts universities the arts.", "„ერთი ქალაქი — ერთი ფაკულტეტი“: თბილისში თსუ-ს რჩება ზუსტი და საბუნებისმეტყველო მეცნიერებები, ჰუმანიტარული მეცნიერებები, სამართალი, ეკონომიკა და სოციალური მეცნიერებები; სტუ-ს — ინჟინერია; სამედიცინო უნივერსიტეტს — მედიცინა; ილიაუნის — პედაგოგიკა და ABET-ით აკრედიტებული STEM; სახელოვნებო უნივერსიტეტებს — ხელოვნება."),
    l("Rules are still being clarified: check naec.ge and the Ministry of Education before you register.", "წესები ჯერ კიდევ ზუსტდება: რეგისტრაციამდე გადაამოწმე naec.ge და განათლების სამინისტროს ინფორმაცია."),
  ],
  sources: [SRC_FREE, SRC_MERIT, SRC_FACULTY, SRC_PRIVATE, SRC_EXAMS, SRC_NAEC],
};

/** Studying abroad from Georgia, step by step. */
export const ABROAD_STEPS: { title: L; steps: L[]; scholarships: { name: L; text: L; source: Source }[] } = {
  title: l("Applying abroad from Georgia", "საზღვარგარეთ ჩაბარება საქართველოდან"),
  steps: [
    l("Start 12–18 months ahead: most deadlines are between October and April of your final school year.", "მზადება 12–18 თვით ადრე დაიწყე: ვადების უმეტესობა სკოლის ბოლო წლის ოქტომბრიდან აპრილამდეა."),
    l("Choose 5–8 universities of different difficulty and cost, including at least one you can afford without a scholarship.", "აირჩიე 5–8 სხვადასხვა სირთულისა და ღირებულების უნივერსიტეტი, მათ შორის ერთი მაინც, რომლის საფასურსაც სტიპენდიის გარეშეც გადაიხდი."),
    l("Take the language test in time (IELTS or TOEFL for English; TestDaF or Goethe C1 for German) and any required admissions tests.", "ენის გამოცდა დროულად ჩააბარე (ინგლისურისთვის — IELTS ან TOEFL, გერმანულისთვის — TestDaF ან Goethe C1) და ყველა საჭირო მისაღები ტესტიც."),
    ABROAD_DOCUMENTS,
    l("Write your own motivation letter or essays, and ask teachers for recommendations early.", "სამოტივაციო წერილი ან ესეები თავად დაწერე და მასწავლებლებს რეკომენდაციები ადრევე სთხოვე."),
    l("Apply for scholarships at the same time as for admission — many close earlier than the university itself.", "სტიპენდიებზე განაცხადი ჩაბარებასთან ერთად გააგზავნე — ბევრი მათგანი უნივერსიტეტზე ადრე იხურება."),
    VISA,
    l("Use only official university and government websites. Be careful with agencies that promise guaranteed admission for a fee.", "ისარგებლე მხოლოდ უნივერსიტეტებისა და სახელმწიფო უწყებების ოფიციალური ვებგვერდებით. ფრთხილად იყავი სააგენტოებთან, რომლებიც ფულის სანაცვლოდ გარანტირებულ ჩარიცხვას გპირდებიან."),
  ],
  scholarships: [
    { name: l("Stipendium Hungaricum (Hungary)", "Stipendium Hungaricum (უნგრეთი)"), text: l("Full tuition, monthly stipend, dormitory and insurance for bachelor's, master's and one-tier (e.g. medicine) programmes; Georgians are eligible; deadline in mid-January.", "სწავლის სრული საფასური, ყოველთვიური სტიპენდია, საერთო საცხოვრებელი და დაზღვევა ბაკალავრიატზე, მაგისტრატურასა და ერთსაფეხურიან (მაგ., მედიცინის) პროგრამებზე; ქართველებს განაცხადის შეტანა შეუძლიათ; ვადა — იანვრის შუა რიცხვები."), source: SRC_HUNGARICUM },
    { name: l("Türkiye Scholarships (Türkiye)", "თურქეთის სტიპენდია (თურქეთი)"), text: l("Tuition, accommodation, monthly stipend, health insurance and a return flight; applications usually in January–February.", "სწავლის საფასური, საცხოვრებელი, ყოველთვიური სტიპენდია, ჯანმრთელობის დაზღვევა და ორმხრივი ავიაბილეთი; განაცხადი, ჩვეულებრივ, იანვარ-თებერვალში."), source: SRC_TURKIYE },
    { name: l("Global Korea Scholarship (South Korea)", "კორეის მთავრობის სტიპენდია — GKS (სამხრეთ კორეა)"), text: l("Full tuition, a monthly stipend, airfare and insurance; age limit 25; check that Georgia is on that year's country list.", "სწავლის სრული საფასური, ყოველთვიური სტიპენდია, ავიაბილეთი და დაზღვევა; ასაკობრივი ზღვარი — 25 წელი; გადაამოწმე, არის თუ არა საქართველო იმ წლის ქვეყნების სიაში."), source: { label: "Korea.net — 2026 Global Korea Scholarship", url: "https://www.korea.net/NewsFocus/Society/view?articleId=278471" } },
    { name: l("MEXT (Japan)", "MEXT (იაპონია)"), text: l("Japanese government scholarship for undergraduates: airfare, tuition and a living stipend, including a year of Japanese first; apply through the Embassy of Japan in Georgia.", "იაპონიის მთავრობის სტიპენდია ბაკალავრებისთვის: ავიაბილეთი, სწავლის საფასური და საცხოვრებელი სტიპენდია, მათ შორის წინასწარი ერთწლიანი იაპონური ენის კურსი; განაცხადი საქართველოში, იაპონიის საელჩოს მეშვეობით."), source: { label: "Study in Japan (official)", url: "https://www.studyinjapan.go.jp/en/" } },
    { name: l("DAAD (Germany)", "DAAD (გერმანია)"), text: l("Mainly for master's and doctoral study (and summer courses); there is no dedicated DAAD scholarship for a full bachelor's degree from Georgia.", "ძირითადად მაგისტრატურისა და დოქტორანტურისთვის (და საზაფხულო კურსებისთვის); საქართველოდან სრული ბაკალავრიატისთვის DAAD-ის ცალკე სტიპენდია არ არსებობს."), source: SRC_DAAD },
  ],
};

/* -------------------------------- helpers -------------------------------- */

export function getUniversity(id: string): UniversityGuide | null {
  return UNIVERSITY_GUIDE.find((u) => u.id === id) ?? null;
}

export function getFieldGuide(id: string): FieldGuide | null {
  return FIELD_GUIDES.find((f) => f.id === id) ?? null;
}

export function isGuideField(value: string): value is GuideField {
  return (GUIDE_FIELDS as readonly string[]).includes(value);
}

/** True when the guide has not been re-checked for more than a year. */
export function guideIsStale(at = Date.now()): boolean {
  return at - Date.parse(`${CHECKED}T00:00:00Z`) > 365 * 24 * 60 * 60 * 1000;
}

/** When the guide was checked, as a card's "checked" time. */
export const GUIDE_CHECKED_AT = Date.parse(`${CHECKED}T12:00:00Z`);

/**
 * A guide entry as the fields of a student's own university card, in one
 * language. The field of study is the one asked for if the university offers
 * it, or its only one.
 */
export function guideCard(u: UniversityGuide, field: GuideField | null, locale: Locale, fieldNames: Record<GuideField, string>) {
  const chosen = field && u.fields.includes(field) ? field : u.fields.length === 1 ? u.fields[0] : null;
  const name = tr(u.name, locale);
  const short = tr(u.short, locale);
  const lines = (items: L[]) => items.map((x) => `• ${tr(x, locale)}`).join("\n");
  return {
    university: `${name}${short && !name.includes(short) ? ` (${short})` : ""}`.slice(0, 200),
    country: tr(u.country, locale).slice(0, 80),
    city: tr(u.city, locale).slice(0, 80),
    program: chosen ? fieldNames[chosen] : "",
    degree: "bachelor" as const,
    language: tr(u.languages, locale).slice(0, 80),
    fieldId: chosen ? CAREER_FIELD[chosen] : null,
    admission: lines(u.admission).slice(0, 3000),
    tuition: tr(u.tuition, locale).slice(0, 1000),
    scholarships: lines(u.funding).slice(0, 2000),
    deadlines: tr(u.deadlines, locale).slice(0, 1000),
    website: u.website,
    sourceUrl: u.sources[0]?.url ?? "",
    notes: lines(u.considerations).slice(0, 3000),
    interest: 2,
  };
}
