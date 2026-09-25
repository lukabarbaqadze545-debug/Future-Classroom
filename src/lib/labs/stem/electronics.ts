import { l, type L } from "../localized";
import type { ChallengeSet } from "./types";

/** Electronics topics and components, with schematic symbols drawn in SVG. */

export interface ElectronicsTopic {
  id: string;
  title: L;
  text: L;
  formula?: string;
}

export const ELECTRONICS_TOPICS: ElectronicsTopic[] = [
  {
    id: "circuit",
    title: l("A complete circuit", "სრული წრედი"),
    text: l(
      "Current flows only around a closed loop: from the source, through the components and back. A switch opens or closes the loop.",
      "დენი მხოლოდ შეკრულ წრედში გადის: წყაროდან, კომპონენტების გავლით და უკან. ამომრთველი წრედს ხსნის ან კრავს.",
    ),
  },
  {
    id: "vir",
    title: l("Voltage, current and resistance", "ძაბვა, დენი და წინაღობა"),
    text: l(
      "Voltage (V, volts) is the push that drives charge. Current (I, amperes) is how much charge flows per second. Resistance (R, ohms) is how strongly a component resists the flow. Ohm’s law links them.",
      "ძაბვა (U, ვოლტი) არის „ბიძგი“, რომელიც მუხტს ამოძრავებს. დენი (I, ამპერი) არის წამში გავლილი მუხტის რაოდენობა. წინაღობა (R, ომი) გვიჩვენებს, რამდენად ეწინააღმდეგება კომპონენტი დენს. მათ ომის კანონი აკავშირებს.",
    ),
    formula: "U = I · R",
  },
  {
    id: "series-parallel",
    title: l("Series and parallel", "მიმდევრობითი და პარალელური შეერთება"),
    text: l(
      "In series the same current flows through each part and the resistances add up. In parallel each branch gets the full voltage and the total resistance is smaller than the smallest branch.",
      "მიმდევრობითი შეერთებისას ყველა ნაწილში ერთი და იგივე დენი გადის და წინაღობები იკრიბება. პარალელური შეერთებისას ყოველ შტოზე სრული ძაბვაა და საერთო წინაღობა ყველაზე მცირე შტოს წინაღობაზე ნაკლებია.",
    ),
    formula: "R = R₁ + R₂   ·   1/R = 1/R₁ + 1/R₂",
  },
  {
    id: "power",
    title: l("Power and energy", "სიმძლავრე და ენერგია"),
    text: l(
      "Power is how fast energy is used: P = U · I (watts). A 2 W lamp running for one hour uses 2 watt-hours of energy.",
      "სიმძლავრე გვიჩვენებს, რა სისწრაფით იხარჯება ენერგია: P = U · I (ვატი). 2 ვტ ნათურა ერთ საათში 2 ვატ-საათ ენერგიას ხარჯავს.",
    ),
    formula: "P = U · I",
  },
];

export interface Component {
  id: "battery" | "resistor" | "led" | "switch" | "lamp" | "capacitor" | "diode" | "motor";
  name: L;
  text: L;
}

export const COMPONENTS: Component[] = [
  { id: "battery", name: l("Battery / cell", "ბატარეა / ელემენტი"), text: l("Provides voltage. The longer line is the positive terminal.", "ქმნის ძაბვას. გრძელი ხაზი დადებითი პოლუსია.") },
  { id: "resistor", name: l("Resistor", "რეზისტორი"), text: l("Limits current. Used to protect LEDs and set voltages.", "ზღუდავს დენს. გამოიყენება შუქდიოდების დასაცავად და ძაბვის დასაყენებლად.") },
  { id: "led", name: l("LED", "შუქდიოდი (LED)"), text: l("Lights up when current flows in one direction. Always needs a series resistor.", "ანათებს, როცა დენი ერთი მიმართულებით გადის. ყოველთვის სჭირდება მიმდევრობითი რეზისტორი.") },
  { id: "switch", name: l("Switch", "ამომრთველი"), text: l("Opens or closes the circuit.", "ხსნის ან კრავს წრედს.") },
  { id: "lamp", name: l("Lamp", "ნათურა"), text: l("Turns electrical energy into light and heat.", "ელექტრულ ენერგიას სინათლედ და სითბოდ გარდაქმნის.") },
  { id: "capacitor", name: l("Capacitor", "კონდენსატორი"), text: l("Stores and releases charge; smooths changes in voltage.", "აგროვებს და გასცემს მუხტს; ძაბვის ცვლილებებს არბილებს.") },
  { id: "diode", name: l("Diode", "დიოდი"), text: l("Lets current flow in one direction only.", "დენს მხოლოდ ერთი მიმართულებით ატარებს.") },
  { id: "motor", name: l("DC motor", "მუდმივი დენის ძრავა"), text: l("Turns electrical energy into rotation.", "ელექტრულ ენერგიას ბრუნვად გარდაქმნის.") },
];

