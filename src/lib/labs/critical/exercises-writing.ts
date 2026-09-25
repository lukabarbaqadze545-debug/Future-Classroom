import { l } from "../localized";
import type { BuilderExercise, DebateExercise, DecisionExercise, HumilityExercise } from "./types";

/*
 * Structured writing exercises. Feedback is rule-based and honest about its
 * limits: it checks the structure of the reasoning, not whether the facts
 * are true — that is for the teacher and the class to discuss.
 */

export const BUILDER_EXERCISES: BuilderExercise[] = [
  {
    id: "ct-builder-1",
    kind: "builder",
    topic: "arguments",
    difficulty: 1,
    minutes: 20,
    title: l("Argument builder: school life", "არგუმენტის აგება: სკოლის ცხოვრება"),
    intro: l(
      "Choose a question and build a complete argument: a clear claim, reasons, evidence for each reason, the strongest counterargument, your answer to it and a conclusion.",
      "აირჩიე კითხვა და ააგე სრული არგუმენტი: მკაფიო მტკიცება, მიზეზები, მტკიცებულება თითოეული მიზეზისთვის, ყველაზე ძლიერი კონტრარგუმენტი, შენი პასუხი მასზე და დასკვნა.",
    ),
    questions: [
      {
        id: "phones",
        text: l("Should students be allowed to use phones during breaks?", "უნდა ჰქონდეთ თუ არა მოსწავლეებს შესვენებაზე ტელეფონის გამოყენების უფლება?"),
        context: l("Think about safety, social life, rest and how breaks are used.", "იფიქრე უსაფრთხოებაზე, ურთიერთობებზე, დასვენებასა და იმაზე, როგორ ვიყენებთ შესვენებას."),
      },
      {
        id: "four-day",
        text: l("Should our school try a four-day week with longer days?", "უნდა სცადოს თუ არა ჩვენმა სკოლამ ოთხდღიანი კვირა უფრო გრძელი დღეებით?"),
        context: l("Think about learning, tiredness, families, transport and teachers.", "იფიქრე სწავლაზე, დაღლილობაზე, ოჯახებზე, ტრანსპორტსა და მასწავლებლებზე."),
      },
      {
        id: "programming",
        text: l("Should every student learn programming?", "უნდა სწავლობდეს თუ არა ყველა მოსწავლე პროგრამირებას?"),
        context: l("Think about future jobs, problem solving, time in the timetable and different interests.", "იფიქრე მომავალ პროფესიებზე, პრობლემების გადაჭრაზე, ცხრილში საათების რაოდენობასა და განსხვავებულ ინტერესებზე."),
      },
      {
        id: "canteen",
        text: l("Should the school canteen sell only healthy food?", "უნდა ყიდდეს თუ არა სკოლის კანტინა მხოლოდ ჯანსაღ საკვებს?"),
        context: l("Think about health, choice, cost and what “healthy” means.", "იფიქრე ჯანმრთელობაზე, არჩევანის თავისუფლებაზე, ფასსა და იმაზე, რას ნიშნავს „ჯანსაღი“."),
      },
    ],
  },
  {
    id: "ct-builder-2",
    kind: "builder",
    topic: "evidence",
    difficulty: 2,
    minutes: 25,
    title: l("Argument builder: society and science", "არგუმენტის აგება: საზოგადოება და მეცნიერება"),
    intro: l(
      "Bigger questions need stronger evidence. For each reason, say what kind of evidence you would use and where it would come from.",
      "დიდი კითხვები ძლიერ მტკიცებულებებს მოითხოვს. თითოეული მიზეზისთვის მიუთითე, რა ტიპის მტკიცებულებას გამოიყენებდი და საიდან მოიპოვებდი.",
    ),
    questions: [
      {
        id: "transport",
        text: l("Should public transport in cities be free?", "უნდა იყოს თუ არა ქალაქის საზოგადოებრივი ტრანსპორტი უფასო?"),
        context: l("Think about traffic, air quality, cost for the city and fairness.", "იფიქრე საცობებზე, ჰაერის ხარისხზე, ქალაქის ხარჯებსა და სამართლიანობაზე."),
      },
      {
        id: "voting-age",
        text: l("Should the voting age be lowered to 16?", "უნდა შემცირდეს თუ არა ხმის მიცემის ასაკი 16 წლამდე?"),
        context: l("Think about responsibility, education, interest in politics and examples from other countries.", "იფიქრე პასუხისმგებლობაზე, განათლებაზე, პოლიტიკით დაინტერესებასა და სხვა ქვეყნების მაგალითებზე."),
      },
      {
        id: "zoos",
        text: l("Do modern zoos do more good than harm?", "თანამედროვე ზოოპარკები მეტ სიკეთეს მოაქვს თუ ზიანს?"),
        context: l("Think about conservation, education, animal welfare and alternatives.", "იფიქრე სახეობების დაცვაზე, განათლებაზე, ცხოველთა კეთილდღეობასა და ალტერნატივებზე."),
      },
      {
        id: "ai-homework",
        text: l("Should students be allowed to use AI tools for homework?", "უნდა ჰქონდეთ თუ არა მოსწავლეებს საშინაო დავალებაში ხელოვნური ინტელექტის ხელსაწყოების გამოყენების უფლება?"),
        context: l("Think about learning, honesty, access and future skills.", "იფიქრე სწავლაზე, პატიოსნებაზე, ხელმისაწვდომობასა და მომავლის უნარებზე."),
      },
    ],
  },
];

