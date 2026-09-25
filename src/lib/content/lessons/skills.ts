import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

/** Research & academic skills, critical thinking & media literacy. */
export const RESEARCH_SKILLS: BiLesson[] = [
  {
    group: "research-question",
    subject: "research",
    grade: 9,
    durationMin: 40,
    difficulty: "foundation",
    match: /research question|hypothesis|საკვლევი კითხვ|ჰიპოთეზ/i,
    title: l("How to Formulate a Research Question", "როგორ ჩამოვაყალიბოთ საკვლევი კითხვა"),
    topic: l("Research questions", "საკვლევი კითხვა"),
    objective: l(
      "Students turn a broad topic into a focused, answerable research question and write a testable hypothesis.",
      "მოსწავლეები ფართო თემას ფოკუსირებულ, პასუხგაცემად საკვლევ კითხვად აქცევენ და შემოწმებად ჰიპოთეზას წერენ.",
    ),
    objectives: [
      l("Distinguish a topic from a research question.", "განასხვავოს თემა საკვლევი კითხვისგან."),
      l("Make a question focused, answerable and worth answering.", "კითხვა გახადოს ფოკუსირებული, პასუხგაცემადი და ღირებული."),
      l("Write a hypothesis that data could support or contradict.", "დაწეროს ჰიპოთეზა, რომელსაც მონაცემები დაადასტურებს ან უარყოფს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Topic or question?", "თემა თუ კითხვა?"),
        minutes: 5,
        body: l(
          `"Sleep" is a topic. "Do students in our school who use screens after 22:00 sleep less on school nights?" is a research question. A good question tells you what data to collect — a topic does not.`,
          `„ძილი“ თემაა. „ნაკლებს სძინავთ თუ არა სასწავლო დღეებში ჩვენი სკოლის იმ მოსწავლეებს, რომლებიც 22:00-ის შემდეგ ეკრანს იყენებენ?“ — საკვლევი კითხვაა. კარგი კითხვა გეუბნება, რა მონაცემები შეაგროვო; თემა — არა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("From broad to focused", "ფართოდან ფოკუსირებულამდე"),
        minutes: 12,
        body: l(
          `Narrow the topic step by step:
Sleep → teenagers' sleep → screens and sleep → screen use after 22:00 and hours of sleep in our school.

A good research question is:
• focused — one clear relationship or problem;
• answerable — with data you can actually collect in the time you have;
• specific — who, where, what exactly is measured;
• worth answering — someone could use the answer.

Types of questions: descriptive (How many…?), comparative (Is A different from B?), causal (Does A affect B?) and evaluative (How well does…?). Causal questions are the hardest to answer with a school survey.`,
          `თემა ნაბიჯ-ნაბიჯ დაავიწროვე:
ძილი → მოზარდების ძილი → ეკრანები და ძილი → 22:00-ის შემდეგ ეკრანის გამოყენება და ძილის საათები ჩვენს სკოლაში.

კარგი საკვლევი კითხვა:
• ფოკუსირებულია — ერთი მკაფიო კავშირი ან პრობლემა;
• პასუხგაცემადია — ისეთი მონაცემებით, რომელთა შეგროვებაც შენთვის ხელმისაწვდომ დროში შეგიძლია;
• კონკრეტულია — ვინ, სად, რა იზომება ზუსტად;
• ღირებულია — პასუხი ვინმეს გამოადგება.

კითხვების ტიპები: აღწერითი (რამდენი…?), შედარებითი (განსხვავდება A B-სგან?), მიზეზობრივი (მოქმედებს A B-ზე?) და შეფასებითი (რამდენად კარგად…?). მიზეზობრივ კითხვაზე სასკოლო გამოკითხვით პასუხის გაცემა ყველაზე რთულია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Hypothesis", "ჰიპოთეზა"),
        minutes: 8,
        body: l(
          `A hypothesis is your expected answer, written so that data can check it:
"Students who use screens after 22:00 sleep on average less than those who do not."

A hypothesis is not a fact and it is fine if the data contradict it — that is a real finding too. Avoid hypotheses that cannot fail, such as "Screens may or may not affect sleep".`,
          `ჰიპოთეზა შენი მოსალოდნელი პასუხია, ისე ჩამოყალიბებული, რომ მონაცემებმა შეძლონ მისი შემოწმება:
„მოსწავლეებს, რომლებიც 22:00-ის შემდეგ ეკრანს იყენებენ, საშუალოდ ნაკლები სძინავთ, ვიდრე მათ, ვინც არ იყენებს.“

ჰიპოთეზა ფაქტი არ არის და ნორმალურია, თუ მონაცემები მას უარყოფს — ესეც რეალური შედეგია. მოერიდე ჰიპოთეზებს, რომლებიც ვერასოდეს „ჩავარდება“, მაგალითად: „ეკრანებმა შეიძლება იმოქმედოს ან არ იმოქმედოს ძილზე“.`,
        ),
      },
      {
        kind: "practice",
        title: l("Start your project", "დაიწყე პროექტი"),
        minutes: 10,
        body: l(
          `Do the activities, then open the Research Laboratory, create a project and write your question, its type, why it matters and your hypothesis in the first two steps.`,
          `შეასრულე აქტივობები, შემდეგ გახსენი კვლევითი ლაბორატორია, შექმენი პროექტი და პირველ ორ ეტაპზე ჩაწერე შენი კითხვა, მისი ტიპი, მნიშვნელობა და ჰიპოთეზა.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Topic → narrow step by step → focused, answerable question → testable hypothesis.`,
          `თემა → ნაბიჯ-ნაბიჯ დავიწროება → ფოკუსირებული, პასუხგაცემადი კითხვა → შემოწმებადი ჰიპოთეზა.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Best question", "საუკეთესო კითხვა"),
        prompt: l("Which is the best research question for a two-week school project?", "რომელია საუკეთესო საკვლევი კითხვა ორკვირიანი სასკოლო პროექტისთვის?"),
        options: [
          l("How far do students in Grades 9–11 of our school travel to school, and how do they travel?", "რა მანძილს გადიან სკოლამდე ჩვენი სკოლის IX–XI კლასების მოსწავლეები და რით მოდიან?"),
          l("Transport", "ტრანსპორტი"),
          l("How can we solve all traffic problems in the world?", "როგორ გადავჭრათ მსოფლიოს ყველა საგზაო პრობლემა?"),
          l("Is walking good?", "სიარული კარგია?"),
        ],
        correct: 0,
        explanation: l("It is focused, specific (who, where, what) and answerable with a short survey.", "ის ფოკუსირებული და კონკრეტულია (ვინ, სად, რა) და მოკლე გამოკითხვით პასუხგაცემადია."),
      },
      {
        type: "mc",
        title: l("Question type", "კითხვის ტიპი"),
        prompt: l("\"Do students who eat breakfast get higher test scores than those who do not?\" — what type of question is this?", "„უფრო მაღალ ქულებს იღებენ თუ არა ის მოსწავლეები, ვინც საუზმობს, ვიდრე ისინი, ვინც არ საუზმობს?“ — რა ტიპის კითხვაა?"),
        options: [l("Comparative", "შედარებითი"), l("Descriptive", "აღწერითი"), l("Evaluative", "შეფასებითი")],
        correct: 0,
      },
      {
        type: "discussion",
        prompt: l("Turn the topic \"school canteen\" into a focused research question and write a hypothesis for it.", "თემა „სკოლის სასადილო“ ფოკუსირებულ საკვლევ კითხვად აქციე და ჰიპოთეზა ჩამოაყალიბე."),
      },
      { type: "exit", prompt: l("Write one question you would like to research this term.", "დაწერე ერთი კითხვა, რომლის კვლევაც ამ სემესტრში გინდა.") },
    ],
    discussion: [l("Why is a question that can be proven wrong more useful than one that cannot?", "რატომ არის კითხვა, რომელიც შეიძლება უარყოფილ იქნეს, უფრო სასარგებლო, ვიდრე ისეთი, რომელიც ვერ იქნება?")],
    assessment: [l("A focused, answerable question with a testable hypothesis in the Research Laboratory.", "ფოკუსირებული, პასუხგაცემადი კითხვა შემოწმებადი ჰიპოთეზით კვლევით ლაბორატორიაში.")],
    homework: [l("Write three versions of your research question, each more focused than the last.", "დაწერე შენი საკვლევი კითხვის სამი ვერსია, თითოეული წინაზე უფრო ფოკუსირებული.")],
    teacherNotes: l(
      "Surveys of students need care: keep them anonymous, ask the school's permission, and avoid sensitive personal topics. The example sleep project in the demo data shows a complete research workflow.",
      "მოსწავლეების გამოკითხვა სიფრთხილეს მოითხოვს: დატოვეთ ანონიმური, აიღეთ სკოლის ნებართვა და მოერიდეთ მგრძნობიარე პირად თემებს. სადემონსტრაციო მონაცემებში ძილის კვლევის მაგალითი სრულ კვლევით პროცესს აჩვენებს.",
    ),
    quiz: {
      title: l("Research questions — check yourself", "საკვლევი კითხვა — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("A hypothesis must always turn out to be true.", "ჰიპოთეზა ყოველთვის უნდა დადასტურდეს."), answer: false },
        { type: "mc", prompt: l("Which is a topic, not a question?", "რომელია თემა და არა კითხვა?"), options: [l("Air pollution", "ჰაერის დაბინძურება"), l("Is the air near our school more polluted in winter than in summer?", "ჩვენი სკოლის მახლობლად ჰაერი ზამთარში უფრო დაბინძურებულია, ვიდრე ზაფხულში?")], correct: 0 },
        { type: "mc", prompt: l("Which type of question is hardest to answer with a simple survey?", "რომელი ტიპის კითხვაზე პასუხის გაცემაა ყველაზე რთული მარტივი გამოკითხვით?"), options: [l("Causal", "მიზეზობრივზე"), l("Descriptive", "აღწერითზე"), l("Comparative", "შედარებითზე")], correct: 0 },
      ],
    },
  },
  {
    group: "evaluating-sources",
    subject: "research",
    grade: 9,
    durationMin: 40,
    difficulty: "standard",
    match: /evaluat\w* sources|reliab|credib|lateral reading|წყაროს შეფასებ|სანდოობ/i,
    title: l("Evaluating Sources", "წყაროების შეფასება"),
    topic: l("Source evaluation", "წყაროს შეფასება"),
    objective: l(
      "Students judge the reliability of sources using authorship, date, evidence, balance and corroboration, and check claims by reading laterally.",
      "მოსწავლეები წყაროს სანდოობას აფასებენ ავტორის, თარიღის, მტკიცებულებების, მიუკერძოებლობისა და სხვა წყაროებით დადასტურების მიხედვით და განცხადებებს „ლატერალური კითხვით“ ამოწმებენ.",
    ),
    objectives: [
      l("Apply five checks to a source.", "წყაროს ხუთი კრიტერიუმით შეამოწმოს."),
      l("Explain lateral reading and use it.", "ახსნას და გამოიყენოს ლატერალური კითხვა."),
      l("Record a source's strengths and limits in a research project.", "კვლევით პროექტში ჩაიწეროს წყაროს ძლიერი მხარეები და შეზღუდვები."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Not all sources are equal", "ყველა წყარო ერთნაირი არ არის"),
        minutes: 5,
        body: l(
          `A peer-reviewed study, a government statistics page, a news article, a blog and an anonymous social-media post can all say something about the same topic. They are not equally reliable — and even a good source can be out of date.`,
          `რეცენზირებულ კვლევას, სახელმწიფო სტატისტიკის გვერდს, საინფორმაციო სტატიას, ბლოგსა და სოციალურ ქსელში ანონიმურ პოსტს შეიძლება ერთსა და იმავე თემაზე რაღაც ჰქონდეთ სათქმელი. ისინი თანაბრად სანდო არ არის — და კარგი წყაროც კი შეიძლება მოძველებული იყოს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Five checks", "ხუთი შემოწმება"),
        minutes: 12,
        body: l(
          `1. Author — who wrote it? What is their expertise? Is it an organisation you can identify?
2. Date — when was it published or updated? Is that recent enough for your topic?
3. Evidence — does it show data, methods or references you could check?
4. Balance — does it present other views, or only sell one position? Who benefits if you believe it?
5. Corroboration — do other independent, reliable sources say the same?

Lateral reading: instead of studying one website for a long time, open new tabs and look up what others say about the site and its author. Professional fact-checkers work this way.`,
          `1. ავტორი — ვინ დაწერა? რა კომპეტენცია აქვს? შეგიძლია ორგანიზაციის იდენტიფიცირება?
2. თარიღი — როდის გამოქვეყნდა ან განახლდა? საკმარისად ახალია შენი თემისთვის?
3. მტკიცებულება — გვიჩვენებს მონაცემებს, მეთოდებს ან წყაროებს, რომელთა გადამოწმებაც შეგიძლია?
4. მიუკერძოებლობა — სხვა შეხედულებებსაც აჩვენებს თუ მხოლოდ ერთ პოზიციას „ყიდის“? ვის სარგებლობს, თუ მას დაიჯერებ?
5. დადასტურება — იგივეს ამბობენ სხვა დამოუკიდებელი, სანდო წყაროები?

ლატერალური კითხვა: ერთი ვებგვერდის ხანგრძლივად შესწავლის ნაცვლად გახსენი ახალი ჩანართები და მოძებნე, რას ამბობენ სხვები ამ საიტსა და მის ავტორზე. პროფესიონალი ფაქტჩეკერები სწორედ ასე მუშაობენ.`,
        ),
      },
      {
        kind: "practice",
        title: l("Use the checklist", "გამოიყენე შემოწმების სია"),
        minutes: 15,
        body: l(
          `Do the activities. Then, in the Research Laboratory, add two sources to your project and fill in the quality checklist for each. The Critical Thinking Laboratory exercise "Evaluating sources" gives more practice with feedback.`,
          `შეასრულე აქტივობები. შემდეგ კვლევით ლაბორატორიაში შენს პროექტს ორი წყარო დაუმატე და თითოეულისთვის ხარისხის შემოწმების სია შეავსე. კრიტიკული აზროვნების ლაბორატორიის სავარჯიშო „წყაროების შეფასება“ დამატებით ვარჯიშს უკუკავშირით გთავაზობს.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 8,
        body: l(
          `Author, date, evidence, balance, corroboration. Read laterally. Write down why you trust — or do not trust — each source.`,
          `ავტორი, თარიღი, მტკიცებულება, მიუკერძოებლობა, დადასტურება. იკითხე ლატერალურად. ჩაიწერე, რატომ ენდობი — ან არ ენდობი — თითოეულ წყაროს.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Most reliable", "ყველაზე სანდო"),
        prompt: l("You need the number of students in Georgian schools. Which source is best?", "გჭირდება საქართველოს სკოლებში მოსწავლეების რაოდენობა. რომელი წყაროა საუკეთესო?"),
        options: [l("Official statistics from Geostat or the Ministry of Education, with the year", "საქსტატის ან განათლების სამინისტროს ოფიციალური სტატისტიკა, წლის მითითებით"), l("A comment under a news video", "კომენტარი საინფორმაციო ვიდეოს ქვეშ"), l("A friend's guess", "მეგობრის ვარაუდი"), l("An advertisement for a private school", "კერძო სკოლის რეკლამა")],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Who benefits?", "ვის აწყობს?"),
        prompt: l("A website selling a vitamin says the vitamin improves memory \"by 80%\". Which check matters most first?", "ვიტამინის გამყიდველი ვებგვერდი ამბობს, რომ ვიტამინი მეხსიერებას „80%-ით“ აუმჯობესებს. რომელი შემოწმებაა პირველ რიგში ყველაზე მნიშვნელოვანი?"),
        options: [l("Balance — the seller benefits if you believe it; look for independent evidence", "მიუკერძოებლობა — გამყიდველს აწყობს, რომ დაიჯერო; მოძებნე დამოუკიდებელი მტკიცებულება"), l("The colour of the website", "ვებგვერდის ფერი"), l("How many pictures it has", "რამდენი სურათია"), l("Nothing — numbers are always true", "არაფერი — რიცხვები ყოველთვის სწორია")],
        correct: 0,
      },
      {
        type: "short",
        title: l("Name the strategy", "დაასახელე სტრატეგია"),
        prompt: l("What is the strategy called where you open new tabs to check what others say about a source?", "რა ჰქვია სტრატეგიას, როცა ახალ ჩანართებს ხსნი, რომ გაარკვიო, რას ამბობენ სხვები წყაროზე?"),
        accepted: { en: ["lateral reading"], ka: ["ლატერალური კითხვა"] },
      },
      { type: "exit", prompt: l("Choose a website you use often. Apply two of the five checks to it.", "აირჩიე ვებგვერდი, რომელსაც ხშირად იყენებ. გამოიყენე მასზე ხუთიდან ორი შემოწმება.") },
    ],
    discussion: [l("Can an expert's source still be wrong? What should you do then?", "შეიძლება ექსპერტის წყაროც ცდებოდეს? რა უნდა გააკეთო მაშინ?")],
    assessment: [l("Two sources in the Research Laboratory with completed quality checks and a short justification.", "კვლევით ლაბორატორიაში ორი წყარო შევსებული ხარისხის შემოწმებითა და მოკლე დასაბუთებით.")],
    homework: [l("Find one reliable and one unreliable source on the same topic. Explain the difference using the five checks.", "იპოვე ერთ თემაზე ერთი სანდო და ერთი არასანდო წყარო. ახსენი განსხვავება ხუთი კრიტერიუმით.")],
    teacherNotes: l(
      "The five checks match the Research Laboratory's source-quality checklist, so students can apply them directly to their projects.",
      "ხუთი შემოწმება კვლევითი ლაბორატორიის წყაროს ხარისხის შემოწმების სიას ემთხვევა, ამიტომ მოსწავლეებს მათი პირდაპირ პროექტებში გამოყენება შეუძლიათ.",
    ),
    quiz: {
      title: l("Evaluating sources — check yourself", "წყაროების შეფასება — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("If many people share a post, it must be true.", "თუ პოსტს ბევრი აზიარებს, ის აუცილებლად მართალია."), answer: false },
        { type: "mc", prompt: l("Which is NOT one of the five checks?", "რომელი არ არის ხუთი კრიტერიუმიდან?"), options: [l("Number of likes", "მოწონებების რაოდენობა"), l("Author", "ავტორი"), l("Date", "თარიღი"), l("Corroboration", "დადასტურება")], correct: 0 },
        { type: "tf", prompt: l("Lateral reading means checking what other sources say about a website.", "ლატერალური კითხვა ნიშნავს იმის შემოწმებას, რას ამბობენ სხვა წყაროები ვებგვერდზე."), answer: true },
      ],
    },
  },
  {
    group: "bibliography",
    subject: "research",
    grade: 10,
    durationMin: 40,
    difficulty: "standard",
    match: /bibliograph|citation|reference|plagiar|ბიბლიოგრაფი|ციტირებ|მითითებ|პლაგიატ/i,
    title: l("Citations and Building a Bibliography", "ციტირება და ბიბლიოგრაფიის შედგენა"),
    topic: l("Citations", "ციტირება"),
    objective: l(
      "Students quote and paraphrase with attribution, avoid plagiarism, and build a consistent bibliography.",
      "მოსწავლეები ციტირებენ და პერიფრაზირებენ წყაროს მითითებით, თავს არიდებენ პლაგიატს და ადგენენ თანმიმდევრულ ბიბლიოგრაფიას.",
    ),
    objectives: [
      l("Explain why we cite and what plagiarism is.", "ახსნას, რატომ ვუთითებთ წყაროს და რა არის პლაგიატი."),
      l("Distinguish quoting from paraphrasing.", "განასხვავოს ციტატა პერიფრაზისგან."),
      l("Write references in one consistent style.", "წყაროები ერთი თანმიმდევრული სტილით ჩაწეროს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Giving credit", "ავტორის პატივისცემა"),
        minutes: 5,
        body: l(
          `When you use someone else's words, ideas or data, you say where they came from. This shows respect for their work, lets readers check your claims, and separates your ideas from theirs. Presenting others' work as your own is plagiarism.`,
          `როცა სხვის სიტყვებს, იდეებს ან მონაცემებს იყენებ, უთითებ, საიდან არის ისინი. ეს ავტორის შრომის პატივისცემაა, მკითხველს შენი მტკიცებების გადამოწმების საშუალებას აძლევს და შენს იდეებს სხვისისგან გამოყოფს. სხვისი ნაშრომის საკუთარად წარმოდგენა პლაგიატია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Quote, paraphrase, reference", "ციტატა, პერიფრაზი, მითითება"),
        minutes: 14,
        body: l(
          `• Quotation — the exact words, in quotation marks, with the source (and page if possible).
• Paraphrase — the idea in your own words and sentence structure, still with the source.
Changing a few words of someone's sentence is neither: it is still plagiarism.

A simple reference style (based on APA):
Author, A. (Year). Title. Publisher or website. Link

Example:
Paruthi, S. et al. (2016). Recommended Amount of Sleep for Pediatric Populations. Journal of Clinical Sleep Medicine. https://doi.org/10.5664/jcsm.5866

Rules: use one style consistently; if something is missing (e.g. the date), write "n.d." rather than guessing; list references alphabetically.`,
          `• ციტატა — ზუსტი სიტყვები, ბრჭყალებში, წყაროს (და შესაძლებლობის შემთხვევაში, გვერდის) მითითებით.
• პერიფრაზი — იდეა შენი სიტყვებითა და წინადადების აგებულებით, ისევ წყაროს მითითებით.
სხვისი წინადადებიდან რამდენიმე სიტყვის შეცვლა არც ერთია და არც მეორე — ესეც პლაგიატია.

წყაროს მითითების მარტივი სტილი (APA-ს საფუძველზე):
ავტორი, ა. (წელი). სათაური. გამომცემელი ან ვებგვერდი. ბმული

მაგალითი:
Paruthi, S. et al. (2016). Recommended Amount of Sleep for Pediatric Populations. Journal of Clinical Sleep Medicine. https://doi.org/10.5664/jcsm.5866

წესები: ერთი სტილი თანმიმდევრულად გამოიყენე; თუ რამე აკლია (მაგ. თარიღი), გამოცნობის ნაცვლად დაწერე „თ. გ.“ (თარიღის გარეშე); წყაროები ანბანური თანმიმდევრობით ჩამოწერე.`,
        ),
      },
      {
        kind: "practice",
        title: l("Build your bibliography", "შეადგინე ბიბლიოგრაფია"),
        minutes: 15,
        body: l(
          `Do the activities. The Research Laboratory builds the bibliography for you from the details you enter — but only from what you enter, so fill in author, year, title and link carefully. Every quotation you save must be linked to a source.`,
          `შეასრულე აქტივობები. კვლევითი ლაბორატორია ბიბლიოგრაფიას შენ მიერ შეყვანილი მონაცემებით ადგენს — მაგრამ მხოლოდ მათით, ამიტომ ავტორი, წელი, სათაური და ბმული ყურადღებით შეავსე. ყოველი შენახული ციტატა წყაროს უნდა უკავშირდებოდეს.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 6,
        body: l(
          `• Quote exactly with quotation marks; paraphrase in your own words; cite both.
• One consistent style; never invent missing details.
• A bibliography lets readers check your work.`,
          `• ციტირება — ზუსტად და ბრჭყალებით; პერიფრაზი — შენი სიტყვებით; ორივე შემთხვევაში წყარო მიუთითე.
• ერთი თანმიმდევრული სტილი; გამოტოვებული დეტალები არასოდეს მოიგონო.
• ბიბლიოგრაფია მკითხველს შენი ნაშრომის გადამოწმების საშუალებას აძლევს.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Is it plagiarism?", "პლაგიატია?"),
        prompt: l("Which is plagiarism?", "რომელია პლაგიატი?"),
        options: [
          l("Copying a paragraph and changing three words, without a reference", "აბზაცის გადაწერა სამი სიტყვის შეცვლით, წყაროს მითითების გარეშე"),
          l("A short quotation in quotation marks with the source", "მოკლე ციტატა ბრჭყალებში, წყაროს მითითებით"),
          l("A paraphrase in your own words with the source", "პერიფრაზი საკუთარი სიტყვებით, წყაროს მითითებით"),
          l("Your own survey results", "შენი საკუთარი გამოკითხვის შედეგები"),
        ],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Missing date", "თარიღი აკლია"),
        prompt: l("A web page shows no publication date. What do you write in the reference?", "ვებგვერდზე გამოქვეყნების თარიღი არ არის. რას დაწერ მითითებაში?"),
        options: [l("n.d. (no date)", "თ. გ. (თარიღის გარეშე)"), l("The current year", "მიმდინარე წელს"), l("A likely year", "სავარაუდო წელს"), l("Leave the source out", "წყაროს საერთოდ არ მივუთითებ")],
        correct: 0,
      },
      {
        type: "discussion",
        prompt: l("Why might copying from an AI tool without saying so be a problem, even if no single author is copied?", "რატომ შეიძლება იყოს პრობლემა ხელოვნური ინტელექტის ინსტრუმენტიდან ტექსტის გადმოწერა ამის აღნიშვნის გარეშე, მაშინაც კი, როცა კონკრეტული ავტორი არ ირღვევა?"),
      },
      { type: "exit", prompt: l("Write the reference for one book you have read, in the style from this lesson.", "ამ გაკვეთილის სტილით დაწერე ერთი წაკითხული წიგნის ბიბლიოგრაფიული მითითება.") },
    ],
    discussion: [l("How can citing sources make your own argument stronger?", "როგორ შეიძლება წყაროების მითითებამ შენი არგუმენტი გააძლიეროს?")],
    assessment: [l("A bibliography of at least three sources in one consistent style.", "სულ მცირე სამი წყაროს ბიბლიოგრაფია ერთი თანმიმდევრული სტილით.")],
    homework: [l("Paraphrase one paragraph from a textbook and add the reference. Ask a classmate to check that the wording is really yours.", "ერთი აბზაცი სახელმძღვანელოდან პერიფრაზირებით გადმოეცი და წყარო მიუთითე. სთხოვე თანაკლასელს, შეამოწმოს, ნამდვილად შენი სიტყვებითაა თუ არა.")],
    teacherNotes: l(
      "The example reference is a real article (DOI 10.5664/jcsm.5866). Schools may prefer another citation style; the principle — consistent, complete, never invented — is what matters.",
      "მაგალითად მოყვანილი მითითება რეალურ სტატიას ეკუთვნის (DOI 10.5664/jcsm.5866). სკოლამ შეიძლება ციტირების სხვა სტილი არჩიოს; მთავარია პრინციპი — თანმიმდევრული, სრული და არასოდეს მოგონილი.",
    ),
    quiz: {
      title: l("Citations — check yourself", "ციტირება — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("A paraphrase does not need a reference because the words are yours.", "პერიფრაზს წყაროს მითითება არ სჭირდება, რადგან სიტყვები შენია."), answer: false },
        { type: "mc", prompt: l("How should the bibliography be ordered in this style?", "ამ სტილში როგორ უნდა დალაგდეს ბიბლიოგრაფია?"), options: [l("Alphabetically by author", "ავტორის მიხედვით ანბანურად"), l("By length", "სიგრძის მიხედვით"), l("Randomly", "შემთხვევით")], correct: 0 },
        { type: "tf", prompt: l("If a detail is missing, you should guess it so the reference looks complete.", "თუ დეტალი აკლია, უნდა გამოიცნო, რომ მითითება სრული ჩანდეს."), answer: false },
      ],
    },
  },
];

export const CRITICAL_THINKING: BiLesson[] = [
  {
    group: "claim-evidence",
    subject: "critical_thinking",
    grade: 8,
    durationMin: 40,
    difficulty: "foundation",
    match: /claim|evidence|reasoning|მტკიცებ|მტკიცებულებ|მსჯელობ/i,
    title: l("Claim vs Evidence", "მტკიცება და მტკიცებულება"),
    topic: l("Claims and evidence", "მტკიცება და მტკიცებულება"),
    objective: l(
      "Students separate claims from evidence, judge whether evidence is relevant and sufficient, and find the reasoning that links them.",
      "მოსწავლეები ერთმანეთისგან გამოყოფენ მტკიცებას და მტკიცებულებას, აფასებენ, რამდენად შესაბამისი და საკმარისია მტკიცებულება, და პოულობენ მსჯელობას, რომელიც მათ აკავშირებს.",
    ),
    objectives: [
      l("Identify the claim, the evidence and the reasoning in a short text.", "მოკლე ტექსტში იპოვოს მტკიცება, მტკიცებულება და მსჯელობა."),
      l("Judge whether evidence is relevant and sufficient.", "შეაფასოს, რამდენად შესაბამისი და საკმარისია მტკიცებულება."),
      l("Spot hidden assumptions.", "ამოიცნოს ფარული დაშვებები."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("\"Everybody knows…\"", "„ყველამ იცის…“"),
        minutes: 5,
        body: l(
          `"Our school should start at 9:00, because students learn better when they sleep more." There is a claim here (start at 9:00), a reason (sleep helps learning) — but no evidence yet. Critical thinking starts by asking: what exactly is claimed, and what supports it?`,
          `„ჩვენი სკოლა 9:00-ზე უნდა იწყებოდეს, რადგან მოსწავლეები უკეთ სწავლობენ, როცა მეტს იძინებენ.“ აქ არის მტკიცება (დაწყება 9:00-ზე), მიზეზი (ძილი სწავლას ეხმარება) — მაგრამ მტკიცებულება ჯერ არ არის. კრიტიკული აზროვნება ამ კითხვით იწყება: რას ამტკიცებენ ზუსტად და რა ამყარებს ამას?`,
        ),
      },
      {
        kind: "explanation",
        title: l("Three parts of an argument", "არგუმენტის სამი ნაწილი"),
        minutes: 12,
        body: l(
          `• Claim — what the speaker wants you to accept.
• Evidence — facts, data, examples or expert findings offered as support.
• Reasoning — why the evidence supports the claim.

Ask two questions about evidence:
• Is it relevant? Does it actually concern the claim?
• Is it sufficient? One story from a friend is weaker than a study of thousands of students.

Hidden assumptions are unstated ideas the argument needs. "We should ban phones in class because phones distract students" assumes that distraction outweighs any benefit of phones in class.`,
          `• მტკიცება — ის, რისი მიღებაც მოსაუბრეს შენგან სურს.
• მტკიცებულება — ფაქტები, მონაცემები, მაგალითები ან ექსპერტთა დასკვნები, რომლებიც მხარდაჭერად მოჰყავთ.
• მსჯელობა — რატომ ამყარებს მტკიცებულება მტკიცებას.

მტკიცებულებაზე ორი კითხვა დასვი:
• შესაბამისია? ნამდვილად ეხება მტკიცებას?
• საკმარისია? მეგობრის ერთი ამბავი ათასობით მოსწავლის კვლევაზე სუსტია.

ფარული დაშვებები გამოუთქმელი იდეებია, რომლებიც არგუმენტს სჭირდება. „ტელეფონები გაკვეთილზე უნდა აიკრძალოს, რადგან ყურადღებას ფანტავს“ — ეს არგუმენტი უშვებს, რომ ყურადღების გაფანტვა გაკვეთილზე ტელეფონის ნებისმიერ სარგებელს აჭარბებს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice in the lab", "ვარჯიში ლაბორატორიაში"),
        minutes: 15,
        body: l(
          `Do the activities. Then open the Critical Thinking Laboratory and complete "Claim analysis: a later school start", where you tag each sentence as claim, evidence, reasoning or assumption and get feedback.`,
          `შეასრულე აქტივობები. შემდეგ გახსენი კრიტიკული აზროვნების ლაბორატორია და შეასრულე „მტკიცების ანალიზი: სკოლის გვიან დაწყება“, სადაც თითოეულ წინადადებას მონიშნავ, როგორც მტკიცებას, მტკიცებულებას, მსჯელობას ან დაშვებას, და მიიღებ უკუკავშირს.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 8,
        body: l(
          `Claim → evidence → reasoning. Check relevance and sufficiency. Look for what is assumed but not said.`,
          `მტკიცება → მტკიცებულება → მსჯელობა. შეამოწმე შესაბამისობა და საკმარისობა. ეძებე ის, რაც ნაგულისხმევია, მაგრამ არ თქმულა.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Find the evidence", "იპოვე მტკიცებულება"),
        prompt: l(
          "\"The school garden should get more funding. Last year it produced 200 kg of vegetables for the canteen, and 40 students joined the garden club.\" Which part is evidence?",
          "„სკოლის ბაღს მეტი დაფინანსება უნდა მიეცეს. შარშან ბაღმა სასადილოსთვის 200 კგ ბოსტნეული მოიყვანა, ბაღის კლუბში კი 40 მოსწავლე გაწევრიანდა.“ რომელი ნაწილია მტკიცებულება?",
        ),
        options: [l("200 kg of vegetables and 40 club members", "200 კგ ბოსტნეული და კლუბის 40 წევრი"), l("The garden should get more funding", "ბაღს მეტი დაფინანსება უნდა მიეცეს"), l("Both parts", "ორივე ნაწილი"), l("Neither", "არცერთი")],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Relevant?", "შესაბამისია?"),
        prompt: l("Claim: \"This phone has the best camera.\" Which evidence is most relevant?", "მტკიცება: „ამ ტელეფონს საუკეთესო კამერა აქვს.“ რომელი მტკიცებულებაა ყველაზე შესაბამისი?"),
        options: [l("Independent tests comparing photos from several phones", "დამოუკიდებელი ტესტები, რომლებიც რამდენიმე ტელეფონის ფოტოებს ადარებს"), l("A famous singer uses it", "მას ცნობილი მომღერალი იყენებს"), l("It is the most expensive", "ის ყველაზე ძვირია"), l("The advert says so", "ასე რეკლამა ამბობს")],
        correct: 0,
      },
      {
        type: "discussion",
        prompt: l("\"Video games make students violent — my cousin plays them and he is always angry.\" Is the evidence sufficient? What would better evidence look like?", "„ვიდეოთამაშები მოსწავლეებს აგრესიულს ხდის — ჩემი ბიძაშვილი თამაშობს და სულ გაბრაზებულია.“ საკმარისია მტკიცებულება? როგორი იქნებოდა უკეთესი მტკიცებულება?"),
      },
      { type: "exit", prompt: l("Write your own claim with one relevant piece of evidence and the reasoning that links them.", "დაწერე შენი მტკიცება ერთი შესაბამისი მტკიცებულებით და მსჯელობით, რომელიც მათ აკავშირებს.") },
    ],
    discussion: [l("Can a true claim be supported by bad evidence? Can good evidence be used for a false claim?", "შეიძლება ჭეშმარიტ მტკიცებას ცუდი მტკიცებულება ამყარებდეს? შეიძლება კარგი მტკიცებულება მცდარი მტკიცებისთვის გამოიყენონ?")],
    assessment: [l("Correct identification of claim, evidence and assumption in two short texts.", "ორ მოკლე ტექსტში მტკიცების, მტკიცებულებისა და დაშვების სწორი იდენტიფიცირება.")],
    homework: [l("Find an opinion article or advert. Write down its main claim, its evidence and one hidden assumption.", "იპოვე მოსაზრების სტატია ან რეკლამა. ჩაწერე მისი მთავარი მტკიცება, მტკიცებულება და ერთი ფარული დაშვება.")],
    teacherNotes: l(
      "The Critical Thinking Laboratory's claim-analysis exercises use the same four roles (claim, evidence, reasoning, assumption) with automatic, explained feedback.",
      "კრიტიკული აზროვნების ლაბორატორიის მტკიცების ანალიზის სავარჯიშოები იმავე ოთხ როლს (მტკიცება, მტკიცებულება, მსჯელობა, დაშვება) იყენებს ავტომატური, ახსნილი უკუკავშირით.",
    ),
    quiz: {
      title: l("Claim and evidence — check yourself", "მტკიცება და მტკიცებულება — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("One personal story is usually sufficient evidence for a general claim.", "ერთი პირადი ამბავი ზოგადი მტკიცებისთვის, როგორც წესი, საკმარისი მტკიცებულებაა."), answer: false },
        { type: "mc", prompt: l("What links evidence to a claim?", "რა აკავშირებს მტკიცებულებას მტკიცებასთან?"), options: [l("Reasoning", "მსჯელობა"), l("A title", "სათაური"), l("Emotion", "ემოცია")], correct: 0 },
        { type: "mc", prompt: l("An unstated idea an argument depends on is…", "გამოუთქმელი იდეა, რომელზეც არგუმენტი დგას, არის…"), options: [l("an assumption", "დაშვება"), l("a quotation", "ციტატა"), l("a conclusion", "დასკვნა")], correct: 0 },
      ],
    },
  },
  {
    group: "logical-fallacies",
    subject: "critical_thinking",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /fallac|ad hominem|straw man|false dilemma|ლოგიკური შეცდომ|აბსურდ|ცალმხრივ/i,
    title: l("Recognising Logical Fallacies", "ლოგიკური შეცდომების ამოცნობა"),
    topic: l("Logical fallacies", "ლოგიკური შეცდომები"),
    objective: l(
      "Students recognise common fallacies in everyday arguments, explain why each is weak, and rewrite the point fairly.",
      "მოსწავლეები ყოველდღიურ არგუმენტებში ამოიცნობენ გავრცელებულ ლოგიკურ შეცდომებს, ხსნიან, რატომ არის თითოეული სუსტი, და იგივე აზრს სამართლიანად ჩამოაყალიბებენ.",
    ),
    objectives: [
      l("Name and explain five common fallacies.", "დაასახელოს და ახსნას ხუთი გავრცელებული ლოგიკური შეცდომა."),
      l("Identify fallacies in short examples from school, media and politics.", "ამოიცნოს ლოგიკური შეცდომები მოკლე მაგალითებში სკოლიდან, მედიიდან და პოლიტიკიდან."),
      l("Rewrite a fallacious argument into a fair one.", "მცდარი არგუმენტი სამართლიანად გადააკეთოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why learn fallacies?", "რატომ ვისწავლოთ ლოგიკური შეცდომები?"),
        minutes: 5,
        body: l(
          `A fallacy is an error in reasoning that can make a weak argument sound convincing. We study fallacies to recognise them — in advertising, online debates and our own thinking — not to use them on other people. Winning an argument unfairly is not the same as being right.`,
          `ლოგიკური შეცდომა მსჯელობის შეცდომაა, რომელსაც სუსტი არგუმენტის დამაჯერებლად წარმოჩენა შეუძლია. ლოგიკურ შეცდომებს იმისთვის ვსწავლობთ, რომ ისინი ამოვიცნოთ — რეკლამაში, ონლაინ დებატებსა და საკუთარ აზროვნებაში — და არა იმისთვის, რომ სხვებზე გამოვიყენოთ. დავის უსამართლოდ მოგება იმას არ ნიშნავს, რომ მართალი ხარ.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Five common fallacies", "ხუთი გავრცელებული ლოგიკური შეცდომა"),
        minutes: 15,
        body: l(
          `• Ad hominem — attacking the person instead of the argument. "Why listen to his idea about recycling? He is always late."
• Straw man — replacing someone's real argument with a weaker, exaggerated version. "You want shorter breaks? So you want us to never rest!"
• False dilemma — presenting only two options when more exist. "Either you join the football team or you don't care about the school."
• Slippery slope — claiming one step will inevitably lead to extreme results without evidence. "If we allow phones at lunch, soon nobody will talk to each other."
• Hasty generalisation — a broad conclusion from too few examples. "Two tourists were rude, so tourists are rude."

For each, ask: what is the real point, and how could it be argued fairly?`,
          `• Ad hominem (პიროვნებაზე თავდასხმა) — არგუმენტის ნაცვლად ადამიანზე თავდასხმა. „რატომ უნდა მოვუსმინოთ მის იდეას გადამუშავებაზე? სულ აგვიანებს.“
• „ჩალის კაცი“ — ადამიანის რეალური არგუმენტის ჩანაცვლება უფრო სუსტი, გაზვიადებული ვერსიით. „შესვენებების შემცირება გინდა? ესე იგი, გინდა, რომ არასოდეს დავისვენოთ!“
• ცრუ დილემა — მხოლოდ ორი ვარიანტის ჩვენება, როცა მეტი არსებობს. „ან საფეხბურთო გუნდში ჩაეწერე, ან სკოლა არ გაინტერესებს.“
• „მოლიპული ფერდობი“ — მტკიცება, რომ ერთი ნაბიჯი მტკიცებულების გარეშე აუცილებლად უკიდურეს შედეგამდე მიგვიყვანს. „თუ სადილზე ტელეფონებს დავუშვებთ, მალე ერთმანეთს აღარავინ დაელაპარაკება.“
• ნაჩქარევი განზოგადება — ფართო დასკვნა ძალიან ცოტა მაგალითზე დაყრდნობით. „ორი ტურისტი უხეში იყო, ესე იგი, ტურისტები უხეშები არიან.“

თითოეულისთვის იკითხე: რა არის რეალური აზრი და როგორ შეიძლება მისი სამართლიანად დასაბუთება?`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice in the lab", "ვარჯიში ლაბორატორიაში"),
        minutes: 15,
        body: l(
          `Do the activities, then open the Critical Thinking Laboratory: "Spot the fallacy: school life" covers ten fallacies with explanations and fair rewrites. Your results show which fallacies you still confuse.`,
          `შეასრულე აქტივობები, შემდეგ გახსენი კრიტიკული აზროვნების ლაბორატორია: „იპოვე შეცდომა: სკოლის ცხოვრება“ ათ ლოგიკურ შეცდომას მოიცავს ახსნებითა და სამართლიანი ვარიანტებით. შედეგები გაჩვენებს, რომელ შეცდომებს ურევ ჯერ კიდევ ერთმანეთში.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 10,
        body: l(
          `Fallacies make weak arguments sound strong. Name the fallacy, explain the flaw, and restate the point fairly — in others' arguments and in your own.`,
          `ლოგიკური შეცდომები სუსტ არგუმენტს ძლიერად აჩვენებს. დაასახელე შეცდომა, ახსენი ნაკლი და აზრი სამართლიანად ჩამოაყალიბე — როგორც სხვის, ისე საკუთარ არგუმენტებში.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Name it", "დაასახელე"),
        prompt: l("\"Either we cancel the school trip or we fail all our exams.\" Which fallacy is this?", "„ან ექსკურსიას გავაუქმებთ, ან ყველა გამოცდას ჩავაბარებთ ცუდად.“ რომელი ლოგიკური შეცდომაა?"),
        options: [l("False dilemma", "ცრუ დილემა"), l("Ad hominem", "Ad hominem"), l("Straw man", "„ჩალის კაცი“"), l("Hasty generalisation", "ნაჩქარევი განზოგადება")],
        correct: 0,
        explanation: l("There are more than two options — for example, planning study time around the trip.", "ორზე მეტი ვარიანტი არსებობს — მაგალითად, მეცადინეობის დროის ექსკურსიასთან შეთანხმებით დაგეგმვა."),
      },
      {
        type: "mc",
        title: l("Name it", "დაასახელე"),
        prompt: l("\"My classmate says we should recycle, but she doesn't even get good grades.\"", "„თანაკლასელი ამბობს, რომ ნარჩენები უნდა გადავამუშაოთ, მაგრამ თვითონ კარგ ნიშნებსაც კი ვერ იღებს.“"),
        options: [l("Ad hominem", "Ad hominem (პიროვნებაზე თავდასხმა)"), l("Slippery slope", "„მოლიპული ფერდობი“"), l("False dilemma", "ცრუ დილემა")],
        correct: 0,
      },
      {
        type: "discussion",
        prompt: l("Rewrite this fairly: \"If we let students choose their seats, soon they will choose their own grades.\"", "ეს არგუმენტი სამართლიანად ჩამოაყალიბე: „თუ მოსწავლეებს ადგილის არჩევის უფლებას მივცემთ, მალე ნიშნებსაც თვითონ აირჩევენ.“"),
      },
      { type: "exit", prompt: l("Describe a fallacy you have seen online this month (without names). Which one was it?", "აღწერე ლოგიკური შეცდომა, რომელიც ამ თვეში ინტერნეტში ნახე (სახელების გარეშე). რომელი იყო?") },
    ],
    discussion: [l("Why do fallacies spread so easily on social media?", "რატომ ვრცელდება ლოგიკური შეცდომები ასე ადვილად სოციალურ ქსელებში?")],
    assessment: [l("Correct identification of fallacies and fair rewrites.", "ლოგიკური შეცდომების სწორი ამოცნობა და არგუმენტების სამართლიანად გადაკეთება.")],
    homework: [l("Complete \"Spot the fallacy: news and public debate\" in the Critical Thinking Laboratory.", "კრიტიკული აზროვნების ლაბორატორიაში შეასრულე „იპოვე შეცდომა: ახალი ამბები და საჯარო დებატი“.")],
    teacherNotes: l(
      "Keep examples away from real classmates, teachers or political figures. The laboratory's fallacy map shows each student which fallacies they confuse most, which is useful for grouping.",
      "მაგალითებში ნუ გამოიყენებთ რეალურ თანაკლასელებს, მასწავლებლებს ან პოლიტიკოსებს. ლაბორატორიის შეცდომების რუკა თითოეულ მოსწავლეს აჩვენებს, რომელ შეცდომებს ურევს ყველაზე ხშირად — ეს ჯგუფების შედგენისას გამოგადგებათ.",
    ),
    quiz: {
      title: l("Logical fallacies — check yourself", "ლოგიკური შეცდომები — შეამოწმე თავი"),
      questions: [
        { type: "mc", prompt: l("Replacing someone's real argument with an exaggerated version is…", "ადამიანის რეალური არგუმენტის გაზვიადებული ვერსიით ჩანაცვლება არის…"), options: [l("a straw man", "„ჩალის კაცი“"), l("a false dilemma", "ცრუ დილემა"), l("ad hominem", "ad hominem")], correct: 0 },
        { type: "tf", prompt: l("We learn fallacies mainly to use them to win arguments.", "ლოგიკურ შეცდომებს ძირითადად იმისთვის ვსწავლობთ, რომ დავაში მოსაგებად გამოვიყენოთ."), answer: false },
        { type: "mc", prompt: l("\"I met two rude drivers from that town, so people there are rude.\"", "„იმ ქალაქიდან ორი უხეში მძღოლი შემხვდა, ესე იგი, იქ ყველა უხეშია.“"), options: [l("Hasty generalisation", "ნაჩქარევი განზოგადება"), l("Slippery slope", "„მოლიპული ფერდობი“"), l("Straw man", "„ჩალის კაცი“")], correct: 0 },
      ],
    },
  },
  {
    group: "online-information",
    subject: "critical_thinking",
    grade: 8,
    durationMin: 40,
    difficulty: "foundation",
    match: /misinformation|fake news|online information|viral|media literacy|მცდარი ინფორმაცი|დეზინფორმაცი|მედიაწიგნიერებ|ყალბი/i,
    title: l("Evaluating Online Information", "ონლაინ ინფორმაციის შეფასება"),
    topic: l("Media literacy", "მედიაწიგნიერება"),
    objective: l(
      "Students pause before sharing, check who is behind a post, look for the original source and use simple verification steps for text and images.",
      "მოსწავლეები გაზიარებამდე ჩერდებიან, ამოწმებენ, ვინ დგას პოსტის უკან, ეძებენ პირველწყაროს და ტექსტისა და სურათების გადასამოწმებლად მარტივ ნაბიჯებს იყენებენ.",
    ),
    objectives: [
      l("Explain the difference between misinformation and disinformation.", "ახსნას განსხვავება მცდარ ინფორმაციასა და დეზინფორმაციას შორის."),
      l("Use a four-step check before sharing.", "გაზიარებამდე ოთხსაფეხურიანი შემოწმება გამოიყენოს."),
      l("Recognise emotional manipulation in headlines.", "სათაურებში ემოციური მანიპულაცია ამოიცნოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Seen it, shared it", "ვნახე, გავაზიარე"),
        minutes: 5,
        body: l(
          `A dramatic photo with the caption "Floods in Batumi today!" spreads in minutes. Later it turns out the photo is from another country, years ago. Nobody meant to lie — but thousands of people were misled.`,
          `დრამატული ფოტო წარწერით „ბათუმში დღეს წყალდიდობაა!“ წუთებში ვრცელდება. მოგვიანებით ირკვევა, რომ ფოტო სხვა ქვეყანაში, წლების წინ არის გადაღებული. არავის უნდოდა მოტყუება — მაგრამ ათასობით ადამიანი შეცდომაში შევიდა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Mistakes and manipulation", "შეცდომა და მანიპულაცია"),
        minutes: 10,
        body: l(
          `• Misinformation — false information shared without the intention to deceive.
• Disinformation — false information created or shared deliberately to deceive.

Warning signs: strong emotion (anger, fear, outrage), "share before it's deleted!", no author or date, a claim no reliable outlet reports, old photos with new captions.`,
          `• მცდარი ინფორმაცია — ყალბი ინფორმაცია, რომელსაც მოტყუების განზრახვის გარეშე ავრცელებენ.
• დეზინფორმაცია — ყალბი ინფორმაცია, რომელსაც განზრახ ქმნიან ან ავრცელებენ მოსატყუებლად.

გამაფრთხილებელი ნიშნები: ძლიერი ემოცია (ბრაზი, შიში, აღშფოთება), „გააზიარე, სანამ წაშლიან!“, ავტორისა და თარიღის არარსებობა, განცხადება, რომელსაც არცერთი სანდო მედია არ აშუქებს, ძველი ფოტოები ახალი წარწერებით.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Four steps before sharing", "ოთხი ნაბიჯი გაზიარებამდე"),
        minutes: 12,
        body: l(
          `1. Stop — notice your emotion. Strong feelings are exactly what manipulative posts aim for.
2. Check the source — who posted it? Is it an identifiable outlet or person with a record?
3. Find the original — search for the claim; for images, use a reverse image search to see where and when the photo first appeared.
4. Look for other coverage — do reliable outlets or official sources report it? Georgian fact-checking organisations also publish checks of viral claims.

If you cannot verify it, do not share it.`,
          `1. გაჩერდი — შეამჩნიე შენი ემოცია. ძლიერი გრძნობები სწორედ ისაა, რისკენაც მანიპულაციური პოსტები მიზნობს.
2. შეამოწმე წყარო — ვინ გამოაქვეყნა? იდენტიფიცირებადი მედიაა ან ადამიანი, რომლის ისტორიაც ცნობილია?
3. იპოვე პირველწყარო — მოძებნე განცხადება; სურათებისთვის გამოიყენე სურათით ძიება (reverse image search), რომ ნახო, სად და როდის გამოჩნდა ფოტო პირველად.
4. მოძებნე სხვა გაშუქება — ავრცელებენ მას სანდო მედია ან ოფიციალური წყაროები? საქართველოში ფაქტების გადამმოწმებელი ორგანიზაციებიც აქვეყნებენ ვირუსული განცხადებების შემოწმებებს.

თუ გადამოწმება ვერ შეძელი, ნუ გააზიარებ.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice in the lab", "ვარჯიში ლაბორატორიაში"),
        minutes: 8,
        body: l(
          `Do the activities, then complete "Misinformation: a viral post" and "Media literacy: a dramatic headline" in the Critical Thinking Laboratory.`,
          `შეასრულე აქტივობები, შემდეგ კრიტიკული აზროვნების ლაბორატორიაში შეასრულე „მცდარი ინფორმაცია: ვირუსული პოსტი“ და „მედიაწიგნიერება: დრამატული სათაური“.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Stop → check the source → find the original → look for other coverage. Unverified means unshared.`,
          `გაჩერდი → შეამოწმე წყარო → იპოვე პირველწყარო → მოძებნე სხვა გაშუქება. გადაუმოწმებელი ინფორმაცია არ ზიარდება.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("First step", "პირველი ნაბიჯი"),
        prompt: l("A post makes you very angry and asks you to share it immediately. What should you do first?", "პოსტი ძალიან გაბრაზებს და დაუყოვნებლივ გაზიარებას გთხოვს. რა უნდა გააკეთო პირველ რიგში?"),
        options: [l("Stop and notice the emotion before checking", "გაჩერდე და შეამჩნიო ემოცია, სანამ შეამოწმებ"), l("Share it quickly so friends know", "სწრაფად გააზიარო, რომ მეგობრებმაც გაიგონ"), l("Comment angrily", "გაბრაზებული კომენტარი დაწერო"), l("Screenshot it", "სქრინშოტი გადაიღო")],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Old photo?", "ძველი ფოტოა?"),
        prompt: l("How can you check whether a photo is really from today's event?", "როგორ შეამოწმებ, ნამდვილად დღევანდელი მოვლენის ფოტოა თუ არა?"),
        options: [l("Reverse image search to find where it first appeared", "სურათით ძიებით გაარკვიო, სად გამოჩნდა პირველად"), l("Count the likes", "მოწონებები დაითვალო"), l("Trust the caption", "წარწერას ენდო"), l("Zoom in", "სურათი გაადიდო")],
        correct: 0,
      },
      {
        type: "short",
        title: l("Deliberate or not?", "განზრახ თუ არა?"),
        prompt: l("What do we call false information spread deliberately to deceive?", "რა ჰქვია ყალბ ინფორმაციას, რომელსაც განზრახ ავრცელებენ მოსატყუებლად?"),
        accepted: { en: ["disinformation"], ka: ["დეზინფორმაცია"] },
      },
      { type: "exit", prompt: l("Write the four steps from memory.", "მეხსიერებით ჩამოწერე ოთხი ნაბიჯი.") },
    ],
    discussion: [l("Why do false stories often spread faster than corrections?", "რატომ ვრცელდება ყალბი ამბები ხშირად უფრო სწრაფად, ვიდრე მათი შესწორებები?")],
    assessment: [l("Students apply the four steps to a real (teacher-chosen) viral post.", "მოსწავლე ოთხ ნაბიჯს რეალურ (მასწავლებლის მიერ შერჩეულ) ვირუსულ პოსტზე იყენებს.")],
    homework: [l("Find one fact-check published by a Georgian fact-checking organisation. What claim did it check, and how?", "იპოვე ქართული ფაქტების გადამმოწმებელი ორგანიზაციის მიერ გამოქვეყნებული ერთი შემოწმება. რა განცხადება შეამოწმეს და როგორ?")],
    teacherNotes: l(
      "Choose example posts carefully and avoid content that targets real individuals or groups. Reverse image search tools change over time; demonstrate one that works in your school's browser.",
      "მაგალითად შერჩეული პოსტები ფრთხილად აარჩიეთ და მოერიდეთ შინაარსს, რომელიც რეალურ ადამიანებს ან ჯგუფებს უმიზნებს. სურათით ძიების ინსტრუმენტები დროთა განმავლობაში იცვლება; აჩვენეთ ის, რომელიც თქვენი სკოლის ბრაუზერში მუშაობს.",
    ),
    quiz: {
      title: l("Online information — check yourself", "ონლაინ ინფორმაცია — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("Misinformation is always spread on purpose.", "მცდარ ინფორმაციას ყოველთვის განზრახ ავრცელებენ."), answer: false },
        { type: "mc", prompt: l("Which is a warning sign?", "რომელია გამაფრთხილებელი ნიშანი?"), options: [l("\"Share before it's deleted!\"", "„გააზიარე, სანამ წაშლიან!“"), l("A named author and date", "ავტორისა და თარიღის მითითება"), l("Links to official data", "ბმულები ოფიციალურ მონაცემებზე")], correct: 0 },
        { type: "tf", prompt: l("If you cannot verify a claim, it is better not to share it.", "თუ განცხადებას ვერ გადაამოწმებ, სჯობს არ გააზიარო."), answer: true },
      ],
    },
  },
];
