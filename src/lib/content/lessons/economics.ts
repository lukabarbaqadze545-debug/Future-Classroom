import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const ECONOMICS: BiLesson[] = [
  {
    group: "personal-budget",
    subject: "economics",
    grade: 8,
    durationMin: 40,
    difficulty: "foundation",
    match: /budget|spending|pocket money|needs and wants|ბიუჯეტ|ხარჯ|ჯიბის ფულ|საჭიროებ/i,
    title: l("Planning a Personal Budget", "პირადი ბიუჯეტის დაგეგმვა"),
    topic: l("Budgeting", "ბიუჯეტი"),
    objective: l(
      "Students separate needs from wants, build a simple monthly budget in lari and plan how to reach a savings goal.",
      "მოსწავლეები ასხვავებენ საჭიროებებსა და სურვილებს, ლარებში ადგენენ მარტივ თვიურ ბიუჯეტს და გეგმავენ დანაზოგის მიზნის მიღწევას.",
    ),
    objectives: [
      l("Distinguish needs and wants.", "განასხვავოს საჭიროებები და სურვილები."),
      l("Build a budget with income, expenses and savings.", "შეადგინოს ბიუჯეტი შემოსავლით, ხარჯებითა და დანაზოგით."),
      l("Calculate how long it takes to reach a savings goal.", "გამოთვალოს, რამდენ ხანში მიაღწევს დანაზოგის მიზანს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Where does the money go?", "სად მიდის ფული?"),
        minutes: 5,
        body: l(
          `Mariam gets 60 lari a month from her parents and earns 40 lari helping a neighbour. By the end of the month she often has nothing left and cannot say where it went. A budget is simply a plan that tells your money where to go before you spend it.`,
          `მარიამს მშობლები თვეში 60 ლარს აძლევენ, 40 ლარს კი მეზობლისთვის დახმარებით გამოიმუშავებს. თვის ბოლოს ხშირად აღარაფერი რჩება და ვერ იხსენებს, სად დახარჯა. ბიუჯეტი უბრალოდ გეგმაა, რომელიც ფულს დახარჯვამდე ეუბნება, სად წავიდეს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Needs, wants and the 50/30/20 idea", "საჭიროებები, სურვილები და 50/30/20 წესი"),
        minutes: 12,
        body: l(
          `• Needs: things you must have — transport to school, school supplies, lunch.
• Wants: things you would like — a new game, cinema, snacks.

A simple rule of thumb (for adults, often 50/30/20): about half for needs, less than a third for wants, and at least a fifth for savings. It is a guide, not a law — the right split depends on your situation.

Mariam's budget (100 GEL):
Needs: transport 20, lunches 30 → 50 GEL
Wants: cinema 12, snacks 13, phone credit 5 → 30 GEL
Savings: 20 GEL`,
          `• საჭიროებები: ის, რაც აუცილებლად გჭირდება — სკოლამდე მგზავრობა, სასკოლო ნივთები, სადილი.
• სურვილები: ის, რაც გინდა — ახალი თამაში, კინო, ტკბილეული.

მარტივი მიდგომა (ზრდასრულებისთვის ხშირად 50/30/20): დაახლოებით ნახევარი — საჭიროებებზე, მესამედზე ნაკლები — სურვილებზე და სულ მცირე მეხუთედი — დანაზოგზე. ეს მითითებაა და არა კანონი — სწორი განაწილება შენს სიტუაციაზეა დამოკიდებული.

მარიამის ბიუჯეტი (100 ლარი):
საჭიროებები: მგზავრობა 20, სადილი 30 → 50 ლარი
სურვილები: კინო 12, ტკბილეული 13, მობილურის ბალანსი 5 → 30 ლარი
დანაზოგი: 20 ლარი`,
        ),
      },
      {
        kind: "example",
        title: l("A savings goal", "დანაზოგის მიზანი"),
        minutes: 8,
        body: l(
          `Mariam wants headphones that cost 150 GEL. Saving 20 GEL a month, she needs 150 ÷ 20 = 7.5 → 8 months. If she cuts snacks by 10 GEL and saves 30 GEL a month, she needs only 5 months.

Tracking expenses for one month (a notebook or a spreadsheet) usually shows small, frequent purchases that add up.`,
          `მარიამს 150 ლარიანი ყურსასმენები უნდა. თვეში 20 ლარის დაზოგვით მას 150 ÷ 20 = 7,5 → 8 თვე სჭირდება. თუ ტკბილეულზე ხარჯს 10 ლარით შეამცირებს და თვეში 30 ლარს დაზოგავს, მხოლოდ 5 თვე დასჭირდება.

ერთი თვის ხარჯების აღრიცხვა (რვეულში ან ელცხრილში) ჩვეულებრივ ავლენს პატარა, ხშირ შენაძენებს, რომლებიც ერთად დიდ თანხას შეადგენს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Make your budget", "შეადგინე შენი ბიუჯეტი"),
        minutes: 10,
        body: l(
          `Do the activities. Then make a budget for an invented student with 120 GEL a month and a goal of your choice. Use real prices you know, or ask at home.`,
          `შეასრულე აქტივობები. შემდეგ შეადგინე ბიუჯეტი წარმოსახვითი მოსწავლისთვის, რომელსაც თვეში 120 ლარი აქვს, და შენ მიერ არჩეული მიზნით. გამოიყენე შენთვის ცნობილი რეალური ფასები ან სახლში იკითხე.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Budget = income − expenses − savings, planned in advance.
• Needs before wants; pay yourself (savings) first.
• Goal ÷ monthly savings = months needed.`,
          `• ბიუჯეტი = შემოსავალი − ხარჯები − დანაზოგი, წინასწარ დაგეგმილი.
• ჯერ საჭიროებები, შემდეგ სურვილები; დანაზოგი თვის დასაწყისშივე გადადე.
• მიზანი ÷ თვიური დანაზოგი = საჭირო თვეები.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Need or want?", "საჭიროება თუ სურვილი?"),
        prompt: l("For most students, which is a need?", "მოსწავლეების უმეტესობისთვის რომელია საჭიროება?"),
        options: [l("A bus ticket to school", "ავტობუსის ბილეთი სკოლამდე"), l("A new phone case", "ტელეფონის ახალი ქეისი"), l("A cinema ticket", "კინოს ბილეთი"), l("A video game", "ვიდეოთამაში")],
        correct: 0,
        hints: [
          l("A need is something you must have.", "საჭიროება ისაა, რაც აუცილებლად გჭირდება."),
          l("Which option is necessary to get to school?", "რომელი ვარიანტია აუცილებელი სკოლამდე მისასვლელად?"),
        ],
      },
      {
        type: "exercise",
        title: l("Months to save", "დაზოგვის თვეები"),
        prompt: l("You save 25 GEL a month. How many months do you need for a 200 GEL bicycle?", "თვეში 25 ლარს ზოგავ. რამდენი თვე დაგჭირდება 200 ლარიანი ველოსიპედისთვის?"),
        accepted: ["8"],
        hints: [l("Divide the goal by the monthly saving.", "მიზანი თვიურ დანაზოგზე გაყავი."), l("200 ÷ 25", "200 ÷ 25")],
        solution: l("200 ÷ 25 = 8 months", "200 ÷ 25 = 8 თვე"),
      },
      {
        type: "exercise",
        title: l("Twenty percent", "ოცი პროცენტი"),
        prompt: l("Following the 20% savings idea, how much should you save from 150 GEL?", "20%-იანი დაზოგვის პრინციპით რამდენი უნდა დაზოგო 150 ლარიდან?"),
        accepted: { en: ["30", "30 GEL"], ka: ["30", "30 ლარი"] },
        hints: [l("20% = 0.2", "20% = 0,2"), l("0.2 × 150", "0,2 × 150")],
        solution: l("0.2 × 150 = 30 GEL", "0,2 × 150 = 30 ლარი"),
      },
      { type: "discussion", prompt: l("Advertisements often turn wants into \"needs\". Give an example and explain the technique.", "რეკლამა ხშირად სურვილებს „საჭიროებად“ აქცევს. მოიყვანე მაგალითი და ახსენი ხერხი.") },
      { type: "exit", prompt: l("Write one change you could make this month to save 10 GEL.", "დაწერე ერთი ცვლილება, რომლითაც ამ თვეში 10 ლარის დაზოგვა შეგიძლია.") },
    ],
    discussion: [l("Why do many people find it easier to save when they put money aside at the start of the month?", "რატომ უადვილდებათ ბევრს დაზოგვა, როცა ფულს თვის დასაწყისშივე გადადებენ?")],
    assessment: [l("A balanced budget with needs, wants and savings and a realistic goal plan.", "დაბალანსებული ბიუჯეტი საჭიროებებით, სურვილებითა და დანაზოგით და რეალისტური მიზნის გეგმა.")],
    homework: [l("Record everything you spend for one week. Sort it into needs and wants. What surprised you?", "ერთი კვირის განმავლობაში ჩაიწერე ყველა ხარჯი. დაყავი საჭიროებებად და სურვილებად. რამ გაგაკვირვა?")],
    teacherNotes: l(
      "Students' family situations differ widely; use invented students and never ask pupils to share their family's income. Amounts in lari are illustrative.",
      "მოსწავლეების ოჯახური მდგომარეობა ძალიან განსხვავებულია; გამოიყენეთ წარმოსახვითი პერსონაჟები და არასოდეს სთხოვოთ მოსწავლეებს ოჯახის შემოსავლის გაზიარება. ლარებში მოცემული თანხები საილუსტრაციოა.",
    ),
    quiz: {
      title: l("Budgeting — check yourself", "ბიუჯეტი — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("Income 90 GEL, expenses 72 GEL. How much is left to save?", "შემოსავალი 90 ლარი, ხარჯი 72 ლარი. რამდენი რჩება დასაზოგად?"), answer: 18 },
        { type: "tf", prompt: l("The 50/30/20 rule is a law every budget must follow.", "50/30/20 წესი კანონია, რომელსაც ყველა ბიუჯეტი უნდა მიჰყვებოდეს."), answer: false },
        { type: "num", prompt: l("Goal 120 GEL, saving 15 GEL a month. Months needed?", "მიზანი 120 ლარი, თვიური დანაზოგი 15 ლარი. რამდენი თვეა საჭირო?"), answer: 8 },
      ],
    },
  },
  {
    group: "interest-saving",
    subject: "economics",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /interest|compound|deposit|loan|saving|პროცენტ|დეპოზიტ|სესხ|დაზოგვ/i,
    title: l("Saving and Interest: Simple and Compound", "დაზოგვა და პროცენტი: მარტივი და რთული"),
    topic: l("Interest", "საპროცენტო განაკვეთი"),
    objective: l(
      "Students calculate simple and compound interest, compare savings and loans, and explain why the effective cost of a loan matters.",
      "მოსწავლეები ითვლიან მარტივ და რთულ პროცენტს, ადარებენ დანაზოგსა და სესხს და ხსნიან, რატომ არის მნიშვნელოვანი სესხის ეფექტური ღირებულება.",
    ),
    objectives: [
      l("Calculate simple interest.", "გამოთვალოს მარტივი პროცენტი."),
      l("Calculate compound interest for a few years and explain the difference.", "გამოთვალოს რთული პროცენტი რამდენიმე წლისთვის და ახსნას განსხვავება."),
      l("Explain why interest helps savers and costs borrowers.", "ახსნას, რატომ სარგებლობს პროცენტით დამზოგველი და რატომ უჯდება ის მსესხებელს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Money that grows", "ფული, რომელიც იზრდება"),
        minutes: 5,
        body: l(
          `If you put money in a savings deposit, the bank pays you interest for using it. If you borrow, you pay the bank interest. The same maths works in both directions — once you understand it, you can see through many advertisements.`,
          `თუ ფულს შემნახველ დეპოზიტზე შეიტან, ბანკი მისი გამოყენებისთვის პროცენტს გიხდის. თუ სესხს აიღებ, პროცენტს ბანკს უხდი. ორივე მიმართულებით ერთი და იგივე მათემატიკა მუშაობს — თუ მას გაიგებ, ბევრ რეკლამას სხვა თვალით შეხედავ.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Simple and compound interest", "მარტივი და რთული პროცენტი"),
        minutes: 14,
        body: l(
          `Simple interest: the interest is calculated only on the original amount.
interest = amount × rate × years
1000 GEL at 10% a year for 3 years → 1000 × 0.10 × 3 = 300 GEL → total 1300 GEL.

Compound interest: each year's interest is added to the amount, and next year interest is paid on the new total.
total = amount × (1 + rate)^years
1000 GEL at 10% for 3 years → 1000 × 1.1³ = 1331 GEL.

The difference (31 GEL) looks small, but over many years compound interest grows much faster. The rates here are examples; real deposit rates change and are published by each bank.`,
          `მარტივი პროცენტი: პროცენტი მხოლოდ საწყის თანხაზე ითვლება.
სარგებელი = თანხა × განაკვეთი × წლები
1000 ლარი წლიური 10%-ით 3 წლით → 1000 × 0,10 × 3 = 300 ლარი → სულ 1300 ლარი.

რთული პროცენტი: ყოველი წლის სარგებელი თანხას ემატება და მომდევნო წელს პროცენტი უკვე ახალ ჯამზე ერიცხება.
ჯამი = თანხა × (1 + განაკვეთი)^წლები
1000 ლარი 10%-ით 3 წლით → 1000 × 1,1³ = 1331 ლარი.

სხვაობა (31 ლარი) მცირედ გამოიყურება, მაგრამ მრავალი წლის განმავლობაში რთული პროცენტი გაცილებით სწრაფად იზრდება. აქ მოყვანილი განაკვეთები მაგალითებია; რეალურ დეპოზიტის განაკვეთებს თითოეული ბანკი აქვეყნებს და ისინი იცვლება.`,
        ),
        plot: { expression: "1000*1.1^x", xMin: 0, xMax: 20, caption: l("1000 GEL at 10% compound interest over 20 years", "1000 ლარი 10%-იანი რთული პროცენტით 20 წლის განმავლობაში") },
      },
      {
        kind: "explanation",
        title: l("When you borrow", "როცა სესხულობ"),
        minutes: 10,
        body: l(
          `For loans, compare the effective interest rate, which includes fees — in Georgia banks must show it. A loan with a low advertised monthly rate can cost much more once fees and compounding are included.

Buying a 1000 GEL phone "in instalments" may mean paying back noticeably more than 1000 GEL. Before borrowing, ask: how much will I pay in total? Can I afford the monthly payment if something goes wrong?`,
          `სესხების შედარებისას შეხედე ეფექტურ საპროცენტო განაკვეთს, რომელიც საკომისიოებსაც მოიცავს — საქართველოში ბანკებს მისი ჩვენება ევალებათ. სესხი, რომლის რეკლამირებული თვიური განაკვეთი დაბალია, საკომისიოებისა და რთული პროცენტის გათვალისწინებით ბევრად ძვირი შეიძლება დაჯდეს.

1000 ლარიანი ტელეფონის „განვადებით“ ყიდვა შეიძლება ნიშნავდეს 1000 ლარზე შესამჩნევად მეტის დაბრუნებას. სესხის აღებამდე იკითხე: სულ რამდენს გადავიხდი? შევძლებ თვიური შენატანის გადახდას, თუ რამე არ გამოვა?`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 11,
        body: l(
          `Do the activities with a calculator. The STEM Laboratory simulation "Population growth models" shows the same exponential shape as compound interest.`,
          `აქტივობები კალკულატორით შეასრულე. STEM ლაბორატორიის სიმულაცია „პოპულაციის ზრდის მოდელები“ იმავე ექსპონენციურ ფორმას გვიჩვენებს, რაც რთული პროცენტი.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Simple: amount × rate × years.
• Compound: amount × (1 + rate)^years — interest on interest.
• For loans, compare the effective rate and the total you will pay.`,
          `• მარტივი: თანხა × განაკვეთი × წლები.
• რთული: თანხა × (1 + განაკვეთი)^წლები — პროცენტი პროცენტზე.
• სესხისას შეადარე ეფექტური განაკვეთი და ჯამური გადასახდელი თანხა.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Simple interest", "მარტივი პროცენტი"),
        prompt: l("500 GEL at 8% simple interest per year for 2 years. How much interest is earned (GEL)?", "500 ლარი წლიური 8%-იანი მარტივი პროცენტით 2 წლით. რამდენი სარგებელი დაერიცხება (ლარი)?"),
        accepted: ["80"],
        hints: [l("interest = amount × rate × years", "სარგებელი = თანხა × განაკვეთი × წლები"), l("500 × 0.08 × 2", "500 × 0,08 × 2")],
        solution: l("500 × 0.08 × 2 = 80 GEL", "500 × 0,08 × 2 = 80 ლარი"),
      },
      {
        type: "exercise",
        title: l("Compound interest", "რთული პროცენტი"),
        prompt: l("2000 GEL at 5% compound interest per year. What is the total after 2 years (GEL)?", "2000 ლარი წლიური 5%-იანი რთული პროცენტით. რამდენი იქნება ჯამი 2 წლის შემდეგ (ლარი)?"),
        accepted: ["2205"],
        hints: [l("total = 2000 × 1.05²", "ჯამი = 2000 × 1,05²"), l("1.05² = 1.1025", "1,05² = 1,1025")],
        solution: l("2000 × 1.1025 = 2205 GEL", "2000 × 1,1025 = 2205 ლარი"),
      },
      {
        type: "mc",
        title: l("Which grows faster?", "რომელი იზრდება სწრაფად?"),
        prompt: l("Over 30 years, which gives more money at the same rate?", "30 წლის განმავლობაში, იმავე განაკვეთით, რომელი მოგცემს მეტ ფულს?"),
        options: [l("Compound interest", "რთული პროცენტი"), l("Simple interest", "მარტივი პროცენტი"), l("They are always equal", "ყოველთვის თანაბარია")],
        correct: 0,
        hints: [
          l("With compound interest, the interest itself earns interest.", "რთული პროცენტისას პროცენტს თავადაც ერიცხება პროცენტი."),
          l("Look at the graph in the lesson: how does the curve grow over time?", "შეხედე გაკვეთილის გრაფიკს: როგორ იზრდება მრუდი დროთა განმავლობაში?"),
        ],
      },
      { type: "discussion", prompt: l("A shop advertises \"0% instalments\". What questions would you ask before agreeing?", "მაღაზია „0%-იან განვადებას“ ავრცელებს. რა კითხვებს დასვამდი დათანხმებამდე?") },
      { type: "exit", prompt: l("Explain compound interest to a younger student in two sentences.", "ორ წინადადებაში აუხსენი რთული პროცენტი უმცროს მოსწავლეს.") },
    ],
    discussion: [l("Why do banks pay interest on deposits at all?", "საერთოდ რატომ იხდიან ბანკები დეპოზიტებზე პროცენტს?")],
    assessment: [l("Correct simple and compound calculations; a reasoned comparison of two loan offers.", "მარტივი და რთული პროცენტის სწორი გამოთვლა; ორი სასესხო შეთავაზების დასაბუთებული შედარება.")],
    homework: [l("Find the current deposit rates of two banks on their official websites (with the date). Calculate what 1000 GEL would become after 1 year at each.", "მოიძიე ორი ბანკის მოქმედი დეპოზიტის განაკვეთები მათ ოფიციალურ ვებგვერდებზე (თარიღის მითითებით). გამოთვალე, რამდენი გახდება 1000 ლარი ერთ წელიწადში თითოეულში.")],
    teacherNotes: l(
      "All rates in the lesson are examples. For current information, use the banks' official pages or the National Bank of Georgia's financial education resources, and write the date next to any real rate.",
      "გაკვეთილში მოცემული ყველა განაკვეთი მაგალითია. მოქმედი ინფორმაციისთვის გამოიყენეთ ბანკების ოფიციალური გვერდები ან საქართველოს ეროვნული ბანკის ფინანსური განათლების რესურსები და ნებისმიერ რეალურ განაკვეთს თარიღი მიუწერეთ.",
    ),
    quiz: {
      title: l("Interest — check yourself", "პროცენტი — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("1000 GEL at 10% compound interest: total after 2 years?", "1000 ლარი 10%-იანი რთული პროცენტით: ჯამი 2 წლის შემდეგ?"), answer: 1210 },
        { type: "num", prompt: l("300 GEL at 6% simple interest for 1 year: interest?", "300 ლარი 6%-იანი მარტივი პროცენტით 1 წლით: სარგებელი?"), answer: 18 },
        { type: "tf", prompt: l("The effective interest rate of a loan includes fees.", "სესხის ეფექტური საპროცენტო განაკვეთი საკომისიოებსაც მოიცავს."), answer: true },
      ],
    },
  },
  {
    group: "inflation",
    subject: "economics",
    grade: 10,
    durationMin: 40,
    difficulty: "standard",
    match: /inflation|price index|purchasing power|ინფლაცი|ფასების ინდექს|მსყიდველობით/i,
    title: l("Inflation and Purchasing Power", "ინფლაცია და მსყიდველობითი უნარი"),
    topic: l("Inflation", "ინფლაცია"),
    objective: l(
      "Students explain inflation, calculate percentage price changes, and describe how inflation affects savings and why central banks try to keep it low and stable.",
      "მოსწავლეები ხსნიან ინფლაციას, ითვლიან ფასების პროცენტულ ცვლილებას და აღწერენ, როგორ მოქმედებს ინფლაცია დანაზოგზე და რატომ ცდილობენ ცენტრალური ბანკები მის დაბალ და სტაბილურ დონეზე შენარჩუნებას.",
    ),
    objectives: [
      l("Define inflation and calculate a percentage change in price.", "განმარტოს ინფლაცია და გამოთვალოს ფასის პროცენტული ცვლილება."),
      l("Explain purchasing power and real interest.", "ახსნას მსყიდველობითი უნარი და რეალური საპროცენტო განაკვეთი."),
      l("Describe the role of the National Bank of Georgia.", "აღწეროს საქართველოს ეროვნული ბანკის როლი."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why does bread cost more?", "რატომ გაძვირდა პური?"),
        minutes: 5,
        body: l(
          `Ask an adult how much a loaf of bread or a bus ride cost when they were at school. Prices rise over time — this general rise in prices is called inflation.`,
          `ჰკითხე ზრდასრულს, რა ღირდა პური ან ავტობუსით მგზავრობა, როცა ის სკოლაში დადიოდა. ფასები დროთა განმავლობაში იზრდება — ფასების ამ საერთო ზრდას ინფლაცია ჰქვია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Measuring inflation", "ინფლაციის გაზომვა"),
        minutes: 12,
        body: l(
          `Inflation is measured with a "basket" of goods and services that households typically buy. The statistics office (in Georgia, Geostat) tracks the price of the basket every month — the consumer price index.

percentage change = (new price − old price) ÷ old price × 100%
A product rises from 2.00 to 2.10 GEL: 0.10 ÷ 2.00 × 100% = 5%.

Purchasing power: if prices rise by 5% in a year, 100 GEL buys about 5% less than before. If your savings earn 3% while inflation is 5%, the real value of your savings falls by about 2%.`,
          `ინფლაცია იზომება საქონლისა და მომსახურების „კალათით“, რომელსაც ოჯახები ჩვეულებრივ ყიდულობენ. სტატისტიკის სამსახური (საქართველოში — საქსტატი) კალათის ღირებულებას ყოველთვიურად აკვირდება — ეს სამომხმარებლო ფასების ინდექსია.

პროცენტული ცვლილება = (ახალი ფასი − ძველი ფასი) ÷ ძველი ფასი × 100%
პროდუქტი 2,00 ლარიდან 2,10 ლარამდე გაძვირდა: 0,10 ÷ 2,00 × 100% = 5%.

მსყიდველობითი უნარი: თუ ფასები წელიწადში 5%-ით იზრდება, 100 ლარით დაახლოებით 5%-ით ნაკლებს იყიდი. თუ დანაზოგს 3% ერიცხება, ინფლაცია კი 5%-ია, დანაზოგის რეალური ღირებულება დაახლოებით 2%-ით მცირდება.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Why central banks care", "რატომ ზრუნავს ცენტრალური ბანკი"),
        minutes: 10,
        body: l(
          `Very high inflation makes planning impossible and hurts people with fixed incomes. Falling prices (deflation) can also be harmful, because people delay spending.

The National Bank of Georgia (NBG) aims to keep inflation low and stable. Its main tool is the monetary policy rate: raising it makes borrowing more expensive and slows price growth; lowering it does the opposite. The NBG publishes its current target and decisions on its website.`,
          `ძალიან მაღალი ინფლაცია დაგეგმვას შეუძლებელს ხდის და ფიქსირებული შემოსავლის მქონე ადამიანებს აზარალებს. ფასების კლება (დეფლაციაც) შეიძლება საზიანო იყოს, რადგან ადამიანები ხარჯვას ადრე აყოვნებენ.

საქართველოს ეროვნული ბანკი (სებ) ცდილობს ინფლაცია დაბალ და სტაბილურ დონეზე შეინარჩუნოს. მისი მთავარი ინსტრუმენტი მონეტარული პოლიტიკის განაკვეთია: მისი გაზრდა სესხებას აძვირებს და ფასების ზრდას ანელებს; შემცირება — პირიქით. სებ თავის ვებგვერდზე აქვეყნებს მოქმედ მიზნობრივ მაჩვენებელს და გადაწყვეტილებებს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 8,
        body: l(
          `Do the activities. As an extension, find the latest annual inflation figure on Geostat's website and write it down with the month it refers to.`,
          `შეასრულე აქტივობები. დამატებით, საქსტატის ვებგვერდზე მოიძიე ბოლო წლიური ინფლაციის მაჩვენებელი და ჩაიწერე, რომელ თვეს ეხება.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Inflation = general rise in prices, measured with a basket (CPI).
• % change = difference ÷ old × 100%.
• Real return ≈ interest rate − inflation.
• The central bank uses its policy rate to keep inflation low and stable.`,
          `• ინფლაცია = ფასების საერთო ზრდა, რომელიც კალათით (სფი) იზომება.
• % ცვლილება = სხვაობა ÷ ძველი × 100%.
• რეალური სარგებელი ≈ საპროცენტო განაკვეთი − ინფლაცია.
• ცენტრალური ბანკი მონეტარული პოლიტიკის განაკვეთით ინფლაციას დაბალ და სტაბილურ დონეზე ინარჩუნებს.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Percentage change", "პროცენტული ცვლილება"),
        prompt: l("A notebook's price rose from 4 GEL to 5 GEL. By what percentage did it rise?", "რვეულის ფასი 4 ლარიდან 5 ლარამდე გაიზარდა. რამდენი პროცენტით გაძვირდა?"),
        accepted: ["25", "25%"],
        hints: [l("(5 − 4) ÷ 4 × 100%", "(5 − 4) ÷ 4 × 100%"), l("1 ÷ 4 = 0.25", "1 ÷ 4 = 0,25")],
        solution: l("1 ÷ 4 × 100% = 25%", "1 ÷ 4 × 100% = 25%"),
      },
      {
        type: "exercise",
        title: l("Real return", "რეალური სარგებელი"),
        prompt: l("Savings earn 6% a year and inflation is 4%. Approximately what is the real return in %?", "დანაზოგს წელიწადში 6% ერიცხება, ინფლაცია კი 4%-ია. დაახლოებით რისი ტოლია რეალური სარგებელი (%)?"),
        accepted: ["2", "2%"],
        hints: [l("Real ≈ interest − inflation", "რეალური ≈ პროცენტი − ინფლაცია"), l("6 − 4", "6 − 4")],
        solution: l("6% − 4% ≈ 2%", "6% − 4% ≈ 2%"),
      },
      {
        type: "mc",
        title: l("Central bank", "ცენტრალური ბანკი"),
        prompt: l("To slow down high inflation, what does a central bank usually do?", "მაღალი ინფლაციის შესანელებლად რას აკეთებს ცენტრალური ბანკი ჩვეულებრივ?"),
        options: [l("Raises the policy rate", "ზრდის მონეტარული პოლიტიკის განაკვეთს"), l("Lowers all prices by law", "კანონით ამცირებს ყველა ფასს"), l("Prints more money", "მეტ ფულს ბეჭდავს"), l("Closes shops", "მაღაზიებს ხურავს")],
        correct: 0,
        hints: [
          l("A higher interest rate makes borrowing more expensive.", "მაღალი განაკვეთი სესხს აძვირებს."),
          l("When borrowing is expensive, people spend less and prices rise more slowly.", "როცა სესხი ძვირია, ადამიანები ნაკლებს ხარჯავენ და ფასები უფრო ნელა იზრდება."),
        ],
      },
      { type: "discussion", prompt: l("Who is hurt most by high inflation: a pensioner, a worker whose wage rises with prices, or a person with a large fixed-rate loan? Why?", "ვის აზარალებს მაღალი ინფლაცია ყველაზე მეტად: პენსიონერს, მუშაკს, რომლის ხელფასიც ფასებთან ერთად იზრდება, თუ ადამიანს დიდი ფიქსირებულგანაკვეთიანი სესხით? რატომ?") },
      { type: "exit", prompt: l("Explain \"purchasing power\" using one example from your life.", "ახსენი „მსყიდველობითი უნარი“ შენი ცხოვრებიდან აღებული ერთი მაგალითით.") },
    ],
    discussion: [l("Why does the price of the \"basket\" matter more than the price of one product?", "რატომ არის „კალათის“ ფასი უფრო მნიშვნელოვანი, ვიდრე ერთი პროდუქტის ფასი?")],
    assessment: [l("Correct percentage calculations and a clear explanation of real return.", "სწორი პროცენტული გამოთვლები და რეალური სარგებლის მკაფიო ახსნა.")],
    homework: [l("Compare the price of three products today with a receipt or advertisement from a year ago (ask at home). Calculate the percentage changes.", "შეადარე სამი პროდუქტის დღევანდელი ფასი ერთი წლის წინანდელ ქვითარს ან რეკლამას (სახლში იკითხე). გამოთვალე პროცენტული ცვლილებები.")],
    teacherNotes: l(
      "Do not quote inflation figures or targets from memory — take them from Geostat and the National Bank of Georgia with the date. Real return is simplified here as rate − inflation.",
      "ინფლაციის მაჩვენებლები და მიზნები მეხსიერებიდან ნუ მოიყვანეთ — აიღეთ ისინი საქსტატისა და საქართველოს ეროვნული ბანკის გვერდებიდან, თარიღის მითითებით. რეალური სარგებელი აქ გამარტივებულად, როგორც განაკვეთი − ინფლაცია, არის წარმოდგენილი.",
    ),
    quiz: {
      title: l("Inflation — check yourself", "ინფლაცია — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("A price rises from 50 to 55 GEL. Percentage increase?", "ფასი 50-დან 55 ლარამდე გაიზარდა. რამდენი პროცენტით?"), answer: 10 },
        { type: "tf", prompt: l("If inflation is higher than the interest on your savings, their real value falls.", "თუ ინფლაცია დანაზოგზე დარიცხულ პროცენტზე მაღალია, დანაზოგის რეალური ღირებულება მცირდება."), answer: true },
        { type: "mc", prompt: l("Which organisation measures consumer prices in Georgia?", "რომელი ორგანიზაცია ზომავს სამომხმარებლო ფასებს საქართველოში?"), options: [l("Geostat", "საქსტატი"), l("The Parliament", "პარლამენტი"), l("A commercial bank", "კომერციული ბანკი")], correct: 0 },
      ],
    },
  },
];