export const DEBATE_EXERCISES: DebateExercise[] = [
  {
    id: "ct-debate-1",
    kind: "debate",
    topic: "debate",
    difficulty: 2,
    minutes: 30,
    title: l("Debate: exams or portfolios?", "დებატი: გამოცდები თუ პორტფოლიო?"),
    intro: l(
      "Prepare for a class debate: three arguments for your side, the strongest argument of the other side stated fairly, your rebuttal — and then one argument from the side you did not choose.",
      "მოემზადე კლასის დებატისთვის: შენი მხარის სამი არგუმენტი, მეორე მხარის ყველაზე ძლიერი არგუმენტი სამართლიანად ჩამოყალიბებული, შენი კონტრარგუმენტი — და ბოლოს ერთი არგუმენტი იმ მხარისგან, რომელიც არ აგირჩევია.",
    ),
    motion: l("This house would replace final exams with project portfolios.", "ეს პალატა საფინალო გამოცდებს პროექტების პორტფოლიოთი ჩაანაცვლებდა."),
    context: l("Portfolios collect work over the year; exams test knowledge at one moment under equal conditions.", "პორტფოლიო წლის განმავლობაში შესრულებულ ნამუშევრებს აგროვებს; გამოცდა ცოდნას ერთ მომენტში, თანაბარ პირობებში ამოწმებს."),
  },
  {
    id: "ct-debate-2",
    kind: "debate",
    topic: "debate",
    difficulty: 2,
    minutes: 30,
    title: l("Debate: social media and teenagers", "დებატი: სოციალური მედია და მოზარდები"),
    intro: l(
      "A classic motion with evidence on both sides. Use facts where you can, and say clearly when something is your opinion.",
      "კლასიკური თემა, რომელზეც ორივე მხარეს აქვს მტკიცებულებები. სადაც შეგიძლია, ფაქტები გამოიყენე და მკაფიოდ აღნიშნე, როცა რაღაც შენი აზრია.",
    ),
    motion: l("This house believes social media does more harm than good for teenagers.", "ეს პალატა მიიჩნევს, რომ სოციალური მედია მოზარდებს მეტ ზიანს აყენებს, ვიდრე სარგებელს."),
    context: l("Consider friendship, learning, creativity, sleep, comparison with others and online safety.", "გაითვალისწინე მეგობრობა, სწავლა, კრეატიულობა, ძილი, სხვებთან შედარება და ონლაინ უსაფრთხოება."),
  },
  {
    id: "ct-debate-3",
    kind: "debate",
    topic: "debate",
    difficulty: 1,
    minutes: 25,
    title: l("Debate: a vegetarian day", "დებატი: ვეგეტარიანული დღე"),
    intro: l("A good first debate: concrete, local and with reasonable arguments on both sides.", "კარგი პირველი დებატი: კონკრეტული, ადგილობრივი და ორივე მხარეს გონივრული არგუმენტებით."),
    motion: l("This house would make the school canteen vegetarian one day a week.", "ეს პალატა სკოლის კანტინას კვირაში ერთი დღით ვეგეტარიანულს გახდიდა."),
    context: l("Consider health, the environment, cost, choice and students’ preferences.", "გაითვალისწინე ჯანმრთელობა, გარემო, ფასი, არჩევანის თავისუფლება და მოსწავლეების სურვილები."),
  },
];

