import { l, type L } from "@/lib/labs/localized";
import type { Subject } from "@/lib/domain/catalog";

/**
 * The school-wide subject catalogue. Educational content only: subject names
 * live in the UI dictionaries (dict.subjects), everything else is here.
 *
 * Every topic points to things that exist — built-in lessons (by content
 * group), laboratory items, library resources, careers or lab tools — so a
 * subject page is a way into real work, never an empty category. A unit test
 * checks that every reference resolves.
 */
export const SUBJECT_CATEGORIES = ["mathematics_computing", "sciences", "languages", "society", "technology_creativity", "skills"] as const;
export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];

export type SubjectIcon =
  | "calculator"
  | "atom"
  | "flask"
  | "dna"
  | "code"
  | "book"
  | "languages"
  | "landmark"
  | "globe"
  | "scale"
  | "coins"
  | "palette"
  | "wrench"
  | "heart"
  | "graduation"
  | "search"
  | "brain"
  | "rocket";

export const LAB_TOOLS = ["research", "universities", "portfolio", "skills", "goals"] as const;
export type LabTool = (typeof LAB_TOOLS)[number];

export type ItemRef =
  | { kind: "lesson"; group: string }
  | { kind: "programming"; id: string }
  | { kind: "critical"; id: string }
  | { kind: "experiment"; id: string }
  | { kind: "simulation"; id: string }
  | { kind: "challenge"; id: string }
  | { kind: "robotics"; id: string }
  | { kind: "electronics"; id: string }
  | { kind: "project"; id: string }
  | { kind: "library"; id: string }
  | { kind: "career"; id: string }
  | { kind: "tool"; id: LabTool };

export interface SubjectTopic {
  id: string;
  name: L;
  items: ItemRef[];
}

export interface SubjectEntry {
  id: Subject;
  icon: SubjectIcon;
  category: SubjectCategory;
  grades: [number, number];
  description: L;
  topics: SubjectTopic[];
  /** A suggested order through the subject's starter content. */
  path: ItemRef[];
}

const lesson = (group: string): ItemRef => ({ kind: "lesson", group });
const code = (id: string): ItemRef => ({ kind: "programming", id });
const ct = (id: string): ItemRef => ({ kind: "critical", id });
const exp = (id: string): ItemRef => ({ kind: "experiment", id });
const sim = (id: string): ItemRef => ({ kind: "simulation", id });
const challenge = (id: string): ItemRef => ({ kind: "challenge", id });
const robot = (id: string): ItemRef => ({ kind: "robotics", id });
const circuit = (id: string): ItemRef => ({ kind: "electronics", id });
const project = (id: string): ItemRef => ({ kind: "project", id });
const book = (id: string): ItemRef => ({ kind: "library", id });
const career = (id: string): ItemRef => ({ kind: "career", id });
const tool = (id: LabTool): ItemRef => ({ kind: "tool", id });

