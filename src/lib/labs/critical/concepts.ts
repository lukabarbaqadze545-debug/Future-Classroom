import { l, type L } from "../localized";
import type { BiasId, CtTopic, FallacyId } from "./types";

/*
 * Concept cards. Fallacies and biases are taught so students can reason
 * better and discuss fairly — each card ends with a constructive response,
 * never with advice on how to use the trick on someone else.
 */

export interface ConceptCard {
  topic: CtTopic;
  title: L;
  summary: L;
  example: L;
  ask: L;
}

export const CONCEPTS: ConceptCard[] = [
  {
    topic: "arguments",
    title: l("Arguments", "არგუმენტები"),
    summary: l(
      "An argument is a claim supported by reasons. It is not a quarrel: its purpose is to show why something is likely to be true or worth doing.",
      "არგუმენტი არის მტკიცება, რომელსაც მიზეზები ამყარებს. ეს არ არის კამათი ან ჩხუბი: მისი მიზანია აჩვენოს, რატომ არის რაღაც სავარაუდოდ მართალი ან ღირებული.",
    ),
    example: l(
      "“The library should open at 8:00, because many students arrive early and have nowhere quiet to study.”",
      "„ბიბლიოთეკა 8:00-ზე უნდა იხსნებოდეს, რადგან ბევრი მოსწავლე ადრე მოდის და სამეცადინოდ წყნარი ადგილი არ აქვს.“",
    ),
    ask: l("What exactly is being claimed, and which reasons are given for it?", "კონკრეტულად რას ამტკიცებს ავტორი და რა მიზეზებს ასახელებს?"),
  },
  {
    topic: "claims",
    title: l("Claims", "მტკიცებები"),
    summary: l(
      "A claim is a statement that can be true or false. Some claims are factual (they can be checked), others are value judgements (they need reasons, not only facts).",
      "მტკიცება არის დებულება, რომელიც შეიძლება იყოს მართალი ან მცდარი. ზოგი მტკიცება ფაქტობრივია (შეიძლება გადამოწმდეს), ზოგი კი შეფასებითია (მას მიზეზები სჭირდება და არა მხოლოდ ფაქტები).",
    ),
    example: l(
      "Factual: “Tbilisi is the capital of Georgia.” Value judgement: “Tbilisi is the most beautiful city in the region.”",
      "ფაქტობრივი: „თბილისი საქართველოს დედაქალაქია.“ შეფასებითი: „თბილისი რეგიონის ყველაზე ლამაზი ქალაქია.“",
    ),
    ask: l("Could this statement be checked? If not, what reasons would support it?", "შეიძლება ამ დებულების გადამოწმება? თუ არა, რა მიზეზები დაუჭერდა მხარს?"),
  },
  {
    topic: "evidence",
    title: l("Evidence", "მტკიცებულებები"),
    summary: l(
      "Evidence is information that makes a claim more or less likely: measurements, statistics, studies, documents, observations. Strong evidence is relevant, reliable, recent enough and confirmed by other sources.",
      "მტკიცებულება არის ინფორმაცია, რომელიც მტკიცებას უფრო ან ნაკლებად სავარაუდოს ხდის: გაზომვები, სტატისტიკა, კვლევები, დოკუმენტები, დაკვირვებები. ძლიერი მტკიცებულება რელევანტურია, სანდოა, საკმარისად ახალია და სხვა წყაროებითაც დასტურდება.",
    ),
    example: l(
      "A survey of 400 students is stronger evidence about the school than one friend’s opinion.",
      "400 მოსწავლის გამოკითხვა სკოლის შესახებ უფრო ძლიერი მტკიცებულებაა, ვიდრე ერთი მეგობრის აზრი.",
    ),
    ask: l("Where does this evidence come from, and would another source confirm it?", "საიდან მოდის ეს მტკიცებულება და დაადასტურებდა მას სხვა წყარო?"),
  },
  {
    topic: "assumptions",
    title: l("Assumptions", "დაშვებები"),
    summary: l(
      "An assumption is an unstated idea the argument needs in order to work. Finding hidden assumptions is often the fastest way to test an argument.",
      "დაშვება არის გამოუთქმელი აზრი, რომლის გარეშეც არგუმენტი არ მუშაობს. დამალული დაშვებების პოვნა ხშირად არგუმენტის შემოწმების ყველაზე სწრაფი გზაა.",
    ),
    example: l(
      "“Sales of the new phone are high, so it must be the best phone.” Hidden assumption: popularity equals quality.",
      "„ახალი ტელეფონი ბევრს იყიდება, ესე იგი საუკეთესოა.“ დამალული დაშვება: პოპულარობა ხარისხის ტოლფასია.",
    ),
    ask: l("What must be true for this conclusion to follow?", "რა უნდა იყოს მართალი, რომ ეს დასკვნა გამომდინარეობდეს?"),
  },
  {
    topic: "reasoning",
    title: l("Reasoning", "მსჯელობა"),
    summary: l(
      "Deductive reasoning gives a certain conclusion if the premises are true. Inductive reasoning generalises from examples and gives a probable conclusion — so the number and variety of examples matter.",
      "დედუქციური მსჯელობა გარკვეულ დასკვნას იძლევა, თუ წანამძღვრები მართალია. ინდუქციური მსჯელობა მაგალითებიდან აზოგადებს და სავარაუდო დასკვნას იძლევა — ამიტომ მნიშვნელოვანია მაგალითების რაოდენობა და მრავალფეროვნება.",
    ),
    example: l(
      "Deductive: all metals conduct electricity; copper is a metal; so copper conducts. Inductive: the last 20 buses were late, so the next one will probably be late.",
      "დედუქციური: ყველა ლითონი ატარებს დენს; სპილენძი ლითონია; მაშასადამე სპილენძი ატარებს დენს. ინდუქციური: ბოლო 20 ავტობუსი დაიგვიანა, ალბათ შემდეგიც დაიგვიანებს.",
    ),
    ask: l("Does the conclusion follow for certain, or only probably?", "დასკვნა აუცილებლად გამომდინარეობს თუ მხოლოდ სავარაუდოდ?"),
  },
  {
    topic: "fallacies",
    title: l("Logical fallacies", "ლოგიკური შეცდომები"),
    summary: l(
      "A fallacy is a common error in reasoning that makes an argument look stronger than it is. Recognising fallacies helps you think clearly and discuss fairly — including noticing them in your own arguments.",
      "ლოგიკური შეცდომა არის მსჯელობის გავრცელებული ხარვეზი, რომლის გამოც არგუმენტი რეალურზე ძლიერად გამოიყურება. მათი ამოცნობა გეხმარება ნათლად იაზროვნო და სამართლიანად იმსჯელო — მათ შორის შეამჩნიო ისინი საკუთარ არგუმენტებშიც.",
    ),
    example: l("“You can’t trust her idea about recycling — she’s only fifteen.” (attacks the person, not the idea)", "„მის იდეას გადამუშავებაზე ვერ ენდობი — სულ თხუთმეტი წლისაა.“ (თავს ესხმის ადამიანს და არა იდეას)"),
    ask: l("Is the reason actually connected to the conclusion?", "მართლა უკავშირდება მიზეზი დასკვნას?"),
  },
  {
    topic: "biases",
    title: l("Cognitive biases", "კოგნიტიური მიკერძოებები"),
    summary: l(
      "Biases are shortcuts in how everyone’s mind works. They are not a sign of stupidity — they affect experts too. Knowing them helps you slow down when it matters.",
      "მიკერძოებები აზროვნების მალსახმობებია, რომლებიც ყველა ადამიანს ახასიათებს. ეს სისულელის ნიშანი არ არის — ექსპერტებზეც მოქმედებს. მათი ცოდნა გეხმარება, შეჩერდე და დაფიქრდე, როცა ეს მნიშვნელოვანია.",
    ),
    example: l("Confirmation bias: noticing only the news that agrees with what you already think.", "დადასტურების მიკერძოება: მხოლოდ იმ ამბების შემჩნევა, რომლებიც უკვე არსებულ აზრს გიდასტურებს."),
    ask: l("Would I accept this so easily if it said the opposite?", "ასე მარტივად დავიჯერებდი, საპირისპიროს რომ ამბობდეს?"),
  },
  {
    topic: "media_literacy",
    title: l("Media literacy", "მედიაწიგნიერება"),
    summary: l(
      "Every media text is made by someone, for a purpose, for an audience. Look at who made it, what they want, what words and images they chose, and what is left out.",
      "ყოველი მედიატექსტი ვიღაცამ შექმნა, რაღაც მიზნით და რაღაც აუდიტორიისთვის. დააკვირდი, ვინ შექმნა, რა სურს, რა სიტყვები და სურათები შეარჩია და რა დარჩა მიღმა.",
    ),
    example: l("“Shocking!” and “disaster” in a headline are chosen to create emotion before you read the facts.", "სათაურში „შოკი!“ და „კატასტროფა“ იმისთვისაა შერჩეული, რომ ემოცია ფაქტების წაკითხვამდე გაგიჩინოს."),
    ask: l("Who made this, why, and how would it look if someone else told the story?", "ვინ შექმნა, რატომ, და როგორ გამოიყურებოდა, სხვას რომ მოეყოლა?"),
  },
  {
    topic: "misinformation",
    title: l("Misinformation", "მცდარი ინფორმაცია"),
    summary: l(
      "Misinformation is false or misleading information, shared by mistake or on purpose (disinformation). Before sharing, check the original source, the date and whether reliable outlets report the same.",
      "მცდარი ინფორმაცია არის ყალბი ან შეცდომაში შემყვანი ცნობა, რომელიც შეცდომით ან განზრახ (დეზინფორმაცია) ვრცელდება. გაზიარებამდე გადაამოწმე პირველწყარო, თარიღი და ავრცელებენ თუ არა იგივეს სანდო წყაროები.",
    ),
    example: l("A real photo from 2015 shared as if it showed yesterday’s flood.", "2015 წლის ნამდვილი ფოტო, რომელიც ისე ვრცელდება, თითქოს გუშინდელ წყალდიდობას ასახავს."),
    ask: l("Can I find the original, and is it from when and where it claims?", "შემიძლია ვიპოვო ორიგინალი და მართლა იმ დროს და იმ ადგილას არის გადაღებული?"),
  },
  {
    topic: "source_evaluation",
    title: l("Evaluating sources", "წყაროების შეფასება"),
    summary: l(
      "Ask: is it a primary source (original data, a document, an eyewitness) or a secondary one (a report about it)? Who is the author or organisation? When was it published? What evidence does it give? Could it be biased? Do other independent sources agree?",
      "იკითხე: ეს პირველადი წყაროა (ორიგინალური მონაცემები, დოკუმენტი, თვითმხილველი) თუ მეორადი (მასზე დაწერილი ანგარიში)? ვინ არის ავტორი ან ორგანიზაცია? როდის გამოქვეყნდა? რა მტკიცებულებას გვთავაზობს? შეიძლება იყოს მიკერძოებული? ეთანხმება მას სხვა დამოუკიდებელი წყაროები?",
    ),
    example: l("A company’s own study of its product is useful, but needs independent confirmation.", "კომპანიის მიერ საკუთარ პროდუქტზე ჩატარებული კვლევა სასარგებლოა, მაგრამ დამოუკიდებელ დადასტურებას საჭიროებს."),
    ask: l("Who benefits if I believe this, and who else says the same?", "ვის აწყობს, რომ ეს დავიჯერო, და კიდევ ვინ ამბობს იგივეს?"),
  },
  {
    topic: "debate",
    title: l("Debate", "დებატი"),
    summary: l(
      "In a good debate you argue a position with reasons and evidence, listen carefully, answer the strongest version of the other side and stay respectful. Arguing the side you disagree with is a powerful way to understand an issue.",
      "კარგ დებატში პოზიციას მიზეზებითა და მტკიცებულებებით იცავ, ყურადღებით უსმენ, პასუხობ მოწინააღმდეგე მხარის ყველაზე ძლიერ არგუმენტს და პატივისცემას ინარჩუნებ. იმ მხარის დაცვა, რომელსაც არ ეთანხმები, საკითხის გაგების ძლიერი გზაა.",
    ),
    example: l("“My opponent is right that phones distract; my point is that a clear rule works better than a total ban.”", "„ჩემი ოპონენტი მართალია, რომ ტელეფონი ყურადღებას ფანტავს; ჩემი აზრით, მკაფიო წესი სრულ აკრძალვაზე უკეთ მუშაობს.“"),
    ask: l("What is the strongest point of the other side, stated fairly?", "რა არის მეორე მხარის ყველაზე ძლიერი არგუმენტი, სამართლიანად ჩამოყალიბებული?"),
  },
  {
    topic: "decision_making",
    title: l("Decision making", "გადაწყვეტილების მიღება"),
    summary: l(
      "Good decisions compare several options against clear criteria, weigh what matters most and check how sensitive the result is to your assumptions.",
      "კარგი გადაწყვეტილება რამდენიმე ვარიანტს მკაფიო კრიტერიუმებით ადარებს, წონის იმას, რაც ყველაზე მნიშვნელოვანია, და ამოწმებს, რამდენად არის შედეგი დამოკიდებული დაშვებებზე.",
    ),
    example: l("Choosing a class trip by cost, learning value, travel time and safety — not only by what is most exciting.", "კლასის ექსკურსიის არჩევა ფასის, სასწავლო ღირებულების, მგზავრობის დროისა და უსაფრთხოების მიხედვით — და არა მხოლოდ იმით, რაც ყველაზე საინტერესოა."),
    ask: l("Which criteria matter most, and would the choice change if I weighed them differently?", "რომელი კრიტერიუმია ყველაზე მნიშვნელოვანი და შეიცვლებოდა არჩევანი, სხვაგვარად რომ შემეფასებინა?"),
  },
  {
    topic: "humility",
    title: l("Intellectual humility", "ინტელექტუალური თავმდაბლობა"),
    summary: l(
      "Intellectual humility means holding beliefs with the confidence the evidence deserves, being open to being wrong, and changing your mind for good reasons — not for pressure.",
      "ინტელექტუალური თავმდაბლობა ნიშნავს, რწმენა იმ დონის თავდაჯერებით გქონდეს, რასაც მტკიცებულებები იმსახურებს, მზად იყო შეცდომის აღიარებისთვის და აზრი კარგი მიზეზების გამო შეიცვალო — და არა ზეწოლის გამო.",
    ),
    example: l("“I was fairly sure, but this new data changes my view — let me look again.”", "„საკმაოდ დარწმუნებული ვიყავი, მაგრამ ეს ახალი მონაცემები ჩემს აზრს ცვლის — თავიდან დავაკვირდები.“"),
    ask: l("What evidence would change my mind?", "რა მტკიცებულება შეცვლიდა ჩემს აზრს?"),
  },
];

