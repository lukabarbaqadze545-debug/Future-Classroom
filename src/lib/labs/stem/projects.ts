import { l } from "../localized";
import type { ProjectTemplate } from "./types";

/** Engineering design project briefs. Students define, design, test and iterate. */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "water-filter",
    mode: "experiment",
    subject: "engineering",
    difficulty: 1,
    title: l("Design a water filter", "წყლის ფილტრის შექმნა"),
    brief: l(
      "Design a filter from everyday materials that makes muddy water as clear as possible. (The filtered water is not safe to drink — this is about clarity, not purification.)",
      "ყოველდღიური მასალებით შექმენი ფილტრი, რომელიც ტალახიან წყალს მაქსიმალურად გაწმენდს. (გაფილტრული წყალი სასმელად უსაფრთხო არ არის — საქმე სიწმინდეს ეხება და არა დეზინფექციას.)",
    ),
    constraints: [l("Use only the materials provided.", "გამოიყენე მხოლოდ მოცემული მასალები."), l("The filter must fit in a cut plastic bottle.", "ფილტრი უნდა დაეტიოს გაჭრილ პლასტმასის ბოთლში.")],
    criteria: [l("Clarity of the water (compare against a scale)", "წყლის სიწმინდე (შეადარე სკალას)"), l("Volume filtered in 5 minutes", "5 წუთში გაფილტრული მოცულობა"), l("Cost of materials used", "გამოყენებული მასალების ღირებულება")],
    materials: [l("Plastic bottle, sand, gravel, cotton wool, coffee filters, charcoal (optional)", "პლასტმასის ბოთლი, ქვიშა, ხრეში, ბამბა, ყავის ფილტრები, ნახშირი (სურვილისამებრ)")],
    safety: [l("Never drink the water, even if it looks clear.", "წყალი არასდროს დალიო, თუნდაც სუფთად გამოიყურებოდეს."), l("Adults cut the bottles.", "ბოთლებს ზრდასრული ჭრის.")],
  },
  {
    id: "tower",
    mode: "experiment",
    subject: "engineering",
    difficulty: 2,
    title: l("Earthquake-resistant tower", "მიწისძვრამედეგი კოშკი"),
    brief: l(
      "Build the tallest tower that survives a 15-second shake on a shake table (a tray on balls or a box shaken by hand at a steady rhythm).",
      "ააშენე რაც შეიძლება მაღალი კოშკი, რომელიც 15-წამიან რყევას გაუძლებს სარყევ მაგიდაზე (ბურთულებზე დადებული ლანგარი ან ყუთი, რომელსაც თანაბარი რიტმით ხელით არყევენ).",
    ),
    constraints: [l("Maximum 50 straws or spaghetti sticks and 1 m of tape.", "მაქსიმუმ 50 საწრუპი ან მაკარონის ღერო და 1 მ ლენტი."), l("The base may not be taped to the table.", "ფუძე მაგიდაზე ლენტით არ მიამაგრო.")],
    criteria: [l("Height after shaking", "სიმაღლე რყევის შემდეგ"), l("Survives 15 seconds", "15 წამს უძლებს"), l("Materials used", "გამოყენებული მასალები")],
    materials: [l("Straws or dry spaghetti, tape, modelling clay, a shake table", "საწრუპები ან მშრალი სპაგეტი, ლენტი, პლასტილინი, სარყევი მაგიდა")],
    safety: [l("Shake the table by hand gently; keep fingers clear of collapsing parts.", "მაგიდა ხელით ფრთხილად არყიე; თითები ჩამოშლილ ნაწილებს მოარიდე.")],
  },
  {
    id: "solar-oven",
    mode: "experiment",
    subject: "physics",
    difficulty: 2,
    title: l("Solar oven", "მზის ღუმელი"),
    brief: l("Design a box that uses sunlight to heat the air inside as much as possible in 30 minutes.", "შექმენი ყუთი, რომელიც მზის სინათლით შიგნით ჰაერს 30 წუთში მაქსიმალურად გააცხელებს."),
    constraints: [l("Use a shoebox-sized box.", "გამოიყენე ფეხსაცმლის ყუთის ზომის ყუთი."), l("No electricity or flames.", "ელექტროენერგიისა და ცეცხლის გარეშე.")],
    criteria: [l("Temperature rise in 30 minutes", "ტემპერატურის ზრდა 30 წუთში"), l("Design explained with heat transfer ideas", "დიზაინის ახსნა სითბოს გადაცემის ცნებებით")],
    materials: [l("Cardboard box, aluminium foil, black paper, cling film, tape, thermometer", "მუყაოს ყუთი, ალუმინის ფოლგა, შავი ქაღალდი, საკვების აპკი, ლენტი, თერმომეტრი")],
    safety: [l("Do not look directly at the sun or at bright reflections.", "პირდაპირ მზეს ან კაშკაშა ანარეკლს ნუ შეხედავ."), l("The inside can get hot — use oven gloves.", "შიგნით შეიძლება ძალიან ცხელა იყოს — გამოიყენე სამზარეულოს ხელთათმანი.")],
  },
  {
    id: "paper-bridge",
    mode: "experiment",
    subject: "engineering",
    difficulty: 1,
    title: l("Paper bridge", "ქაღალდის ხიდი"),
    brief: l("Build a bridge from paper that spans a 20 cm gap and holds as many coins as possible.", "ქაღალდისგან ააგე ხიდი, რომელიც 20 სმ ღიობს გადაფარავს და რაც შეიძლება მეტ მონეტას დაიჭერს."),
    constraints: [l("Maximum 5 sheets of A4 paper and 30 cm of tape.", "მაქსიმუმ 5 ფურცელი A4 ქაღალდი და 30 სმ ლენტი.")],
    criteria: [l("Number of coins held", "დაჭერილი მონეტების რაოდენობა"), l("Strength per sheet of paper", "სიმტკიცე ერთ ფურცელზე")],
    materials: [l("A4 paper, tape, two stacks of books, coins", "A4 ქაღალდი, ლენტი, წიგნების ორი დასტა, მონეტები")],
    safety: [l("Use scissors carefully.", "მაკრატელი ფრთხილად გამოიყენე.")],
  },
  {
    id: "smart-sensor",
    mode: "physical",
    subject: "computing",
    difficulty: 3,
    title: l("Smart classroom sensor", "ჭკვიანი სენსორი საკლასო ოთახისთვის"),
    brief: l(
      "Design a device that measures something in the classroom (light, temperature, noise or CO₂) and helps people act on it — for example, a light that says when to open a window.",
      "შექმენი მოწყობილობა, რომელიც საკლასო ოთახში რაღაცას ზომავს (სინათლე, ტემპერატურა, ხმაური ან CO₂) და ადამიანებს მოქმედებაში ეხმარება — მაგალითად, სანათი, რომელიც გვეუბნება, როდის გავაღოთ ფანჯარა.",
    ),
    constraints: [l("Needs a microcontroller kit and a sensor — not provided by the platform.", "საჭიროა მიკროკონტროლერის ნაკრები და სენსორი — პლატფორმა მათ არ გთავაზობს."), l("Battery or USB powered only.", "მხოლოდ ბატარეით ან USB-ით კვება.")],
    criteria: [l("Measures reliably (checked against another instrument)", "საიმედოდ ზომავს (სხვა ხელსაწყოსთან შედარებით)"), l("Output is easy to understand", "გამოსავალი ინფორმაცია ადვილად გასაგებია"), l("Tested in a real lesson", "შემოწმებულია რეალურ გაკვეთილზე")],
    materials: [l("Arduino-compatible board, sensor, LEDs or a small display, breadboard", "Arduino-თავსებადი დაფა, სენსორი, შუქდიოდები ან პატარა ეკრანი, სამონტაჟო დაფა")],
    safety: [l("Low voltage only; never connect anything to mains sockets.", "მხოლოდ დაბალი ძაბვა; არასდროს შეაერთო რამე ქსელის როზეტთან.")],
  },
  {
    id: "free",
    mode: "physical",
    subject: "engineering",
    difficulty: 2,
    title: l("Your own engineering project", "შენი საინჟინრო პროექტი"),
    brief: l("Find a real problem at school or at home and design, build and test a solution.", "იპოვე რეალური პრობლემა სკოლაში ან სახლში და დააპროექტე, ააწყე და გამოსცადე გადაწყვეტა."),
    constraints: [l("Agree the materials and safety plan with your teacher before building.", "აწყობამდე მასალები და უსაფრთხოების გეგმა მასწავლებელთან შეათანხმე.")],
    criteria: [l("Clear problem and users", "მკაფიო პრობლემა და მომხმარებლები"), l("At least two tested iterations", "მინიმუმ ორი გამოცდილი ვერსია"), l("Honest evaluation", "გულახდილი შეფასება")],
    materials: [l("Depends on your design", "დამოკიდებულია შენს დიზაინზე")],
    safety: [l("Your teacher approves the safety plan.", "უსაფრთხოების გეგმას მასწავლებელი ამტკიცებს.")],
  },
];

export function findTemplate(id: string) {
  return PROJECT_TEMPLATES.find((t) => t.id === id) ?? null;
}
