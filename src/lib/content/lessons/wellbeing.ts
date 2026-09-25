import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

/** Health, safety & wellbeing; career & university. */
export const WELLBEING: BiLesson[] = [
  {
    group: "study-habits",
    subject: "health",
    grade: 8,
    durationMin: 40,
    difficulty: "foundation",
    match: /study habit|sleep|screen time|digital wellbeing|spaced|retrieval|სწავლის ჩვევ|ძილ|ეკრანთან გატარებულ|ციფრული კეთილდღეობ/i,
    title: l("Healthy Study Habits and Digital Wellbeing", "სწავლის ჯანსაღი ჩვევები და ციფრული კეთილდღეობა"),
    topic: l("Study habits", "სწავლის ჩვევები"),
    objective: l(
      "Students use evidence-based study strategies (retrieval practice, spacing), plan sleep and breaks, and set personal rules for screen use.",
      "მოსწავლეები იყენებენ მტკიცებულებებზე დაფუძნებულ სწავლის სტრატეგიებს (თვითშემოწმება, განაწილებული გამეორება), გეგმავენ ძილსა და შესვენებებს და ეკრანის გამოყენების პირად წესებს ადგენენ.",
    ),
    objectives: [
      l("Explain retrieval practice and spaced repetition.", "ახსნას თვითშემოწმება და განაწილებული გამეორება."),
      l("Plan a week of study with sleep and breaks.", "დაგეგმოს სასწავლო კვირა ძილითა და შესვენებებით."),
      l("Set realistic personal rules for phone and screen use.", "ტელეფონისა და ეკრანის გამოყენების რეალისტური პირადი წესები დაადგინოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Busy or effective?", "დაკავებული თუ ეფექტიანი?"),
        minutes: 5,
        body: l(
          `Rereading notes five times feels like hard work — but research on learning shows that it is one of the least effective ways to study. A few habits make a much bigger difference, and they cost no extra time.`,
          `კონსპექტის ხუთჯერ გადაკითხვა შრომატევადად გვეჩვენება — თუმცა სწავლის კვლევები აჩვენებს, რომ ეს სწავლის ერთ-ერთი ყველაზე ნაკლებად ეფექტიანი გზაა. რამდენიმე ჩვევა გაცილებით დიდ სხვაობას ქმნის და დამატებით დროს არ მოითხოვს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Strategies that work", "სტრატეგიები, რომლებიც მუშაობს"),
        minutes: 12,
        body: l(
          `• Retrieval practice — close the book and try to recall: answer questions, explain to someone, use practice quizzes. Remembering strengthens memory more than rereading.
• Spaced repetition — review a topic several times over days and weeks instead of all at once the night before.
• Mix topics — alternating different kinds of problems helps you learn to choose the right method.
• Breaks — short breaks (for example 5 minutes after 25–30 minutes of focus) help concentration.
• Sleep — the American Academy of Sleep Medicine recommends 8–10 hours per night for teenagers aged 13–18. Sleep is when the brain consolidates what you learned.`,
          `• თვითშემოწმება — დახურე წიგნი და სცადე გახსენება: უპასუხე კითხვებს, აუხსენი ვინმეს, გამოიყენე სავარჯიშო ქვიზები. გახსენება მეხსიერებას გადაკითხვაზე მეტად აძლიერებს.
• განაწილებული გამეორება — თემა რამდენჯერმე გაიმეორე დღეებისა და კვირების განმავლობაში, ნაცვლად იმისა, რომ ყველაფერი ერთად, წინა ღამეს ისწავლო.
• თემების მონაცვლეობა — სხვადასხვა ტიპის ამოცანების მონაცვლეობით ამოხსნა გასწავლის, სწორი მეთოდი როგორ აირჩიო.
• შესვენებები — მოკლე შესვენება (მაგალითად, 5 წუთი 25–30 წუთიანი კონცენტრირებული მუშაობის შემდეგ) ყურადღებას ეხმარება.
• ძილი — ამერიკის ძილის მედიცინის აკადემია 13–18 წლის მოზარდებს ღამით 8–10 საათ ძილს ურჩევს. ძილის დროს ტვინი ნასწავლს ამყარებს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Screens and attention", "ეკრანები და ყურადღება"),
        minutes: 10,
        body: l(
          `Notifications interrupt focus, and getting back into a task takes time. Practical rules many students find helpful:
• phone in another room (or face down, silent) while studying;
• notifications off for apps that are not urgent;
• no screens in the last 30–60 minutes before sleep;
• notice how you feel after scrolling — energised or drained?

Digital wellbeing is not about never using technology; it is about using it on purpose.`,
          `შეტყობინებები ყურადღებას წყვეტს, საქმეზე დაბრუნებას კი დრო სჭირდება. პრაქტიკული წესები, რომლებიც ბევრ მოსწავლეს ეხმარება:
• მეცადინეობისას ტელეფონი სხვა ოთახში (ან ეკრანით ქვემოთ, უხმოდ);
• გამორთული შეტყობინებები არასასწრაფო აპლიკაციებისთვის;
• ძილამდე ბოლო 30–60 წუთი — ეკრანების გარეშე;
• დააკვირდი, როგორ გრძნობ თავს სქროლვის შემდეგ — ენერგიით სავსედ თუ დაღლილად?

ციფრული კეთილდღეობა ტექნოლოგიაზე უარის თქმას არ ნიშნავს; ის მის გააზრებულ გამოყენებას ნიშნავს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Plan your week", "დაგეგმე შენი კვირა"),
        minutes: 8,
        body: l(
          `Do the activities. Then plan next week: when will you review each subject (spacing), how will you test yourself (retrieval — for example the quizzes in each lesson), and what time will you go to sleep?`,
          `შეასრულე აქტივობები. შემდეგ დაგეგმე მომავალი კვირა: როდის გაიმეორებ თითოეულ საგანს (განაწილება), როგორ შეამოწმებ საკუთარ თავს (თვითშემოწმება — მაგალითად, ყოველი გაკვეთილის ქვიზებით) და რომელ საათზე დაიძინებ?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Test yourself, spread your practice, take breaks, sleep 8–10 hours, and put the phone away while studying.`,
          `შეამოწმე საკუთარი თავი, გაანაწილე გამეორება, დაისვენე, იძინე 8–10 საათი და მეცადინეობისას ტელეფონი გვერდზე გადადე.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Most effective", "ყველაზე ეფექტიანი"),
        prompt: l("Which study method is usually most effective for remembering?", "სწავლის რომელი მეთოდია დასამახსოვრებლად ჩვეულებრივ ყველაზე ეფექტიანი?"),
        options: [l("Closing the book and answering questions from memory", "წიგნის დახურვა და კითხვებზე მეხსიერებით პასუხის გაცემა"), l("Rereading the chapter many times", "თავის მრავალჯერ გადაკითხვა"), l("Highlighting every line", "ყველა სტრიქონის მარკერით გამოყოფა"), l("Studying everything the night before", "ყველაფრის წინა ღამეს სწავლა")],
        correct: 0,
      },
      {
        type: "exercise",
        title: l("Bedtime", "დაძინების დრო"),
        prompt: l("You must wake up at 7:00 and want 9 hours of sleep. What time should you be asleep? (hh:mm)", "7:00-ზე უნდა გაიღვიძო და 9 საათი ძილი გინდა. რომელ საათზე უნდა გეძინოს? (სს:წწ)"),
        accepted: ["22:00", "22.00", "10 pm", "10:00 pm", "22"],
        hints: [l("Count back 9 hours from 7:00.", "7:00-დან 9 საათი უკან გადაითვალე.")],
        solution: l("22:00", "22:00"),
      },
      {
        type: "poll",
        prompt: l("Which habit will you try this week?", "რომელ ჩვევას სცდი ამ კვირაში?"),
        options: [l("Testing myself instead of rereading", "გადაკითხვის ნაცვლად თვითშემოწმებას"), l("Phone in another room while studying", "მეცადინეობისას ტელეფონს სხვა ოთახში"), l("A regular bedtime", "დაძინების მუდმივ დროს"), l("Short breaks", "მოკლე შესვენებებს")],
      },
      { type: "exit", prompt: l("Write your personal rule for phone use during homework.", "დაწერე ტელეფონის გამოყენების შენი პირადი წესი საშინაო დავალების შესრულებისას.") },
    ],
    discussion: [l("Why do many students feel that rereading works, even though testing yourself works better?", "რატომ გრძნობს ბევრი მოსწავლე, რომ გადაკითხვა მუშაობს, თუმცა თვითშემოწმება უკეთეს შედეგს იძლევა?")],
    assessment: [l("A realistic weekly plan with spaced review, self-testing and sleep.", "რეალისტური კვირის გეგმა განაწილებული გამეორებით, თვითშემოწმებითა და ძილით.")],
    homework: [l("Follow your plan for one week and write three sentences about what worked.", "ერთი კვირა შენს გეგმას მიჰყევი და სამი წინადადებით დაწერე, რა გამოვიდა.")],
    teacherNotes: l(
      "Sleep recommendation: American Academy of Sleep Medicine consensus (Paruthi et al., 2016, DOI 10.5664/jcsm.5866). Be sensitive to students whose sleep is affected by circumstances at home; frame advice as options, not blame.",
      "ძილის რეკომენდაცია: ამერიკის ძილის მედიცინის აკადემიის კონსენსუსი (Paruthi et al., 2016, DOI 10.5664/jcsm.5866). გაითვალისწინეთ მოსწავლეები, რომელთა ძილზეც სახლის პირობები მოქმედებს; რჩევები შესაძლებლობებად წარმოადგინეთ და არა საყვედურად.",
    ),
    sources: ["Paruthi, S. et al. (2016). Recommended Amount of Sleep for Pediatric Populations. Journal of Clinical Sleep Medicine, 12(6). https://doi.org/10.5664/jcsm.5866"],
    quiz: {
      title: l("Study habits — check yourself", "სწავლის ჩვევები — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("Spreading review over several days usually works better than one long session.", "გამეორების რამდენიმე დღეზე განაწილება, როგორც წესი, ერთ ხანგრძლივ მეცადინეობაზე უკეთ მუშაობს."), answer: true },
        { type: "mc", prompt: l("How many hours of sleep are recommended for 13–18-year-olds?", "რამდენი საათი ძილია რეკომენდებული 13–18 წლის მოზარდებისთვის?"), options: [l("8–10 hours", "8–10 საათი"), l("5–6 hours", "5–6 საათი"), l("12–14 hours", "12–14 საათი")], correct: 0 },
        { type: "tf", prompt: l("Digital wellbeing means never using a phone.", "ციფრული კეთილდღეობა ტელეფონის საერთოდ არგამოყენებას ნიშნავს."), answer: false },
      ],
    },
  },
  {
    group: "first-aid-awareness",
    subject: "health",
    grade: 7,
    durationMin: 40,
    difficulty: "foundation",
    match: /first aid|emergency|112|burn|injur|პირველადი დახმარებ|გადაუდებელ|დამწვრობ/i,
    title: l("First-Aid Awareness and Emergencies", "პირველადი დახმარების საფუძვლები და საგანგებო სიტუაციები"),
    topic: l("First-aid awareness", "პირველადი დახმარება"),
    objective: l(
      "Students know how to stay safe, call the emergency number 112 with the right information, and give simple first help until adults or professionals arrive.",
      "მოსწავლეებმა იციან, როგორ დაიცვან საკუთარი თავი, როგორ დარეკონ გადაუდებელი დახმარების ნომერზე 112 საჭირო ინფორმაციით და როგორ აღმოუჩინონ მარტივი დახმარება ზრდასრულების ან პროფესიონალების მოსვლამდე.",
    ),
    objectives: [
      l("Follow the order: danger → help → call 112.", "დაიცვას თანმიმდევრობა: საფრთხე → დახმარება → დარეკვა 112-ზე."),
      l("Give the key information when calling 112.", "112-ზე დარეკვისას საჭირო ინფორმაცია გადასცეს."),
      l("Know simple first steps for burns and small wounds.", "იცოდეს პირველი ნაბიჯები დამწვრობისა და მცირე ჭრილობის დროს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("You can help", "შენ შეგიძლია დახმარება"),
        minutes: 5,
        body: l(
          `Most emergencies happen at home, at school or on the street — with ordinary people nearby. You do not need to be a doctor to help. Knowing what to do in the first minutes, and above all how to get professional help quickly, can make a real difference.

This lesson is an introduction. Practical first-aid skills (such as CPR) should be learned in a certified course with a trainer.`,
          `საგანგებო სიტუაციების უმეტესობა სახლში, სკოლაში ან ქუჩაში ხდება — ჩვეულებრივი ადამიანების თანდასწრებით. დასახმარებლად ექიმი არ უნდა იყო. იმის ცოდნა, რა გააკეთო პირველ წუთებში, და, უპირველეს ყოვლისა, როგორ გამოიძახო სწრაფად პროფესიონალები, შეიძლება გადამწყვეტი აღმოჩნდეს.

ეს გაკვეთილი შესავალია. პირველადი დახმარების პრაქტიკული უნარები (მაგალითად, გულ-ფილტვის რეანიმაცია) სერტიფიცირებულ კურსზე, ტრენერთან უნდა ისწავლო.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Danger, help, call", "საფრთხე, დახმარება, დარეკვა"),
        minutes: 12,
        body: l(
          `1. Danger — first make sure you are safe: traffic, fire, electricity, water. Do not become a second casualty.
2. Help — call a nearby adult (a teacher, a parent). Speak to the injured person: can they answer?
3. Call 112 — the single emergency number in Georgia (ambulance, fire, police). Say calmly:
   • where you are (address, landmark, floor);
   • what happened and how many people are hurt;
   • whether the person is conscious and breathing;
   • your name and phone number.
Stay on the line and follow the dispatcher's instructions. Do not hang up first.

Do not move an injured person unless they are in danger where they are.`,
          `1. საფრთხე — ჯერ დარწმუნდი, რომ შენ უსაფრთხოდ ხარ: მოძრავი მანქანები, ცეცხლი, ელექტრობა, წყალი. თავად არ იქცე მეორე დაზარალებულად.
2. დახმარება — დაუძახე ახლომახლო ზრდასრულს (მასწავლებელს, მშობელს). დაელაპარაკე დაშავებულს: გპასუხობს?
3. დარეკე 112-ზე — საქართველოში გადაუდებელი დახმარების ერთიანი ნომერი (სასწრაფო, სახანძრო, პოლიცია). მშვიდად თქვი:
   • სად ხარ (მისამართი, ორიენტირი, სართული);
   • რა მოხდა და რამდენი ადამიანია დაშავებული;
   • არის თუ არა დაშავებული გონზე და სუნთქავს თუ არა;
   • შენი სახელი და ტელეფონის ნომერი.
ხაზზე დარჩი და ოპერატორის მითითებებს მიჰყევი. პირველი ნუ გათიშავ.

დაშავებული არ გადააადგილო, თუ იმ ადგილას, სადაც არის, საფრთხე არ ემუქრება.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Burns and small wounds", "დამწვრობა და მცირე ჭრილობა"),
        minutes: 10,
        body: l(
          `Burns: cool the burn under cool (not ice-cold) running water for about 20 minutes. Remove rings or watches near the burn if they are not stuck. Do not put butter, oil, toothpaste or ice on a burn. Cover loosely with clean cling film or a clean non-fluffy cloth. Large burns, burns on the face, and burns on young children need medical help — call 112.

Small cuts: press on the wound with a clean cloth to stop bleeding, wash hands, then cover with a plaster. Heavy bleeding that does not stop needs 112.`,
          `დამწვრობა: დამწვარი ადგილი დაახლოებით 20 წუთის განმავლობაში გრილი (და არა ყინულივით ცივი) გამდინარე წყლით გააგრილე. დამწვრობასთან ახლოს მდებარე ბეჭდები ან საათი მოიხსენი, თუ არ არის მიწებებული. დამწვრობაზე ნუ წაისვამ კარაქს, ზეთს, კბილის პასტას და ნუ დაადებ ყინულს. თავისუფლად დაფარე სუფთა საკვები აპკით ან სუფთა, ბუსუსებისგან თავისუფალი ქსოვილით. დიდი ფართობის დამწვრობა, სახის დამწვრობა და მცირეწლოვანი ბავშვის დამწვრობა სამედიცინო დახმარებას საჭიროებს — დარეკე 112-ზე.

მცირე ჭრილობა: სისხლდენის შესაჩერებლად ჭრილობას სუფთა ქსოვილით დააწექი, ხელები დაიბანე და ჭრილობა სახვევით დაფარე. ძლიერი სისხლდენა, რომელიც არ ჩერდება, 112-ზე დარეკვას საჭიროებს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Role-play a call", "ზარის იმიტაცია"),
        minutes: 8,
        body: l(
          `In pairs, role-play a 112 call: one is the caller, one is the dispatcher. Use the checklist: where, what, how many, conscious and breathing, your name and number. Swap roles.`,
          `წყვილებში გაითამაშეთ 112-ზე ზარი: ერთი რეკავს, მეორე ოპერატორია. გამოიყენეთ სია: სად, რა, რამდენი, გონზეა და სუნთქავს თუ არა, შენი სახელი და ნომერი. შემდეგ როლები გაცვალეთ.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Danger → help → 112. Give clear information and stay on the line. Cool burns with running water for 20 minutes. Learn practical skills in a certified course.`,
          `საფრთხე → დახმარება → 112. მკაფიოდ გადაეცი ინფორმაცია და ხაზზე დარჩი. დამწვრობა 20 წუთის განმავლობაში გამდინარე წყლით გააგრილე. პრაქტიკული უნარები სერტიფიცირებულ კურსზე ისწავლე.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("The number", "ნომერი"),
        prompt: l("What is the single emergency number in Georgia?", "რომელია საქართველოში გადაუდებელი დახმარების ერთიანი ნომერი?"),
        accepted: ["112"],
      },
      {
        type: "mc",
        title: l("First step", "პირველი ნაბიჯი"),
        prompt: l("You see someone lying on the road after a bicycle accident. What do you do first?", "ველოსიპედით ავარიის შემდეგ გზაზე მწოლიარე ადამიანს ხედავ. რას გააკეთებ პირველ რიგში?"),
        options: [l("Check that it is safe for you (traffic) before approaching", "მიახლოებამდე შეამოწმებ, უსაფრთხოა თუ არა შენთვის (მოძრავი მანქანები)"), l("Run straight into the road", "პირდაპირ გზაზე გავარდები"), l("Take a photo", "ფოტოს გადაიღებ"), l("Walk away", "წახვალ")],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Burns", "დამწვრობა"),
        prompt: l("What should you put on a small burn first?", "რა უნდა გააკეთო პირველ რიგში მცირე დამწვრობის დროს?"),
        options: [l("Cool running water for about 20 minutes", "დაახლოებით 20 წუთი გრილი გამდინარე წყალი"), l("Butter", "კარაქი"), l("Toothpaste", "კბილის პასტა"), l("Ice directly on the skin", "ყინული პირდაპირ კანზე")],
        correct: 0,
      },
      { type: "exit", prompt: l("List the information you give when you call 112.", "ჩამოწერე ინფორმაცია, რომელსაც 112-ზე დარეკვისას გადასცემ.") },
    ],
    discussion: [l("Why is it important not to hang up before the dispatcher tells you?", "რატომ არ უნდა გათიშო ზარი, სანამ ოპერატორი არ გეტყვის?")],
    assessment: [l("Students give a complete 112 message in role-play and choose correct first steps.", "მოსწავლე ზარის იმიტაციისას სრულ ინფორმაციას გადასცემს და სწორ პირველ ნაბიჯებს ირჩევს.")],
    homework: [l("With your family, find the address details you would give for your home (street, number, entrance, floor) and the nearest landmark.", "ოჯახთან ერთად ჩაიწერე სახლის მისამართის დეტალები, რომლებსაც ზარისას გადასცემდი (ქუჩა, ნომერი, სადარბაზო, სართული), და უახლოესი ორიენტირი.")],
    teacherNotes: l(
      "This lesson gives awareness, not certification. Recommend a certified first-aid course (for example from the Georgia Red Cross Society) for hands-on skills such as CPR and the recovery position. Be ready for students who have experienced emergencies; allow them to step out.",
      "ეს გაკვეთილი ცნობიერების ამაღლებას ემსახურება და სერტიფიკატს არ იძლევა. პრაქტიკული უნარებისთვის (მაგალითად, გულ-ფილტვის რეანიმაცია, გვერდითი მდგრადი პოზიცია) ურჩიეთ სერტიფიცირებული კურსი (მაგალითად, საქართველოს წითელი ჯვრის საზოგადოებისგან). გაითვალისწინეთ მოსწავლეები, რომლებსაც საგანგებო სიტუაცია გამოუცდიათ; მიეცით საშუალება, საჭიროების შემთხვევაში გავიდნენ.",
    ),
    quiz: {
      title: l("First aid — check yourself", "პირველადი დახმარება — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("You should always move an injured person to a comfortable place.", "დაშავებული ყოველთვის უნდა გადაიყვანო კომფორტულ ადგილას."), answer: false },
        { type: "num", prompt: l("For how many minutes should you cool a burn under running water?", "რამდენი წუთის განმავლობაში უნდა გააგრილო დამწვრობა გამდინარე წყლით?"), answer: 20 },
        { type: "tf", prompt: l("When calling 112, you should stay on the line until told otherwise.", "112-ზე დარეკვისას ხაზზე უნდა დარჩე, სანამ სხვა მითითებას არ მიიღებ."), answer: true },
      ],
    },
  },
  {
    group: "choosing-a-path",
    subject: "career",
    grade: 10,
    durationMin: 45,
    difficulty: "foundation",
    match: /career|university|profession|study programme|კარიერ|უნივერსიტეტ|პროფესი|სასწავლო პროგრამ/i,
    title: l("Exploring Careers and Choosing a Study Path", "კარიერის შესწავლა და სასწავლო გზის არჩევა"),
    topic: l("Career planning", "კარიერის დაგეგმვა"),
    objective: l(
      "Students connect their interests and skills to fields of study, research a university programme from official sources, and plan next steps in their portfolio.",
      "მოსწავლეები საკუთარ ინტერესებსა და უნარებს სწავლის სფეროებს უკავშირებენ, ოფიციალური წყაროებით იკვლევენ უნივერსიტეტის პროგრამას და პორტფოლიოში შემდეგ ნაბიჯებს გეგმავენ.",
    ),
    objectives: [
      l("Describe their interests, strengths and values.", "აღწეროს საკუთარი ინტერესები, ძლიერი მხარეები და ღირებულებები."),
      l("Link a field of study to several possible careers.", "სწავლის სფერო რამდენიმე შესაძლო კარიერას დაუკავშიროს."),
      l("Research a programme using official, dated sources.", "პროგრამა ოფიციალური, დათარიღებული წყაროებით გამოიკვლიოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Not one decision, but many small ones", "არა ერთი გადაწყვეტილება, არამედ ბევრი პატარა"),
        minutes: 5,
        body: l(
          `Choosing a career is not a single moment. Most people change jobs several times, and new professions appear all the time. What helps is knowing yourself, exploring options early, and keeping evidence of what you can do.`,
          `კარიერის არჩევა ერთჯერადი მომენტი არ არის. ადამიანების უმეტესობა სამსახურს რამდენჯერმე იცვლის, ახალი პროფესიები კი მუდმივად ჩნდება. გეხმარება საკუთარი თავის ცოდნა, ვარიანტების ადრევე შესწავლა და იმის მტკიცებულებების შენახვა, რისი გაკეთებაც შეგიძლია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Interests, skills, values", "ინტერესები, უნარები, ღირებულებები"),
        minutes: 10,
        body: l(
          `Ask yourself:
• Interests — which subjects and activities make you lose track of time?
• Skills — what can you already do well (solving problems, explaining, drawing, organising, building)?
• Values — what matters to you in work: helping people, creating, stability, independence, working outdoors?

One field of study can lead to many careers: a mathematics degree can lead to teaching, data analysis, finance or software; a biology degree to research, medicine-related work, environmental protection or teaching.`,
          `ჰკითხე საკუთარ თავს:
• ინტერესები — რომელ საგნებსა და საქმიანობაზე გავიწყდება დრო?
• უნარები — რისი გაკეთება გამოგდის უკვე კარგად (პრობლემების გადაჭრა, ახსნა, ხატვა, ორგანიზება, აწყობა)?
• ღირებულებები — რა არის შენთვის მნიშვნელოვანი საქმეში: ადამიანების დახმარება, შექმნა, სტაბილურობა, დამოუკიდებლობა, ღია ცის ქვეშ მუშაობა?

ერთ სფეროს შეიძლება ბევრ კარიერამდე მიჰყავდე: მათემატიკის ხარისხს — სწავლებამდე, მონაცემთა ანალიზამდე, ფინანსებამდე ან პროგრამირებამდე; ბიოლოგიისას — კვლევამდე, მედიცინასთან დაკავშირებულ საქმიანობამდე, გარემოს დაცვამდე ან სწავლებამდე.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Researching a programme honestly", "პროგრამის კეთილსინდისიერი კვლევა"),
        minutes: 12,
        body: l(
          `Admission rules, exam subjects, fees, scholarships and deadlines change every year. So:
• use official sources — the university's own website and, for the Unified National Exams in Georgia, the National Assessment and Examinations Center (naec.ge);
• write down the date you checked and the link;
• treat anything older than a year as needing re-checking.

In the Career & University laboratory, a university card stores exactly this: programme, what you found, the source link and the date you checked it. Examples of Georgian universities you might research include Ivane Javakhishvili Tbilisi State University, Ilia State University and the Georgian Technical University — always check current details on their official sites.`,
          `მიღების წესები, საგამოცდო საგნები, სწავლის საფასური, სტიპენდიები და ვადები ყოველწლიურად იცვლება. ამიტომ:
• გამოიყენე ოფიციალური წყაროები — უნივერსიტეტის საკუთარი ვებგვერდი და, საქართველოში ერთიანი ეროვნული გამოცდებისთვის, შეფასებისა და გამოცდების ეროვნული ცენტრი (naec.ge);
• ჩაიწერე შემოწმების თარიღი და ბმული;
• ერთ წელზე ძველი ინფორმაცია ხელახლა გადასამოწმებლად ჩათვალე.

კარიერისა და უნივერსიტეტის ლაბორატორიაში უნივერსიტეტის ბარათი სწორედ ამას ინახავს: პროგრამას, მოძიებულ ინფორმაციას, წყაროს ბმულსა და შემოწმების თარიღს. საქართველოს უნივერსიტეტების მაგალითებად, რომელთა კვლევაც შეგიძლია, შეიძლება დასახელდეს ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი, ილიას სახელმწიფო უნივერსიტეტი და საქართველოს ტექნიკური უნივერსიტეტი — მოქმედი დეტალები ყოველთვის მათ ოფიციალურ ვებგვერდებზე გადაამოწმე.`,
        ),
      },
      {
        kind: "practice",
        title: l("Explore and record", "შეისწავლე და ჩაიწერე"),
        minutes: 13,
        body: l(
          `Open the Career & University laboratory. Browse careers linked to a field you like, bookmark two, and create one university card for a programme, with a source link and today's date. Then add one portfolio item that shows a skill related to that path.`,
          `გახსენი კარიერისა და უნივერსიტეტის ლაბორატორია. დაათვალიერე შენთვის საინტერესო სფეროსთან დაკავშირებული პროფესიები, შეინახე ორი სანიშნეებში და შექმენი ერთი უნივერსიტეტის ბარათი რომელიმე პროგრამისთვის, წყაროს ბმულითა და დღევანდელი თარიღით. შემდეგ დაამატე პორტფოლიოში ერთი ნამუშევარი, რომელიც ამ გზასთან დაკავშირებულ უნარს აჩვენებს.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Know your interests, skills and values; explore several paths; use official, dated sources for admission information; build evidence in your portfolio.`,
          `გაიცანი შენი ინტერესები, უნარები და ღირებულებები; შეისწავლე რამდენიმე გზა; მიღების შესახებ ინფორმაციისთვის ოფიციალური, დათარიღებული წყაროები გამოიყენე; პორტფოლიოში მტკიცებულებები დააგროვე.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Reliable admission info", "სანდო ინფორმაცია მიღებაზე"),
        prompt: l("Where should you check the exam requirements for a programme?", "სად უნდა გადაამოწმო პროგრამაზე მისაღები გამოცდების მოთხოვნები?"),
        options: [l("On the university's official website and naec.ge", "უნივერსიტეტის ოფიციალურ ვებგვერდზე და naec.ge-ზე"), l("In a two-year-old forum post", "ორი წლის წინანდელ ფორუმის პოსტში"), l("By asking a friend's older brother", "მეგობრის უფროსი ძმის კითხვით"), l("It never changes, so anywhere", "არასოდეს იცვლება, ამიტომ — ნებისმიერ ადგილას")],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Why the date?", "რატომ თარიღი?"),
        prompt: l("Why should you write down the date when you checked admission information?", "რატომ უნდა ჩაიწერო მიღების შესახებ ინფორმაციის შემოწმების თარიღი?"),
        options: [l("Because requirements, fees and deadlines can change every year", "რადგან მოთხოვნები, საფასური და ვადები შეიძლება ყოველწლიურად შეიცვალოს"), l("It is not important", "მნიშვნელოვანი არ არის"), l("Universities require it", "ამას უნივერსიტეტები ითხოვენ")],
        correct: 0,
      },
      { type: "discussion", prompt: l("Name one field of study and three different careers it could lead to.", "დაასახელე ერთი სწავლის სფერო და სამი სხვადასხვა კარიერა, რომლებამდეც ის შეიძლება მიგიყვანოს.") },
      { type: "exit", prompt: l("Write one interest, one skill and one value that matter for your future work.", "დაწერე ერთი ინტერესი, ერთი უნარი და ერთი ღირებულება, რომლებიც შენი მომავალი საქმისთვის მნიშვნელოვანია.") },
    ],
    discussion: [l("Is it a problem not to know yet what you want to do? Why or why not?", "პრობლემაა, თუ ჯერ არ იცი, რისი კეთება გინდა? რატომ?")],
    assessment: [l("A university card with a source link and date, two bookmarked careers and one portfolio item.", "უნივერსიტეტის ბარათი წყაროს ბმულითა და თარიღით, ორი შენახული პროფესია და ერთი პორტფოლიოს ნამუშევარი.")],
    homework: [l("Interview an adult about their career path: what did they study, and how did their plans change?", "გამოკითხე ზრდასრული მისი კარიერული გზის შესახებ: რა ისწავლა და როგორ შეიცვალა მისი გეგმები?")],
    teacherNotes: l(
      "The platform never stores admission figures as permanent facts; shared university cards are provided without numbers on purpose. If you share a card with the class, record the date you checked it.",
      "პლატფორმა მიღების მონაცემებს მუდმივ ფაქტებად არასოდეს ინახავს; საერთო უნივერსიტეტის ბარათები რიცხვების გარეშეა განზრახ. თუ ბარათს კლასს გაუზიარებთ, შემოწმების თარიღი მიუთითეთ.",
    ),
    quiz: {
      title: l("Career planning — check yourself", "კარიერის დაგეგმვა — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("One field of study can lead to several different careers.", "ერთ სფეროს შეიძლება რამდენიმე განსხვავებულ კარიერამდე მიჰყავდე."), answer: true },
        { type: "tf", prompt: l("University admission requirements never change.", "უნივერსიტეტში მიღების მოთხოვნები არასოდეს იცვლება."), answer: false },
        { type: "mc", prompt: l("Which organisation runs the Unified National Exams in Georgia?", "რომელი ორგანიზაცია ატარებს ერთიან ეროვნულ გამოცდებს საქართველოში?"), options: [l("The National Assessment and Examinations Center (NAEC)", "შეფასებისა და გამოცდების ეროვნული ცენტრი"), l("Geostat", "საქსტატი"), l("The National Bank", "ეროვნული ბანკი")], correct: 0 },
      ],
    },
  },
];
