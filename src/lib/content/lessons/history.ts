import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const HISTORY: BiLesson[] = [
  {
    group: "david-builder-didgori",
    subject: "history",
    grade: 8,
    durationMin: 45,
    difficulty: "standard",
    match: /david (iv|the builder)|didgori|დავით აღმაშენებ|დიდგორ/i,
    title: l("David IV the Builder and the Battle of Didgori", "დავით IV აღმაშენებელი და დიდგორის ბრძოლა"),
    topic: l("David the Builder", "დავით აღმაშენებელი"),
    objective: l(
      "Students explain the causes and consequences of the Battle of Didgori (1121) and link it to David IV's reforms.",
      "მოსწავლეები ხსნიან დიდგორის ბრძოლის (1121) მიზეზებსა და შედეგებს და მას დავით IV-ის რეფორმებს უკავშირებენ.",
    ),
    objectives: [
      l("Place David IV's reign (1089–1125) and the Battle of Didgori (1121) on a timeline.", "დავით IV-ის მეფობა (1089–1125) და დიდგორის ბრძოლა (1121) ქრონოლოგიურ ღერძზე განალაგოს."),
      l("Describe three of David IV's reforms and explain why they mattered.", "აღწეროს დავით IV-ის სამი რეფორმა და ახსნას მათი მნიშვნელობა."),
      l("Distinguish short-term and long-term consequences.", "განასხვავოს მოკლევადიანი და გრძელვადიანი შედეგები."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("A divided country", "დაქუცმაცებული ქვეყანა"),
        minutes: 5,
        body: l(
          `When David IV became king in 1089, he was sixteen. Much of Georgia was under Seljuk control, Tbilisi was ruled by an emir, and powerful nobles often acted independently of the king. By the end of his reign (1125) Georgia was one of the strongest states in the region. How did that happen?`,
          `როცა 1089 წელს დავით IV მეფე გახდა, ის თექვსმეტი წლის იყო. საქართველოს დიდი ნაწილი თურქ-სელჩუკების კონტროლქვეშ იყო, თბილისს ამირა მართავდა, ძლიერი დიდებულები კი ხშირად მეფისგან დამოუკიდებლად მოქმედებდნენ. მისი მეფობის ბოლოს (1125) საქართველო რეგიონის ერთ-ერთი უძლიერესი სახელმწიფო იყო. როგორ მოხდა ეს?`,
        ),
      },
      {
        kind: "explanation",
        title: l("Reforms before the battle", "რეფორმები ბრძოლამდე"),
        minutes: 12,
        body: l(
          `• Church reform: the Council of Ruisi-Urbnisi (1103) removed unworthy church leaders and strengthened the link between church and crown.
• Military reform: David created a standing army loyal to the king, including a royal guard (the monaspa) and Kipchak families invited from the North Caucasus to settle in Georgia.
• Learning: in 1106 he founded the Gelati Monastery near Kutaisi, which became a centre of education and scholarship (the Gelati Academy).
• Administration: the Mtsignobartukhutsesi–Chqondideli became the king's chief adviser, uniting church and state leadership.

Each reform reduced the power of rival nobles and gave the king the resources to fight.`,
          `• საეკლესიო რეფორმა: რუის-ურბნისის კრებამ (1103) ღირსებას მოკლებული სასულიერო პირები ჩამოაცილა და ეკლესიისა და სამეფო ხელისუფლების კავშირი გააძლიერა.
• სამხედრო რეფორმა: დავითმა მეფისადმი ერთგული მუდმივი ლაშქარი შექმნა, მათ შორის სამეფო გვარდია (მონასპები), და ჩრდილოეთ კავკასიიდან ყივჩაღთა ოჯახები ჩამოასახლა.
• განათლება: 1106 წელს ქუთაისთან ახლოს გელათის მონასტერი დააარსა, რომელიც განათლებისა და მეცნიერების ცენტრად იქცა (გელათის აკადემია).
• მმართველობა: მწიგნობართუხუცეს-ჭყონდიდელი მეფის უმთავრესი მრჩეველი გახდა და საეკლესიო და სახელმწიფო ხელისუფლება გააერთიანა.

ყოველმა რეფორმამ მეტოქე დიდებულების ძალაუფლება შეამცირა და მეფეს ბრძოლისთვის საჭირო რესურსი მისცა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Didgori, 12 August 1121", "დიდგორი, 1121 წლის 12 აგვისტო"),
        minutes: 10,
        body: l(
          `A large coalition army of Muslim rulers marched against Georgia. On 12 August 1121, at Didgori, west of Tbilisi, David's army won a decisive victory. Georgian and foreign medieval sources both describe it as a major defeat for the coalition; the exact size of the armies is uncertain and historians' estimates differ.

Consequences:
• short term: in 1122 David took Tbilisi, which became the capital of the united kingdom;
• long term: the victory opened a period of political and cultural flourishing often called Georgia's "Golden Age", continued under Queen Tamar.`,
          `მაჰმადიან მმართველთა დიდი გაერთიანებული ლაშქარი საქართველოს წინააღმდეგ დაიძრა. 1121 წლის 12 აგვისტოს, დიდგორთან, თბილისის დასავლეთით, დავითის ლაშქარმა გადამწყვეტი გამარჯვება მოიპოვა. როგორც ქართული, ისე უცხოური შუა საუკუნეების წყაროები ამას კოალიციის დიდ მარცხად აღწერს; ლაშქრების ზუსტი რაოდენობა უცნობია და ისტორიკოსების შეფასებები განსხვავდება.

შედეგები:
• მოკლევადიანი: 1122 წელს დავითმა თბილისი აიღო, რომელიც გაერთიანებული სამეფოს დედაქალაქი გახდა;
• გრძელვადიანი: გამარჯვებამ პოლიტიკური და კულტურული აღმავლობის ხანა დაიწყო, რომელსაც ხშირად საქართველოს „ოქროს ხანას“ უწოდებენ და რომელიც თამარ მეფის დროს გაგრძელდა.`,
        ),
      },
      {
        kind: "practice",
        title: l("Cause and consequence", "მიზეზი და შედეგი"),
        minutes: 13,
        body: l(
          `In groups, make a cause-and-consequence chain on paper: reforms → stronger army and state → Didgori → Tbilisi → Golden Age. For each arrow, write one sentence explaining the link. Then complete the activities.`,
          `ჯგუფებში ქაღალდზე შეადგინეთ მიზეზ-შედეგობრივი ჯაჭვი: რეფორმები → ძლიერი ლაშქარი და სახელმწიფო → დიდგორი → თბილისი → ოქროს ხანა. ყოველ ისარს ერთი წინადადებით ახსნა მიუწერეთ. შემდეგ შეასრულეთ აქტივობები.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• 1089–1125: reign of David IV.
• Reforms: church (1103), army, Gelati (1106), administration.
• 12 August 1121: Didgori; 1122: Tbilisi becomes the capital.
• Historians separate what sources agree on from what remains uncertain (e.g. army sizes).`,
          `• 1089–1125: დავით IV-ის მეფობა.
• რეფორმები: საეკლესიო (1103), სამხედრო, გელათი (1106), მმართველობითი.
• 1121 წლის 12 აგვისტო: დიდგორი; 1122: თბილისი დედაქალაქი ხდება.
• ისტორიკოსები განასხვავებენ იმას, რაზეც წყაროები თანხმდება, და იმას, რაც გაურკვეველი რჩება (მაგ. ლაშქრის რაოდენობა).`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("The date", "თარიღი"),
        prompt: l("In which year was the Battle of Didgori?", "რომელ წელს მოხდა დიდგორის ბრძოლა?"),
        accepted: ["1121"],
        solution: l("1121 (12 August).", "1121 (12 აგვისტო)."),
      },
      {
        type: "mc",
        title: l("Short-term consequence", "მოკლევადიანი შედეგი"),
        prompt: l("Which was a direct consequence of Didgori in the following year?", "რომელი იყო დიდგორის პირდაპირი შედეგი მომდევნო წელს?"),
        options: [l("David took Tbilisi (1122)", "დავითმა თბილისი აიღო (1122)"), l("The Council of Ruisi-Urbnisi", "რუის-ურბნისის კრება"), l("The founding of Gelati", "გელათის დაარსება"), l("David became king", "დავითი მეფე გახდა")],
        correct: 0,
        hints: [l("Check the dates: which event came after 1121?", "შეამოწმე თარიღები: რომელი მოვლენა მოხდა 1121 წლის შემდეგ?")],
      },
      {
        type: "mc",
        title: l("Why reform the army?", "რატომ სამხედრო რეფორმა?"),
        prompt: l("Why was a standing army loyal to the king important for David?", "რატომ იყო დავითისთვის მნიშვნელოვანი მეფისადმი ერთგული მუდმივი ლაშქარი?"),
        options: [
          l("He no longer depended only on the troops of powerful nobles", "ის მხოლოდ ძლიერი დიდებულების ლაშქარზე აღარ იყო დამოკიდებული"),
          l("It made taxes unnecessary", "გადასახადები აღარ იყო საჭირო"),
          l("It replaced the church", "ის ეკლესიას ანაცვლებდა"),
          l("Armies were forbidden before", "მანამდე ლაშქარი აკრძალული იყო"),
        ],
        correct: 0,
      },
      {
        type: "discussion",
        prompt: l("Medieval sources give very different numbers for the armies at Didgori. How should a historian deal with such differences?", "შუა საუკუნეების წყაროები დიდგორთან მებრძოლი ლაშქრების რაოდენობაზე ძალიან განსხვავებულ ციფრებს გვაწვდის. როგორ უნდა მოეკიდოს ისტორიკოსი ასეთ განსხვავებებს?"),
      },
      { type: "exit", prompt: l("Name one reform of David IV and explain in one sentence how it helped at Didgori.", "დაასახელე დავით IV-ის ერთი რეფორმა და ერთ წინადადებაში ახსენი, როგორ დაეხმარა ის დიდგორთან.") },
    ],
    discussion: [
      l("Why is David IV called \"the Builder\" (Aghmashenebeli)?", "რატომ უწოდებენ დავით IV-ს „აღმაშენებელს“?"),
      l("Which is more important for a strong state: military victories or schools and learning?", "რა არის ძლიერი სახელმწიფოსთვის უფრო მნიშვნელოვანი: სამხედრო გამარჯვებები თუ სკოლები და განათლება?"),
    ],
    assessment: [
      l("Accurate timeline with key dates.", "ზუსტი ქრონოლოგიური ღერძი ძირითადი თარიღებით."),
      l("A cause-and-consequence chain with explained links.", "მიზეზ-შედეგობრივი ჯაჭვი ახსნილი კავშირებით."),
    ],
    homework: [l("Research the Gelati Monastery: when was it founded, what was taught there, and what is its status today? Name your sources.", "მოიძიე ინფორმაცია გელათის მონასტერზე: როდის დაარსდა, რას ასწავლიდნენ იქ და რა სტატუსი აქვს დღეს? დაასახელე წყაროები.")],
    teacherNotes: l(
      "Dates follow standard Georgian historiography; check terminology (e.g. transliteration of titles) against your textbook. Avoid presenting army sizes as facts — the gap between sources is a good opportunity for a source-criticism discussion (see the lesson on historical sources).",
      "თარიღები ქართული ისტორიოგრაფიის საყოველთაოდ მიღებულ მონაცემებს მიჰყვება; ტერმინოლოგია სახელმძღვანელოს შეუსაბამეთ. ლაშქრის რაოდენობას ფაქტად ნუ წარმოადგენთ — წყაროებს შორის სხვაობა წყაროთმცოდნეობითი მსჯელობის კარგი შესაძლებლობაა (იხ. გაკვეთილი ისტორიულ წყაროებზე).",
    ),
    quiz: {
      title: l("David the Builder — check yourself", "დავით აღმაშენებელი — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("In which year did David take Tbilisi?", "რომელ წელს აიღო დავითმა თბილისი?"), answer: 1122 },
        { type: "mc", prompt: l("Which monastery did David IV found in 1106?", "რომელი მონასტერი დააარსა დავით IV-მ 1106 წელს?"), options: [l("Gelati", "გელათი"), l("Jvari", "ჯვარი"), l("Vardzia", "ვარძია"), l("Svetitskhoveli", "სვეტიცხოველი")], correct: 0 },
        { type: "tf", prompt: l("Historians agree on the exact number of soldiers at Didgori.", "ისტორიკოსები დიდგორთან მებრძოლთა ზუსტ რაოდენობაზე თანხმდებიან."), answer: false },
        { type: "num", prompt: l("In which year was the Council of Ruisi-Urbnisi held?", "რომელ წელს ჩატარდა რუის-ურბნისის კრება?"), answer: 1103 },
      ],
    },
  },
  {
    group: "democratic-republic-1918",
    subject: "history",
    grade: 10,
    durationMin: 45,
    difficulty: "standard",
    match: /1918|democratic republic|independence|26 may|დამოუკიდებლობ|პირველი რესპუბლიკ|დემოკრატიული რესპუბლიკ/i,
    title: l("The Democratic Republic of Georgia, 1918–1921", "საქართველოს დემოკრატიული რესპუბლიკა (1918–1921)"),
    topic: l("First Republic", "პირველი რესპუბლიკა"),
    objective: l(
      "Students explain why Georgia declared independence in 1918, describe the achievements of the First Republic and the reasons for its end in 1921, and connect it to the restoration of independence in 1991.",
      "მოსწავლეები ხსნიან, რატომ გამოაცხადა საქართველომ დამოუკიდებლობა 1918 წელს, აღწერენ პირველი რესპუბლიკის მიღწევებს და 1921 წელს მისი დასრულების მიზეზებს და მას 1991 წელს დამოუკიდებლობის აღდგენას უკავშირებენ.",
    ),
    objectives: [
      l("Explain the context of 26 May 1918.", "ახსნას 1918 წლის 26 მაისის კონტექსტი."),
      l("Describe democratic achievements of the Republic.", "აღწეროს რესპუბლიკის დემოკრატიული მიღწევები."),
      l("Explain the Soviet invasion of 1921 and the link to 9 April 1991.", "ახსნას 1921 წლის საბჭოთა შემოჭრა და მისი კავშირი 1991 წლის 9 აპრილთან."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why 26 May?", "რატომ 26 მაისი?"),
        minutes: 5,
        body: l(
          `26 May is Georgia's Independence Day. It marks the day in 1918 when the National Council of Georgia adopted the Act of Independence. What was happening in the world that made independence possible — and why did it last less than three years?`,
          `26 მაისი საქართველოს დამოუკიდებლობის დღეა. 1918 წლის ამ დღეს საქართველოს ეროვნულმა საბჭომ დამოუკიდებლობის აქტი მიიღო. რა ხდებოდა მსოფლიოში, რამაც დამოუკიდებლობა შესაძლებელი გახადა — და რატომ გაგრძელდა ის სამ წელზე ნაკლები?`,
        ),
      },
      {
        kind: "explanation",
        title: l("From empire to republic", "იმპერიიდან რესპუბლიკამდე"),
        minutes: 12,
        body: l(
          `• 1917: the Russian Empire collapsed during the First World War and the revolutions.
• The short-lived Transcaucasian federation of Georgia, Armenia and Azerbaijan broke apart in May 1918.
• 26 May 1918: Georgia declared independence as a democratic republic. Noe Zhordania soon became head of government.

Achievements often highlighted by historians:
• elections to the Constituent Assembly (1919) with universal suffrage — women could vote and be elected;
• support for Tbilisi State University, opened in early 1918 as the first university teaching in Georgian;
• a constitution adopted in February 1921.`,
          `• 1917: პირველი მსოფლიო ომისა და რევოლუციების დროს რუსეთის იმპერია დაიშალა.
• საქართველოს, სომხეთისა და აზერბაიჯანის ხანმოკლე ამიერკავკასიის ფედერაცია 1918 წლის მაისში დაიშალა.
• 1918 წლის 26 მაისი: საქართველომ დამოუკიდებლობა გამოაცხადა, როგორც დემოკრატიულმა რესპუბლიკამ. მალე მთავრობის თავმჯდომარე ნოე ჟორდანია გახდა.

მიღწევები, რომლებსაც ისტორიკოსები ხშირად გამოყოფენ:
• დამფუძნებელი კრების არჩევნები (1919) საყოველთაო საარჩევნო უფლებით — ქალებს ხმის მიცემაც შეეძლოთ და არჩევაც;
• 1918 წლის დასაწყისში გახსნილი თბილისის სახელმწიფო უნივერსიტეტის — პირველი ქართულენოვანი უნივერსიტეტის — მხარდაჭერა;
• კონსტიტუცია, რომელიც 1921 წლის თებერვალში მიიღეს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("1921 and 1991", "1921 და 1991"),
        minutes: 10,
        body: l(
          `In February 1921 the Soviet Red Army invaded Georgia; Tbilisi fell on 25 February. The government went into exile, and Georgia became part of the Soviet Union for seventy years.

On 9 April 1991 the Supreme Council of Georgia adopted the Act of Restoration of State Independence, which referred to the Act of 26 May 1918. The First Republic's example of democracy and independence became a foundation for the modern state.`,
          `1921 წლის თებერვალში საბჭოთა წითელი არმია საქართველოში შემოიჭრა; 25 თებერვალს თბილისი დაეცა. მთავრობა ემიგრაციაში წავიდა, საქართველო კი სამოცდაათი წლით საბჭოთა კავშირის ნაწილი გახდა.

1991 წლის 9 აპრილს საქართველოს უზენაესმა საბჭომ სახელმწიფოებრივი დამოუკიდებლობის აღდგენის აქტი მიიღო, რომელიც 1918 წლის 26 მაისის აქტს ეყრდნობოდა. პირველი რესპუბლიკის დემოკრატიისა და დამოუკიდებლობის მაგალითი თანამედროვე სახელმწიფოს ერთ-ერთ საფუძვლად იქცა.`,
        ),
      },
      {
        kind: "practice",
        title: l("Work with a source", "იმუშავე წყაროსთან"),
        minutes: 13,
        body: l(
          `Read the Act of Independence of 26 May 1918 (the text is published by the National Archives of Georgia and in many textbooks). Find: (1) what kind of state it declares, (2) which rights it promises, (3) how it describes relations with other countries. Then do the activities.`,
          `წაიკითხე 1918 წლის 26 მაისის დამოუკიდებლობის აქტი (ტექსტი გამოქვეყნებულია საქართველოს ეროვნული არქივის მიერ და ბევრ სახელმძღვანელოში). იპოვე: (1) რა ტიპის სახელმწიფოს აცხადებს, (2) რა უფლებებს ჰპირდება მოქალაქეებს, (3) როგორ აღწერს ურთიერთობას სხვა ქვეყნებთან. შემდეგ შეასრულე აქტივობები.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• 26 May 1918: independence declared.
• Democratic achievements: universal suffrage, a Georgian-language university, a constitution.
• February 1921: Soviet invasion.
• 9 April 1991: independence restored on the basis of the 1918 Act.`,
          `• 1918 წლის 26 მაისი: დამოუკიდებლობის გამოცხადება.
• დემოკრატიული მიღწევები: საყოველთაო საარჩევნო უფლება, ქართულენოვანი უნივერსიტეტი, კონსტიტუცია.
• 1921 წლის თებერვალი: საბჭოთა შემოჭრა.
• 1991 წლის 9 აპრილი: დამოუკიდებლობის აღდგენა 1918 წლის აქტის საფუძველზე.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Independence Day", "დამოუკიდებლობის დღე"),
        prompt: l("Georgia's Independence Day is 26 May. In which year was independence first declared?", "საქართველოს დამოუკიდებლობის დღე 26 მაისია. რომელ წელს გამოცხადდა დამოუკიდებლობა პირველად?"),
        accepted: ["1918"],
      },
      {
        type: "mc",
        title: l("Voting rights", "საარჩევნო უფლება"),
        prompt: l("What was notable about the 1919 Constituent Assembly elections?", "რით იყო აღსანიშნავი 1919 წლის დამფუძნებელი კრების არჩევნები?"),
        options: [l("Women could vote and be elected", "ქალებს ხმის მიცემაც შეეძლოთ და არჩევაც"), l("Only landowners could vote", "ხმის მიცემა მხოლოდ მიწათმფლობელებს შეეძლოთ"), l("There was only one party", "მხოლოდ ერთი პარტია იყო"), l("There were no elections", "არჩევნები არ ჩატარებულა")],
        correct: 0,
      },
      {
        type: "exercise",
        title: l("Restoration", "აღდგენა"),
        prompt: l("On which date in 1991 was the Act of Restoration of State Independence adopted? (day and month)", "1991 წლის რომელ თარიღს მიიღეს სახელმწიფოებრივი დამოუკიდებლობის აღდგენის აქტი? (დღე და თვე)"),
        accepted: { en: ["9 April", "April 9", "9 april"], ka: ["9 აპრილი", "9 აპრილს", "9 აპრილს."] },
      },
      { type: "discussion", prompt: l("The First Republic lasted less than three years. Was it a failure? Give arguments for and against.", "პირველი რესპუბლიკა სამ წელზე ნაკლებ ხანს არსებობდა. იყო ეს მარცხი? მოიყვანე არგუმენტები მომხრედაც და საწინააღმდეგოდაც.") },
      { type: "exit", prompt: l("Explain in two sentences how 26 May 1918 and 9 April 1991 are connected.", "ორ წინადადებაში ახსენი, როგორ უკავშირდება ერთმანეთს 1918 წლის 26 მაისი და 1991 წლის 9 აპრილი.") },
    ],
    discussion: [
      l("Why might small states find it hard to stay independent between large empires?", "რატომ შეიძლება პატარა სახელმწიფოებს დიდ იმპერიებს შორის დამოუკიდებლობის შენარჩუნება გაუჭირდეთ?"),
      l("Which achievement of the First Republic seems most modern to you?", "პირველი რესპუბლიკის რომელი მიღწევა გეჩვენება ყველაზე თანამედროვედ?"),
    ],
    assessment: [
      l("Correct dates and sequence of events.", "სწორი თარიღები და მოვლენების თანმიმდევრობა."),
      l("A balanced judgement supported by evidence.", "მტკიცებულებებით გამყარებული დაბალანსებული შეფასება."),
    ],
    homework: [l("Interview an older family member about 9 April 1991. What do they remember? Compare their memory with a written source.", "გამოკითხე ოჯახის უფროსი წევრი 1991 წლის 9 აპრილზე. რა ახსოვს? შეადარე მისი მოგონება წერილობით წყაროს.")],
    teacherNotes: l(
      "Oral history (homework) is a primary source with its own limits — discuss memory and perspective before students interview. The Act of Independence text is available from the National Archives of Georgia; use an official publication.",
      "ზეპირი ისტორია (საშინაო დავალება) პირველწყაროა, რომელსაც საკუთარი შეზღუდვები აქვს — ინტერვიუმდე განიხილეთ მეხსიერება და თვალსაზრისი. დამოუკიდებლობის აქტის ტექსტი საქართველოს ეროვნულ არქივშია ხელმისაწვდომი; გამოიყენეთ ოფიციალური გამოცემა.",
    ),
    quiz: {
      title: l("First Republic — check yourself", "პირველი რესპუბლიკა — შეამოწმე თავი"),
      questions: [
        { type: "mc", prompt: l("Who became head of the government of the Democratic Republic?", "ვინ გახდა დემოკრატიული რესპუბლიკის მთავრობის თავმჯდომარე?"), options: [l("Noe Zhordania", "ნოე ჟორდანია"), l("Ilia Chavchavadze", "ილია ჭავჭავაძე"), l("Zviad Gamsakhurdia", "ზვიად გამსახურდია"), l("Ivane Javakhishvili", "ივანე ჯავახიშვილი")], correct: 0 },
        { type: "num", prompt: l("In which year did the Red Army invade Georgia?", "რომელ წელს შემოიჭრა წითელი არმია საქართველოში?"), answer: 1921 },
        { type: "tf", prompt: l("The Constituent Assembly elected in 1919 included women.", "1919 წელს არჩეულ დამფუძნებელ კრებაში ქალებიც იყვნენ."), answer: true },
      ],
    },
  },
  {
    group: "historical-sources",
    subject: "history",
    grade: 7,
    durationMin: 40,
    difficulty: "foundation",
    match: /historical source|primary source|secondary source|source analysis|ისტორიული წყარო|პირველწყარო|წყაროს ანალიზ/i,
    title: l("Working with Historical Sources", "ისტორიულ წყაროებთან მუშაობა"),
    topic: l("Historical sources", "ისტორიული წყაროები"),
    objective: l(
      "Students distinguish primary and secondary sources and ask the key questions — who, when, why, for whom — to judge how useful and reliable a source is.",
      "მოსწავლეები განასხვავებენ პირველად და მეორეულ წყაროებს და ძირითადი კითხვებით — ვინ, როდის, რატომ, ვისთვის — აფასებენ წყაროს სარგებლიანობასა და სანდოობას.",
    ),
    objectives: [
      l("Define primary and secondary sources with examples.", "განმარტოს პირველადი და მეორეული წყაროები მაგალითებით."),
      l("Analyse a source with the questions: who, when, why, for whom?", "გააანალიზოს წყარო კითხვებით: ვინ, როდის, რატომ, ვისთვის?"),
      l("Explain why historians compare several sources.", "ახსნას, რატომ ადარებენ ისტორიკოსები რამდენიმე წყაროს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("How do we know?", "საიდან ვიცით?"),
        minutes: 5,
        body: l(
          `Nobody alive today saw the Battle of Didgori. Everything we know about the past comes from traces people left behind: documents, buildings, coins, photographs, memories. Historians call them sources — and they treat each one like a witness who might be right, mistaken or one-sided.`,
          `დღეს ცოცხალთაგან არავის უნახავს დიდგორის ბრძოლა. ყველაფერი, რაც წარსულზე ვიცით, ადამიანების დატოვებული კვალიდან მოდის: დოკუმენტებიდან, შენობებიდან, მონეტებიდან, ფოტოებიდან, მოგონებებიდან. ისტორიკოსები მათ წყაროებს უწოდებენ — და თითოეულს მოწმესავით ეპყრობიან, რომელიც შეიძლება მართალი იყოს, ცდებოდეს ან მიკერძოებული იყოს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Primary and secondary", "პირველადი და მეორეული"),
        minutes: 12,
        body: l(
          `• Primary source: created at the time, by someone involved or present — a letter, a law, a diary, a photograph, an inscription on a church, an interview with an eyewitness.
• Secondary source: created later, by someone who studied primary sources — a textbook, a historian's book, a documentary.

Neither type is automatically "true". A primary source can be one-sided; a good secondary source can be more balanced because it compares many primary sources.`,
          `• პირველადი წყარო (პირველწყარო): შექმნილია მოვლენის დროს, მონაწილის ან თვითმხილველის მიერ — წერილი, კანონი, დღიური, ფოტო, წარწერა ეკლესიაზე, თვითმხილველთან ინტერვიუ.
• მეორეული წყარო: შექმნილია მოგვიანებით, ვინც პირველწყაროები შეისწავლა — სახელმძღვანელო, ისტორიკოსის წიგნი, დოკუმენტური ფილმი.

არცერთი მათგანი ავტომატურად „ჭეშმარიტი“ არ არის. პირველწყარო შეიძლება ცალმხრივი იყოს; კარგი მეორეული წყარო კი შეიძლება უფრო დაბალანსებული იყოს, რადგან ბევრ პირველწყაროს ადარებს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Four questions for every source", "ოთხი კითხვა ყველა წყაროსთვის"),
        minutes: 10,
        body: l(
          `1. Who made it? What did they know — were they there?
2. When? At the time, or many years later?
3. Why? To inform, to persuade, to praise a ruler, to remember?
4. For whom? A private diary is written differently from an official announcement.

Then compare: do other sources agree? Where they disagree, the historian says so instead of choosing the most exciting version.`,
          `1. ვინ შექმნა? რა იცოდა — იქ იყო?
2. როდის? მოვლენის დროს თუ მრავალი წლის შემდეგ?
3. რატომ? ინფორმირებისთვის, დასარწმუნებლად, მმართველის სადიდებლად, მოსაგონებლად?
4. ვისთვის? პირადი დღიური ოფიციალური განცხადებისგან განსხვავებულად იწერება.

შემდეგ შეადარე: სხვა წყაროები ეთანხმება? სადაც ისინი ერთმანეთს არ ემთხვევა, ისტორიკოსი ამას პირდაპირ ამბობს და ყველაზე შთამბეჭდავ ვერსიას არ ირჩევს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 8,
        body: l(
          `Do the activities. The Research Laboratory uses the same questions for any source — history, science or news.`,
          `შეასრულე აქტივობები. კვლევითი ლაბორატორია იმავე კითხვებს ნებისმიერი წყაროსთვის იყენებს — ისტორიის, მეცნიერებისა თუ ახალი ამბებისთვის.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Primary = from the time; secondary = later study.
• Ask: who, when, why, for whom?
• Compare sources and say what remains uncertain.`,
          `• პირველადი = მოვლენის დროინდელი; მეორეული = მოგვიანებით შესწავლილი.
• იკითხე: ვინ, როდის, რატომ, ვისთვის?
• შეადარე წყაროები და თქვი, რა რჩება გაურკვეველი.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Primary or secondary?", "პირველადი თუ მეორეული?"),
        prompt: l("Which is a primary source about life in Tbilisi in 1920?", "რომელია პირველწყარო 1920 წლის თბილისის ცხოვრების შესახებ?"),
        options: [l("A newspaper printed in Tbilisi in 1920", "1920 წელს თბილისში დაბეჭდილი გაზეთი"), l("A 2019 history textbook", "2019 წლის ისტორიის სახელმძღვანელო"), l("A documentary made in 2005", "2005 წელს გადაღებული დოკუმენტური ფილმი"), l("An encyclopedia article", "ენციკლოპედიის სტატია")],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Purpose", "მიზანი"),
        prompt: l("A royal chronicle praises the king in every chapter. What should a historian keep in mind?", "სამეფო მატიანე მეფეს ყოველ თავში აქებს. რა უნდა გაითვალისწინოს ისტორიკოსმა?"),
        options: [
          l("It may exaggerate the king's successes, so compare it with other sources", "ის შეიძლება მეფის წარმატებებს აზვიადებდეს, ამიტომ სხვა წყაროებს უნდა შეადაროს"),
          l("It must be completely false", "ის აუცილებლად სრულიად მცდარია"),
          l("It is always completely reliable", "ის ყოველთვის სრულიად სანდოა"),
          l("Chronicles cannot be used at all", "მატიანეების გამოყენება საერთოდ არ შეიძლება"),
        ],
        correct: 0,
      },
      {
        type: "discussion",
        prompt: l("Choose an old family photograph. Answer the four questions about it. What can it tell a historian — and what can it not?", "აირჩიე ოჯახის ძველი ფოტო. უპასუხე მასზე ოთხ კითხვას. რას ეტყვის ის ისტორიკოსს და რას — ვერა?"),
      },
      { type: "exit", prompt: l("Give one example each of a primary and a secondary source about your own school.", "მოიყვანე თითო მაგალითი პირველადი და მეორეული წყაროსი შენი სკოლის შესახებ.") },
    ],
    discussion: [l("Is a social-media post from today a primary source for future historians? What problems might it bring?", "დღევანდელი სოციალური ქსელის პოსტი მომავალი ისტორიკოსებისთვის პირველწყარო იქნება? რა პრობლემები შეიძლება მოჰყვეს ამას?")],
    assessment: [l("Students classify sources correctly and apply the four questions.", "მოსწავლე წყაროებს სწორად აჯგუფებს და ოთხ კითხვას იყენებს.")],
    homework: [l("Find two different descriptions of the same historical event (e.g. in two textbooks or websites). Where do they differ?", "იპოვე ერთი და იმავე ისტორიული მოვლენის ორი განსხვავებული აღწერა (მაგ. ორ სახელმძღვანელოში ან ვებგვერდზე). რით განსხვავდება ისინი?")],
    teacherNotes: l(
      "The Critical Thinking Laboratory exercise \"Evaluating sources\" and the Research Laboratory's source quality checklist reinforce the same skills outside history.",
      "კრიტიკული აზროვნების ლაბორატორიის სავარჯიშო „წყაროების შეფასება“ და კვლევითი ლაბორატორიის წყაროს ხარისხის შემოწმების სია იმავე უნარებს ისტორიის მიღმაც ავითარებს.",
    ),
    quiz: {
      title: l("Historical sources — check yourself", "ისტორიული წყაროები — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("A primary source is always true.", "პირველწყარო ყოველთვის ჭეშმარიტია."), answer: false },
        { type: "mc", prompt: l("A historian's book written in 2010 about the 12th century is…", "ისტორიკოსის 2010 წელს დაწერილი წიგნი XII საუკუნის შესახებ არის…"), options: [l("a secondary source", "მეორეული წყარო"), l("a primary source", "პირველწყარო"), l("not a source", "წყარო არ არის")], correct: 0 },
        { type: "mc", prompt: l("Which question helps you find bias in a source?", "რომელი კითხვა გეხმარება წყაროში მიკერძოების პოვნაში?"), options: [l("Why was it made?", "რატომ შეიქმნა?"), l("How many pages does it have?", "რამდენი გვერდია?"), l("What colour is it?", "რა ფერისაა?")], correct: 0 },
      ],
    },
  },
];