export const HUMILITY_EXERCISES: HumilityExercise[] = [
  {
    id: "ct-humility-1",
    kind: "humility",
    topic: "humility",
    difficulty: 2,
    minutes: 15,
    title: l("Changing your mind well", "როგორ შევიცვალოთ აზრი სწორად"),
    intro: l(
      "Rate how confident you are, then see new information and rate again. Good thinkers move their confidence when evidence is relevant — and keep it steady when it is not.",
      "შეაფასე, რამდენად ხარ დარწმუნებული, შემდეგ ნახე ახალი ინფორმაცია და ხელახლა შეაფასე. კარგი მოაზროვნე თავდაჯერებას ცვლის, როცა მტკიცებულება რელევანტურია — და არ ცვლის, როცა არ არის.",
    ),
    scenarios: [
      {
        id: "h1",
        situation: l("You read online that a new energy drink improves test scores.", "ინტერნეტში წაიკითხე, რომ ახალი ენერგეტიკული სასმელი ტესტის შედეგებს აუმჯობესებს."),
        claim: l("The energy drink improves test scores.", "ენერგეტიკული სასმელი ტესტის შედეგებს აუმჯობესებს."),
        newEvidence: l(
          "You discover that the only study was paid for by the drink company, had 12 participants and no comparison group.",
          "აღმოაჩინე, რომ ერთადერთი კვლევა სასმელის მწარმოებელმა დააფინანსა, მასში 12 ადამიანი მონაწილეობდა და საკონტროლო ჯგუფი არ ჰყავდა.",
        ),
        direction: "down",
        explanation: l("A tiny, uncontrolled study funded by the seller is weak support — your confidence should go down.", "გამყიდველის მიერ დაფინანსებული პატარა, უკონტროლო კვლევა სუსტი საყრდენია — თავდაჯერება უნდა შემცირდეს."),
      },
      {
        id: "h2",
        situation: l("A friend says the school library is almost empty on Fridays.", "მეგობარი ამბობს, რომ სკოლის ბიბლიოთეკა პარასკევობით თითქმის ცარიელია."),
        claim: l("The library is almost empty on Fridays.", "ბიბლიოთეკა პარასკევობით თითქმის ცარიელია."),
        newEvidence: l(
          "The librarian shows you the visitor log for the last ten Fridays: on average 4 visitors, compared with 35 on other days.",
          "ბიბლიოთეკარი გაჩვენებს ბოლო ათი პარასკევის ვიზიტორთა ჟურნალს: საშუალოდ 4 მნახველი, სხვა დღეებში კი — 35.",
        ),
        direction: "up",
        explanation: l("Systematic records over ten weeks strongly support the claim — your confidence should go up.", "ათი კვირის სისტემური ჩანაწერები მტკიცებას ძლიერ ამყარებს — თავდაჯერება უნდა გაიზარდოს."),
      },
      {
        id: "h3",
        situation: l("You believe reading on paper helps you remember more than reading on a screen.", "გჯერა, რომ ქაღალდზე კითხვა ეკრანზე კითხვასთან შედარებით უკეთ გამახსოვრებს."),
        claim: l("Reading on paper helps memory more than reading on a screen.", "ქაღალდზე კითხვა მეხსიერებას ეკრანზე კითხვაზე მეტად ეხმარება."),
        newEvidence: l("You learn that the author of one study on this topic has a popular podcast.", "გაიგე, რომ ამ თემაზე ერთ-ერთი კვლევის ავტორს პოპულარული პოდკასტი აქვს."),
        direction: "none",
        explanation: l(
          "Whether the author has a podcast says nothing about the evidence. Your confidence should stay about the same.",
          "ის, რომ ავტორს პოდკასტი აქვს, მტკიცებულებაზე არაფერს ამბობს. თავდაჯერება დაახლოებით იგივე უნდა დარჩეს.",
        ),
      },
      {
        id: "h4",
        situation: l("Your group believes plants grow better when music is played to them.", "შენს ჯგუფს სჯერა, რომ მცენარეები მუსიკის თანხლებით უკეთ იზრდება."),
        claim: l("Music makes plants grow better.", "მუსიკა მცენარეების ზრდას აუმჯობესებს."),
        newEvidence: l(
          "In your class experiment, plants with and without music grew the same over four weeks, with identical light and water.",
          "კლასის ექსპერიმენტში მცენარეები მუსიკით და მუსიკის გარეშე ოთხი კვირის განმავლობაში ერთნაირად გაიზარდა, თანაბარი სინათლისა და მორწყვის პირობებში.",
        ),
        direction: "down",
        explanation: l("A fair test found no difference, so your confidence should go down — though one small experiment is not the final word.", "სამართლიანმა ექსპერიმენტმა განსხვავება ვერ აჩვენა, ამიტომ თავდაჯერება უნდა შემცირდეს — თუმცა ერთი მცირე ექსპერიმენტი საბოლოო სიტყვა არ არის."),
      },
      {
        id: "h5",
        situation: l("A classmate claims the new bus route to school is faster.", "კლასელი ამბობს, რომ სკოლამდე ახალი ავტობუსის მარშრუტი უფრო სწრაფია."),
        claim: l("The new bus route is faster.", "ახალი ავტობუსის მარშრუტი უფრო სწრაფია."),
        newEvidence: l(
          "Three classmates who took both routes last week timed them: the new route was 6–9 minutes faster every time.",
          "სამმა კლასელმა, რომელიც გასულ კვირას ორივე მარშრუტით იმგზავრა, დრო გაზომა: ახალი მარშრუტი ყოველ ჯერზე 6–9 წუთით სწრაფი იყო.",
        ),
        direction: "up",
        explanation: l("Repeated, measured comparisons support the claim — your confidence should go up.", "განმეორებითი, გაზომილი შედარებები მტკიცებას ამყარებს — თავდაჯერება უნდა გაიზარდოს."),
      },
    ],
  },
];

