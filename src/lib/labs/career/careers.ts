import { l, type L } from "../localized";
import type { SkillId } from "./skills";

/*
 * Career and field-of-study profiles describe the work and the typical
 * pathways. They deliberately contain no salaries, admission scores or
 * deadlines: those change every year and must be checked at the source.
 */

export const FIELD_IDS = [
  "computer_science",
  "engineering",
  "medicine_health",
  "natural_sciences",
  "mathematics_statistics",
  "economics_business",
  "law",
  "education",
  "psychology_social",
  "architecture_design",
  "media_communication",
  "humanities_languages",
] as const;
export type FieldId = (typeof FIELD_IDS)[number];

export interface Field {
  id: FieldId;
  name: L;
  description: L;
  schoolSubjects: L;
  skills: SkillId[];
  askWhenResearching: L[];
}

const ASK_COMMON: L[] = [
  l("What are the admission requirements this year, and where are they published officially?", "რა მოთხოვნებია ამ წელს მისაღებად და სად არის ოფიციალურად გამოქვეყნებული?"),
  l("What does the programme cost, and which scholarships exist?", "რა ღირს პროგრამა და რა სტიპენდიები არსებობს?"),
];

export const FIELDS: Field[] = [
  {
    id: "computer_science",
    name: l("Computer science and IT", "კომპიუტერული მეცნიერებები და IT"),
    description: l("Programming, algorithms, data, networks and how software systems are designed.", "პროგრამირება, ალგორითმები, მონაცემები, ქსელები და პროგრამული სისტემების დაპროექტება."),
    schoolSubjects: l("Mathematics, computer science, English", "მათემატიკა, ინფორმატიკა, ინგლისური ენა"),
    skills: ["programming", "problem_solving", "math_reasoning", "digital_literacy"],
    askWhenResearching: [l("How much of the programme is practical projects or internships?", "პროგრამის რა ნაწილია პრაქტიკული პროექტები ან სტაჟირება?"), ...ASK_COMMON],
  },
  {
    id: "engineering",
    name: l("Engineering", "ინჟინერია"),
    description: l("Designing and building structures, machines, energy and electronic systems.", "კონსტრუქციების, მანქანების, ენერგეტიკული და ელექტრონული სისტემების დაპროექტება და შექმნა."),
    schoolSubjects: l("Mathematics, physics, chemistry", "მათემატიკა, ფიზიკა, ქიმია"),
    skills: ["engineering_design", "math_reasoning", "problem_solving", "collaboration"],
    askWhenResearching: [l("Which specialisations are offered (civil, electrical, mechanical…)?", "რა სპეციალიზაციებს გთავაზობენ (სამშენებლო, ელექტრო, მექანიკური…)?"), ...ASK_COMMON],
  },
  {
    id: "medicine_health",
    name: l("Medicine and health", "მედიცინა და ჯანდაცვა"),
    description: l("Understanding the human body, diagnosing and treating illness, caring for patients and public health.", "ადამიანის ორგანიზმის შესწავლა, დაავადებების დიაგნოსტიკა და მკურნალობა, პაციენტებზე ზრუნვა და საზოგადოებრივი ჯანდაცვა."),
    schoolSubjects: l("Biology, chemistry, physics", "ბიოლოგია, ქიმია, ფიზიკა"),
    skills: ["scientific_inquiry", "communication", "self_management", "critical_thinking"],
    askWhenResearching: [l("Is the programme recognised in the country where I want to work?", "აღიარებულია თუ არა პროგრამა იმ ქვეყანაში, სადაც მუშაობა მინდა?"), ...ASK_COMMON],
  },
  {
    id: "natural_sciences",
    name: l("Natural sciences", "საბუნებისმეტყველო მეცნიერებები"),
    description: l("Physics, chemistry, biology and earth sciences — research into how nature works.", "ფიზიკა, ქიმია, ბიოლოგია და დედამიწის შემსწავლელი მეცნიერებები — ბუნების კანონზომიერებების კვლევა."),
    schoolSubjects: l("Physics, chemistry, biology, mathematics", "ფიზიკა, ქიმია, ბიოლოგია, მათემატიკა"),
    skills: ["scientific_inquiry", "data_analysis", "research", "critical_thinking"],
    askWhenResearching: [l("Can bachelor students join research labs?", "შეუძლიათ თუ არა ბაკალავრიატის სტუდენტებს კვლევით ლაბორატორიებში ჩართვა?"), ...ASK_COMMON],
  },
  {
    id: "mathematics_statistics",
    name: l("Mathematics and statistics", "მათემატიკა და სტატისტიკა"),
    description: l("Pure and applied mathematics, statistics and data — the language behind science and technology.", "წმინდა და გამოყენებითი მათემატიკა, სტატისტიკა და მონაცემები — მეცნიერებისა და ტექნოლოგიების ენა."),
    schoolSubjects: l("Mathematics, computer science", "მათემატიკა, ინფორმატიკა"),
    skills: ["math_reasoning", "data_analysis", "problem_solving", "programming"],
    askWhenResearching: [l("Does it include programming and data courses?", "მოიცავს თუ არა პროგრამირებისა და მონაცემების კურსებს?"), ...ASK_COMMON],
  },
  {
    id: "economics_business",
    name: l("Economics and business", "ეკონომიკა და ბიზნესი"),
    description: l("How markets, organisations and money work; management, finance and entrepreneurship.", "როგორ მუშაობს ბაზრები, ორგანიზაციები და ფინანსები; მენეჯმენტი, ფინანსები და მეწარმეობა."),
    schoolSubjects: l("Mathematics, geography, English", "მათემატიკა, გეოგრაფია, ინგლისური ენა"),
    skills: ["data_analysis", "communication", "leadership", "critical_thinking"],
    askWhenResearching: [l("What practical experience (projects, internships) is included?", "რა პრაქტიკული გამოცდილებაა გათვალისწინებული (პროექტები, სტაჟირება)?"), ...ASK_COMMON],
  },
  {
    id: "law",
    name: l("Law", "სამართალი"),
    description: l("Legal systems, rights, contracts and justice; arguing a case with evidence.", "სამართლებრივი სისტემები, უფლებები, ხელშეკრულებები და მართლმსაჯულება; საქმის მტკიცებულებებით დაცვა."),
    schoolSubjects: l("Georgian language and literature, history, civic education, English", "ქართული ენა და ლიტერატურა, ისტორია, სამოქალაქო განათლება, ინგლისური ენა"),
    skills: ["critical_thinking", "communication", "research", "languages"],
    askWhenResearching: [l("Which legal system does the programme focus on?", "რომელ სამართლებრივ სისტემაზეა ორიენტირებული პროგრამა?"), ...ASK_COMMON],
  },
  {
    id: "education",
    name: l("Education and teaching", "განათლება და სწავლება"),
    description: l("How people learn, and how to teach a subject well to children and adults.", "როგორ სწავლობენ ადამიანები და როგორ ვასწავლოთ საგანი კარგად ბავშვებსა და მოზრდილებს."),
    schoolSubjects: l("The subject you want to teach, Georgian, English", "საგანი, რომლის სწავლებაც გინდა, ქართული, ინგლისური"),
    skills: ["communication", "collaboration", "leadership", "creativity"],
    askWhenResearching: [l("How much teaching practice in schools is included?", "რამდენი სასკოლო პრაქტიკაა გათვალისწინებული?"), ...ASK_COMMON],
  },
  {
    id: "psychology_social",
    name: l("Psychology and social sciences", "ფსიქოლოგია და სოციალური მეცნიერებები"),
    description: l("Human behaviour, society and institutions, studied with surveys, experiments and interviews.", "ადამიანის ქცევა, საზოგადოება და ინსტიტუტები, რომლებსაც გამოკითხვებით, ექსპერიმენტებითა და ინტერვიუებით სწავლობენ."),
    schoolSubjects: l("Biology, history, mathematics (statistics), English", "ბიოლოგია, ისტორია, მათემატიკა (სტატისტიკა), ინგლისური ენა"),
    skills: ["research", "data_analysis", "communication", "critical_thinking"],
    askWhenResearching: [l("Does the programme teach research methods and statistics?", "ასწავლის თუ არა პროგრამა კვლევის მეთოდებსა და სტატისტიკას?"), ...ASK_COMMON],
  },
  {
    id: "architecture_design",
    name: l("Architecture and design", "არქიტექტურა და დიზაინი"),
    description: l("Designing buildings, spaces, products and digital interfaces that work well for people.", "შენობების, სივრცეების, პროდუქტებისა და ციფრული ინტერფეისების დაპროექტება, რომლებიც ადამიანებისთვის მოსახერხებელია."),
    schoolSubjects: l("Mathematics, physics, art", "მათემატიკა, ფიზიკა, ხელოვნება"),
    skills: ["creativity", "engineering_design", "communication", "digital_literacy"],
    askWhenResearching: [l("Is a portfolio of drawings or designs required for admission?", "საჭიროა თუ არა მისაღებად ნახატების ან დიზაინების პორტფოლიო?"), ...ASK_COMMON],
  },
  {
    id: "media_communication",
    name: l("Media and communication", "მედია და კომუნიკაცია"),
    description: l("Journalism, public relations and digital media — informing people accurately and responsibly.", "ჟურნალისტიკა, საზოგადოებასთან ურთიერთობა და ციფრული მედია — ადამიანების ზუსტი და პასუხისმგებლიანი ინფორმირება."),
    schoolSubjects: l("Georgian, English, history", "ქართული, ინგლისური, ისტორია"),
    skills: ["communication", "critical_thinking", "digital_literacy", "creativity"],
    askWhenResearching: [l("Are there student newspapers, radio or media labs?", "არსებობს თუ არა სტუდენტური გაზეთი, რადიო ან მედიალაბორატორია?"), ...ASK_COMMON],
  },
  {
    id: "humanities_languages",
    name: l("Humanities and languages", "ჰუმანიტარული მეცნიერებები და ენები"),
    description: l("History, literature, philosophy and languages — understanding cultures and ideas.", "ისტორია, ლიტერატურა, ფილოსოფია და ენები — კულტურებისა და იდეების გაგება."),
    schoolSubjects: l("Georgian, history, foreign languages", "ქართული, ისტორია, უცხო ენები"),
    skills: ["languages", "research", "communication", "critical_thinking"],
    askWhenResearching: [l("Which languages and exchange programmes are offered?", "რომელ ენებს და გაცვლით პროგრამებს გთავაზობენ?"), ...ASK_COMMON],
  },
];