export const ELECTRONICS_CHALLENGES: ChallengeSet[] = [
  {
    id: "ohm-practice",
    area: "electronics",
    difficulty: 1,
    title: l("Ohm’s law practice", "ომის კანონის ვარჯიში"),
    summary: l("Five quick calculations with voltage, current and resistance.", "ხუთი სწრაფი გამოთვლა ძაბვით, დენითა და წინაღობით."),
    items: [
      {
        type: "numeric",
        id: "o1",
        prompt: l("A 12 V supply drives 0.5 A through a heater. What is its resistance?", "12 ვ წყარო გამათბობელში 0,5 ა დენს ატარებს. რა არის მისი წინაღობა?"),
        unit: "Ω",
        answer: 24,
        tolerance: 0.1,
        explanation: l("R = U ÷ I = 12 ÷ 0.5 = 24 Ω.", "R = U ÷ I = 12 ÷ 0,5 = 24 Ω."),
      },
      {
        type: "numeric",
        id: "o2",
        prompt: l("A current of 0.02 A flows through a 220 Ω resistor. What is the voltage across it?", "220 Ω რეზისტორში 0,02 ა დენი გადის. რა ძაბვაა მასზე?"),
        unit: "V",
        answer: 4.4,
        tolerance: 0.05,
        explanation: l("U = I · R = 0.02 × 220 = 4.4 V.", "U = I · R = 0,02 × 220 = 4,4 ვ."),
      },
      {
        type: "numeric",
        id: "o3",
        prompt: l("100 Ω and 220 Ω are connected in series. What is the total resistance?", "100 Ω და 220 Ω მიმდევრობითაა შეერთებული. რა არის საერთო წინაღობა?"),
        unit: "Ω",
        answer: 320,
        tolerance: 0.5,
        explanation: l("In series, resistances add: 100 + 220 = 320 Ω.", "მიმდევრობით შეერთებისას წინაღობები იკრიბება: 100 + 220 = 320 Ω."),
      },
      {
        type: "numeric",
        id: "o4",
        prompt: l("What power does a 6 V lamp use when 0.3 A flows through it?", "რა სიმძლავრეს მოიხმარს 6 ვ ნათურა, როცა მასში 0,3 ა დენი გადის?"),
        unit: "W",
        answer: 1.8,
        tolerance: 0.02,
        explanation: l("P = U · I = 6 × 0.3 = 1.8 W.", "P = U · I = 6 × 0,3 = 1,8 ვტ."),
      },
      {
        type: "choice",
        id: "o5",
        prompt: l("You double the resistance while keeping the voltage the same. What happens to the current?", "წინაღობას აორმაგებ, ძაბვა კი უცვლელია. რა ემართება დენს?"),
        options: [
          { id: "double", text: l("It doubles", "ორმაგდება") },
          { id: "half", text: l("It halves", "ნახევრდება") },
          { id: "same", text: l("It stays the same", "უცვლელი რჩება") },
          { id: "zero", text: l("It becomes zero", "ნულდება") },
        ],
        correct: "half",
        explanation: l("I = U ÷ R: twice the resistance means half the current.", "I = U ÷ R: ორჯერ მეტი წინაღობა ორჯერ ნაკლებ დენს ნიშნავს."),
      },
    ],
  },
  {
    id: "led-circuits",
    area: "electronics",
    difficulty: 2,
    title: l("LED circuits", "შუქდიოდიანი წრედები"),
    summary: l("Choose safe resistors for LEDs and read simple schematics.", "შეარჩიე უსაფრთხო რეზისტორები შუქდიოდებისთვის და წაიკითხე მარტივი სქემები."),
    items: [
      {
        type: "numeric",
        id: "led1",
        prompt: l(
          "A red LED needs 2 V and 20 mA. With a 9 V battery, what series resistor do you need?",
          "წითელ შუქდიოდს 2 ვ და 20 მა სჭირდება. 9 ვ ბატარეით რა მიმდევრობითი რეზისტორია საჭირო?",
        ),
        unit: "Ω",
        answer: 350,
        tolerance: 5,
        explanation: l("The resistor takes the remaining 9 − 2 = 7 V: R = 7 ÷ 0.02 = 350 Ω. In practice choose the next standard value up, 390 Ω.", "რეზისტორზე რჩება 9 − 2 = 7 ვ: R = 7 ÷ 0,02 = 350 Ω. პრაქტიკაში აირჩიე შემდეგი სტანდარტული, მეტი მნიშვნელობა — 390 Ω."),
      },
      {
        type: "choice",
        id: "led2",
        prompt: l("Why must an LED have a series resistor?", "რატომ სჭირდება შუქდიოდს მიმდევრობითი რეზისტორი?"),
        options: [
          { id: "bright", text: l("To make it brighter", "რომ უფრო კაშკაშა იყოს") },
          { id: "limit", text: l("To limit the current so the LED is not destroyed", "რომ დენი შეზღუდოს და შუქდიოდი არ დაზიანდეს") },
          { id: "colour", text: l("To change its colour", "რომ ფერი შეცვალოს") },
          { id: "none", text: l("It doesn’t need one", "არ სჭირდება") },
        ],
        correct: "limit",
        explanation: l("An LED has very little resistance once it conducts; without a resistor the current rises until it burns out.", "გამტარ მდგომარეობაში შუქდიოდის წინაღობა ძალიან მცირეა; რეზისტორის გარეშე დენი იზრდება, სანამ შუქდიოდი არ დაიწვება."),
      },
      {
        type: "choice",
        id: "led3",
        prompt: l("An LED is connected the wrong way round in a correct circuit. What happens?", "შუქდიოდი სწორ წრედში შებრუნებულადაა ჩართული. რა მოხდება?"),
        options: [
          { id: "dim", text: l("It glows dimly", "მკრთლად ანათებს") },
          { id: "off", text: l("It does not light, because current cannot flow backwards through it", "არ ანთებს, რადგან დენი მასში საპირისპირო მიმართულებით ვერ გადის") },
          { id: "boom", text: l("It explodes immediately", "მაშინვე ფეთქდება") },
          { id: "same", text: l("It works the same", "ისევე მუშაობს") },
        ],
        correct: "off",
        explanation: l("An LED is a diode: it conducts in one direction only. At low voltages reversing it is harmless — it simply stays off.", "შუქდიოდი დიოდია: დენს მხოლოდ ერთი მიმართულებით ატარებს. დაბალ ძაბვაზე შებრუნება უსაფრთხოა — უბრალოდ არ ანთებს."),
      },
      {
        type: "choice",
        id: "led4",
        prompt: l("Two identical LEDs, each with its own resistor, are connected in parallel to a battery. One LED breaks. What happens to the other?", "ორი ერთნაირი შუქდიოდი, თითოეული საკუთარი რეზისტორით, ბატარეასთან პარალელურადაა შეერთებული. ერთი გაფუჭდა. რა ემართება მეორეს?"),
        options: [
          { id: "off", text: l("It goes out too", "ისიც ქრება") },
          { id: "on", text: l("It keeps shining, because its branch is still complete", "ანათებს ისევ, რადგან მისი შტო კვლავ შეკრულია") },
          { id: "brighter", text: l("It becomes much brighter", "ბევრად უფრო კაშკაშა ხდება") },
          { id: "flash", text: l("It starts flashing", "ციმციმს იწყებს") },
        ],
        correct: "on",
        explanation: l("In parallel each branch is its own loop. This is why house lights are wired in parallel.", "პარალელურ შეერთებაში ყოველი შტო დამოუკიდებელი წრედია. ამიტომ არის სახლის განათება პარალელურად შეერთებული."),
      },
    ],
  },
];
