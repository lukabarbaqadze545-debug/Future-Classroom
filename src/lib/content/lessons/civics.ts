import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const CIVICS: BiLesson[] = [
  {
    group: "rights-responsibilities",
    subject: "civics",
    grade: 7,
    durationMin: 40,
    difficulty: "foundation",
    match: /rights|responsibilit|children's rights|convention|უფლებ|მოვალეობ|ბავშვის უფლებ/i,
    title: l("Rights and Responsibilities", "უფლებები და პასუხისმგებლობები"),
    topic: l("Rights and responsibilities", "უფლებები და პასუხისმგებლობები"),
    objective: l(
      "Students explain what human rights and children's rights are, connect rights with responsibilities, and resolve school situations where rights conflict.",
      "მოსწავლეები ხსნიან, რა არის ადამიანის უფლებები და ბავშვის უფლებები, უკავშირებენ უფლებებს პასუხისმგებლობებს და განიხილავენ სასკოლო სიტუაციებს, სადაც უფლებები ერთმანეთს უპირისპირდება.",
    ),
    objectives: [
      l("Explain what makes a right a human right.", "ახსნას, რა აქცევს უფლებას ადამიანის უფლებად."),
      l("Name examples from the UN Convention on the Rights of the Child.", "დაასახელოს მაგალითები გაეროს ბავშვის უფლებების კონვენციიდან."),
      l("Link rights with responsibilities in everyday school life.", "დაუკავშიროს უფლებები პასუხისმგებლობებს სკოლის ყოველდღიურ ცხოვრებაში."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Rights at school", "უფლებები სკოლაში"),
        minutes: 5,
        body: l(
          `You have the right to express your opinion. Your classmate has the right to learn without constant interruptions. What happens when these rights meet in the same lesson? Living together means balancing rights — and that is where responsibilities come in.`,
          `შენ უფლება გაქვს, აზრი გამოთქვა. შენს თანაკლასელს უფლება აქვს, ისწავლოს მუდმივი შეწყვეტის გარეშე. რა ხდება, როცა ეს უფლებები ერთ გაკვეთილზე ერთმანეთს ხვდება? ერთად ცხოვრება უფლებების დაბალანსებას ნიშნავს — და აქ ჩნდება პასუხისმგებლობა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Human rights and children's rights", "ადამიანის უფლებები და ბავშვის უფლებები"),
        minutes: 12,
        body: l(
          `Human rights belong to every person because they are human — not because of their origin, religion, opinion or wealth. Examples: the right to life, freedom of expression, freedom from discrimination, the right to education.

The UN Convention on the Rights of the Child (adopted in 1989; Georgia joined it in 1994) lists rights of everyone under 18, for example:
• to be protected from violence;
• to education;
• to be heard in matters that affect them;
• to rest, play and culture.

In Georgia, the Constitution protects fundamental rights, and the Public Defender (Ombudsman) monitors how they are respected, including children's rights.`,
          `ადამიანის უფლებები ყველას ეკუთვნის იმიტომ, რომ ადამიანია — და არა წარმოშობის, რელიგიის, შეხედულებების ან სიმდიდრის გამო. მაგალითები: სიცოცხლის უფლება, გამოხატვის თავისუფლება, დისკრიმინაციისგან დაცვა, განათლების უფლება.

გაეროს ბავშვის უფლებების კონვენცია (მიღებულია 1989 წელს; საქართველო მას 1994 წელს შეუერთდა) ყველა 18 წლამდე პირის უფლებებს ჩამოთვლის, მაგალითად:
• ძალადობისგან დაცვა;
• განათლება;
• აზრის მოსმენა მასთან დაკავშირებულ საკითხებში;
• დასვენება, თამაში და კულტურულ ცხოვრებაში მონაწილეობა.

საქართველოში ძირითად უფლებებს კონსტიტუცია იცავს, მათ დაცვას კი, მათ შორის ბავშვის უფლებებისას, სახალხო დამცველი (ომბუდსმენი) აკვირდება.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Every right has a responsibility", "ყოველ უფლებას პასუხისმგებლობა ახლავს"),
        minutes: 10,
        body: l(
          `• Right to express your opinion → responsibility to respect others' opinions and not to insult.
• Right to learn → responsibility not to stop others from learning.
• Right to safety → responsibility not to hurt or bully anyone, online or offline.

Rights can be limited only in specific ways set by law — for example, freedom of expression does not protect threats or calls to violence.`,
          `• აზრის გამოთქმის უფლება → პასუხისმგებლობა, პატივი სცე სხვის აზრს და არავის შეურაცხყო.
• სწავლის უფლება → პასუხისმგებლობა, ხელი არ შეუშალო სხვის სწავლას.
• უსაფრთხოების უფლება → პასუხისმგებლობა, არავის ატკინო და არავის ჩაგრო — არც ონლაინ, არც ცხოვრებაში.

უფლებები მხოლოდ კანონით განსაზღვრული გზით შეიძლება შეიზღუდოს — მაგალითად, გამოხატვის თავისუფლება არ იცავს მუქარას ან ძალადობისკენ მოწოდებას.`,
        ),
      },
      {
        kind: "practice",
        title: l("Dilemmas", "დილემები"),
        minutes: 8,
        body: l(
          `In small groups, discuss the activities. For each situation, name the rights involved and suggest a fair solution that respects them.`,
          `მცირე ჯგუფებში განიხილეთ აქტივობები. თითოეული სიტუაციისთვის დაასახელეთ, რომელი უფლებებია ჩართული, და შესთავაზეთ სამართლიანი გამოსავალი, რომელიც მათ პატივს სცემს.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Human rights belong to everyone equally.
• Children have specific rights (UN Convention, 1989).
• Rights come with responsibilities, and rights sometimes need to be balanced.`,
          `• ადამიანის უფლებები ყველას თანაბრად ეკუთვნის.
• ბავშვებს განსაკუთრებული უფლებები აქვთ (გაეროს კონვენცია, 1989).
• უფლებებს პასუხისმგებლობა ახლავს და ზოგჯერ მათი დაბალანსებაა საჭირო.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Whose rights?", "ვისი უფლებები?"),
        prompt: l("Who do human rights belong to?", "ვის ეკუთვნის ადამიანის უფლებები?"),
        options: [l("Every person", "ყველა ადამიანს"), l("Only citizens over 18", "მხოლოდ 18 წელს გადაცილებულ მოქალაქეებს"), l("Only people who pay taxes", "მხოლოდ გადასახადის გადამხდელებს"), l("Only people who follow all rules", "მხოლოდ მათ, ვინც ყველა წესს იცავს")],
        correct: 0,
        hints: [
          l("Human rights come from being human.", "ადამიანის უფლებები ადამიანად ყოფნიდან მომდინარეობს."),
          l("Do they depend on age, money or behaviour?", "დამოკიდებულია ისინი ასაკზე, ფულზე ან ქცევაზე?"),
        ],
      },
      {
        type: "exercise",
        title: l("The Convention", "კონვენცია"),
        prompt: l("In which year was the UN Convention on the Rights of the Child adopted?", "რომელ წელს მიიღეს გაეროს ბავშვის უფლებების კონვენცია?"),
        accepted: ["1989"],
        hints: [
          l("It was adopted in the late 1980s.", "ის 1980-იანი წლების ბოლოს მიიღეს."),
          l("Georgia joined five years later, in 1994.", "საქართველო მას ხუთი წლის შემდეგ, 1994 წელს შეუერთდა."),
        ],
      },
      {
        type: "discussion",
        prompt: l(
          "A student posts a joke about a classmate in the class chat. Others laugh; the classmate is hurt. Which rights and responsibilities are involved? What should happen next?",
          "მოსწავლემ კლასის ჩატში თანაკლასელზე ხუმრობა დაწერა. სხვებმა გაიცინეს, თანაკლასელი კი დაწყდა. რომელი უფლებები და პასუხისმგებლობებია აქ ჩართული? რა უნდა მოხდეს შემდეგ?",
        ),
      },
      {
        type: "discussion",
        prompt: l("Your class is choosing a trip destination. Two students were absent. Is it fair to decide without them? How could their right to be heard be respected?", "თქვენი კლასი ექსკურსიის ადგილს ირჩევს. ორი მოსწავლე არ იყო. სამართლიანია მათ გარეშე გადაწყვეტა? როგორ შეიძლება მათი აზრის მოსმენის უფლების დაცვა?"),
      },
      { type: "exit", prompt: l("Name one right you have at school and the responsibility that comes with it.", "დაასახელე ერთი უფლება, რომელიც სკოლაში გაქვს, და მასთან დაკავშირებული პასუხისმგებლობა.") },
    ],
    discussion: [l("Can a school rule limit a right? When is that fair?", "შეუძლია სასკოლო წესს უფლების შეზღუდვა? როდის არის ეს სამართლიანი?")],
    assessment: [l("Students identify rights in a scenario and propose a solution that balances them.", "მოსწავლე სიტუაციაში უფლებებს ამოიცნობს და მათ დამაბალანსებელ გამოსავალს გვთავაზობს.")],
    homework: [l("Read the child-friendly version of the Convention (UNICEF publishes one). Choose three rights and give an example of each from your life.", "წაიკითხე კონვენციის ბავშვებისთვის ადაპტირებული ვერსია (UNICEF აქვეყნებს). აირჩიე სამი უფლება და თითოეულისთვის მოიყვანე მაგალითი შენი ცხოვრებიდან.")],
    teacherNotes: l(
      "Bullying dilemmas can touch real situations in the class; keep examples general and make it clear whom students can talk to at school. The Public Defender's Office publishes materials on children's rights in Georgian.",
      "ჩაგვრასთან დაკავშირებული დილემები შეიძლება კლასის რეალურ სიტუაციებს შეეხოს; მაგალითები ზოგადი დატოვეთ და მოსწავლეებს მკაფიოდ უთხარით, ვის შეუძლიათ სკოლაში მიმართონ. სახალხო დამცველის აპარატი ბავშვის უფლებებზე ქართულენოვან მასალებს აქვეყნებს.",
    ),
    quiz: {
      title: l("Rights and responsibilities — check yourself", "უფლებები და პასუხისმგებლობები — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("Freedom of expression protects threats against other people.", "გამოხატვის თავისუფლება სხვა ადამიანების მიმართ მუქარასაც იცავს."), answer: false },
        { type: "mc", prompt: l("Who monitors respect for human rights in Georgia?", "ვინ აკვირდება საქართველოში ადამიანის უფლებების დაცვას?"), options: [l("The Public Defender (Ombudsman)", "სახალხო დამცველი (ომბუდსმენი)"), l("The school director", "სკოლის დირექტორი"), l("A television channel", "ტელეარხი"), l("Nobody", "არავინ")], correct: 0 },
        { type: "num", prompt: l("Up to what age does the Convention on the Rights of the Child apply?", "რა ასაკამდე ვრცელდება ბავშვის უფლებების კონვენცია?"), answer: 18 },
      ],
    },
  },
  {
    group: "state-institutions",
    subject: "civics",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /separation of powers|parliament|constitution|government|court|ხელისუფლების დანაწილ|პარლამენტ|კონსტიტუცი|მთავრობ|სასამართლო/i,
    title: l("How the State Works: Separation of Powers", "როგორ მუშაობს სახელმწიფო: ხელისუფლების დანაწილება"),
    topic: l("State institutions", "სახელმწიფო ინსტიტუტები"),
    objective: l(
      "Students describe the three branches of power in Georgia, explain why power is separated, and identify how citizens can take part.",
      "მოსწავლეები აღწერენ საქართველოში ხელისუფლების სამ შტოს, ხსნიან, რატომ არის ხელისუფლება დანაწილებული, და ასახელებენ მოქალაქეების მონაწილეობის გზებს.",
    ),
    objectives: [
      l("Name the legislative, executive and judicial branches and their main institutions.", "დაასახელოს საკანონმდებლო, აღმასრულებელი და სასამართლო ხელისუფლება და მათი ძირითადი ინსტიტუტები."),
      l("Explain checks and balances with an example.", "მაგალითით ახსნას შეკავებისა და გაწონასწორების სისტემა."),
      l("Describe ways citizens participate, including local self-government.", "აღწეროს მოქალაქეების მონაწილეობის გზები, მათ შორის ადგილობრივი თვითმმართველობა."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why not give all power to one person?", "რატომ არ მივცეთ მთელი ძალაუფლება ერთ ადამიანს?"),
        minutes: 5,
        body: l(
          `Imagine a school where the same person writes the rules, enforces them and decides every dispute. Even with good intentions, mistakes would go unchecked. Democracies separate power so that institutions can limit and correct each other.`,
          `წარმოიდგინე სკოლა, სადაც ერთი და იგივე ადამიანი წერს წესებს, აღასრულებს მათ და ყველა დავას წყვეტს. კეთილი განზრახვის შემთხვევაშიც კი შეცდომებს არავინ გაასწორებდა. დემოკრატიაში ხელისუფლება დანაწილებულია, რომ ინსტიტუტებმა ერთმანეთი შეზღუდონ და გამოასწორონ.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Three branches in Georgia", "ხელისუფლების სამი შტო საქართველოში"),
        minutes: 14,
        body: l(
          `The Constitution of Georgia (adopted in 1995 and amended several times since) is the highest law.

• Legislative power — the Parliament of Georgia (150 members) passes laws, approves the state budget and oversees the government.
• Executive power — the Government, led by the Prime Minister, runs the country day to day through ministries.
• Judicial power — independent courts decide disputes and whether laws were broken; the Constitutional Court checks whether laws comply with the Constitution; the Supreme Court is the highest court for ordinary cases.

The President is the head of state and represents the country. How the President is elected and which powers each institution has are set by the Constitution — check the current version, because these rules have changed over the years.`,
          `საქართველოს კონსტიტუცია (მიღებულია 1995 წელს, შემდეგ რამდენჯერმე შეიცვალა) უზენაესი კანონია.

• საკანონმდებლო ხელისუფლება — საქართველოს პარლამენტი (150 წევრი) იღებს კანონებს, ამტკიცებს სახელმწიფო ბიუჯეტს და მთავრობას აკონტროლებს.
• აღმასრულებელი ხელისუფლება — მთავრობა, პრემიერ-მინისტრის ხელმძღვანელობით, სამინისტროების მეშვეობით ქვეყანას ყოველდღიურად მართავს.
• სასამართლო ხელისუფლება — დამოუკიდებელი სასამართლოები დავებს წყვეტენ და ადგენენ, დაირღვა თუ არა კანონი; საკონსტიტუციო სასამართლო ამოწმებს, შეესაბამება თუ არა კანონები კონსტიტუციას; უზენაესი სასამართლო საერთო სასამართლოების უმაღლესი ინსტანციაა.

პრეზიდენტი სახელმწიფოს მეთაურია და ქვეყანას წარმოადგენს. როგორ აირჩევა პრეზიდენტი და რა უფლებამოსილებები აქვს თითოეულ ინსტიტუტს, კონსტიტუცია განსაზღვრავს — გადაამოწმე მოქმედი რედაქცია, რადგან ეს წესები წლების განმავლობაში იცვლებოდა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Checks and balances; local self-government", "შეკავება და გაწონასწორება; ადგილობრივი თვითმმართველობა"),
        minutes: 10,
        body: l(
          `Examples of checks and balances:
• Parliament can question ministers and must approve the budget.
• Courts can decide that a government action was unlawful.
• The Constitutional Court can declare a law unconstitutional.

Much of daily life — roads, kindergartens, public transport, parks — is decided locally. Municipalities have an elected council (sakrebulo) and an elected mayor. Citizens can attend council sessions, submit petitions and contact their representatives.`,
          `შეკავებისა და გაწონასწორების მაგალითები:
• პარლამენტს შეუძლია მინისტრების დაკითხვა და ბიუჯეტი სწორედ მან უნდა დაამტკიცოს.
• სასამართლოს შეუძლია დაადგინოს, რომ მთავრობის ქმედება უკანონო იყო.
• საკონსტიტუციო სასამართლოს შეუძლია კანონი არაკონსტიტუციურად ცნოს.

ყოველდღიური ცხოვრების დიდი ნაწილი — გზები, საბავშვო ბაღები, საზოგადოებრივი ტრანსპორტი, პარკები — ადგილობრივად წყდება. მუნიციპალიტეტებს არჩეული საკრებულო და არჩეული მერი ჰყავთ. მოქალაქეებს შეუძლიათ საკრებულოს სხდომებზე დასწრება, პეტიციის წარდგენა და თავიანთ წარმომადგენლებთან დაკავშირება.`,
        ),
      },
      {
        kind: "practice",
        title: l("Who decides?", "ვინ წყვეტს?"),
        minutes: 11,
        body: l(
          `Do the activities. Then, as a class, choose one local issue (a crossing near the school, a park, a bus route) and find out which institution is responsible and how citizens can raise it.`,
          `შეასრულე აქტივობები. შემდეგ კლასთან ერთად აირჩიეთ ერთი ადგილობრივი საკითხი (გადასასვლელი სკოლასთან, პარკი, ავტობუსის მარშრუტი) და გაარკვიეთ, რომელი ინსტიტუტია პასუხისმგებელი და როგორ შეუძლიათ მოქალაქეებს საკითხის დაყენება.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Legislative: Parliament. Executive: Government led by the Prime Minister. Judicial: independent courts, including the Constitutional Court.
• Separation of powers and checks and balances limit abuse of power.
• Local self-government brings decisions closer to citizens.`,
          `• საკანონმდებლო: პარლამენტი. აღმასრულებელი: მთავრობა პრემიერ-მინისტრის ხელმძღვანელობით. სასამართლო: დამოუკიდებელი სასამართლოები, მათ შორის საკონსტიტუციო სასამართლო.
• ხელისუფლების დანაწილება და შეკავება-გაწონასწორება ძალაუფლების ბოროტად გამოყენებას ზღუდავს.
• ადგილობრივი თვითმმართველობა გადაწყვეტილებებს მოქალაქეებთან აახლოებს.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Which branch?", "რომელი შტო?"),
        prompt: l("Which institution passes laws in Georgia?", "რომელი ინსტიტუტი იღებს კანონებს საქართველოში?"),
        options: [l("The Parliament", "პარლამენტი"), l("The Government", "მთავრობა"), l("The Supreme Court", "უზენაესი სასამართლო"), l("The city council", "საკრებულო")],
        correct: 0,
        hints: [
          l("Which branch of power is legislative?", "რომელია საკანონმდებლო ხელისუფლება?"),
          l("Making laws is the job of the elected national body of 150 members.", "კანონების მიღება 150-წევრიანი არჩეული ეროვნული ორგანოს საქმეა."),
        ],
      },
      {
        type: "mc",
        title: l("Check the law", "შეამოწმე კანონი"),
        prompt: l("Which institution decides whether a law complies with the Constitution?", "რომელი ინსტიტუტი წყვეტს, შეესაბამება თუ არა კანონი კონსტიტუციას?"),
        options: [l("The Constitutional Court", "საკონსტიტუციო სასამართლო"), l("The Prime Minister", "პრემიერ-მინისტრი"), l("The Public Defender", "სახალხო დამცველი"), l("The mayor", "მერი")],
        correct: 0,
        hints: [
          l("This is a court, not a politician.", "ეს სასამართლოა და არა პოლიტიკოსი."),
          l("Its name contains the name of the highest law.", "მის სახელში უზენაესი კანონის სახელია."),
        ],
      },
      {
        type: "exercise",
        title: l("Members of Parliament", "პარლამენტის წევრები"),
        prompt: l("How many members does the Parliament of Georgia have?", "რამდენი წევრისგან შედგება საქართველოს პარლამენტი?"),
        accepted: ["150"],
        hints: [
          l("It is a three-digit number.", "ეს სამნიშნა რიცხვია."),
          l("It is between 100 and 200 and ends in 0.", "ის 100-სა და 200-ს შორისაა და 0-ით მთავრდება."),
        ],
      },
      { type: "discussion", prompt: l("Why is it important that courts are independent from the government?", "რატომ არის მნიშვნელოვანი, რომ სასამართლო მთავრობისგან დამოუკიდებელი იყოს?") },
      { type: "exit", prompt: l("Name one way a 15-year-old can take part in decisions in their town.", "დაასახელე ერთი გზა, რომლითაც 15 წლის მოზარდს შეუძლია თავის ქალაქში გადაწყვეტილებების მიღებაში მონაწილეობა.") },
    ],
    discussion: [l("How is your school's student self-government similar to the state's institutions?", "რით ჰგავს შენი სკოლის მოსწავლეთა თვითმმართველობა სახელმწიფო ინსტიტუტებს?")],
    assessment: [l("Students match institutions to branches and give an example of a check.", "მოსწავლე ინსტიტუტებს ხელისუფლების შტოებს უკავშირებს და შეკავების მაგალითს ასახელებს.")],
    homework: [l("Visit your municipality's official website. Find: the name of the council, how to submit a petition, and one current local project.", "ეწვიე შენი მუნიციპალიტეტის ოფიციალურ ვებგვერდს. იპოვე: საკრებულოს დასახელება, პეტიციის წარდგენის წესი და ერთი მიმდინარე ადგილობრივი პროექტი.")],
    teacherNotes: l(
      "Constitutional details (for example how the President is elected) have changed with amendments; check the current text on the Legislative Herald of Georgia (matsne.gov.ge) before teaching specifics. Keep party politics out of the examples.",
      "კონსტიტუციის დეტალები (მაგალითად, პრეზიდენტის არჩევის წესი) ცვლილებებით იცვლებოდა; კონკრეტიკის სწავლებამდე მოქმედი ტექსტი საკანონმდებლო მაცნეზე (matsne.gov.ge) გადაამოწმეთ. მაგალითებში პარტიულ პოლიტიკას ნუ შეეხებით.",
    ),
    quiz: {
      title: l("State institutions — check yourself", "სახელმწიფო ინსტიტუტები — შეამოწმე თავი"),
      questions: [
        { type: "mc", prompt: l("Who leads the Government of Georgia?", "ვინ ხელმძღვანელობს საქართველოს მთავრობას?"), options: [l("The Prime Minister", "პრემიერ-მინისტრი"), l("The Speaker of Parliament", "პარლამენტის თავმჯდომარე"), l("The chief judge", "მთავარი მოსამართლე")], correct: 0 },
        { type: "tf", prompt: l("Separation of powers means one institution makes, enforces and judges the laws.", "ხელისუფლების დანაწილება ნიშნავს, რომ ერთი ინსტიტუტი იღებს, აღასრულებს და განმარტავს კანონებს."), answer: false },
        { type: "num", prompt: l("In which year was the current Constitution of Georgia adopted?", "რომელ წელს მიიღეს საქართველოს მოქმედი კონსტიტუცია?"), answer: 1995 },
      ],
    },
  },
];