export interface FallacyCard {
  id: FallacyId;
  name: L;
  definition: L;
  example: L;
  respond: L;
}

export const FALLACY_CARDS: FallacyCard[] = [
  {
    id: "ad_hominem",
    name: l("Ad hominem (attacking the person)", "Ad hominem (პიროვნებაზე თავდასხმა)"),
    definition: l("Rejecting an argument because of who says it, instead of what is said.", "არგუმენტის უარყოფა იმის გამო, ვინ ამბობს, და არა იმის გამო, რას ამბობს."),
    example: l("“Why listen to his ideas on the budget? He failed maths last year.”", "„რატომ უნდა მოვუსმინოთ მის აზრს ბიუჯეტზე? შარშან მათემატიკაში ჩაიჭრა.“"),
    respond: l("Bring the discussion back to the reasons: which part of the argument is wrong, and why?", "დაუბრუნე მსჯელობა მიზეზებს: არგუმენტის რომელი ნაწილია მცდარი და რატომ?"),
  },
  {
    id: "straw_man",
    name: l("Straw man", "ჩალის კაცი"),
    definition: l("Replacing someone’s real position with a weaker or more extreme version and attacking that instead.", "ვიღაცის რეალური პოზიციის ჩანაცვლება უფრო სუსტი ან უკიდურესი ვერსიით და მასზე თავდასხმა."),
    example: l("A: “We should reduce homework on weekends.” B: “So you want students to never study at all?”", "ა: „შაბათ-კვირას საშინაო დავალება უნდა შევამციროთ.“ ბ: „ესე იგი გინდა, მოსწავლეებმა საერთოდ აღარ ისწავლონ?“"),
    respond: l("Restate the other person’s view in words they would agree with before you answer it.", "პასუხამდე ოპონენტის აზრი ისე გადმოეცი, რომ თავადაც დაგეთანხმოს."),
  },
  {
    id: "false_dilemma",
    name: l("False dilemma", "ცრუ დილემა"),
    definition: l("Presenting only two options when more exist.", "მხოლოდ ორი ვარიანტის წარმოდგენა, როცა მეტი არსებობს."),
    example: l("“Either we ban phones completely, or students will never learn anything.”", "„ან ტელეფონებს სრულად ავკრძალავთ, ან მოსწავლეები ვერაფერს ისწავლიან.“"),
    respond: l("Ask what other options exist between the two extremes.", "იკითხე, რა ვარიანტები არსებობს ამ ორ უკიდურესობას შორის."),
  },
  {
    id: "appeal_to_authority",
    name: l("Appeal to (irrelevant) authority", "ავტორიტეტზე მითითება"),
    definition: l("Treating a claim as true because a famous or powerful person said it, especially outside their expertise.", "მტკიცების ჭეშმარიტად მიჩნევა მხოლოდ იმიტომ, რომ ცნობილმა ან გავლენიანმა ადამიანმა თქვა — განსაკუთრებით მისი კომპეტენციის მიღმა."),
    example: l("“A famous footballer says this vitamin cures colds, so it must work.”", "„ცნობილი ფეხბურთელი ამბობს, რომ ეს ვიტამინი გაციებას კურნავს, ესე იგი მოქმედებს.“"),
    respond: l("Ask whether the person is an expert on this topic and what evidence supports the claim.", "იკითხე, არის თუ არა ეს ადამიანი ამ საკითხის ექსპერტი და რა მტკიცებულება ადასტურებს ნათქვამს."),
  },
  {
    id: "appeal_to_popularity",
    name: l("Appeal to popularity", "უმრავლესობაზე აპელირება"),
    definition: l("Claiming something is true or good because many people believe or do it.", "იმის მტკიცება, რომ რაღაც მართალი ან კარგია, რადგან ბევრს სჯერა ან ბევრი აკეთებს."),
    example: l("“Millions of people share this post, so it must be true.”", "„ამ პოსტს მილიონობით ადამიანი აზიარებს, ესე იგი მართალია.“"),
    respond: l("Popularity tells you what people think, not whether it is true. Look for the evidence.", "პოპულარობა გვეუბნება, რას ფიქრობენ ადამიანები, და არა იმას, მართალია თუ არა. მოძებნე მტკიცებულება."),
  },
  {
    id: "hasty_generalization",
    name: l("Hasty generalisation", "ნაჩქარევი განზოგადება"),
    definition: l("Drawing a broad conclusion from too few or unrepresentative examples.", "ფართო დასკვნის გამოტანა ძალიან ცოტა ან არაწარმომადგენლობითი მაგალითებიდან."),
    example: l("“Two tourists were rude to me, so people from that country are rude.”", "„ორი ტურისტი უხეში იყო ჩემთან, ესე იგი იმ ქვეყნის ხალხი უხეშია.“"),
    respond: l("Ask how many cases were seen and whether they represent the whole group.", "იკითხე, რამდენი შემთხვევა ნახე და წარმოადგენენ თუ არა ისინი მთელ ჯგუფს."),
  },
  {
    id: "slippery_slope",
    name: l("Slippery slope", "მოლიპული ფერდობი"),
    definition: l("Claiming that one step will inevitably lead to a chain of extreme consequences, without showing why.", "იმის მტკიცება, რომ ერთი ნაბიჯი აუცილებლად გამოიწვევს უკიდურეს შედეგების ჯაჭვს, ისე რომ არ აჩვენებ, რატომ."),
    example: l("“If we allow one late homework, soon nobody will hand anything in on time and the school will fall apart.”", "„თუ ერთ დაგვიანებულ დავალებას დავუშვებთ, მალე აღარავინ ჩააბარებს დროზე და სკოლა დაინგრევა.“"),
    respond: l("Ask for evidence for each step of the chain — is each one really likely?", "მოითხოვე მტკიცებულება ჯაჭვის ყოველი რგოლისთვის — მართლა სავარაუდოა თითოეული?"),
  },
  {
    id: "circular_reasoning",
    name: l("Circular reasoning", "წრიული მსჯელობა"),
    definition: l("Using the conclusion as a reason for itself.", "დასკვნის გამოყენება საკუთარი თავის დასასაბუთებლად."),
    example: l("“This news site is trustworthy because it says it only publishes the truth.”", "„ეს საინფორმაციო საიტი სანდოა, რადგან თავად ამბობს, რომ მხოლოდ სიმართლეს აქვეყნებს.“"),
    respond: l("Ask for a reason that is independent of the conclusion.", "მოითხოვე მიზეზი, რომელიც დასკვნისგან დამოუკიდებელია."),
  },
  {
    id: "false_cause",
    name: l("False cause", "ცრუ მიზეზი"),
    definition: l("Assuming that because one thing happened after or together with another, it was caused by it.", "იმის დაშვება, რომ თუ ერთი მოვლენა მეორის შემდეგ ან მასთან ერთად მოხდა, მისი გამოწვეულია."),
    example: l("“I wore my lucky socks and we won — the socks help us win.”", "„ბედნიერი წინდები ჩავიცვი და მოვიგეთ — წინდები გვეხმარება მოგებაში.“"),
    respond: l("Ask what else could explain it, and whether it happens reliably when tested.", "იკითხე, კიდევ რა შეიძლება ხსნიდეს ამას და მეორდება თუ არა შედეგი შემოწმებისას."),
  },
  {
    id: "red_herring",
    name: l("Red herring", "ყურადღების გადატანა"),
    definition: l("Introducing an unrelated topic to distract from the actual question.", "არარელევანტური თემის შემოტანა, რათა ყურადღება ძირითად კითხვას მოაცილო."),
    example: l("Asked about the rise in canteen prices: “Students should be grateful — many schools don’t even have a canteen.”", "როცა კანტინის ფასების ზრდაზე ეკითხებიან: „მოსწავლეები მადლიერები უნდა იყვნენ — ბევრ სკოლას კანტინაც კი არ აქვს.“"),
    respond: l("Politely return to the original question and ask for an answer to it.", "თავაზიანად დაუბრუნდი თავდაპირველ კითხვას და სთხოვე მასზე პასუხი."),
  },
];

