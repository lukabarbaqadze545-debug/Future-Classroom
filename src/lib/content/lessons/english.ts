import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

/**
 * English lessons: the English version is written for learners; the Georgian
 * version explains in Georgian and keeps the English examples and answers.
 */
export const ENGLISH: BiLesson[] = [
  {
    group: "present-perfect",
    subject: "english",
    grade: 8,
    durationMin: 45,
    difficulty: "standard",
    match: /present perfect|past simple|have been|აწმყო სრულ|present perfect/i,
    title: l("Present Perfect or Past Simple?", "Present Perfect თუ Past Simple?"),
    topic: l("Present perfect and past simple", "Present Perfect და Past Simple"),
    objective: l(
      "Students choose between the present perfect and the past simple using time expressions and the idea of a finished or unfinished time.",
      "მოსწავლეები დროის გამომხატველი სიტყვებისა და დასრულებული ან დაუსრულებელი პერიოდის მიხედვით ირჩევენ Present Perfect-სა და Past Simple-ს შორის.",
    ),
    objectives: [
      l("Form the present perfect (have/has + past participle).", "ააგოს Present Perfect (have/has + past participle)."),
      l("Use the past simple for finished times and the present perfect for experience and results.", "გამოიყენოს Past Simple დასრულებული დროისთვის, Present Perfect — გამოცდილებისა და შედეგისთვის."),
      l("Use signal words: yesterday, ago, in 2020 / ever, never, already, yet, just.", "გამოიყენოს მანიშნებელი სიტყვები: yesterday, ago, in 2020 / ever, never, already, yet, just."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Two ways to talk about the past", "წარსულზე საუბრის ორი გზა"),
        minutes: 5,
        body: l(
          `Compare:
• I visited Batumi last summer.
• I have visited Batumi three times.

Both are about the past. The first says when (last summer — a finished time). The second is about your experience up to now; the exact time does not matter.`,
          `შეადარე:
• I visited Batumi last summer.
• I have visited Batumi three times.

ორივე წარსულზეა. პირველი ამბობს, როდის (last summer — დასრულებული პერიოდი). მეორე შენს გამოცდილებაზეა დღემდე; ზუსტ დროს მნიშვნელობა არ აქვს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Form and use", "აგებულება და გამოყენება"),
        minutes: 12,
        body: l(
          `Present perfect: have / has + past participle
I have finished. She has seen that film. We haven't started yet. Have you ever been to Svaneti?

Use the present perfect for:
• life experience (ever, never): Have you ever tried khachapuri Adjaruli?
• a past action with a result now (just, already, yet): I've lost my key — I can't open the door.
• a situation that started in the past and continues (for, since): We have lived in Kutaisi since 2019.

Use the past simple for a finished time: yesterday, last week, in 2015, two days ago, when I was a child.
✗ I have seen him yesterday.  ✓ I saw him yesterday.`,
          `Present Perfect: have / has + past participle (ზმნის მესამე ფორმა)
I have finished. She has seen that film. We haven't started yet. Have you ever been to Svaneti?

Present Perfect-ს ვიყენებთ:
• ცხოვრებისეული გამოცდილებისთვის (ever, never): Have you ever tried khachapuri Adjaruli?
• წარსული მოქმედებისთვის, რომლის შედეგი ახლაც ჩანს (just, already, yet): I've lost my key — I can't open the door.
• მდგომარეობისთვის, რომელიც წარსულში დაიწყო და გრძელდება (for, since): We have lived in Kutaisi since 2019.

Past Simple-ს ვიყენებთ დასრულებული დროისთვის: yesterday, last week, in 2015, two days ago, when I was a child.
✗ I have seen him yesterday.  ✓ I saw him yesterday.

ყურადღება: ქართულში ორივე შემთხვევას ხშირად ერთი ფორმით გადმოვცემთ („მინახავს“ / „ვნახე“), ამიტომ ინგლისურში მანიშნებელ სიტყვებს მიაქციე ყურადღება.`,
        ),
      },
      {
        kind: "example",
        title: l("A short dialogue", "მოკლე დიალოგი"),
        minutes: 8,
        body: l(
          `A: Have you ever been to Mestia?
B: Yes, I have. I went there in 2022 with my class.
A: Did you climb anything?
B: We walked to the Chalaadi glacier. I've never seen so much ice!

Notice the switch: the question about experience uses the present perfect; as soon as B names a time (in 2022), the past simple follows.`,
          `A: Have you ever been to Mestia?
B: Yes, I have. I went there in 2022 with my class.
A: Did you climb anything?
B: We walked to the Chalaadi glacier. I've never seen so much ice!

შენიშნე გადასვლა: გამოცდილებაზე კითხვა Present Perfect-შია; როგორც კი B დროს ასახელებს (in 2022), Past Simple-ზე გადადის.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 15,
        body: l(
          `Do the activities. Then interview a partner with "Have you ever…?" questions and follow up with "When…? / Where…? / Who with…?" in the past simple.`,
          `შეასრულე აქტივობები. შემდეგ მეწყვილეს ინტერვიუ ჩაუტარე კითხვებით „Have you ever…?“ და დააზუსტე Past Simple-ით: „When…? / Where…? / Who with…?“`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Finished time (yesterday, ago, in 2020) → past simple.
• Experience, result now, continuing situation (ever, never, just, yet, for, since) → present perfect.`,
          `• დასრულებული დრო (yesterday, ago, in 2020) → Past Simple.
• გამოცდილება, შედეგი ახლა, გრძელდება (ever, never, just, yet, for, since) → Present Perfect.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Choose the form", "აირჩიე ფორმა"),
        prompt: l("I ___ my homework yesterday evening.", "I ___ my homework yesterday evening."),
        options: ["did", "have done", "have did", "done"],
        correct: 0,
        hints: [l("\"Yesterday evening\" is a finished time.", "„Yesterday evening“ დასრულებული დროა.")],
        explanation: l("A finished time needs the past simple: I did my homework yesterday evening.", "დასრულებულ დროს Past Simple სჭირდება: I did my homework yesterday evening."),
      },
      {
        type: "mc",
        title: l("Experience", "გამოცდილება"),
        prompt: l("___ you ever ___ a horse?", "___ you ever ___ a horse?"),
        options: ["Have … ridden", "Did … rode", "Have … rode", "Do … ridden"],
        correct: 0,
        hints: [l("\"Ever\" asks about experience up to now.", "„Ever“ დღემდე გამოცდილებას ეკითხება.")],
      },
      {
        type: "short",
        title: l("Since or for?", "Since თუ for?"),
        prompt: l("Complete with since or for: We have known each other ___ five years.", "ჩასვი since ან for: We have known each other ___ five years."),
        accepted: ["for"],
        hints: [l("\"For\" + a length of time; \"since\" + a starting point.", "„For“ + ხანგრძლივობა; „since“ + საწყისი მომენტი.")],
        solution: l("for — five years is a length of time.", "for — five years ხანგრძლივობაა."),
      },
      {
        type: "short",
        title: l("Correct the mistake", "გაასწორე შეცდომა"),
        prompt: l("Correct the sentence: \"I have seen her two days ago.\"", "გაასწორე წინადადება: „I have seen her two days ago.“"),
        accepted: ["I saw her two days ago.", "I saw her two days ago"],
        hints: [l("\"Ago\" points to a finished time.", "„Ago“ დასრულებულ დროზე მიუთითებს.")],
        solution: l("I saw her two days ago.", "I saw her two days ago."),
      },
      { type: "discussion", prompt: l("Write three true sentences about things you have never done, and one thing you did last weekend.", "დაწერე სამი მართალი წინადადება იმაზე, რაც არასოდეს გაგიკეთებია, და ერთი — იმაზე, რაც გასულ შაბათ-კვირას გააკეთე.") },
      { type: "exit", prompt: l("Explain in one sentence when you use the present perfect.", "ერთ წინადადებაში ახსენი, როდის იყენებ Present Perfect-ს.") },
    ],
    discussion: [
      l("Which signal words helped you most today?", "რომელი მანიშნებელი სიტყვები დაგეხმარა დღეს ყველაზე მეტად?"),
      l("How would you translate \"I have lived here for ten years\" into Georgian? What changes?", "როგორ თარგმნიდი ქართულად „I have lived here for ten years“? რა იცვლება?"),
    ],
    assessment: [
      l("Correct choice of tense in gap-fill sentences.", "გამოტოვებული სიტყვების ჩასმისას დროის სწორი შერჩევა."),
      l("Accurate use in a short spoken interview.", "სწორი გამოყენება მოკლე ზეპირ ინტერვიუში."),
    ],
    homework: [l("Write an 80–100 word paragraph: \"Places I have visited\" — use both tenses correctly.", "დაწერე 80–100 სიტყვიანი აბზაცი თემაზე „Places I have visited“ — ორივე დრო სწორად გამოიყენე.")],
    teacherNotes: l(
      "British English uses the present perfect more often than American English with just/already/yet (\"Did you eat yet?\" is common in American English). Accept both in speaking; be consistent in writing tasks.",
      "ბრიტანულ ინგლისურში just/already/yet-თან Present Perfect უფრო ხშირია, ვიდრე ამერიკულში („Did you eat yet?“ ამერიკულ ინგლისურში გავრცელებულია). ზეპირ მეტყველებაში ორივე მიიღეთ, წერით დავალებებში კი ერთ ნორმას მიჰყევით.",
    ),
    quiz: {
      title: l("Present perfect or past simple — check yourself", "Present Perfect თუ Past Simple — შეამოწმე თავი"),
      questions: [
        { type: "mc", prompt: l("She ___ in Tbilisi since 2018.", "She ___ in Tbilisi since 2018."), options: ["has lived", "lived", "lives", "is living"], correct: 0 },
        { type: "mc", prompt: l("We ___ the museum last Saturday.", "We ___ the museum last Saturday."), options: ["visited", "have visited", "has visited", "visit"], correct: 0 },
        { type: "short", prompt: l("Past participle of \"go\"?", "რა არის „go“-ს past participle?"), accepted: ["gone"] },
        { type: "tf", prompt: l("\"I have finished it yesterday\" is correct.", "„I have finished it yesterday“ სწორია."), answer: false },
      ],
    },
  },
  {
    group: "formal-email",
    subject: "english",
    grade: 10,
    durationMin: 45,
    difficulty: "standard",
    match: /formal email|formal letter|email|ოფიციალური წერილ|ელფოსტ/i,
    title: l("Writing a Formal Email", "ოფიციალური ელწერილის წერა ინგლისურად"),
    topic: l("Formal email", "ოფიციალური ელწერილი"),
    objective: l(
      "Students write a clear, polite formal email in English with a suitable subject line, greeting, paragraphs and closing.",
      "მოსწავლეები ინგლისურად წერენ მკაფიო, თავაზიან ოფიციალურ ელწერილს შესაფერისი თემით, მიმართვით, აბზაცებითა და დასასრულით.",
    ),
    objectives: [
      l("Use formal greetings and closings correctly.", "სწორად გამოიყენოს ოფიციალური მიმართვა და დასასრული."),
      l("Organise an email into purpose, details and request.", "ელწერილი დაალაგოს: მიზანი, დეტალები, თხოვნა."),
      l("Choose formal instead of informal expressions.", "არაფორმალური გამოთქმების ნაცვლად ფორმალური აირჩიოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why it matters", "რატომ არის ეს მნიშვნელოვანი"),
        minutes: 5,
        body: l(
          `One day you will email a university, an exchange programme or an employer. The first thing they see is your subject line and greeting — a clear, polite email makes a good impression before they read your ideas.`,
          `ერთ დღეს უნივერსიტეტს, გაცვლით პროგრამას ან დამსაქმებელს მისწერ. პირველი, რასაც ისინი დაინახავენ, შენი ელწერილის თემა და მიმართვაა — მკაფიო და თავაზიანი წერილი კარგ შთაბეჭდილებას შენი იდეების წაკითხვამდე ქმნის.`,
        ),
      },
      {
        kind: "explanation",
        title: l("The structure", "სტრუქტურა"),
        minutes: 12,
        body: l(
          `Subject: Question about the summer science camp
Dear Ms Smith,   (if you do not know the name: Dear Sir or Madam,)

Paragraph 1 — purpose: I am writing to ask about…
Paragraph 2 — details: I am a Grade 10 student at School No. 5 in Rustavi…
Paragraph 3 — request: Could you please tell me… / I would be grateful if you could…

I look forward to hearing from you.
Kind regards, / Yours sincerely,
Nino Beridze

Formal, not informal:
• Hi → Dear…
• I want → I would like
• Can you…? → Could you please…?
• Thanks a lot! → Thank you for your time.
• No contractions: I am, not I'm.`,
          `Subject: Question about the summer science camp
Dear Ms Smith,   (თუ სახელი არ იცი: Dear Sir or Madam,)

1-ლი აბზაცი — მიზანი: I am writing to ask about…
მე-2 აბზაცი — დეტალები: I am a Grade 10 student at School No. 5 in Rustavi…
მე-3 აბზაცი — თხოვნა: Could you please tell me… / I would be grateful if you could…

I look forward to hearing from you.
Kind regards, / Yours sincerely,
Nino Beridze

ფორმალური და არა არაფორმალური:
• Hi → Dear…
• I want → I would like
• Can you…? → Could you please…?
• Thanks a lot! → Thank you for your time.
• შემოკლებების გარეშე: I am და არა I'm.`,
        ),
      },
      {
        kind: "practice",
        title: l("Write your email", "დაწერე შენი ელწერილი"),
        minutes: 20,
        body: l(
          `Task: you want to join an online science competition for school students. Write to the organisers (120–150 words): introduce yourself, ask two questions (dates, how to register) and thank them.

Then swap with a partner and check: subject line? formal greeting? three paragraphs? no contractions? polite request?`,
          `დავალება: გსურს სკოლის მოსწავლეებისთვის ონლაინ სამეცნიერო კონკურსში მონაწილეობა. მისწერე ორგანიზატორებს (120–150 სიტყვა): წარუდგინე თავი, დაუსვი ორი კითხვა (თარიღები, რეგისტრაციის წესი) და მადლობა გადაუხადე.

შემდეგ მეწყვილეს გაუცვალე და შეამოწმეთ: არის თემა? ფორმალური მიმართვა? სამი აბზაცი? შემოკლებების გარეშეა? თხოვნა თავაზიანია?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Clear subject → formal greeting → purpose, details, request → polite closing → your full name. Keep it short and check spelling before you press Send.`,
          `მკაფიო თემა → ფორმალური მიმართვა → მიზანი, დეტალები, თხოვნა → თავაზიანი დასასრული → სრული სახელი. იყავი ლაკონიური და გაგზავნამდე მართლწერა შეამოწმე.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Greeting", "მიმართვა"),
        prompt: l("You don't know the name of the person. Which greeting is best?", "ადრესატის სახელი არ იცი. რომელი მიმართვაა საუკეთესო?"),
        options: ["Dear Sir or Madam,", "Hey there,", "Hi!", "To whoever reads this,"],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Most formal", "ყველაზე ფორმალური"),
        prompt: l("Which request is the most formal?", "რომელი თხოვნაა ყველაზე ფორმალური?"),
        options: ["I would be grateful if you could send me the timetable.", "Send me the timetable.", "Can u send the timetable?", "I want the timetable now."],
        correct: 0,
      },
      {
        type: "short",
        title: l("Make it formal", "გახადე ფორმალური"),
        prompt: l("Rewrite formally (one sentence): \"I wanna know when it starts.\"", "გადაწერე ფორმალურად (ერთი წინადადება): „I wanna know when it starts.“"),
        accepted: ["I would like to know when it starts.", "I would like to know when it starts", "Could you please tell me when it starts?", "Could you tell me when it starts?"],
        hints: [l("\"Wanna\" → \"would like to\".", "„Wanna“ → „would like to“.")],
        solution: l("I would like to know when it starts. (or: Could you please tell me when it starts?)", "I would like to know when it starts. (ან: Could you please tell me when it starts?)"),
      },
      { type: "exit", prompt: l("Write a subject line and the first sentence of an email asking your school librarian to reserve a book.", "დაწერე თემა და პირველი წინადადება ელწერილისთვის, რომლითაც სკოლის ბიბლიოთეკარს წიგნის დაჯავშნას სთხოვ.") },
    ],
    discussion: [l("How is a formal email different from a message to a friend in Georgian? Which differences are the same in English?", "რით განსხვავდება ოფიციალური ელწერილი მეგობრისთვის ქართულად გაგზავნილი შეტყობინებისგან? რომელი განსხვავებაა ინგლისურშიც ასეთივე?")],
    assessment: [l("Email includes all parts and uses formal language consistently.", "ელწერილი ყველა ნაწილს შეიცავს და თანმიმდევრულად ფორმალურ ენას იყენებს.")],
    homework: [l("Write a formal email to a university asking for information about an exchange programme (150 words).", "დაწერე ოფიციალური ელწერილი უნივერსიტეტს, სადაც გაცვლითი პროგრამის შესახებ ინფორმაციას ითხოვ (150 სიტყვა).")],
    teacherNotes: l(
      "Use real but safe contexts (school competitions, library requests). Never ask students to send emails to real organisations from class accounts without permission. The Career & University laboratory's university cards give natural follow-up tasks.",
      "გამოიყენეთ რეალური, მაგრამ უსაფრთხო კონტექსტები (სასკოლო კონკურსები, ბიბლიოთეკისადმი თხოვნები). ნებართვის გარეშე ნუ სთხოვთ მოსწავლეებს რეალურ ორგანიზაციებს საკლასო ანგარიშებიდან მისწერონ. კარიერისა და უნივერსიტეტის ლაბორატორიის უნივერსიტეტების ბარათები ბუნებრივ შემდგომ დავალებებს იძლევა.",
    ),
    quiz: {
      title: l("Formal email — check yourself", "ოფიციალური ელწერილი — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("Contractions like I'm are normal in formal emails.", "ისეთი შემოკლებები, როგორიცაა I'm, ოფიციალურ ელწერილში ჩვეულებრივია."), answer: false },
        { type: "mc", prompt: l("Which closing fits a formal email?", "რომელი დასასრული შეეფერება ოფიციალურ ელწერილს?"), options: ["Kind regards,", "Cheers!", "Bye!!", "See ya,"], correct: 0 },
        { type: "mc", prompt: l("What should the first paragraph say?", "რა უნდა ეწეროს პირველ აბზაცში?"), options: [l("Why you are writing", "რატომ წერ"), l("Your hobbies", "შენი ჰობი"), l("A joke", "ხუმრობა"), l("Nothing", "არაფერი")], correct: 0 },
      ],
    },
  },
];
