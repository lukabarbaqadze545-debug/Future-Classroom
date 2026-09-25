import type { Subject, MaterialVisibility } from "@/lib/domain/catalog";

/**
 * School-created demo materials (plain Markdown). They are indexed like any
 * uploaded document, so the library search and grounded answers work out of
 * the box.
 */
export interface SeedMaterial {
  key: string;
  owner: string;
  title: string;
  subject: Subject;
  grade: number | null;
  author: string;
  tags: string[];
  visibility: MaterialVisibility;
  fileName: string;
  daysAgo: number;
  text: string;
}

export const SEED_MATERIALS: SeedMaterial[] = [
  {
    key: "newton-notes",
    owner: "davit",
    title: "Newton's Laws — Physics Notes (Grade 9)",
    subject: "physics",
    grade: 9,
    author: "Davit Kapanadze",
    tags: ["forces", "motion", "notes"],
    visibility: "students",
    fileName: "newtons-laws-notes.md",
    daysAgo: 21,
    text: `# Newton's Laws of Motion — class notes

## Newton's first law (law of inertia)
An object remains at rest, or continues to move in a straight line at a constant speed, unless a net external force acts on it. The property of an object to resist changes in its motion is called inertia. The more mass an object has, the greater its inertia.

Example from class: when our school bus brakes suddenly, the passengers lean forward. Their bodies keep moving forward while the bus slows down.

## Newton's second law
The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. We write this as F = m · a, where F is the net force in newtons (N), m is the mass in kilograms (kg) and a is the acceleration in metres per second squared (m/s²).

One newton is the force that gives a mass of 1 kg an acceleration of 1 m/s². If the same force acts on a heavier object, the acceleration is smaller. To calculate acceleration, divide the net force by the mass: a = F / m.

Worked example: a net force of 20 N acts on a 4 kg trolley. The acceleration is a = 20 / 4 = 5 m/s².

## Newton's third law
When one object exerts a force on a second object, the second object exerts a force of equal size and opposite direction on the first. These two forces act on different objects, so they do not cancel out.

Examples: a swimmer pushes water backwards and moves forwards; a rocket pushes exhaust gases downwards and is pushed upwards.

## Safety in the lab
When we test these laws with trolleys and ramps, keep ramps low, work on the floor where possible and keep hands and feet away from moving trolleys.`,
  },
  {
    key: "newton-notes-ka",
    owner: "davit",
    title: "ნიუტონის კანონები — მოკლე კონსპექტი",
    subject: "physics",
    grade: 9,
    author: "დავით კაპანაძე",
    tags: ["ძალა", "მოძრაობა", "კონსპექტი"],
    visibility: "students",
    fileName: "niutonis-kanonebi.md",
    daysAgo: 20,
    text: `# ნიუტონის კანონები

## ნიუტონის პირველი კანონი (ინერციის კანონი)
სხეული ინარჩუნებს უძრაობის ან წრფივი თანაბარი მოძრაობის მდგომარეობას, სანამ მასზე სხვა სხეულები არ იმოქმედებენ. სხეულის თვისებას, შეინარჩუნოს სიჩქარე, ინერცია ეწოდება.

## ნიუტონის მეორე კანონი
სხეულის აჩქარება პირდაპირპროპორციულია მასზე მოქმედი ტოლქმედი ძალისა და უკუპროპორციულია სხეულის მასისა: F = m · a. ძალა იზომება ნიუტონებში (ნ), მასა — კილოგრამებში, აჩქარება — მ/წმ²-ში.

მაგალითი: 20 ნ ძალა მოქმედებს 4 კგ მასის ურიკაზე. აჩქარება a = 20 / 4 = 5 მ/წმ².

## ნიუტონის მესამე კანონი
ორი სხეული ერთმანეთზე მოქმედებს სიდიდით ტოლი და მიმართულებით საწინააღმდეგო ძალებით. ეს ძალები სხვადასხვა სხეულზეა მოდებული, ამიტომ ერთმანეთს არ აბათილებს.`,
  },
  {
    key: "quadratic-worked",
    owner: "nino",
    title: "Quadratic Equations — Worked Examples",
    subject: "mathematics",
    grade: 11,
    author: "Nino Beridze",
    tags: ["algebra", "worksheet", "examples"],
    visibility: "students",
    fileName: "quadratic-worked-examples.md",
    daysAgo: 14,
    text: `# Quadratic equations — worked examples

## Standard form
A quadratic equation has the form ax² + bx + c = 0 where a is not zero. Always move every term to one side before you solve.

## Method 1: factoring
Example: x² − 7x + 10 = 0. We need two numbers that multiply to 10 and add to −7: they are −2 and −5. So (x − 2)(x − 5) = 0 and x = 2 or x = 5.

Tip: check your answer by substituting it back into the original equation.

## Method 2: the quadratic formula
x = (−b ± √(b² − 4ac)) / (2a). Example: x² + 4x + 1 = 0 gives D = 16 − 4 = 12, so x = (−4 ± √12) / 2 = −2 ± √3.

## The discriminant
D = b² − 4ac. If D > 0 there are two real roots, if D = 0 there is one repeated root, and if D < 0 there are no real roots.

## Common mistakes
Forgetting the ± sign, sign errors when b is negative, and dividing both sides by x, which loses the solution x = 0.`,
  },
  {
    key: "ecosystems-reading",
    owner: "eka",
    title: "Ecosystems of Georgia — Reading",
    subject: "biology",
    grade: 7,
    author: "Eka Chkheidze",
    tags: ["ecology", "reading", "Georgia"],
    visibility: "students",
    fileName: "ecosystems-of-georgia.md",
    daysAgo: 30,
    text: `# Ecosystems of Georgia

Georgia is small, but it has many ecosystems: alpine meadows in the Greater Caucasus, humid Colchic forests in the west, dry semi-deserts in Vashlovani, and wetlands on the Black Sea coast.

## Producers, consumers and decomposers
In a Colchic forest, beech and chestnut trees are producers: they make food from sunlight by photosynthesis. Deer and wild boar are herbivores that eat plants. Wolves and brown bears are consumers higher up the food web. Fungi and bacteria are decomposers: they break down fallen leaves and dead animals and return nutrients to the soil.

## Energy in food chains
Only about ten percent of the energy stored at one level of a food chain passes to the next level. The rest is used for living or lost as heat. This is why there are far fewer bears and wolves than deer, and far fewer deer than trees.

## Protecting ecosystems
National parks such as Borjomi-Kharagauli and Lagodekhi protect habitats. Removing one species, for example a top predator, can change the whole food web.`,
  },
  {
    key: "rubric",
    owner: "nino",
    title: "Assessment rubric for problem-solving tasks",
    subject: "mathematics",
    grade: null,
    author: "Mathematics department",
    tags: ["assessment", "rubric", "teachers"],
    visibility: "teachers",
    fileName: "problem-solving-rubric.md",
    daysAgo: 45,
    text: `# Problem-solving rubric (mathematics department)

Level 4 — Complete and correct solution with clear reasoning and a check of the answer.
Level 3 — Correct method with a small calculation error, reasoning mostly clear.
Level 2 — Partially correct method; key step missing or incorrect.
Level 1 — Attempt shows some relevant knowledge but no workable method.

Feedback should name one strength and one next step. Use hints before giving model solutions.`,
  },
];