export const DECISION_EXERCISES: DecisionExercise[] = [
  {
    id: "ct-decision-1",
    kind: "decision",
    topic: "decision_making",
    difficulty: 1,
    minutes: 15,
    title: l("Decision matrix: a class project", "გადაწყვეტილების მატრიცა: კლასის პროექტი"),
    intro: l(
      "Your class must choose one project for the spring term. Weigh the criteria, score each option and see whether the result is a clear winner or a close call.",
      "თქვენმა კლასმა საგაზაფხულო სემესტრისთვის ერთი პროექტი უნდა აირჩიოს. შეაფასე კრიტერიუმების მნიშვნელობა, მიანიჭე ქულები თითოეულ ვარიანტს და ნახე, აშკარა გამარჯვებულია თუ თანაბარი შედეგი.",
    ),
    scenario: l("Choose the class project for the spring term.", "აირჩიეთ კლასის პროექტი საგაზაფხულო სემესტრისთვის."),
    options: [
      l("Build a school weather station", "სკოლის მეტეოსადგურის აწყობა"),
      l("Organise a book swap for the whole school", "მთელი სკოლისთვის წიგნების გაცვლის ორგანიზება"),
      l("Make a short documentary about the town’s history", "მოკლე დოკუმენტური ფილმი ქალაქის ისტორიაზე"),
    ],
    criteria: [l("Cost", "ხარჯი"), l("What we learn", "რას ვისწავლით"), l("Time needed", "საჭირო დრო"), l("Benefit to others", "სარგებელი სხვებისთვის")],
  },
  {
    id: "ct-decision-2",
    kind: "decision",
    topic: "decision_making",
    difficulty: 2,
    minutes: 20,
    title: l("Decision matrix: which study programme to research", "გადაწყვეტილების მატრიცა: რომელი პროგრამა გამოვიკვლიო"),
    intro: l(
      "Use a decision matrix for a personal choice. Replace the example options with your own. The matrix does not decide for you — it shows what your own priorities imply.",
      "გამოიყენე გადაწყვეტილების მატრიცა პირადი არჩევანისთვის. მაგალითები შენი ვარიანტებით ჩაანაცვლე. მატრიცა შენ მაგივრად არ წყვეტს — ის აჩვენებს, რა გამომდინარეობს შენივე პრიორიტეტებიდან.",
    ),
    scenario: l("Which study programme should I research first?", "რომელი სასწავლო პროგრამა გამოვიკვლიო პირველ რიგში?"),
    options: [l("Computer science", "კომპიუტერული მეცნიერებები"), l("Medicine", "მედიცინა"), l("Architecture", "არქიტექტურა")],
    criteria: [l("My interest", "ჩემი ინტერესი"), l("Career options", "კარიერული შესაძლებლობები"), l("Entry requirements I can meet", "მისაღები მოთხოვნები, რომლებსაც დავაკმაყოფილებ"), l("Cost and location", "ღირებულება და მდებარეობა")],
  },
];
