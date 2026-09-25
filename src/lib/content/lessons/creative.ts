import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

/** Arts & design, engineering & technology, entrepreneurship & innovation. */
export const CREATIVE: BiLesson[] = [
  {
    group: "design-principles",
    subject: "arts",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /design principle|poster|contrast|alignment|typography|visual communication|დიზაინის პრინციპ|პლაკატ|კონტრასტ|ვიზუალური კომუნიკაცი/i,
    title: l("Design Principles: Making a Poster that Works", "დიზაინის პრინციპები: ეფექტური პლაკატის შექმნა"),
    topic: l("Visual communication", "ვიზუალური კომუნიკაცია"),
    objective: l(
      "Students apply contrast, alignment, repetition, proximity and hierarchy to design a clear poster for a school event.",
      "მოსწავლეები სასკოლო ღონისძიების მკაფიო პლაკატის შესაქმნელად იყენებენ კონტრასტს, სწორებას, გამეორებას, სიახლოვესა და იერარქიას.",
    ),
    objectives: [
      l("Name and explain five design principles.", "დაასახელოს და ახსნას დიზაინის ხუთი პრინციპი."),
      l("Critique a design using the principles.", "პრინციპების მიხედვით შეაფასოს დიზაინი."),
      l("Design and improve a poster through feedback.", "შექმნას პლაკატი და გააუმჯობესოს ის უკუკავშირის საფუძველზე."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Three seconds", "სამი წამი"),
        minutes: 5,
        body: l(
          `People look at a poster in a corridor for about three seconds. In that time they must understand what, when and where. Good design is not decoration — it is communication.`,
          `დერეფანში პლაკატს ადამიანი დაახლოებით სამ წამს უყურებს. ამ დროში უნდა გაიგოს, რა, როდის და სად. კარგი დიზაინი მორთულობა კი არა, კომუნიკაციაა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Five principles", "ხუთი პრინციპი"),
        minutes: 12,
        body: l(
          `• Hierarchy — the most important information is the most visible (size, weight, colour). Title first, then date and place, then details.
• Contrast — make different things clearly different: dark text on a light background, big versus small, bold versus regular.
• Alignment — every element lines up with something else; invisible lines make a design look calm and deliberate.
• Proximity — related items sit together (date next to time and place); unrelated items are separated.
• Repetition — reuse the same fonts, colours and shapes so the poster feels like one piece.

Also: leave empty space (white space), use no more than two typefaces, and check that text is readable from a few metres away.`,
          `• იერარქია — ყველაზე მნიშვნელოვანი ინფორმაცია ყველაზე შესამჩნევია (ზომა, სისქე, ფერი). ჯერ სათაური, შემდეგ თარიღი და ადგილი, მერე დეტალები.
• კონტრასტი — განსხვავებული ელემენტები მკაფიოდ განსხვავებული უნდა იყოს: მუქი ტექსტი ღია ფონზე, დიდი და პატარა, მსხვილი და ჩვეულებრივი შრიფტი.
• სწორება — ყოველი ელემენტი სხვა რომელიმე ელემენტთან ერთ ხაზზე დგას; უხილავი ხაზები დიზაინს მშვიდსა და გააზრებულს ხდის.
• სიახლოვე — ერთმანეთთან დაკავშირებული ელემენტები ერთად დგას (თარიღი — დროისა და ადგილის გვერდით); დაუკავშირებელი — ცალკე.
• გამეორება — ერთი და იგივე შრიფტები, ფერები და ფორმები გამოიყენე, რომ პლაკატი მთლიანობად აღიქმებოდეს.

ასევე: დატოვე ცარიელი სივრცე, ორზე მეტი შრიფტი არ გამოიყენო და შეამოწმე, იკითხება თუ არა ტექსტი რამდენიმე მეტრიდან.`,
        ),
      },
      {
        kind: "practice",
        title: l("Design, critique, improve", "შექმენი, შეაფასე, გააუმჯობესე"),
        minutes: 20,
        body: l(
          `Design a poster (on paper or with any drawing tool) for a school science fair: title, date, time, place, one line about what visitors will see. Swap with a partner, give feedback using the five principles ("I noticed…, I suggest…"), and make a second version. Keep both versions — the change is the most interesting part for your portfolio.`,
          `შექმენი პლაკატი (ქაღალდზე ან ნებისმიერ სახატავ პროგრამაში) სასკოლო სამეცნიერო ფესტივალისთვის: სათაური, თარიღი, დრო, ადგილი და ერთი წინადადება იმაზე, რას ნახავენ სტუმრები. გაუცვალე მეწყვილეს, მიეცით ერთმანეთს უკუკავშირი ხუთი პრინციპის მიხედვით („შევამჩნიე…, გირჩევ…“) და შექმენი მეორე ვერსია. ორივე ვერსია შეინახე — პორტფოლიოსთვის ცვლილება ყველაზე საინტერესო ნაწილია.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 8,
        body: l(
          `Hierarchy, contrast, alignment, proximity, repetition — and enough white space. Design is improved through feedback and iteration.`,
          `იერარქია, კონტრასტი, სწორება, სიახლოვე, გამეორება — და საკმარისი ცარიელი სივრცე. დიზაინი უკუკავშირითა და ხელახალი ვერსიებით უმჯობესდება.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Which principle?", "რომელი პრინციპი?"),
        prompt: l("On a poster, the date, time and place are grouped together in one block. Which principle is this?", "პლაკატზე თარიღი, დრო და ადგილი ერთ ბლოკშია გაერთიანებული. რომელი პრინციპია ეს?"),
        options: [l("Proximity", "სიახლოვე"), l("Contrast", "კონტრასტი"), l("Repetition", "გამეორება"), l("Hierarchy", "იერარქია")],
        correct: 0,
        hints: [
          l("The items are close together because they belong together.", "ელემენტები ერთმანეთთან ახლოსაა, რადგან ერთმანეთს ეკუთვნის."),
          l("Which principle is about closeness?", "რომელი პრინციპი ეხება სიახლოვეს?"),
        ],
      },
      {
        type: "mc",
        title: l("Readable?", "იკითხება?"),
        prompt: l("Which combination has the best contrast for reading?", "რომელ კომბინაციას აქვს წასაკითხად საუკეთესო კონტრასტი?"),
        options: [l("Dark blue text on a white background", "მუქი ლურჯი ტექსტი თეთრ ფონზე"), l("Yellow text on a white background", "ყვითელი ტექსტი თეთრ ფონზე"), l("Light grey text on a white background", "ღია ნაცრისფერი ტექსტი თეთრ ფონზე"), l("Red text on a green background", "წითელი ტექსტი მწვანე ფონზე")],
        correct: 0,
        hints: [
          l("Contrast is how different the text and the background are.", "კონტრასტი ტექსტისა და ფონის განსხვავებაა."),
          l("Light text on a light background is hard to read.", "ღია ფონზე ღია ტექსტი ძნელად იკითხება."),
        ],
      },
      { type: "discussion", prompt: l("Find a poster or advert near your school. Which principle does it use well, and which could be improved?", "მოძებნე პლაკატი ან რეკლამა სკოლის მახლობლად. რომელ პრინციპს იყენებს კარგად და რა შეიძლება გაუმჯობესდეს?") },
      { type: "exit", prompt: l("Explain \"hierarchy\" in your own words with an example.", "შენი სიტყვებით, მაგალითით ახსენი „იერარქია“.") },
    ],
    discussion: [l("Why is red text on green hard for some people to read? (Think about colour vision.)", "რატომ უჭირთ ზოგიერთ ადამიანს მწვანე ფონზე წითელი ტექსტის წაკითხვა? (იფიქრე ფერთა აღქმაზე.)")],
    assessment: [l("Two poster versions with feedback notes showing use of the principles.", "პლაკატის ორი ვერსია და უკუკავშირის ჩანაწერები, რომლებიც პრინციპების გამოყენებას აჩვენებს.")],
    homework: [l("Add your two poster versions to your portfolio with a short reflection on what you changed and why.", "დაამატე პლაკატის ორივე ვერსია შენს პორტფოლიოში მოკლე რეფლექსიით: რა შეცვალე და რატომ.")],
    teacherNotes: l(
      "Red–green combinations are hard to distinguish for many people with colour-vision deficiency; this is a good accessibility discussion. Posters can be uploaded as portfolio attachments.",
      "წითელ-მწვანე კომბინაციების გარჩევა უჭირს ბევრ ადამიანს, ვისაც ფერთა აღქმის დარღვევა აქვს — ეს ხელმისაწვდომობაზე სასაუბროდ კარგი თემაა. პლაკატები პორტფოლიოში დანართად შეიძლება აიტვირთოს.",
    ),
    quiz: {
      title: l("Design principles — check yourself", "დიზაინის პრინციპები — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("Using many different fonts makes a poster clearer.", "ბევრი სხვადასხვა შრიფტი პლაკატს უფრო მკაფიოს ხდის."), answer: false },
        { type: "mc", prompt: l("Making the title the biggest element is an example of…", "სათაურის ყველაზე დიდ ელემენტად გამოყოფა არის…"), options: [l("hierarchy", "იერარქია"), l("repetition", "გამეორება"), l("proximity", "სიახლოვე")], correct: 0 },
        { type: "tf", prompt: l("Empty (white) space can make a design easier to read.", "ცარიელი სივრცე დიზაინს უფრო ადვილად აღსაქმელს ხდის."), answer: true },
      ],
    },
  },
  {
    group: "engineering-design-process",
    subject: "engineering",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /engineering design|prototype|design process|ინჟინრული დიზაინ|პროტოტიპ/i,
    title: l("The Engineering Design Process", "საინჟინრო დიზაინის პროცესი"),
    topic: l("Engineering design", "საინჟინრო დიზაინი"),
    objective: l(
      "Students use the engineering design process — define, research, imagine, plan, build, test, improve — to solve a constrained problem and record their iterations.",
      "მოსწავლეები შეზღუდული პირობების ამოცანის გადასაჭრელად საინჟინრო დიზაინის პროცესს იყენებენ — განსაზღვრა, კვლევა, იდეები, დაგეგმვა, აწყობა, გამოცდა, გაუმჯობესება — და აღრიცხავენ თავიანთ ვერსიებს.",
    ),
    objectives: [
      l("Describe the steps of the engineering design process.", "აღწეროს საინჟინრო დიზაინის პროცესის ეტაპები."),
      l("Define criteria and constraints for a problem.", "ამოცანისთვის განსაზღვროს კრიტერიუმები და შეზღუდვები."),
      l("Test a prototype fairly and improve it based on results.", "პროტოტიპი სამართლიანად გამოსცადოს და შედეგების მიხედვით გააუმჯობესოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Engineers solve problems under limits", "ინჟინრები პრობლემებს შეზღუდვების პირობებში წყვეტენ"),
        minutes: 5,
        body: l(
          `A bridge must carry a load, cost a certain amount and be built in time. Engineers rarely find the perfect answer first — they design, test, learn and improve. That cycle is the engineering design process.`,
          `ხიდმა გარკვეული დატვირთვა უნდა გაუძლოს, გარკვეული თანხა დაჯდეს და დროულად აშენდეს. ინჟინრები სრულყოფილ პასუხს იშვიათად პოულობენ პირველივე ცდაზე — ისინი აპროექტებენ, სცდიან, სწავლობენ და აუმჯობესებენ. ეს ციკლი საინჟინრო დიზაინის პროცესია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("The cycle", "ციკლი"),
        minutes: 12,
        body: l(
          `1. Define — what is the problem? Who is it for? What are the criteria (what counts as success) and constraints (materials, time, money, safety)?
2. Research — what already exists? What do we know about the science involved?
3. Imagine — many ideas first, judge later.
4. Plan — choose one idea, sketch it with measurements, list materials.
5. Build — make a prototype, a first version for testing.
6. Test — measure against the criteria, changing one thing at a time.
7. Improve — change the design based on evidence and test again.

Failure in testing is information, not defeat.`,
          `1. განსაზღვრა — რა არის პრობლემა? ვისთვის? რა არის კრიტერიუმები (რას ჩავთვლით წარმატებად) და შეზღუდვები (მასალები, დრო, ფული, უსაფრთხოება)?
2. კვლევა — რა არსებობს უკვე? რა ვიცით შესაბამისი მეცნიერების შესახებ?
3. იდეები — ჯერ ბევრი იდეა, შეფასება — მერე.
4. დაგეგმვა — აირჩიე ერთი იდეა, დახაზე ზომებით და ჩამოწერე მასალები.
5. აწყობა — შექმენი პროტოტიპი, პირველი ვერსია გამოსაცდელად.
6. გამოცდა — გაზომე კრიტერიუმების მიხედვით, ყოველ ჯერზე მხოლოდ ერთი რამ შეცვალე.
7. გაუმჯობესება — შეცვალე დიზაინი მტკიცებულებების საფუძველზე და კვლავ გამოსცადე.

გამოცდისას მარცხი ინფორმაციაა და არა დამარცხება.`,
        ),
      },
      {
        kind: "practice",
        title: l("Paper bridge challenge", "ქაღალდის ხიდის გამოწვევა"),
        minutes: 20,
        body: l(
          `In teams, use the STEM Laboratory project brief "Paper bridge": span a 20 cm gap with paper and tape only and hold as many coins as possible. Record each version in the project workspace — what you changed, the result, and what you will try next. Georgia is a mountainous, earthquake-prone country; the brief "Earthquake-resistant tower" is a good next challenge.`,
          `გუნდებში გამოიყენეთ STEM ლაბორატორიის საპროექტო დავალება „ქაღალდის ხიდი“: მხოლოდ ქაღალდითა და წებოვანი ლენტით გადააბით 20 სმ-იანი ღრიჭო და გაუძლეთ რაც შეიძლება მეტ მონეტას. ყოველი ვერსია პროექტის სამუშაო სივრცეში ჩაიწერეთ — რა შეცვალეთ, რა შედეგი მიიღეთ და რას სცდით შემდეგ. საქართველო მთიანი, სეისმურად აქტიური ქვეყანაა; დავალება „მიწისძვრამედეგი კოშკი“ კარგი შემდეგი გამოწვევაა.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 8,
        body: l(
          `Define → research → imagine → plan → build → test → improve — and repeat. Criteria say what success is; constraints say what limits you.`,
          `განსაზღვრა → კვლევა → იდეები → დაგეგმვა → აწყობა → გამოცდა → გაუმჯობესება — და თავიდან. კრიტერიუმები გეუბნება, რა არის წარმატება; შეზღუდვები — რა გზღუდავს.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Criterion or constraint?", "კრიტერიუმი თუ შეზღუდვა?"),
        prompt: l("\"You may use only 10 sheets of paper.\" Is this a criterion or a constraint?", "„შეგიძლია გამოიყენო მხოლოდ 10 ფურცელი.“ ეს კრიტერიუმია თუ შეზღუდვა?"),
        options: [l("A constraint", "შეზღუდვა"), l("A criterion", "კრიტერიუმი")],
        correct: 0,
        hints: [
          l("A criterion says what success looks like.", "კრიტერიუმი გეუბნება, როგორია წარმატება."),
          l("A constraint is a limit you must work within.", "შეზღუდვა ზღვარია, რომლის ფარგლებშიც უნდა იმუშაო."),
        ],
      },
      {
        type: "mc",
        title: l("Fair test", "სამართლიანი გამოცდა"),
        prompt: l("Your bridge failed. What is the best next step?", "შენი ხიდი ჩამოინგრა. რა არის საუკეთესო შემდეგი ნაბიჯი?"),
        options: [
          l("Find where it failed, change one thing, and test again", "გაარკვიო, სად ჩამოინგრა, შეცვალო ერთი რამ და კვლავ გამოსცადო"),
          l("Change everything at once", "ყველაფერი ერთდროულად შეცვალო"),
          l("Give up and start a different project", "დანებდე და სხვა პროექტი დაიწყო"),
          l("Use more tape than allowed", "ნებადართულზე მეტი ლენტი გამოიყენო"),
        ],
        correct: 0,
        hints: [
          l("Testing is about learning why something failed.", "გამოცდის მიზანია გაიგო, რატომ ჩავარდა რამე."),
          l("If you change many things at once, can you tell which change helped?", "თუ ბევრ რამეს ერთად შეცვლი, გაიგებ, რომელმა ცვლილებამ იმოქმედა?"),
        ],
      },
      { type: "discussion", prompt: l("Which step of the process do you think people most often skip? What happens when they do?", "როგორ ფიქრობ, პროცესის რომელ ეტაპს ტოვებენ ადამიანები ყველაზე ხშირად? რა ხდება ასეთ დროს?") },
      { type: "exit", prompt: l("Write one criterion and one constraint for a school bag designed for Grade 5 students.", "დაწერე ერთი კრიტერიუმი და ერთი შეზღუდვა V კლასის მოსწავლეებისთვის განკუთვნილი ზურგჩანთის დიზაინისთვის.") },
    ],
    discussion: [l("Why do engineers build prototypes instead of building the final product straight away?", "რატომ ქმნიან ინჟინრები პროტოტიპებს, ნაცვლად იმისა, რომ პირდაპირ საბოლოო პროდუქტი შექმნან?")],
    assessment: [l("A completed project record with at least two tested versions.", "პროექტის შევსებული ჩანაწერი, სულ მცირე ორი გამოცდილი ვერსიით.")],
    homework: [l("Choose an everyday object that annoys you. Define the problem, list criteria and constraints, and sketch two ideas.", "აირჩიე ყოველდღიური ნივთი, რომელიც გაღიზიანებს. განსაზღვრე პრობლემა, ჩამოწერე კრიტერიუმები და შეზღუდვები და დახაზე ორი იდეა.")],
    teacherNotes: l(
      "The STEM Laboratory project workspace follows these same steps, so the design record doubles as a portfolio item. Keep building materials safe (no hot glue without supervision, no sharp tools for younger groups).",
      "STEM ლაბორატორიის პროექტის სამუშაო სივრცე იმავე ეტაპებს მიჰყვება, ამიტომ დიზაინის ჩანაწერი პორტფოლიოს ნაწილადაც გამოდგება. უზრუნველყავით მასალების უსაფრთხოება (ცხელი წებო მხოლოდ ზედამხედველობით, ბასრი ხელსაწყოები არა უმცროსი ჯგუფებისთვის).",
    ),
    quiz: {
      title: l("Engineering design — check yourself", "საინჟინრო დიზაინი — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("A prototype is the final product sold to customers.", "პროტოტიპი საბოლოო პროდუქტია, რომელიც მომხმარებლებს მიეყიდება."), answer: false },
        { type: "mc", prompt: l("\"The bridge must hold at least 50 coins\" is…", "„ხიდმა სულ მცირე 50 მონეტას უნდა გაუძლოს“ არის…"), options: [l("a criterion", "კრიტერიუმი"), l("a constraint", "შეზღუდვა")], correct: 0 },
        { type: "tf", prompt: l("In a fair test you change one thing at a time.", "სამართლიანი გამოცდისას ყოველ ჯერზე მხოლოდ ერთ რამეს ცვლი."), answer: true },
      ],
    },
  },
  {
    group: "problem-to-idea",
    subject: "entrepreneurship",
    grade: 10,
    durationMin: 45,
    difficulty: "standard",
    match: /entrepreneur|startup|business idea|customer|pitch|მეწარმე|სტარტაპ|ბიზნეს იდე|მომხმარებ|პრეზენტაცი/i,
    title: l("From a Problem to an Idea: Customer Research and Pitching", "პრობლემიდან იდეამდე: მომხმარებლის კვლევა და იდეის წარდგენა"),
    topic: l("Entrepreneurship", "მეწარმეობა"),
    objective: l(
      "Students identify a real problem, interview potential users, write a value proposition, and pitch a simple solution in one minute.",
      "მოსწავლეები პოულობენ რეალურ პრობლემას, ესაუბრებიან პოტენციურ მომხმარებლებს, აყალიბებენ ღირებულების შეთავაზებას და ერთ წუთში წარადგენენ მარტივ გადაწყვეტას.",
    ),
    objectives: [
      l("Describe a problem from the user's point of view.", "აღწეროს პრობლემა მომხმარებლის თვალით."),
      l("Plan and run short, fair customer interviews.", "დაგეგმოს და ჩაატაროს მოკლე, მიუკერძოებელი ინტერვიუები მომხმარებლებთან."),
      l("Write a value proposition and a one-minute pitch.", "ჩამოაყალიბოს ღირებულების შეთავაზება და ერთწუთიანი წარდგენა."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Start with a problem, not a product", "დაიწყე პრობლემით და არა პროდუქტით"),
        minutes: 5,
        body: l(
          `Many new products fail because nobody needed them. Entrepreneurs who succeed usually start with a problem real people have — and check that the problem is real before building anything.`,
          `ბევრი ახალი პროდუქტი იმიტომ მარცხდება, რომ ის არავის სჭირდებოდა. წარმატებული მეწარმეები ჩვეულებრივ რეალური ადამიანების პრობლემით იწყებენ — და რამის შექმნამდე ამოწმებენ, ნამდვილად არსებობს თუ არა ეს პრობლემა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Listen before you build", "ჯერ მოუსმინე, მერე შექმენი"),
        minutes: 12,
        body: l(
          `Problem statement: "[Who] needs a way to [do what] because [why]."
"Students who commute from nearby villages need a way to know when the bus will actually arrive, because timetables are often unreliable."

Customer interviews:
• Ask about past behaviour, not opinions about your idea: "Tell me about the last time you waited for the bus."
• Avoid leading questions ("Wouldn't an app be great?").
• Talk to at least five people who have the problem.

Value proposition: "For [who], [our solution] helps [do what] unlike [current alternative]."`,
          `პრობლემის ფორმულირება: „[ვის] სჭირდება გზა, რომ [რა გააკეთოს], რადგან [რატომ].“
„ახლომდებარე სოფლებიდან მოსიარულე მოსწავლეებს სჭირდებათ გზა, რომ იცოდნენ, როდის მოვა ავტობუსი სინამდვილეში, რადგან განრიგი ხშირად არ სრულდება.“

ინტერვიუები მომხმარებლებთან:
• იკითხე წარსულ ქცევაზე და არა შენს იდეაზე მოსაზრებაზე: „მომიყევი, ბოლოს როდის ელოდე ავტობუსს?“
• მოერიდე მიმანიშნებელ კითხვებს („აპლიკაცია კარგი იქნებოდა, არა?“).
• ესაუბრე სულ მცირე ხუთ ადამიანს, ვისაც ეს პრობლემა აქვს.

ღირებულების შეთავაზება: „[ვისთვის] [ჩვენი გადაწყვეტა] გვეხმარება, რომ [რა გავაკეთოთ], [არსებული ალტერნატივისგან] განსხვავებით.“`,
        ),
      },
      {
        kind: "explanation",
        title: l("A one-minute pitch", "ერთწუთიანი წარდგენა"),
        minutes: 8,
        body: l(
          `1. The problem — a short story of one real user (what you heard in interviews).
2. The solution — what it does, in one sentence.
3. Why it is better than what people do now.
4. What you learned from testing, and your next step.
5. What you need (feedback, a partner, a first test group).

Be honest about what you do not know yet — investors and teachers trust that more than big promises.`,
          `1. პრობლემა — ერთი რეალური მომხმარებლის მოკლე ისტორია (რაც ინტერვიუებში მოისმინე).
2. გადაწყვეტა — რას აკეთებს, ერთი წინადადებით.
3. რატომ სჯობს იმას, რასაც ადამიანები ახლა აკეთებენ.
4. რა ისწავლე გამოცდისას და რა არის შემდეგი ნაბიჯი.
5. რა გჭირდება (უკუკავშირი, პარტნიორი, პირველი სატესტო ჯგუფი).

გულწრფელად თქვი, რა არ იცი ჯერ — ინვესტორები და მასწავლებლები ამას დიდ დაპირებებზე მეტად ენდობიან.`,
        ),
      },
      {
        kind: "practice",
        title: l("Find a school problem", "იპოვე სკოლის პრობლემა"),
        minutes: 15,
        body: l(
          `In teams, choose a problem in your school or neighbourhood. Write the problem statement, prepare three interview questions and interview classmates during the break. Then write your value proposition and practise the pitch. Record the project in the STEM Laboratory ("Your own engineering project") or as a portfolio item.`,
          `გუნდებში აირჩიეთ პრობლემა სკოლაში ან თქვენს უბანში. ჩამოაყალიბეთ პრობლემა, მოამზადეთ ინტერვიუს სამი კითხვა და შესვენებაზე თანაკლასელებს ესაუბრეთ. შემდეგ დაწერეთ ღირებულების შეთავაზება და წარდგენა გაიმეორეთ. პროექტი STEM ლაბორატორიაში („შენი საინჟინრო პროექტი“) ან პორტფოლიოს ნაწილად შეინახეთ.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Problem → interviews → value proposition → prototype → pitch. Listen to users before building.`,
          `პრობლემა → ინტერვიუები → ღირებულების შეთავაზება → პროტოტიპი → წარდგენა. შექმნამდე მომხმარებლებს მოუსმინე.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Good interview question", "კარგი ინტერვიუს კითხვა"),
        prompt: l("Which interview question is best?", "რომელია ინტერვიუს საუკეთესო კითხვა?"),
        options: [
          l("Tell me about the last time you had this problem.", "მომიყევი, ბოლოს როდის შეგექმნა ეს პრობლემა."),
          l("Would you buy my great app?", "იყიდდი ჩემს შესანიშნავ აპლიკაციას?"),
          l("Don't you agree this is a big problem?", "ხომ ეთანხმები, რომ ეს დიდი პრობლემაა?"),
          l("How much would you pay?", "რამდენს გადაიხდიდი?"),
        ],
        correct: 0,
        explanation: l("It asks about real past behaviour and does not lead the person to the answer you want.", "ის რეალურ წარსულ ქცევას ეკითხება და ადამიანს შენთვის სასურველ პასუხს არ კარნახობს."),
        hints: [
          l("Good interviews ask what people actually did.", "კარგი ინტერვიუ ეკითხება, რა გააკეთეს ადამიანებმა სინამდვილეში."),
          l("Avoid questions that suggest the answer you want.", "მოერიდე კითხვებს, რომლებიც სასურველ პასუხს კარნახობს."),
        ],
      },
      {
        type: "discussion",
        prompt: l("Write a problem statement using the pattern \"[Who] needs a way to [do what] because [why]\" for a problem in your school.", "ჩამოაყალიბე შენი სკოლის პრობლემა ფორმით: „[ვის] სჭირდება გზა, რომ [რა გააკეთოს], რადგან [რატომ]“."),
      },
      {
        type: "mc",
        title: l("Why interview?", "რატომ ინტერვიუ?"),
        prompt: l("Why talk to users before building a product?", "რატომ უნდა ესაუბრო მომხმარებლებს პროდუქტის შექმნამდე?"),
        options: [l("To check that the problem is real and understand it", "რომ შეამოწმო, პრობლემა რეალურია თუ არა, და უკეთ გაიგო"), l("To sell to them immediately", "რომ მაშინვე მიჰყიდო"), l("Because it is required by law", "რადგან კანონი ითხოვს")],
        correct: 0,
        hints: [
          l("Many products fail because nobody needed them.", "ბევრი პროდუქტი იმიტომ მარცხდება, რომ ის არავის სჭირდებოდა."),
          l("What do you learn by listening first?", "რას იგებ, თუ ჯერ მოუსმენ?"),
        ],
      },
      { type: "exit", prompt: l("Give your one-sentence value proposition.", "ჩამოაყალიბე შენი ღირებულების შეთავაზება ერთი წინადადებით.") },
    ],
    discussion: [l("Is a project that helps people but earns no money still entrepreneurship? (Think of social enterprises.)", "არის თუ არა მეწარმეობა პროექტი, რომელიც ადამიანებს ეხმარება, მაგრამ შემოსავალი არ მოაქვს? (გაიხსენე სოციალური საწარმოები.)")],
    assessment: [l("Problem statement, interview notes from at least five people, value proposition and a one-minute pitch.", "პრობლემის ფორმულირება, სულ მცირე ხუთ ადამიანთან ინტერვიუს ჩანაწერები, ღირებულების შეთავაზება და ერთწუთიანი წარდგენა.")],
    homework: [l("Interview two more people outside school about your problem. Did anything change your idea?", "შენს პრობლემაზე სკოლის გარეთ კიდევ ორ ადამიანს ესაუბრე. შეცვალა რამემ შენი იდეა?")],
    teacherNotes: l(
      "Keep interviews within the school community unless parents have agreed. Pitch days work well on the classroom touchscreen with the presentation mode.",
      "ინტერვიუები სასკოლო საზოგადოების ფარგლებში დატოვეთ, თუ მშობლების თანხმობა არ გაქვთ. იდეების წარდგენის დღე კარგად მუშაობს საკლასო სენსორულ ეკრანზე, პრეზენტაციის რეჟიმში.",
    ),
    quiz: {
      title: l("Entrepreneurship — check yourself", "მეწარმეობა — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("A good interview asks people whether they like your idea.", "კარგ ინტერვიუში ადამიანებს ეკითხები, მოსწონთ თუ არა შენი იდეა."), answer: false },
        { type: "mc", prompt: l("What should come first?", "რა უნდა იყოს პირველი?"), options: [l("Understanding the problem", "პრობლემის გაგება"), l("Designing a logo", "ლოგოს დიზაინი"), l("Setting a price", "ფასის დადგენა")], correct: 0 },
        { type: "tf", prompt: l("Admitting what you do not know yet can make a pitch more trustworthy.", "იმის აღიარება, რაც ჯერ არ იცი, წარდგენას უფრო სანდოს ხდის."), answer: true },
      ],
    },
  },
];