export interface Career {
  id: string;
  title: L;
  summary: L;
  dayToDay: L[];
  skills: SkillId[];
  fields: FieldId[];
  pathway: L;
  tryAtSchool: { label: L; href: string }[];
}

export const CAREERS: Career[] = [
  {
    id: "software-developer",
    title: l("Software developer", "პროგრამული უზრუნველყოფის დეველოპერი"),
    summary: l("Designs, writes and tests the programs behind apps, websites and devices.", "ქმნის, წერს და ამოწმებს პროგრამებს, რომლებზეც აპლიკაციები, ვებგვერდები და მოწყობილობები მუშაობს."),
    dayToDay: [
      l("Turning a problem into a clear plan and code", "პრობლემის მკაფიო გეგმად და კოდად ქცევა"),
      l("Testing, finding and fixing bugs", "ტესტირება, შეცდომების პოვნა და გასწორება"),
      l("Working in a team and reviewing each other's code", "გუნდური მუშაობა და ერთმანეთის კოდის განხილვა"),
    ],
    skills: ["programming", "problem_solving", "collaboration", "self_management"],
    fields: ["computer_science", "mathematics_statistics"],
    pathway: l("Usually a bachelor's degree in computer science or a related field; strong portfolios of projects also matter.", "როგორც წესი, ბაკალავრის ხარისხი კომპიუტერულ მეცნიერებებში ან მომიჯნავე სფეროში; მნიშვნელოვანია პროექტების ძლიერი პორტფოლიოც."),
    tryAtSchool: [{ label: l("Programming Lab", "პროგრამირების ლაბორატორია"), href: "/labs/programming" }],
  },
  {
    id: "data-scientist",
    title: l("Data scientist", "მონაცემთა მეცნიერი"),
    summary: l("Collects and analyses data to answer questions and support decisions.", "აგროვებს და აანალიზებს მონაცემებს კითხვებზე პასუხის გასაცემად და გადაწყვეტილებების მხარდასაჭერად."),
    dayToDay: [
      l("Cleaning and exploring datasets", "მონაცემების გასუფთავება და შესწავლა"),
      l("Building statistical models", "სტატისტიკური მოდელების აგება"),
      l("Explaining results clearly with charts", "შედეგების მკაფიოდ ახსნა დიაგრამებით"),
    ],
    skills: ["data_analysis", "programming", "math_reasoning", "communication"],
    fields: ["mathematics_statistics", "computer_science"],
    pathway: l("A degree in statistics, mathematics, computer science or a science, plus practice with real data.", "ხარისხი სტატისტიკაში, მათემატიკაში, კომპიუტერულ მეცნიერებებში ან საბუნებისმეტყველო სფეროში, პლუს რეალურ მონაცემებთან მუშაობის გამოცდილება."),
    tryAtSchool: [
      { label: l("Research Lab — datasets", "კვლევითი ლაბორატორია — მონაცემები"), href: "/labs/research" },
      { label: l("Line-fitting simulation", "წრფის მორგების სიმულაცია"), href: "/labs/stem/simulations/linear-model" },
    ],
  },
  {
    id: "civil-engineer",
    title: l("Civil engineer", "სამოქალაქო ინჟინერი"),
    summary: l("Plans and builds bridges, roads, buildings and water systems that are safe and last.", "გეგმავს და აშენებს ხიდებს, გზებს, შენობებსა და წყლის სისტემებს, რომლებიც უსაფრთხო და გამძლეა."),
    dayToDay: [
      l("Calculating loads and choosing materials", "დატვირთვების გამოთვლა და მასალების შერჩევა"),
      l("Drawing and checking designs", "პროექტების შედგენა და შემოწმება"),
      l("Working on building sites with other professionals", "სამშენებლო ობიექტებზე სხვა სპეციალისტებთან მუშაობა"),
    ],
    skills: ["engineering_design", "math_reasoning", "collaboration", "problem_solving"],
    fields: ["engineering"],
    pathway: l("A bachelor's (often followed by a master's) in civil engineering; professional certification in some countries.", "ბაკალავრის (ხშირად მაგისტრის) ხარისხი სამოქალაქო ინჟინერიაში; ზოგ ქვეყანაში — პროფესიული სერტიფიცირება."),
    tryAtSchool: [{ label: l("Earthquake-resistant tower project", "მიწისძვრამედეგი კოშკის პროექტი"), href: "/labs/stem#projects" }],
  },
  {
    id: "energy-engineer",
    title: l("Electrical and renewable-energy engineer", "ელექტრო და განახლებადი ენერგიის ინჟინერი"),
    summary: l("Designs systems that generate, store and deliver electricity — including solar, wind and hydropower.", "ქმნის სისტემებს, რომლებიც ელექტროენერგიას გამოიმუშავებს, ინახავს და აწვდის — მათ შორის მზის, ქარისა და ჰიდროენერგიას."),
    dayToDay: [
      l("Designing and simulating circuits and grids", "წრედებისა და ქსელების დაპროექტება და მოდელირება"),
      l("Measuring and improving efficiency", "ეფექტიანობის გაზომვა და გაუმჯობესება"),
      l("Following strict safety standards", "უსაფრთხოების მკაცრი სტანდარტების დაცვა"),
    ],
    skills: ["engineering_design", "math_reasoning", "scientific_inquiry", "problem_solving"],
    fields: ["engineering", "natural_sciences"],
    pathway: l("A degree in electrical or energy engineering; practical training with real equipment.", "ხარისხი ელექტრო ან ენერგეტიკულ ინჟინერიაში; პრაქტიკული მომზადება რეალურ აღჭურვილობაზე."),
    tryAtSchool: [
      { label: l("Ohm's law circuit", "ომის კანონის წრედი"), href: "/labs/stem/simulations/circuit" },
      { label: l("Solar oven project", "მზის ღუმელის პროექტი"), href: "/labs/stem#projects" },
    ],
  },
  {
    id: "physician",
    title: l("Doctor (physician)", "ექიმი"),
    summary: l("Diagnoses and treats illness, and helps people stay healthy.", "სვამს დიაგნოზს, მკურნალობს დაავადებებს და ეხმარება ადამიანებს ჯანმრთელობის შენარჩუნებაში."),
    dayToDay: [
      l("Listening to patients and examining them", "პაციენტების მოსმენა და გასინჯვა"),
      l("Interpreting tests and evidence", "ანალიზებისა და მტკიცებულებების ინტერპრეტაცია"),
      l("Making careful decisions under pressure", "ზეწოლის ქვეშ ფრთხილი გადაწყვეტილებების მიღება"),
    ],
    skills: ["scientific_inquiry", "communication", "critical_thinking", "self_management"],
    fields: ["medicine_health"],
    pathway: l("A long medical degree followed by residency (specialist training). Requirements differ a lot between countries.", "ხანგრძლივი სამედიცინო განათლება, შემდეგ რეზიდენტურა (სპეციალიზაცია). მოთხოვნები ქვეყნების მიხედვით ძალიან განსხვავდება."),
    tryAtSchool: [{ label: l("Yeast and temperature experiment", "საფუარისა და ტემპერატურის ექსპერიმენტი"), href: "/labs/stem/experiments/yeast" }],
  },
  {
    id: "nurse",
    title: l("Nurse", "ექთანი"),
    summary: l("Cares for patients, gives treatment and supports families in hospitals and communities.", "უვლის პაციენტებს, უტარებს მკურნალობას და მხარს უჭერს ოჯახებს საავადმყოფოებსა და თემებში."),
    dayToDay: [
      l("Monitoring patients and recording observations", "პაციენტების მონიტორინგი და დაკვირვებების ჩაწერა"),
      l("Giving medicines safely", "მედიკამენტების უსაფრთხოდ მიცემა"),
      l("Explaining care to patients and families", "მოვლის ახსნა პაციენტებისა და ოჯახებისთვის"),
    ],
    skills: ["communication", "collaboration", "self_management", "scientific_inquiry"],
    fields: ["medicine_health"],
    pathway: l("A nursing degree or diploma with supervised clinical practice.", "საექთნო ხარისხი ან დიპლომი ზედამხედველობით გავლილი კლინიკური პრაქტიკით."),
    tryAtSchool: [{ label: l("Biology textbook in the library", "ბიოლოგიის სახელმძღვანელო ბიბლიოთეკაში"), href: "/library/lib-openstax-biology" }],
  },
  {
    id: "teacher",
    title: l("Teacher", "მასწავლებელი"),
    summary: l("Helps young people learn a subject and grow as independent thinkers.", "ეხმარება ახალგაზრდებს საგნის შესწავლასა და დამოუკიდებელ მოაზროვნეებად ჩამოყალიბებაში."),
    dayToDay: [
      l("Planning lessons and activities", "გაკვეთილებისა და აქტივობების დაგეგმვა"),
      l("Explaining ideas in several ways", "იდეების სხვადასხვაგვარად ახსნა"),
      l("Giving feedback that helps students improve", "უკუკავშირის მიცემა, რომელიც მოსწავლეებს წინსვლაში ეხმარება"),
    ],
    skills: ["communication", "leadership", "creativity", "collaboration"],
    fields: ["education", "humanities_languages", "natural_sciences", "mathematics_statistics"],
    pathway: l("A degree in the subject plus a teacher-education programme or certification.", "ხარისხი საგანში და მასწავლებლის მომზადების პროგრამა ან სერტიფიცირება."),
    tryAtSchool: [{ label: l("Present your research to the class", "წარუდგინე კვლევა კლასს"), href: "/labs/research" }],
  },
  {
    id: "architect",
    title: l("Architect", "არქიტექტორი"),
    summary: l("Designs buildings and spaces that are beautiful, safe and practical.", "ქმნის შენობებსა და სივრცეებს, რომლებიც ლამაზი, უსაფრთხო და პრაქტიკულია."),
    dayToDay: [
      l("Sketching and modelling designs", "ესკიზებისა და მოდელების შექმნა"),
      l("Meeting clients and understanding their needs", "დამკვეთებთან შეხვედრა და მათი საჭიროებების გაგება"),
      l("Working with engineers and builders", "ინჟინრებთან და მშენებლებთან თანამშრომლობა"),
    ],
    skills: ["creativity", "engineering_design", "communication", "math_reasoning"],
    fields: ["architecture_design", "engineering"],
    pathway: l("A long architecture degree with studio work; a portfolio is usually needed for admission.", "ხანგრძლივი არქიტექტურული განათლება სტუდიური მუშაობით; მისაღებად, როგორც წესი, პორტფოლიოა საჭირო."),
    tryAtSchool: [{ label: l("Paper bridge project", "ქაღალდის ხიდის პროექტი"), href: "/labs/stem#projects" }],
  },
  {
    id: "lawyer",
    title: l("Lawyer", "იურისტი"),
    summary: l("Advises people and organisations on the law and represents them.", "ურჩევს ადამიანებსა და ორგანიზაციებს სამართლებრივ საკითხებში და წარმოადგენს მათ."),
    dayToDay: [
      l("Reading laws, cases and documents carefully", "კანონების, საქმეებისა და დოკუმენტების ყურადღებით კითხვა"),
      l("Building arguments with evidence", "არგუმენტების აგება მტკიცებულებებით"),
      l("Writing and speaking precisely", "ზუსტი წერა და მეტყველება"),
    ],
    skills: ["critical_thinking", "communication", "research", "languages"],
    fields: ["law"],
    pathway: l("A law degree; many countries also require a bar exam or professional training.", "სამართლის ხარისხი; ბევრ ქვეყანაში ასევე საჭიროა ადვოკატთა გამოცდა ან პროფესიული მომზადება."),
    tryAtSchool: [
      { label: l("Argument builder", "არგუმენტის აგება"), href: "/labs/critical-thinking/ct-builder-1" },
      { label: l("Debate preparation", "დებატისთვის მომზადება"), href: "/labs/critical-thinking/ct-debate-1" },
    ],
  },
  {
    id: "journalist",
    title: l("Journalist", "ჟურნალისტი"),
    summary: l("Finds, checks and tells true stories that the public needs to know.", "პოულობს, ამოწმებს და ყვება ნამდვილ ამბებს, რომლებიც საზოგადოებამ უნდა იცოდეს."),
    dayToDay: [
      l("Interviewing people and verifying facts", "ინტერვიუები და ფაქტების გადამოწმება"),
      l("Writing clearly for a deadline", "მკაფიო წერა ვადების დაცვით"),
      l("Being fair to different sides", "სხვადასხვა მხარის მიმართ სამართლიანობა"),
    ],
    skills: ["communication", "research", "critical_thinking", "digital_literacy"],
    fields: ["media_communication", "humanities_languages"],
    pathway: l("A degree in journalism or another subject, plus a strong portfolio of published work.", "ხარისხი ჟურნალისტიკაში ან სხვა სფეროში, პლუს გამოქვეყნებული ნაშრომების ძლიერი პორტფოლიო."),
    tryAtSchool: [{ label: l("Media literacy exercise", "მედიაწიგნიერების სავარჯიშო"), href: "/labs/critical-thinking/ct-media-1" }],
  },
  {
    id: "psychologist",
    title: l("Psychologist", "ფსიქოლოგი"),
    summary: l("Studies how people think, feel and behave, and helps them with difficulties.", "შეისწავლის, როგორ ფიქრობენ, გრძნობენ და იქცევიან ადამიანები, და ეხმარება მათ სირთულეების გადალახვაში."),
    dayToDay: [
      l("Listening and asking good questions", "მოსმენა და სწორი კითხვების დასმა"),
      l("Using research-based methods", "კვლევაზე დაფუძნებული მეთოდების გამოყენება"),
      l("Keeping information confidential", "ინფორმაციის კონფიდენციალურობის დაცვა"),
    ],
    skills: ["communication", "research", "data_analysis", "self_management"],
    fields: ["psychology_social", "medicine_health"],
    pathway: l("A psychology degree followed by a master's and supervised practice for clinical work.", "ფსიქოლოგიის ხარისხი, შემდეგ მაგისტრატურა და ზედამხედველობით გავლილი პრაქტიკა კლინიკური მუშაობისთვის."),
    tryAtSchool: [{ label: l("Everyday biases", "ყოველდღიური მიკერძოებები"), href: "/labs/critical-thinking/ct-biases-1" }],
  },
  {
    id: "ux-designer",
    title: l("UX / product designer", "UX / პროდუქტის დიზაინერი"),
    summary: l("Designs apps and services that are easy and pleasant to use, based on research with real users.", "ქმნის აპლიკაციებსა და სერვისებს, რომლებიც მარტივი და სასიამოვნო გამოსაყენებელია — რეალურ მომხმარებლებთან ჩატარებული კვლევის საფუძველზე."),
    dayToDay: [
      l("Interviewing and observing users", "მომხმარებლებთან ინტერვიუები და დაკვირვება"),
      l("Sketching and prototyping", "ესკიზები და პროტოტიპები"),
      l("Testing designs and improving them", "დიზაინების გამოცდა და გაუმჯობესება"),
    ],
    skills: ["creativity", "research", "communication", "digital_literacy"],
    fields: ["architecture_design", "computer_science", "psychology_social"],
    pathway: l("Degrees vary (design, psychology, computer science); a portfolio showing your design process matters most.", "განათლება განსხვავებულია (დიზაინი, ფსიქოლოგია, კომპიუტერული მეცნიერებები); ყველაზე მნიშვნელოვანია პორტფოლიო, რომელიც შენს დიზაინის პროცესს აჩვენებს."),
    tryAtSchool: [{ label: l("Your own engineering project", "შენი საინჟინრო პროექტი"), href: "/labs/stem#projects" }],
  },
];

export function findCareer(id: string) {
  return CAREERS.find((c) => c.id === id) ?? null;
}

export function findField(id: string) {
  return FIELDS.find((f) => f.id === id) ?? null;
}