export interface BiasCard {
  id: BiasId;
  name: L;
  definition: L;
  example: L;
  counter: L;
}

export const BIAS_CARDS: BiasCard[] = [
  {
    id: "confirmation",
    name: l("Confirmation bias", "დადასტურების მიკერძოება"),
    definition: l("Looking for, noticing and remembering information that supports what we already believe.", "იმ ინფორმაციის ძებნა, შემჩნევა და დამახსოვრება, რომელიც ჩვენს არსებულ აზრს ადასტურებს."),
    example: l("Reading only reviews that praise the phone you already decided to buy.", "მხოლოდ იმ მიმოხილვების კითხვა, რომლებიც აქებს ტელეფონს, რომლის ყიდვაც უკვე გადაწყვიტე."),
    counter: l("Deliberately search for the best evidence against your view.", "შეგნებულად მოძებნე ყველაზე ძლიერი მტკიცებულება შენი აზრის საწინააღმდეგოდ."),
  },
  {
    id: "anchoring",
    name: l("Anchoring", "ღუზის ეფექტი"),
    definition: l("Relying too much on the first number or piece of information we see.", "პირველ ნანახ რიცხვზე ან ინფორმაციაზე ზედმეტად დაყრდნობა."),
    example: l("A jacket “reduced from 400 to 200 GEL” feels cheap, even if 200 is a high price.", "ქურთუკი, „400-დან 200 ლარამდე ფასდაკლებით“, იაფად გეჩვენება, თუნდაც 200 ლარი მაღალი ფასი იყოს."),
    counter: l("Ask what you would think if you had never seen the first number.", "იკითხე, რას იფიქრებდი, პირველი რიცხვი საერთოდ რომ არ გენახა."),
  },
  {
    id: "availability",
    name: l("Availability heuristic", "ხელმისაწვდომობის ევრისტიკა"),
    definition: l("Judging how common something is by how easily examples come to mind.", "იმის შეფასება, რამდენად ხშირია რაღაც, იმის მიხედვით, რამდენად მარტივად გახსენდება მაგალითები."),
    example: l("After seeing news of a plane crash, flying feels more dangerous than driving, although statistics show the opposite.", "ავიაკატასტროფის ამბის ნახვის შემდეგ ფრენა მანქანით მგზავრობაზე საშიში გეჩვენება, თუმცა სტატისტიკა საპირისპიროს აჩვენებს."),
    counter: l("Look up the actual numbers instead of relying on memorable stories.", "დასამახსოვრებელ ამბებს კი არ დაეყრდნო, არამედ რეალურ რიცხვებს მოძებნე."),
  },
  {
    id: "survivorship",
    name: l("Survivorship bias", "გადარჩენილის მიკერძოება"),
    definition: l("Drawing conclusions only from the cases that “survived” and are visible, ignoring those that failed.", "დასკვნის გამოტანა მხოლოდ იმ შემთხვევებიდან, რომლებიც „გადარჩა“ და ჩანს, და წარუმატებელი შემთხვევების იგნორირება."),
    example: l("“Famous founders dropped out of university, so dropping out leads to success.” We don’t hear about the many who dropped out and failed.", "„ცნობილმა დამფუძნებლებმა უნივერსიტეტი მიატოვეს, ესე იგი მიტოვება წარმატებას იწვევს.“ ჩვენ არ გვესმის მათზე, ვინც მიატოვა და ვერ მიაღწია წარმატებას."),
    counter: l("Ask what happened to the cases you cannot see.", "იკითხე, რა მოუვიდა იმ შემთხვევებს, რომლებსაც ვერ ხედავ."),
  },
  {
    id: "sunk_cost",
    name: l("Sunk cost trap", "დახარჯული რესურსის მახე"),
    definition: l("Continuing something because of what we have already invested, even when stopping would be better.", "რაღაცის გაგრძელება იმის გამო, რაც უკვე ჩავდეთ, მაშინაც კი, როცა შეწყვეტა უკეთესი იქნებოდა."),
    example: l("Watching a boring film to the end because the ticket was expensive.", "მოსაწყენი ფილმის ბოლომდე ყურება მხოლოდ იმიტომ, რომ ბილეთი ძვირი ღირდა."),
    counter: l("Decide by looking forward: what are the costs and benefits from now on?", "გადაწყვიტე მომავლის გათვალისწინებით: რა ხარჯი და სარგებელი გელის ამიერიდან?"),
  },
  {
    id: "framing",
    name: l("Framing effect", "ჩარჩოს ეფექტი"),
    definition: l("Reacting differently to the same information depending on how it is presented.", "ერთსა და იმავე ინფორმაციაზე განსხვავებული რეაქცია იმის მიხედვით, როგორ არის წარმოდგენილი."),
    example: l("“90% of students passed” sounds better than “10% of students failed”, though they say the same thing.", "„მოსწავლეების 90%-მა ჩააბარა“ უკეთ ჟღერს, ვიდრე „10%-მა ვერ ჩააბარა“, თუმცა ერთსა და იმავეს ნიშნავს."),
    counter: l("Rephrase the information the opposite way and see if your judgement changes.", "ინფორმაცია საპირისპიროდ ჩამოაყალიბე და ნახე, შეიცვლება თუ არა შენი შეფასება."),
  },
];

export function fallacyName(id: string): L | null {
  return FALLACY_CARDS.find((f) => f.id === id)?.name ?? null;
}

export function biasName(id: string): L | null {
  return BIAS_CARDS.find((b) => b.id === id)?.name ?? null;
}