export const SUBJECT_CATALOG: SubjectEntry[] = [
  {
    id: "mathematics",
    icon: "calculator",
    category: "mathematics_computing",
    grades: [5, 12],
    description: l(
      "Equations, functions, probability and problem solving — with interactive graphs, simulations and exercises that check your answers and give hints step by step.",
      "განტოლებები, ფუნქციები, ალბათობა და ამოცანების ამოხსნა — ინტერაქტიური გრაფიკებით, სიმულაციებითა და სავარჯიშოებით, რომლებიც პასუხს ამოწმებს და მინიშნებებს ნაბიჯ-ნაბიჯ გაძლევს.",
    ),
    topics: [
      { id: "equations", name: l("Equations", "განტოლებები"), items: [lesson("linear-equations"), lesson("quadratic"), book("lib-quadratics-ka"), book("lib-quadratics")] },
      { id: "functions", name: l("Functions and graphs", "ფუნქციები და გრაფიკები"), items: [lesson("functions"), sim("linear-model"), sim("growth")] },
      { id: "probability", name: l("Probability and statistics", "ალბათობა და სტატისტიკა"), items: [lesson("probability-basics"), sim("probability"), exp("reaction-time"), book("lib-openstax-statistics")] },
      { id: "problem-solving", name: l("Problem solving", "ამოცანების ამოხსნა"), items: [code("l1-sum-to-n"), code("l2-gcd"), ct("ct-decision-1")] },
    ],
    path: [lesson("linear-equations"), lesson("functions"), sim("linear-model"), lesson("probability-basics"), sim("probability"), lesson("quadratic")],
  },
  {
    id: "physics",
    icon: "atom",
    category: "sciences",
    grades: [7, 12],
    description: l(
      "Motion, forces, energy and electricity — explained, simulated and tested with real classroom experiments.",
      "მოძრაობა, ძალები, ენერგია და ელექტრობა — ახსნით, სიმულაციებითა და რეალური საკლასო ექსპერიმენტებით.",
    ),
    topics: [
      { id: "motion", name: l("Motion and forces", "მოძრაობა და ძალები"), items: [lesson("motion"), sim("motion"), lesson("newton"), sim("projectile"), exp("pendulum"), book("lib-newton-notes"), book("lib-newton-notes-ka")] },
      { id: "energy", name: l("Energy", "ენერგია"), items: [lesson("energy"), exp("insulation"), circuit("power")] },
      { id: "electricity", name: l("Electricity", "ელექტრობა"), items: [lesson("simple-circuits"), sim("circuit"), exp("conductors"), circuit("circuit"), circuit("series-parallel"), challenge("ohm-practice")] },
      { id: "matter", name: l("Matter and measurement", "ნივთიერება და გაზომვა"), items: [exp("density"), book("lib-openstax-physics"), book("lib-brief-history")] },
    ],
    path: [lesson("motion"), sim("motion"), lesson("newton"), exp("pendulum"), lesson("energy"), lesson("simple-circuits"), sim("circuit")],
  },
  {
    id: "chemistry",
    icon: "flask",
    category: "sciences",
    grades: [7, 12],
    description: l(
      "Atoms, the periodic table and chemical reactions, with safe classroom experiments and clear safety guidance.",
      "ატომები, პერიოდული სისტემა და ქიმიური რეაქციები — უსაფრთხო საკლასო ექსპერიმენტებითა და უსაფრთხოების მკაფიო წესებით.",
    ),
    topics: [
      { id: "atoms", name: l("Atoms and the periodic table", "ატომები და პერიოდული სისტემა"), items: [lesson("atomic-structure"), lesson("periodic-table"), book("lib-openstax-chemistry")] },
      { id: "reactions", name: l("Reactions, acids and bases", "რეაქციები, მჟავები და ფუძეები"), items: [lesson("chemical-reactions"), exp("cabbage-ph")] },
    ],
    path: [lesson("atomic-structure"), lesson("periodic-table"), lesson("chemical-reactions"), exp("cabbage-ph")],
  },
  {
    id: "biology",
    icon: "dna",
    category: "sciences",
    grades: [7, 12],
    description: l(
      "Cells, genetics and ecosystems — from the microscope to the forests of Georgia, with experiments and population models.",
      "უჯრედები, გენეტიკა და ეკოსისტემები — მიკროსკოპიდან საქართველოს ტყეებამდე, ექსპერიმენტებითა და პოპულაციის მოდელებით.",
    ),
    topics: [
      { id: "cells", name: l("Cells", "უჯრედები"), items: [lesson("cell-structure"), exp("yeast")] },
      { id: "genetics", name: l("Genetics and evolution", "გენეტიკა და ევოლუცია"), items: [lesson("genetics-basics"), book("lib-origin")] },
      { id: "ecology", name: l("Ecology", "ეკოლოგია"), items: [lesson("ecosystems"), exp("plant-light"), sim("growth"), book("lib-ecosystems"), book("lib-openstax-biology")] },
    ],
    path: [lesson("cell-structure"), exp("plant-light"), lesson("ecosystems"), sim("growth"), lesson("genetics-basics")],
  },
  {
    id: "computer_science",
    icon: "code",
    category: "mathematics_computing",
    grades: [6, 12],
    description: l(
      "Computational thinking, Python and C++, algorithms and data structures — with programs checked automatically in the Programming Laboratory.",
      "გამოთვლითი აზროვნება, Python და C++, ალგორითმები და მონაცემთა სტრუქტურები — პროგრამებით, რომლებსაც პროგრამირების ლაბორატორია ავტომატურად ამოწმებს.",
    ),
    topics: [
      { id: "computational-thinking", name: l("Computational thinking", "გამოთვლითი აზროვნება"), items: [lesson("computational-thinking"), sim("grid-robot"), challenge("robot-logic")] },
      { id: "programming", name: l("Programming in Python and C++", "პროგრამირება Python-სა და C++-ზე"), items: [lesson("python-basics"), code("l1-hello"), code("l1-greeting"), code("l1-even-odd"), code("l1-sum-to-n"), lesson("cpp-basics"), code("l4-overflow"), book("lib-think-python")] },
      { id: "algorithms", name: l("Algorithms", "ალგორითმები"), items: [lesson("algorithms"), code("l3-binary-search"), code("l3-sort"), code("l2-complexity-pairs"), book("lib-cph")] },
      { id: "data-structures", name: l("Data structures", "მონაცემთა სტრუქტურები (Data Structures)"), items: [code("l2-list-max-min"), code("l3-brackets"), code("l4-distinct")] },
      { id: "robotics", name: l("Robotics", "რობოტიკა"), items: [robot("line-follower"), robot("obstacle-car")] },
    ],
    path: [lesson("computational-thinking"), sim("grid-robot"), lesson("python-basics"), code("l1-hello"), code("l1-sum-to-n"), lesson("algorithms"), code("l3-binary-search"), lesson("cpp-basics")],
  },
  {
    id: "georgian",
    icon: "book",
    category: "languages",
    grades: [5, 12],
    description: l(
      "Georgian language and literature: reading and analysing classic texts, grammar and punctuation, and writing well-argued essays.",
      "ქართული ენა და ლიტერატურა: კლასიკური ტექსტების კითხვა და ანალიზი, გრამატიკა და პუნქტუაცია, არგუმენტირებული ესეს წერა.",
    ),
    topics: [
      { id: "literature", name: l("Literature", "ლიტერატურა"), items: [lesson("vepkhistkaosani-friendship"), book("lib-vepkhistkaosani")] },
      { id: "writing", name: l("Writing and argumentation", "წერა და არგუმენტაცია"), items: [lesson("argumentative-essay"), ct("ct-builder-1")] },
      { id: "grammar", name: l("Grammar and punctuation", "გრამატიკა და პუნქტუაცია"), items: [lesson("commas-complex-sentences")] },
    ],
    path: [lesson("commas-complex-sentences"), lesson("argumentative-essay"), ct("ct-builder-1"), lesson("vepkhistkaosani-friendship")],
  },
  {
    id: "english",
    icon: "languages",
    category: "languages",
    grades: [5, 12],
    description: l(
      "Grammar, reading and writing in English, with explanations available in Georgian and classic books to read in the original.",
      "ინგლისური ენის გრამატიკა, კითხვა და წერა — ქართულად ახსნილი წესებით და კლასიკური წიგნებით ორიგინალში.",
    ),
    topics: [
      { id: "grammar", name: l("Grammar", "გრამატიკა"), items: [lesson("present-perfect")] },
      { id: "writing", name: l("Writing", "წერა"), items: [lesson("formal-email")] },
      { id: "reading", name: l("Reading", "კითხვა"), items: [book("lib-alice"), book("lib-sherlock"), book("lib-dictionary")] },
    ],
    path: [lesson("present-perfect"), lesson("formal-email"), book("lib-sherlock")],
  },
  {
    id: "history",
    icon: "landmark",
    category: "society",
    grades: [6, 12],
    description: l(
      "Georgian and world history through sources, chronology, and cause and consequence.",
      "საქართველოსა და მსოფლიოს ისტორია წყაროების, ქრონოლოგიისა და მიზეზ-შედეგობრივი კავშირების მეშვეობით.",
    ),
    topics: [
      { id: "georgian-history", name: l("History of Georgia", "საქართველოს ისტორია"), items: [lesson("david-builder-didgori"), lesson("democratic-republic-1918")] },
      { id: "sources", name: l("Historical sources", "ისტორიული წყაროები"), items: [lesson("historical-sources"), ct("ct-sources-1")] },
    ],
    path: [lesson("historical-sources"), lesson("david-builder-didgori"), lesson("democratic-republic-1918"), ct("ct-sources-1")],
  },
  {
    id: "geography",
    icon: "globe",
    category: "society",
    grades: [6, 12],
    description: l(
      "Maps, landforms and climate — starting with Georgia — and working with real geographic data.",
      "რუკები, რელიეფი და კლიმატი — საქართველოდან დაწყებული — და რეალურ გეოგრაფიულ მონაცემებთან მუშაობა.",
    ),
    topics: [
      { id: "maps", name: l("Maps", "რუკები"), items: [lesson("map-reading")] },
      { id: "georgia", name: l("Physical geography of Georgia", "საქართველოს ფიზიკური გეოგრაფია"), items: [lesson("georgia-relief")] },
      { id: "climate", name: l("Climate and data", "კლიმატი და მონაცემები"), items: [lesson("climate-graphs"), tool("research")] },
    ],
    path: [lesson("map-reading"), lesson("georgia-relief"), lesson("climate-graphs")],
  },
  {
    id: "civics",
    icon: "scale",
    category: "society",
    grades: [7, 12],
    description: l(
      "Rights and responsibilities, how the state works, media literacy and taking part in the life of your school and community.",
      "უფლებები და პასუხისმგებლობები, სახელმწიფოს მოწყობა, მედიაწიგნიერება და სკოლისა და თემის ცხოვრებაში მონაწილეობა.",
    ),
    topics: [
      { id: "rights", name: l("Rights and responsibilities", "უფლებები და პასუხისმგებლობები"), items: [lesson("rights-responsibilities"), ct("ct-debate-2")] },
      { id: "institutions", name: l("State and institutions", "სახელმწიფო და ინსტიტუტები"), items: [lesson("state-institutions")] },
      { id: "media", name: l("Media and participation", "მედია და მონაწილეობა"), items: [lesson("online-information"), ct("ct-media-1")] },
    ],
    path: [lesson("rights-responsibilities"), lesson("state-institutions"), lesson("online-information"), ct("ct-debate-2")],
  },
  {
    id: "economics",
    icon: "coins",
    category: "society",
    grades: [8, 12],
    description: l(
      "Money, budgeting, saving and interest, inflation and good financial decisions — with examples in lari.",
      "ფული, ბიუჯეტი, დაზოგვა და პროცენტი, ინფლაცია და გონივრული ფინანსური გადაწყვეტილებები — ლარში მოცემული მაგალითებით.",
    ),
    topics: [
      { id: "personal-finance", name: l("Personal finance", "პირადი ფინანსები"), items: [lesson("personal-budget"), lesson("interest-saving")] },
      { id: "economy", name: l("The economy", "ეკონომიკა"), items: [lesson("inflation")] },
      { id: "decisions", name: l("Decisions", "გადაწყვეტილებები"), items: [ct("ct-decision-1")] },
    ],
    path: [lesson("personal-budget"), lesson("interest-saving"), lesson("inflation"), ct("ct-decision-1")],
  },
  {
    id: "arts",
    icon: "palette",
    category: "technology_creativity",
    grades: [5, 12],
    description: l(
      "Visual communication and design principles, creative projects and a portfolio that shows how your work developed.",
      "ვიზუალური კომუნიკაცია და დიზაინის პრინციპები, შემოქმედებითი პროექტები და პორტფოლიო, რომელიც შენი ნამუშევრების განვითარებას აჩვენებს.",
    ),
    topics: [
      { id: "design", name: l("Design principles", "დიზაინის პრინციპები"), items: [lesson("design-principles"), tool("portfolio")] },
      { id: "careers", name: l("Creative careers", "შემოქმედებითი პროფესიები"), items: [career("ux-designer"), career("architect")] },
    ],
    path: [lesson("design-principles"), tool("portfolio"), career("ux-designer")],
  },
  {
    id: "engineering",
    icon: "wrench",
    category: "technology_creativity",
    grades: [7, 12],
    description: l(
      "The engineering design process, electronics and robotics — building, testing and improving real prototypes.",
      "საინჟინრო დიზაინის პროცესი, ელექტრონიკა და რობოტიკა — რეალური პროტოტიპების აწყობა, გამოცდა და გაუმჯობესება.",
    ),
    topics: [
      { id: "design-process", name: l("Engineering design", "საინჟინრო დიზაინი"), items: [lesson("engineering-design-process"), project("paper-bridge"), project("tower"), project("water-filter"), project("solar-oven")] },
      { id: "electronics", name: l("Electronics", "ელექტრონიკა"), items: [circuit("circuit"), circuit("vir"), challenge("led-circuits")] },
      { id: "robotics", name: l("Robotics", "რობოტიკა"), items: [robot("night-light"), robot("obstacle-car"), robot("line-follower"), robot("plant-monitor"), challenge("robot-logic")] },
      { id: "careers", name: l("Engineering careers", "საინჟინრო პროფესიები"), items: [career("civil-engineer"), career("energy-engineer")] },
    ],
    path: [lesson("engineering-design-process"), project("paper-bridge"), circuit("circuit"), challenge("led-circuits"), robot("night-light")],
  },
  {
    id: "health",
    icon: "heart",
    category: "skills",
    grades: [5, 12],
    description: l(
      "Healthy study habits, digital wellbeing, safety and first-aid awareness — practical and age-appropriate.",
      "სწავლის ჯანსაღი ჩვევები, ციფრული კეთილდღეობა, უსაფრთხოება და პირველადი დახმარების საფუძვლები — პრაქტიკულად და ასაკის შესაბამისად.",
    ),
    topics: [
      { id: "wellbeing", name: l("Study habits and wellbeing", "სწავლის ჩვევები და კეთილდღეობა"), items: [lesson("study-habits")] },
      { id: "safety", name: l("Safety and first aid", "უსაფრთხოება და პირველადი დახმარება"), items: [lesson("first-aid-awareness")] },
      { id: "careers", name: l("Careers in health", "პროფესიები ჯანდაცვაში"), items: [career("physician"), career("nurse"), career("psychologist")] },
    ],
    path: [lesson("study-habits"), lesson("first-aid-awareness")],
  },
  {
    id: "career",
    icon: "graduation",
    category: "skills",
    grades: [8, 12],
    description: l(
      "Exploring careers and fields of study, researching universities with official sources, and building a portfolio.",
      "პროფესიებისა და სწავლის სფეროების შესწავლა, უნივერსიტეტების კვლევა ოფიციალური წყაროებით და პორტფოლიოს შექმნა.",
    ),
    topics: [
      { id: "exploring", name: l("Exploring careers", "პროფესიების შესწავლა"), items: [lesson("choosing-a-path"), tool("skills"), career("software-developer"), career("teacher"), career("journalist"), career("lawyer")] },
      { id: "university", name: l("University research", "უნივერსიტეტების კვლევა"), items: [tool("universities"), ct("ct-decision-2")] },
      { id: "portfolio", name: l("Portfolio and goals", "პორტფოლიო და მიზნები"), items: [tool("portfolio"), tool("goals")] },
    ],
    path: [lesson("choosing-a-path"), tool("skills"), tool("universities"), ct("ct-decision-2"), tool("portfolio")],
  },
  {
    id: "research",
    icon: "search",
    category: "skills",
    grades: [7, 12],
    description: l(
      "Asking good research questions, evaluating sources, taking notes, citing honestly and working with data — then presenting what you found.",
      "კარგი საკვლევი კითხვის დასმა, წყაროების შეფასება, ჩანაწერები, კეთილსინდისიერი ციტირება და მონაცემებთან მუშაობა — და ბოლოს მიგნებების წარდგენა.",
    ),
    topics: [
      { id: "questions", name: l("Research questions", "საკვლევი კითხვები"), items: [lesson("research-question"), tool("research")] },
      { id: "sources", name: l("Sources and citations", "წყაროები და ციტირება"), items: [lesson("evaluating-sources"), lesson("bibliography"), ct("ct-sources-1")] },
      { id: "data", name: l("Working with data", "მონაცემებთან მუშაობა"), items: [lesson("climate-graphs"), sim("linear-model")] },
    ],
    path: [lesson("research-question"), lesson("evaluating-sources"), lesson("bibliography"), tool("research")],
  },
  {
    id: "critical_thinking",
    icon: "brain",
    category: "skills",
    grades: [6, 12],
    description: l(
      "Claims and evidence, logical fallacies and cognitive biases, misinformation, debate and changing your mind well.",
      "მტკიცება და მტკიცებულება, ლოგიკური შეცდომები და კოგნიტური მიკერძოებები, მცდარი ინფორმაცია, დებატები და აზრის სწორად შეცვლა.",
    ),
    topics: [
      { id: "claims", name: l("Claims and evidence", "მტკიცება და მტკიცებულება"), items: [lesson("claim-evidence"), ct("ct-claims-1"), ct("ct-claims-2"), ct("ct-claims-3")] },
      { id: "fallacies", name: l("Fallacies and biases", "ლოგიკური შეცდომები და მიკერძოებები"), items: [lesson("logical-fallacies"), ct("ct-fallacies-1"), ct("ct-fallacies-2"), ct("ct-biases-1")] },
      { id: "media", name: l("Media literacy", "მედიაწიგნიერება"), items: [lesson("online-information"), ct("ct-media-1"), ct("ct-media-2"), ct("ct-sources-1")] },
      { id: "debate", name: l("Arguments and debate", "არგუმენტაცია და დებატი"), items: [ct("ct-builder-1"), ct("ct-builder-2"), ct("ct-debate-1"), ct("ct-debate-2"), ct("ct-debate-3"), ct("ct-humility-1")] },
    ],
    path: [lesson("claim-evidence"), ct("ct-claims-1"), lesson("logical-fallacies"), ct("ct-fallacies-1"), lesson("online-information"), ct("ct-media-2"), ct("ct-debate-1")],
  },
  {
    id: "entrepreneurship",
    icon: "rocket",
    category: "technology_creativity",
    grades: [9, 12],
    description: l(
      "Finding real problems, listening to users, prototyping and pitching ideas — plus the money basics every project needs.",
      "რეალური პრობლემების პოვნა, მომხმარებლების მოსმენა, პროტოტიპირება და იდეების წარდგენა — და ფინანსური საფუძვლები, რომლებიც ყველა პროექტს სჭირდება.",
    ),
    topics: [
      { id: "ideas", name: l("From problem to idea", "პრობლემიდან იდეამდე"), items: [lesson("problem-to-idea"), project("free")] },
      { id: "decisions", name: l("Decisions and money", "გადაწყვეტილებები და ფინანსები"), items: [ct("ct-decision-1"), lesson("personal-budget")] },
    ],
    path: [lesson("problem-to-idea"), ct("ct-decision-1"), project("free")],
  },
];

export function findSubjectEntry(id: string): SubjectEntry | undefined {
  return SUBJECT_CATALOG.find((s) => s.id === id);
}
