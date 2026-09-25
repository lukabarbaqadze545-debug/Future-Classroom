import { l } from "../localized";
import { biasItem, choice, fallacyItem, multi, tags } from "./builders";
import type { ItemExercise } from "./types";

/*
 * Item-based exercises: every answer is checked deterministically and every
 * item explains why. All articles and posts are fictional and labelled so.
 */

const FICTIONAL = l("Fictional text written for this exercise — not a real article.", "ეს ტექსტი სავარჯიშოსთვის არის შექმნილი — ნამდვილი სტატია არ არის.");
const FICTIONAL_POST = l("Fictional post written for this exercise — not a real message.", "ეს პოსტი სავარჯიშოსთვის არის შექმნილი — ნამდვილი შეტყობინება არ არის.");

const TAG_PROMPT = l("Label each sentence: is it the main claim, evidence, or background information?", "მონიშნე თითოეული წინადადება: ეს მთავარი მტკიცებაა, მტკიცებულება თუ ფონური ინფორმაცია?");
const ASSUMPTION_PROMPT = l("Which unstated assumption does the argument depend on?", "რომელ გამოუთქმელ დაშვებას ეყრდნობა არგუმენტი?");
const MISSING_PROMPT = l("Which information would help you judge the claim? Select all that apply.", "რომელი ინფორმაცია დაგეხმარებოდა მტკიცების შეფასებაში? მონიშნე ყველა შესაფერისი.");

export const ITEM_EXERCISES: ItemExercise[] = [
  // ---------------------------------------------------------------- Fallacies
  {
    id: "ct-fallacies-1",
    kind: "fallacy",
    topic: "fallacies",
    difficulty: 1,
    minutes: 12,
    title: l("Spot the fallacy: school life", "იპოვე შეცდომა: სკოლის ცხოვრება"),
    intro: l(
      "Ten short situations from school life. Name the fallacy in each — then read how the same point could be made fairly.",
      "სკოლის ცხოვრებიდან ათი მოკლე სიტუაცია. დაასახელე თითოეულში ლოგიკური შეცდომა — შემდეგ წაიკითხე, როგორ შეიძლებოდა იგივე აზრის სამართლიანად გამოთქმა.",
    ),
    items: [
      fallacyItem(
        "f1-1",
        l(
          "Nika proposes a recycling bin in every classroom. Levan replies: “Nika is always late to class, so why should we listen to his ideas about the school?”",
          "ნიკა გვთავაზობს, რომ ყველა საკლასო ოთახში გადასამუშავებელი ურნა დაიდგას. ლევანი პასუხობს: „ნიკა სულ აგვიანებს გაკვეთილზე, რატომ უნდა მოვუსმინოთ მის იდეებს სკოლაზე?“",
        ),
        "ad_hominem",
        ["red_herring", "hasty_generalization", "straw_man"],
        l("Levan attacks Nika’s punctuality, which has nothing to do with whether recycling bins are a good idea.", "ლევანი ნიკას დაგვიანებას აკრიტიკებს, რასაც არანაირი კავშირი არ აქვს იმასთან, კარგი იდეაა თუ არა ურნები."),
        l("“Who would empty the bins, and would students really use them?” — questions about the idea itself.", "„ვინ დაცლის ურნებს და მართლა გამოიყენებენ მოსწავლეები?“ — კითხვები თავად იდეაზე."),
      ),
      fallacyItem(
        "f1-2",
        l(
          "The principal suggests shortening breaks by five minutes so the day ends at 14:30. A student says: “So the principal wants us to study non-stop and never rest!”",
          "დირექტორი გვთავაზობს, შესვენებები ხუთი წუთით შემცირდეს, რომ დღე 14:30-ზე დასრულდეს. მოსწავლე ამბობს: „ესე იგი დირექტორს უნდა, რომ შეუსვენებლად ვისწავლოთ და არასდროს დავისვენოთ!“",
        ),
        "straw_man",
        ["slippery_slope", "false_dilemma", "ad_hominem"],
        l("The real proposal (five minutes shorter) is replaced with an extreme one (no rest at all), which is easier to attack.", "რეალური წინადადება (ხუთი წუთით ნაკლები) უკიდურესით (საერთოდ არ დასვენება) არის ჩანაცვლებული, რაზე თავდასხმაც უფრო ადვილია."),
        l("“Five minutes less break might make the afternoon harder. Could we try it for a month and see?”", "„ხუთი წუთით ნაკლები შესვენება შეიძლება დღის მეორე ნახევარს ართულებდეს. ვცადოთ ერთი თვით და ვნახოთ?“"),
      ),
      fallacyItem(
        "f1-3",
        l("“Either you join the school football team, or you don’t care about our school.”", "„ან სკოლის საფეხბურთო გუნდში ჩაეწერები, ან სკოლა არ გაინტერესებს.“"),
        "false_dilemma",
        ["appeal_to_popularity", "circular_reasoning", "straw_man"],
        l("There are many ways to care about the school — clubs, volunteering, good work in class — not only these two options.", "სკოლაზე ზრუნვის ბევრი გზა არსებობს — წრეები, მოხალისეობა, კარგი სწავლა — და არა მხოლოდ ეს ორი ვარიანტი."),
        l("“The team needs players — if you like football, it would be great to have you.”", "„გუნდს მოთამაშეები სჭირდება — თუ ფეხბურთი გიყვარს, კარგი იქნება, შემოგვიერთდე.“"),
      ),
      fallacyItem(
        "f1-4",
        l("“A popular singer said on TV that reading in dim light ruins your eyes forever, so it’s definitely true.”", "„პოპულარულმა მომღერალმა ტელევიზიით თქვა, რომ მკრთალ შუქზე კითხვა თვალებს სამუდამოდ აზიანებს, ესე იგი ნამდვილად ასეა.“"),
        "appeal_to_authority",
        ["appeal_to_popularity", "false_cause", "hasty_generalization"],
        l("A singer is not an expert on eyesight. The claim needs evidence from eye specialists, not fame.", "მომღერალი მხედველობის ექსპერტი არ არის. მტკიცებას ოფთალმოლოგების მტკიცებულება სჭირდება და არა პოპულარობა."),
        l("“What do eye doctors say about reading in dim light? Let’s check a health organisation’s advice.”", "„რას ამბობენ ოფთალმოლოგები მკრთალ შუქზე კითხვაზე? ვნახოთ ჯანდაცვის ორგანიზაციის რეკომენდაცია.“"),
      ),
      fallacyItem(
        "f1-5",
        l("“Everyone in our class uses this study app, so it must be the best way to learn.”", "„ჩვენს კლასში ყველა ამ სასწავლო აპლიკაციას იყენებს, ესე იგი სწავლის საუკეთესო გზაა.“"),
        "appeal_to_popularity",
        ["appeal_to_authority", "circular_reasoning", "false_cause"],
        l("Many users show the app is popular, not that it helps people learn better than other methods.", "ბევრი მომხმარებელი აჩვენებს, რომ აპლიკაცია პოპულარულია, და არა იმას, რომ სხვა მეთოდებზე უკეთ გვასწავლის."),
        l("“Many of us use it — has anyone compared their results before and after?”", "„ბევრი ვიყენებთ — ვინმეს შეუდარებია შედეგები მანამდე და მერე?“"),
      ),
      fallacyItem(
        "f1-6",
        l("“I tried two vegetarian dishes and didn’t like them. Vegetarian food is tasteless.”", "„ორი ვეგეტარიანული კერძი გავსინჯე და არ მომეწონა. ვეგეტარიანული საჭმელი უგემურია.“"),
        "hasty_generalization",
        ["false_cause", "ad_hominem", "slippery_slope"],
        l("Two dishes are far too few to judge a whole cuisine with thousands of dishes.", "ორი კერძი სრულიად არასაკმარისია ათასობით კერძის მქონე მთელ სამზარეულოზე დასკვნის გასაკეთებლად."),
        l("“The two vegetarian dishes I tried weren’t for me — maybe I should try a few different ones.”", "„ის ორი ვეგეტარიანული კერძი, რაც გავსინჯე, ჩემი გემოვნების არ იყო — იქნებ სხვებიც ვცადო.“"),
      ),
      fallacyItem(
        "f1-7",
        l(
          "“If we let students choose one elective subject, next they’ll want to choose all their subjects, then they’ll drop maths, and soon nobody will be able to count.”",
          "„თუ მოსწავლეებს ერთი არჩევითი საგნის არჩევის უფლებას მივცემთ, მერე ყველა საგნის არჩევა მოუნდებათ, მათემატიკას მიატოვებენ და მალე ვეღარავინ დაითვლის.“",
        ),
        "slippery_slope",
        ["false_dilemma", "straw_man", "hasty_generalization"],
        l("Each step in the chain is assumed, not shown. One elective does not automatically lead to dropping maths.", "ჯაჭვის ყოველი რგოლი დაშვებულია და არა ნაჩვენები. ერთი არჩევითი საგანი ავტომატურად არ ნიშნავს მათემატიკის მიტოვებას."),
        l("“If we add an elective, how do we make sure core subjects keep enough hours?”", "„თუ არჩევით საგანს დავამატებთ, როგორ უზრუნველვყოთ, რომ ძირითად საგნებს საკმარისი საათები დარჩეს?“"),
      ),
      fallacyItem(
        "f1-8",
        l("“Our class president is trustworthy — she told us herself that she never lies.”", "„ჩვენი კლასის პრეზიდენტი სანდოა — თავად გვითხრა, რომ არასდროს იტყუება.“"),
        "circular_reasoning",
        ["appeal_to_authority", "red_herring", "appeal_to_popularity"],
        l("Her statement can only prove her honesty if we already assume she is honest — the reasoning goes in a circle.", "მისი სიტყვები მის პატიოსნებას მხოლოდ მაშინ ამტკიცებს, თუ წინასწარ ვთვლით, რომ პატიოსანია — მსჯელობა წრეზე ტრიალებს."),
        l("“She kept her promises about the class trip and the budget — that’s why I trust her.”", "„მან შეასრულა დაპირებები ექსკურსიასა და ბიუჯეტზე — ამიტომ ვენდობი.“"),
      ),
      fallacyItem(
        "f1-9",
        l("“Since the new vending machine was installed, grades in 9B went up. The vending machine improved learning.”", "„მას შემდეგ, რაც ახალი სავაჭრო აპარატი დაიდგა, 9ბ კლასის ნიშნები გაუმჯობესდა. აპარატმა სწავლა გააუმჯობესა.“"),
        "false_cause",
        ["hasty_generalization", "appeal_to_popularity", "red_herring"],
        l("Two things happening at the same time does not mean one caused the other. Perhaps 9B got a new teacher or had easier tests.", "ორი მოვლენის ერთდროულად მოხდენა არ ნიშნავს, რომ ერთმა მეორე გამოიწვია. შეიძლება 9ბ-ს ახალი მასწავლებელი ჰყავდა ან ტესტები უფრო მარტივი იყო."),
        l("“Grades went up this term — what changed for 9B, and did other classes change too?”", "„ამ სემესტრში ნიშნები გაუმჯობესდა — რა შეიცვალა 9ბ-სთვის და სხვა კლასებშიც შეიცვალა?“"),
      ),
      fallacyItem(
        "f1-10",
        l("Asked why the school trip costs so much more this year, the organiser answers: “Let’s not forget how much fun last year’s trip was!”", "როცა ორგანიზატორს ეკითხებიან, რატომ ღირს წლევანდელი ექსკურსია ბევრად ძვირი, ის პასუხობს: „არ დაგვავიწყდეს, რა მხიარული იყო შარშანდელი ექსკურსია!“"),
        "red_herring",
        ["ad_hominem", "circular_reasoning", "false_dilemma"],
        l("The answer changes the subject from cost to fun, and the question about price is never answered.", "პასუხი თემას ფასიდან გართობაზე გადაიტანს და კითხვა ფასზე უპასუხოდ რჩება."),
        l("“The bus and museum tickets went up — here is the breakdown of costs.”", "„ავტობუსი და მუზეუმის ბილეთები გაძვირდა — აი, ხარჯების ჩამონათვალი.“"),
      ),
    ],
  },
  {
    id: "ct-fallacies-2",
    kind: "fallacy",
    topic: "fallacies",
    difficulty: 2,
    minutes: 12,
    title: l("Spot the fallacy: news and public debate", "იპოვე შეცდომა: ახალი ამბები და საჯარო დებატი"),
    intro: l(
      "Ten situations from news, advertising and public debate (all invented). Spotting a fallacy does not mean the conclusion is false — only that this reason does not support it.",
      "ათი სიტუაცია ახალი ამბებიდან, რეკლამიდან და საჯარო დებატებიდან (ყველა გამოგონილია). შეცდომის პოვნა არ ნიშნავს, რომ დასკვნა მცდარია — მხოლოდ იმას, რომ ეს მიზეზი მას არ ამყარებს.",
    ),
    items: [
      fallacyItem(
        "f2-1",
        l("In a debate about a new bike lane, a council member says: “The cyclists’ association is just a group of young people with no life experience.”", "ველობილიკის შესახებ დებატებში საკრებულოს წევრი ამბობს: „ველოსიპედისტთა ასოციაცია უბრალოდ ცხოვრებისეული გამოცდილების არმქონე ახალგაზრდების ჯგუფია.“"),
        "ad_hominem",
        ["straw_man", "hasty_generalization", "appeal_to_authority"],
        l("The age of the association’s members says nothing about whether a bike lane is safe or useful.", "ასოციაციის წევრების ასაკი არაფერს ამბობს იმაზე, უსაფრთხო ან სასარგებლოა თუ არა ველობილიკი."),
        l("“The bike lane would remove 40 parking places — how would residents park?”", "„ველობილიკი 40 სადგომ ადგილს მოაკლებს — სად გააჩერებენ მანქანას მაცხოვრებლები?“"),
      ),
      fallacyItem(
        "f2-2",
        l("Nutritionists recommend less sugar in school canteens. A blogger writes: “They want to ban every dessert and take all joy out of childhood.”", "დიეტოლოგები გვირჩევენ, სკოლის კანტინებში შაქარი შემცირდეს. ბლოგერი წერს: „მათ უნდათ ყველა დესერტის აკრძალვა და ბავშვობისთვის სიხარულის წართმევა.“"),
        "straw_man",
        ["slippery_slope", "red_herring", "false_cause"],
        l("“Less sugar” became “ban every dessert” — a distorted version that nobody proposed.", "„ნაკლები შაქარი“ იქცა „ყველა დესერტის აკრძალვად“ — დამახინჯებულ ვერსიად, რომელიც არავის შემოუთავაზებია."),
        l("“Less sugar is reasonable, but kids should still have a treat sometimes — how much is sensible?”", "„შაქრის შემცირება გონივრულია, მაგრამ ბავშვებს ხანდახან ტკბილეულიც უნდა ჰქონდეთ — რა რაოდენობაა გონივრული?“"),
      ),
      fallacyItem(
        "f2-3",
        l("“We can either build a new stadium, or let our young people waste their time on the streets.”", "„ან ახალ სტადიონს ავაშენებთ, ან ჩვენს ახალგაზრდებს ქუჩაში დროის ფლანგვის საშუალებას მივცემთ.“"),
        "false_dilemma",
        ["slippery_slope", "appeal_to_popularity", "ad_hominem"],
        l("Libraries, youth clubs, sports grounds or courses are other options — the choice is not only between these two.", "ბიბლიოთეკები, ახალგაზრდული ცენტრები, სპორტული მოედნები ან კურსები სხვა ვარიანტებია — არჩევანი მხოლოდ ამ ორს შორის არ არის."),
        l("“A stadium is one way to give young people something to do — how does it compare with other options for the same money?”", "„სტადიონი ახალგაზრდების დასაქმების ერთ-ერთი გზაა — როგორ გამოიყურება სხვა ვარიანტებთან შედარებით იმავე თანხით?“"),
      ),
      fallacyItem(
        "f2-4",
        l("“A famous chess champion says this energy drink improves memory, so it must be true.”", "„ჭადრაკის ცნობილი ჩემპიონი ამბობს, რომ ეს ენერგეტიკული სასმელი მეხსიერებას აუმჯობესებს, ესე იგი მართალია.“"),
        "appeal_to_authority",
        ["appeal_to_popularity", "hasty_generalization", "circular_reasoning"],
        l("Being excellent at chess does not make someone an expert on nutrition or memory research.", "ჭადრაკში წარმატება ადამიანს კვების ან მეხსიერების კვლევის ექსპერტად არ აქცევს."),
        l("“Is there a study showing the drink improves memory, and who paid for it?”", "„არსებობს კვლევა, რომელიც აჩვენებს, რომ სასმელი მეხსიერებას აუმჯობესებს? ვინ დააფინანსა?“"),
      ),
      fallacyItem(
        "f2-5",
        l("“This video has five million views — the story in it can’t be fake.”", "„ამ ვიდეოს ხუთი მილიონი ნახვა აქვს — მასში მოყოლილი ამბავი ვერ იქნება ყალბი.“"),
        "appeal_to_popularity",
        ["appeal_to_authority", "false_cause", "red_herring"],
        l("False stories often spread faster than true ones. Views measure attention, not accuracy.", "ყალბი ამბები ხშირად უფრო სწრაფად ვრცელდება, ვიდრე ნამდვილი. ნახვები ყურადღებას ზომავს და არა სიზუსტეს."),
        l("“It’s very popular — let’s see whether reliable news outlets have confirmed it.”", "„ძალიან პოპულარულია — ვნახოთ, დაადასტურეს თუ არა სანდო მედიასაშუალებებმა.“"),
      ),
      fallacyItem(
        "f2-6",
        l("A reporter interviews three people outside one shop and concludes: “The whole city is against the new bus route.”", "ჟურნალისტი ერთი მაღაზიის წინ სამ ადამიანს ესაუბრება და ასკვნის: „მთელი ქალაქი ახალი ავტობუსის მარშრუტის წინააღმდეგია.“"),
        "hasty_generalization",
        ["appeal_to_popularity", "straw_man", "false_dilemma"],
        l("Three people at one place cannot represent a whole city. A fair survey would ask many people in different areas.", "ერთ ადგილას მყოფი სამი ადამიანი მთელ ქალაქს ვერ წარმოადგენს. სამართლიანი გამოკითხვა ბევრ ადამიანს სხვადასხვა უბანში ჰკითხავდა."),
        l("“The three people we spoke to were against it; a city-wide survey would show how common that view is.”", "„სამივე რესპონდენტი წინააღმდეგი იყო; ქალაქის მასშტაბით გამოკითხვა აჩვენებდა, რამდენად გავრცელებულია ეს აზრი.“"),
      ),
      fallacyItem(
        "f2-7",
        l("“If the school allows calculators in 8th grade, soon students won’t be able to add, then they’ll fail every exam, and no one will become an engineer.”", "„თუ სკოლა მე-8 კლასში კალკულატორს დაუშვებს, მალე მოსწავლეები შეკრებას ვეღარ შეძლებენ, მერე ყველა გამოცდაში ჩაიჭრებიან და ინჟინერი აღარავინ გახდება.“"),
        "slippery_slope",
        ["false_cause", "hasty_generalization", "straw_man"],
        l("The chain of consequences is not supported. Calculators can be allowed for some tasks while mental arithmetic is still practised.", "შედეგების ჯაჭვი დაუსაბუთებელია. კალკულატორი შეიძლება ზოგ დავალებაში დავუშვათ და ზეპირი ანგარიშის ვარჯიშიც გავაგრძელოთ."),
        l("“Calculators help with complex problems — how do we keep mental arithmetic strong too?”", "„კალკულატორი რთულ ამოცანებში გვეხმარება — როგორ შევინარჩუნოთ ზეპირი ანგარიშის უნარიც?“"),
      ),
      fallacyItem(
        "f2-8",
        l("“Homework is necessary because students need to do homework.”", "„საშინაო დავალება აუცილებელია, რადგან მოსწავლეებს საშინაო დავალების შესრულება სჭირდებათ.“"),
        "circular_reasoning",
        ["appeal_to_authority", "false_dilemma", "red_herring"],
        l("The reason just repeats the conclusion in other words; it gives no new information.", "მიზეზი უბრალოდ იმეორებს დასკვნას სხვა სიტყვებით და ახალ ინფორმაციას არ იძლევა."),
        l("“Homework helps because practising at home, spaced over days, improves long-term memory.”", "„დავალება გვეხმარება, რადგან სახლში, რამდენიმე დღეზე გადანაწილებული ვარჯიში გრძელვადიან მეხსიერებას აუმჯობესებს.“"),
      ),
      fallacyItem(
        "f2-9",
        l("“Ice-cream sales and swimming accidents both rise in summer. So eating ice cream causes swimming accidents.”", "„ზაფხულში ნაყინის გაყიდვებიც იზრდება და ცურვისას უბედური შემთხვევებიც. ესე იგი ნაყინის ჭამა უბედურ შემთხვევებს იწვევს.“"),
        "false_cause",
        ["hasty_generalization", "circular_reasoning", "appeal_to_popularity"],
        l("A third factor — hot weather — explains both. Correlation is not causation.", "ორივეს მესამე ფაქტორი — ცხელი ამინდი — ხსნის. კორელაცია მიზეზობრიობა არ არის."),
        l("“Both rise in summer — probably because of the heat. Let’s check whether they’re linked on days with the same weather.”", "„ორივე ზაფხულში იზრდება — ალბათ სიცხის გამო. შევამოწმოთ, უკავშირდება თუ არა ერთმანეთს ერთნაირი ამინდის დღეებში.“"),
      ),
      fallacyItem(
        "f2-10",
        l("Journalist: “Why was the park renovation delayed by a year?” Official: “Our city has the most beautiful parks in the region, and we are proud of them.”", "ჟურნალისტი: „რატომ გადაიდო პარკის რემონტი ერთი წლით?“ ჩინოვნიკი: „ჩვენს ქალაქს რეგიონში ყველაზე ლამაზი პარკები აქვს და ვამაყობთ მათით.“"),
        "red_herring",
        ["circular_reasoning", "ad_hominem", "appeal_to_authority"],
        l("The answer is about the beauty of parks, not about the reason for the delay.", "პასუხი პარკების სილამაზეზეა და არა დაგვიანების მიზეზზე."),
        l("“The delay happened because the contractor changed — the new date is May.”", "„დაგვიანება კონტრაქტორის შეცვლამ გამოიწვია — ახალი ვადა მაისია.“"),
      ),
    ],
  },

  // ------------------------------------------------------------------- Biases
  {
    id: "ct-biases-1",
    kind: "bias",
    topic: "biases",
    difficulty: 2,
    minutes: 8,
    title: l("Everyday biases", "ყოველდღიური მიკერძოებები"),
    intro: l(
      "Six everyday situations. Biases affect everyone, including experts — the goal is to notice them in our own thinking.",
      "ექვსი ყოველდღიური სიტუაცია. მიკერძოებები ყველაზე მოქმედებს, ექსპერტებზეც — მიზანია, საკუთარ აზროვნებაში შევამჩნიოთ ისინი.",
    ),
    items: [
      biasItem(
        "b1-1",
        l("Dato believes his team plays best on Saturdays. He remembers every Saturday win but quickly forgets the Saturday losses.", "დათოს სჯერა, რომ მისი გუნდი შაბათობით საუკეთესოდ თამაშობს. ყოველი შაბათის მოგება ახსოვს, წაგებები კი სწრაფად ავიწყდება."),
        "confirmation",
        ["availability", "anchoring", "framing"],
        l("He notices and remembers only what confirms his belief. Counting all Saturday games would test it fairly.", "ის მხოლოდ იმას ამჩნევს და იმახსოვრებს, რაც მის რწმენას ადასტურებს. ყველა შაბათის თამაშის დათვლა სამართლიანად შეამოწმებდა მას."),
      ),
      biasItem(
        "b1-2",
        l("A shop shows “was 900 GEL” crossed out next to “now 499 GEL”. Mari feels it is a great deal and buys it without checking other shops.", "მაღაზიაში გადახაზულია „იყო 900 ლარი“ და გვერდით წერია „ახლა 499 ლარი“. მარის ეს კარგ შეთავაზებად ეჩვენება და სხვა მაღაზიების შემოწმების გარეშე ყიდულობს."),
        "anchoring",
        ["framing", "sunk_cost", "confirmation"],
        l("The first number (900) became the reference point. The real question is what the item costs elsewhere.", "პირველი რიცხვი (900) ათვლის წერტილად იქცა. ნამდვილი კითხვაა, რა ღირს ეს ნივთი სხვაგან."),
      ),
      biasItem(
        "b1-3",
        l("After watching a series about shark attacks, Luka is afraid to swim in the sea, although shark attacks are extremely rare.", "ზვიგენის თავდასხმებზე სერიალის ნახვის შემდეგ ლუკას ზღვაში ცურვის ეშინია, თუმცა ზვიგენის თავდასხმა უკიდურესად იშვიათია."),
        "availability",
        ["confirmation", "survivorship", "anchoring"],
        l("Vivid, memorable stories make rare events feel common. Statistics give a better picture of the real risk.", "ნათელი, დასამახსოვრებელი ამბები იშვიათ მოვლენებს ხშირად გვაჩვენებს. რეალური რისკის უკეთეს სურათს სტატისტიკა იძლევა."),
      ),
      biasItem(
        "b1-4",
        l("A magazine studies ten famous musicians who practised eight hours a day and concludes that practising eight hours a day guarantees success.", "ჟურნალი ათ ცნობილ მუსიკოსს სწავლობს, რომლებიც დღეში რვა საათს ვარჯიშობდნენ, და ასკვნის, რომ დღეში რვასაათიანი ვარჯიში წარმატებას იძლევა."),
        "survivorship",
        ["availability", "confirmation", "framing"],
        l("We only see the musicians who became famous. Many who practised just as much are invisible because they did not.", "ჩვენ მხოლოდ იმ მუსიკოსებს ვხედავთ, ვინც ცნობილი გახდა. ბევრი, ვინც ამდენივე ვარჯიშობდა, უხილავია, რადგან წარმატებას ვერ მიაღწია."),
      ),
      biasItem(
        "b1-5",
        l("Elene has spent three months on a science project that is clearly not working. She refuses to change topic: “I’ve already put in so much time.”", "ელენემ სამი თვე დაუთმო სამეცნიერო პროექტს, რომელიც აშკარად არ გამოდის. თემის შეცვლაზე უარს ამბობს: „ამდენი დრო უკვე დავხარჯე.“"),
        "sunk_cost",
        ["anchoring", "confirmation", "availability"],
        l("The time already spent cannot be recovered either way. The better question: what is the best use of the time left?", "უკვე დახარჯული დრო ნებისმიერ შემთხვევაში აღარ დაბრუნდება. უკეთესი კითხვაა: როგორ გამოვიყენო დარჩენილი დრო საუკეთესოდ?"),
      ),
      biasItem(
        "b1-6",
        l("One group of parents is told a new timetable “keeps 80% of lessons the same”; another is told it “changes 20% of lessons”. The first group supports it much more.", "მშობლების ერთ ჯგუფს უთხრეს, რომ ახალი ცხრილი „გაკვეთილების 80%-ს უცვლელად ტოვებს“, მეორეს — რომ „გაკვეთილების 20%-ს ცვლის“. პირველი ჯგუფი ბევრად მეტად უჭერს მხარს."),
        "framing",
        ["anchoring", "confirmation", "survivorship"],
        l("Both descriptions are the same fact. Only the presentation changed — and with it, people’s reaction.", "ორივე აღწერა ერთი და იგივე ფაქტია. შეიცვალა მხოლოდ წარმოდგენის ფორმა — და მასთან ერთად ადამიანების რეაქციაც."),
      ),
    ],
  },

  // ----------------------------------------------------------- Claim analysis
  {
    id: "ct-claims-1",
    kind: "claim",
    topic: "claims",
    difficulty: 1,
    minutes: 10,
    title: l("Claim analysis: a later school start", "მტკიცების ანალიზი: სკოლის გვიან დაწყება"),
    intro: l("Read the short opinion piece, then take it apart: claim, evidence, hidden assumption and missing information.", "წაიკითხე მოკლე მოსაზრება და დაშალე: მტკიცება, მტკიცებულება, დამალული დაშვება და ინფორმაცია, რომელიც აკლია."),
    passage: {
      title: l("Our school should start later", "ჩვენი სკოლა უფრო გვიან უნდა იწყებოდეს"),
      body: l(
        "Most secondary schools in our city start lessons at 8:30. Our school should start at 9:30 instead. In a survey of 300 of our students, 62% said they sleep less than seven hours on school nights. Sleep researchers report that teenagers’ body clocks shift later during adolescence.",
        "ჩვენი ქალაქის საშუალო სკოლების უმეტესობაში გაკვეთილები 8:30-ზე იწყება. ჩვენი სკოლა 9:30-ზე უნდა იწყებოდეს. ჩვენი სკოლის 300 მოსწავლის გამოკითხვაში 62%-მა თქვა, რომ სასწავლო დღეების წინ შვიდ საათზე ნაკლებს სძინავს. ძილის მკვლევრები აღნიშნავენ, რომ მოზარდობის ასაკში ბიოლოგიური საათი უფრო გვიან დროზე გადაიწევს.",
      ),
      label: FICTIONAL,
    },
    items: [
      tags(
        "c1-tags",
        TAG_PROMPT,
        [
          ["background", l("Most secondary schools in our city start lessons at 8:30.", "ჩვენი ქალაქის საშუალო სკოლების უმეტესობაში გაკვეთილები 8:30-ზე იწყება.")],
          ["claim", l("Our school should start at 9:30 instead.", "ჩვენი სკოლა 9:30-ზე უნდა იწყებოდეს.")],
          ["evidence", l("In a survey of 300 of our students, 62% said they sleep less than seven hours on school nights.", "ჩვენი სკოლის 300 მოსწავლის გამოკითხვაში 62%-მა თქვა, რომ სასწავლო დღეების წინ შვიდ საათზე ნაკლებს სძინავს.")],
          ["evidence", l("Sleep researchers report that teenagers’ body clocks shift later during adolescence.", "ძილის მკვლევრები აღნიშნავენ, რომ მოზარდობის ასაკში ბიოლოგიური საათი უფრო გვიან დროზე გადაიწევს.")],
        ],
        l(
          "The claim is what the author wants us to accept (start at 9:30). The survey and the research are evidence. The first sentence only describes the situation.",
          "მტკიცება ისაა, რისი მიღებაც ავტორს სურს (დაწყება 9:30-ზე). გამოკითხვა და კვლევა მტკიცებულებებია. პირველი წინადადება მხოლოდ ვითარებას აღწერს.",
        ),
      ),
      choice(
        "c1-assumption",
        ASSUMPTION_PROMPT,
        [
          ["a", l("Students would use the extra hour to sleep, not to stay up later.", "მოსწავლეები დამატებით საათს ძილისთვის გამოიყენებენ და არა უფრო გვიან დაწოლისთვის.")],
          ["b", l("All schools in the city start at 8:30.", "ქალაქის ყველა სკოლა 8:30-ზე იწყება.")],
          ["c", l("Teachers prefer to start later.", "მასწავლებლებს ურჩევნიათ უფრო გვიან დაწყება.")],
          ["d", l("Surveys are always accurate.", "გამოკითხვები ყოველთვის ზუსტია.")],
        ],
        "a",
        l(
          "The argument only works if a later start leads to more sleep. If students simply went to bed an hour later, the problem would remain.",
          "არგუმენტი მხოლოდ მაშინ მუშაობს, თუ გვიან დაწყება მეტ ძილს ნიშნავს. თუ მოსწავლეები უბრალოდ ერთი საათით გვიან დაიძინებენ, პრობლემა დარჩება.",
        ),
      ),
      multi(
        "c1-missing",
        MISSING_PROMPT,
        [
          [l("Whether schools that start later report better attendance or grades", "აქვთ თუ არა გვიან დაწყებულ სკოლებს უკეთესი დასწრება ან ნიშნები"), true],
          [l("How a later start would affect buses and parents’ working hours", "როგორ იმოქმედებს გვიან დაწყება ავტობუსებზე და მშობლების სამუშაო საათებზე"), true],
          [l("How the 300 students in the survey were chosen", "როგორ შეირჩა გამოკითხული 300 მოსწავლე"), true],
          [l("The favourite breakfast of the students surveyed", "გამოკითხული მოსწავლეების საყვარელი საუზმე"), false],
          [l("The colour of the school building", "სკოლის შენობის ფერი"), false],
        ],
        l(
          "Good missing information either tests the claim (results elsewhere), shows the costs (transport, families) or checks the evidence (how the sample was chosen).",
          "სასარგებლო დამატებითი ინფორმაცია ან ამოწმებს მტკიცებას (სხვაგან მიღებული შედეგები), ან აჩვენებს ხარჯებს (ტრანსპორტი, ოჯახები), ან ამოწმებს მტკიცებულებას (როგორ შეირჩა შერჩევა).",
        ),
      ),
    ],
  },
  {
    id: "ct-claims-2",
    kind: "claim",
    topic: "assumptions",
    difficulty: 2,
    minutes: 10,
    title: l("Claim analysis: plastic bottles in the canteen", "მტკიცების ანალიზი: პლასტმასის ბოთლები კანტინაში"),
    intro: l("An eco-club proposal. Separate the claim from the evidence and find the assumption that holds it together.", "ეკოკლუბის წინადადება. გამოყავი მტკიცება მტკიცებულებისგან და იპოვე დაშვება, რომელიც მათ აკავშირებს."),
    passage: {
      title: l("Proposal from the eco-club", "ეკოკლუბის წინადადება"),
      body: l(
        "The school canteen sells about 400 drinks in plastic bottles every week. The canteen should stop selling drinks in plastic bottles. Last month the eco-club counted 1,150 plastic bottles in the school’s waste bins. According to its annual report, a nearby school that installed drinking fountains cut its plastic waste by half in one term.",
        "სკოლის კანტინა ყოველკვირეულად დაახლოებით 400 სასმელს ყიდის პლასტმასის ბოთლებში. კანტინამ პლასტმასის ბოთლებში სასმელების გაყიდვა უნდა შეწყვიტოს. გასულ თვეს ეკოკლუბმა სკოლის ნაგვის ურნებში 1 150 პლასტმასის ბოთლი დათვალა. წლიური ანგარიშის მიხედვით, მეზობელმა სკოლამ, რომელმაც სასმელი წყლის შადრევნები დაამონტაჟა, ერთ სემესტრში პლასტმასის ნარჩენები განახევრა.",
      ),
      label: FICTIONAL,
    },
    items: [
      tags(
        "c2-tags",
        TAG_PROMPT,
        [
          ["background", l("The school canteen sells about 400 drinks in plastic bottles every week.", "სკოლის კანტინა ყოველკვირეულად დაახლოებით 400 სასმელს ყიდის პლასტმასის ბოთლებში.")],
          ["claim", l("The canteen should stop selling drinks in plastic bottles.", "კანტინამ პლასტმასის ბოთლებში სასმელების გაყიდვა უნდა შეწყვიტოს.")],
          ["evidence", l("Last month the eco-club counted 1,150 plastic bottles in the school’s waste bins.", "გასულ თვეს ეკოკლუბმა სკოლის ნაგვის ურნებში 1 150 პლასტმასის ბოთლი დათვალა.")],
          ["evidence", l("According to its annual report, a nearby school that installed drinking fountains cut its plastic waste by half in one term.", "წლიური ანგარიშის მიხედვით, მეზობელმა სკოლამ, რომელმაც სასმელი წყლის შადრევნები დაამონტაჟა, ერთ სემესტრში პლასტმასის ნარჩენები განახევრა.")],
        ],
        l(
          "The first sentence describes the situation; it would be true whatever we decide. The count and the other school’s result are evidence for the proposal.",
          "პირველი წინადადება ვითარებას აღწერს და მართალი იქნება, რაც არ უნდა გადავწყვიტოთ. დათვლა და მეზობელი სკოლის შედეგი წინადადების მტკიცებულებებია.",
        ),
      ),
      choice(
        "c2-assumption",
        ASSUMPTION_PROMPT,
        [
          ["a", l("Most students like the canteen food.", "მოსწავლეების უმეტესობას კანტინის საჭმელი მოსწონს.")],
          ["b", l("The nearby school is bigger than ours.", "მეზობელი სკოლა ჩვენსაზე დიდია.")],
          ["c", l("Students will switch to refillable bottles or fountains instead of buying bottled drinks elsewhere.", "მოსწავლეები სხვაგან ბოთლში ჩამოსხმული სასმელის ყიდვის ნაცვლად მრავალჯერად ბოთლებსა და შადრევნებზე გადავლენ.")],
          ["d", l("Plastic bottles are more expensive than glass ones.", "პლასტმასის ბოთლები მინისაზე ძვირია.")],
        ],
        "c",
        l(
          "If students simply bought bottled drinks at the shop next door, the school’s plastic waste might not fall at all.",
          "თუ მოსწავლეები სასმელს უბრალოდ მეზობელ მაღაზიაში იყიდიან, სკოლის პლასტმასის ნარჩენები შეიძლება საერთოდ არ შემცირდეს.",
        ),
      ),
      multi(
        "c2-missing",
        MISSING_PROMPT,
        [
          [l("Whether the school can provide free drinking water", "შეუძლია თუ არა სკოლას უფასო სასმელი წყლის უზრუნველყოფა"), true],
          [l("How the change would affect the canteen’s income", "როგორ იმოქმედებს ცვლილება კანტინის შემოსავალზე"), true],
          [l("Whether the other school’s situation is comparable to ours", "შედარებადია თუ არა მეზობელი სკოლის ვითარება ჩვენსას"), true],
          [l("Which brand of bottled water sells best", "ბოთლში ჩამოსხმული წყლის რომელი ბრენდი იყიდება საუკეთესოდ"), false],
          [l("How many teachers drink coffee", "რამდენი მასწავლებელი სვამს ყავას"), false],
        ],
        l(
          "Good questions check whether the plan can work here (water, money) and whether the example really transfers to our school.",
          "კარგი კითხვები ამოწმებს, იმუშავებს თუ არა გეგმა აქ (წყალი, ფინანსები) და მართლა გადმოდის თუ არა მაგალითი ჩვენს სკოლაზე.",
        ),
      ),
    ],
  },
  {
    id: "ct-claims-3",
    kind: "claim",
    topic: "reasoning",
    difficulty: 3,
    minutes: 12,
    title: l("Claim analysis: games and grades", "მტკიცების ანალიზი: თამაშები და ნიშნები"),
    intro: l("A news-style paragraph about a survey. Watch for the difference between a link and a cause.", "ახალი ამბის სტილის აბზაცი გამოკითხვის შესახებ. დააკვირდი განსხვავებას კავშირსა და მიზეზს შორის."),
    passage: {
      title: l("Games hurt grades, survey suggests", "გამოკითხვა: თამაშები ნიშნებს აფუჭებს"),
      body: l(
        "Video games are one of the most popular hobbies among teenagers. Playing video games makes teenagers’ grades worse. In a survey of 1,000 teenagers, those who played more than three hours a day had lower average grades than those who played less. Several teachers interviewed said students seem more tired in the morning.",
        "ვიდეოთამაშები მოზარდების ერთ-ერთი ყველაზე პოპულარული გატაცებაა. ვიდეოთამაშები მოზარდების ნიშნებს აუარესებს. 1 000 მოზარდის გამოკითხვაში, ვინც დღეში სამ საათზე მეტს თამაშობდა, საშუალოდ უფრო დაბალი ნიშნები ჰქონდა, ვიდრე ნაკლებად მოთამაშეებს. გამოკითხული რამდენიმე მასწავლებლის თქმით, მოსწავლეები დილით უფრო დაღლილები ჩანან.",
      ),
      label: FICTIONAL,
    },
    items: [
      tags(
        "c3-tags",
        TAG_PROMPT,
        [
          ["background", l("Video games are one of the most popular hobbies among teenagers.", "ვიდეოთამაშები მოზარდების ერთ-ერთი ყველაზე პოპულარული გატაცებაა.")],
          ["claim", l("Playing video games makes teenagers’ grades worse.", "ვიდეოთამაშები მოზარდების ნიშნებს აუარესებს.")],
          ["evidence", l("In a survey of 1,000 teenagers, those who played more than three hours a day had lower average grades than those who played less.", "1 000 მოზარდის გამოკითხვაში, ვინც დღეში სამ საათზე მეტს თამაშობდა, საშუალოდ უფრო დაბალი ნიშნები ჰქონდა, ვიდრე ნაკლებად მოთამაშეებს.")],
          ["evidence", l("Several teachers interviewed said students seem more tired in the morning.", "გამოკითხული რამდენიმე მასწავლებლის თქმით, მოსწავლეები დილით უფრო დაღლილები ჩანან.")],
        ],
        l(
          "The claim is causal (“makes worse”). The survey shows a link, and the teachers’ impression is weak, anecdotal evidence.",
          "მტკიცება მიზეზობრივია („აუარესებს“). გამოკითხვა კავშირს აჩვენებს, მასწავლებლების შთაბეჭდილება კი სუსტი, ანეკდოტური მტკიცებულებაა.",
        ),
      ),
      choice(
        "c3-assumption",
        ASSUMPTION_PROMPT,
        [
          ["a", l("Teachers know every student’s gaming habits.", "მასწავლებლებმა ყველა მოსწავლის სათამაშო ჩვევები იციან.")],
          ["b", l("The link between gaming and grades is caused by gaming — not by something else, such as less sleep or less support at home.", "თამაშსა და ნიშნებს შორის კავშირს თავად თამაში იწვევს — და არა სხვა რამ, მაგალითად ნაკლები ძილი ან ოჯახის ნაკლები მხარდაჭერა.")],
          ["c", l("All video games take the same time to finish.", "ყველა ვიდეოთამაშის დასრულებას ერთნაირი დრო სჭირდება.")],
          ["d", l("Teenagers should not have hobbies.", "მოზარდებს გატაცებები არ უნდა ჰქონდეთ.")],
        ],
        "b",
        l(
          "A survey can show that two things go together. To say one causes the other, we must rule out other explanations — or run an experiment.",
          "გამოკითხვას შეუძლია აჩვენოს, რომ ორი რამ ერთად გვხვდება. იმის სათქმელად, რომ ერთი მეორეს იწვევს, სხვა ახსნები უნდა გამოვრიცხოთ — ან ექსპერიმენტი ჩავატაროთ.",
        ),
      ),
      multi(
        "c3-missing",
        MISSING_PROMPT,
        [
          [l("Whether the study took sleep, homework time and family situation into account", "გაითვალისწინა თუ არა კვლევამ ძილი, საშინაო დავალების დრო და ოჯახური ვითარება"), true],
          [l("Who ran the survey and how the participants were chosen", "ვინ ჩაატარა გამოკითხვა და როგორ შეირჩნენ მონაწილეები"), true],
          [l("Whether grades improved when the same students played less", "გაუმჯობესდა თუ არა ნიშნები, როცა იმავე მოსწავლეებმა ნაკლები ითამაშეს"), true],
          [l("The price of a new games console", "ახალი სათამაშო კონსოლის ფასი"), false],
        ],
        l(
          "These questions test whether the link is a cause: other factors, the quality of the survey, and what happens when gaming changes.",
          "ეს კითხვები ამოწმებს, არის თუ არა კავშირი მიზეზობრივი: სხვა ფაქტორები, გამოკითხვის ხარისხი და რა ხდება, როცა თამაშის დრო იცვლება.",
        ),
      ),
    ],
  },

  // ------------------------------------------------------------ Media literacy
  {
    id: "ct-media-1",
    kind: "media",
    topic: "media_literacy",
    difficulty: 2,
    minutes: 12,
    title: l("Media literacy: a dramatic headline", "მედიაწიგნიერება: დრამატული სათაური"),
    intro: l("Read the article closely. Look at the words it chooses, what the evidence really shows and what is missing.", "ყურადღებით წაიკითხე სტატია. დააკვირდი შერჩეულ სიტყვებს, რას აჩვენებს სინამდვილეში მტკიცებულება და რა აკლია."),
    passage: {
      title: l("SHOCKING: Phones Are Destroying Our Children’s Brains!", "შოკი: ტელეფონები ჩვენი შვილების ტვინს ანადგურებს!"),
      body: l(
        "A shocking new study proves that smartphones are destroying the brains of an entire generation. Researchers found that students who used their phones for more than four hours a day scored 8% lower on a memory test. “This is a disaster,” said one worried parent. Experts agree that urgent action is needed before it is too late. The study was carried out with 45 students from one school over two weeks.",
        "ახალი შოკისმომგვრელი კვლევა ამტკიცებს, რომ სმარტფონები მთელი თაობის ტვინს ანადგურებს. მკვლევრებმა აღმოაჩინეს, რომ მოსწავლეებმა, რომლებიც ტელეფონს დღეში ოთხ საათზე მეტს იყენებდნენ, მეხსიერების ტესტში 8%-ით დაბალი შედეგი აჩვენეს. „ეს კატასტროფაა“, — თქვა ერთმა შეშფოთებულმა მშობელმა. ექსპერტები თანხმდებიან, რომ სასწრაფო ზომებია საჭირო, სანამ გვიან არ არის. კვლევა ერთი სკოლის 45 მოსწავლეზე ორი კვირის განმავლობაში ჩატარდა.",
      ),
      label: FICTIONAL,
    },
    items: [
      multi(
        "m1-words",
        l("Which words or phrases are chosen mainly to create emotion? Select all that apply.", "რომელი სიტყვები ან ფრაზებია შერჩეული ძირითადად ემოციის გამოსაწვევად? მონიშნე ყველა შესაფერისი."),
        [
          [l("“shocking”", "„შოკისმომგვრელი“"), true],
          [l("“destroying”", "„ანადგურებს“"), true],
          [l("“disaster”", "„კატასტროფა“"), true],
          [l("“before it is too late”", "„სანამ გვიან არ არის“"), true],
          [l("“memory test”", "„მეხსიერების ტესტი“"), false],
          [l("“two weeks”", "„ორი კვირა“"), false],
        ],
        l("Loaded words push a feeling before the facts. Neutral words like “memory test” or “two weeks” describe what happened.", "ემოციური სიტყვები გრძნობას ფაქტებზე ადრე გვთავაზობს. ნეიტრალური სიტყვები, როგორიცაა „მეხსიერების ტესტი“ ან „ორი კვირა“, უბრალოდ აღწერს მომხდარს."),
      ),
      choice(
        "m1-headline",
        l("Does the headline match the evidence in the article?", "შეესაბამება სათაური სტატიაში მოყვანილ მტკიცებულებას?"),
        [
          ["a", l("Yes — 8% is proof of brain damage.", "კი — 8% ტვინის დაზიანების დადასტურებაა.")],
          ["b", l("No — a small study found an 8% lower test score; “destroying brains” is a large exaggeration.", "არა — მცირე კვლევამ ტესტში 8%-ით დაბალი შედეგი აჩვენა; „ტვინის განადგურება“ დიდი გაზვიადებაა.")],
          ["c", l("Yes, because a parent called it a disaster.", "კი, რადგან მშობელმა კატასტროფა უწოდა.")],
          ["d", l("It is impossible to learn anything from an article.", "სტატიიდან ვერაფერს გავიგებთ.")],
        ],
        "b",
        l("A slightly lower score on one test is very different from brain damage across a generation.", "ერთ ტესტში ოდნავ დაბალი შედეგი სულ სხვაა, ვიდრე მთელი თაობის ტვინის დაზიანება."),
      ),
      choice(
        "m1-experts",
        l("“Experts agree that urgent action is needed.” What is the problem with this sentence?", "„ექსპერტები თანხმდებიან, რომ სასწრაფო ზომებია საჭირო.“ რა პრობლემაა ამ წინადადებაში?"),
        [
          ["a", l("Experts are never right.", "ექსპერტები არასდროს არიან მართლები.")],
          ["b", l("Nothing — this is how science works.", "არაფერი — მეცნიერება ასე მუშაობს.")],
          ["c", l("No expert is named and no evidence is given that they agree.", "არც ერთი ექსპერტი არ არის დასახელებული და არ არის ნაჩვენები, რომ ისინი თანხმდებიან.")],
          ["d", l("The sentence is too long.", "წინადადება ძალიან გრძელია.")],
        ],
        "c",
        l("Vague references to “experts” cannot be checked. Good reporting names its sources.", "ბუნდოვანი მითითება „ექსპერტებზე“ ვერ გადამოწმდება. კარგი ჟურნალისტიკა წყაროებს ასახელებს."),
      ),
      multi(
        "m1-weak",
        l("Which details make the study weaker evidence than the headline suggests? Select all that apply.", "რომელი დეტალები ხდის კვლევას უფრო სუსტ მტკიცებულებად, ვიდრე სათაური გვთავაზობს? მონიშნე ყველა შესაფერისი."),
        [
          [l("Only 45 students took part", "მონაწილეობდა მხოლოდ 45 მოსწავლე"), true],
          [l("All participants were from one school", "ყველა მონაწილე ერთი სკოლიდან იყო"), true],
          [l("It lasted only two weeks", "მხოლოდ ორი კვირა გაგრძელდა"), true],
          [l("It shows a link, not that phones caused the lower scores", "აჩვენებს კავშირს და არა იმას, რომ დაბალი შედეგი ტელეფონებმა გამოიწვია"), true],
          [l("It used a memory test", "მასში მეხსიერების ტესტი გამოიყენეს"), false],
        ],
        l("Small, short, single-school studies are a starting point, not proof — and a link is not a cause.", "მცირე, ხანმოკლე, ერთ სკოლაში ჩატარებული კვლევა ამოსავალი წერტილია და არა დადასტურება — კავშირი კი მიზეზი არ არის."),
      ),
      choice(
        "m1-next",
        l("What is the best next step before sharing this article?", "რა არის საუკეთესო შემდეგი ნაბიჯი ამ სტატიის გაზიარებამდე?"),
        [
          ["a", l("Share it — warnings are always useful.", "გავაზიარო — გაფრთხილება ყოველთვის სასარგებლოა.")],
          ["b", l("Check how many likes it has.", "შევამოწმო, რამდენი მოწონება აქვს.")],
          ["c", l("Find the original study and see whether other reliable sources report it.", "ვიპოვო ორიგინალური კვლევა და ვნახო, წერენ თუ არა მასზე სხვა სანდო წყაროები.")],
          ["d", l("Ask the worried parent for more details.", "შეშფოთებულ მშობელს დეტალები ვკითხო.")],
        ],
        "c",
        l("Going to the original source and checking other reliable outlets is the core of verification.", "პირველწყაროსთან მისვლა და სხვა სანდო მედიის შემოწმება გადამოწმების საფუძველია."),
      ),
    ],
  },
  {
    id: "ct-media-2",
    kind: "media",
    topic: "misinformation",
    difficulty: 1,
    minutes: 8,
    title: l("Misinformation: a viral post", "მცდარი ინფორმაცია: ვირუსული პოსტი"),
    intro: l("A post is spreading in group chats. Decide what to check and how to respond kindly.", "ჯგუფურ ჩატებში პოსტი ვრცელდება. გადაწყვიტე, რა უნდა შეამოწმო და როგორ უპასუხო კეთილგანწყობით."),
    passage: {
      title: l("Post in a group chat", "პოსტი ჯგუფურ ჩატში"),
      body: l(
        "BREAKING!!! From next Monday ALL schools in the country will close for a month because of a new virus!!! Share before they delete this!!! [Photo: a crowded hospital corridor]",
        "სასწრაფოდ!!! მომავალი ორშაბათიდან ქვეყნის ყველა სკოლა ერთი თვით დაიხურება ახალი ვირუსის გამო!!! გააზიარეთ, სანამ წაშლიან!!! [ფოტო: ხალხით სავსე საავადმყოფოს დერეფანი]",
      ),
      label: FICTIONAL_POST,
    },
    items: [
      multi(
        "m2-signs",
        l("Which are warning signs in this post? Select all that apply.", "რომელია გამაფრთხილებელი ნიშნები ამ პოსტში? მონიშნე ყველა შესაფერისი."),
        [
          [l("No source or official body is named", "არც წყარო და არც ოფიციალური უწყებაა დასახელებული"), true],
          [l("Pressure to share quickly (“before they delete this”)", "სწრაფად გაზიარების მოწოდება („სანამ წაშლიან“)"), true],
          [l("Many capital letters and exclamation marks", "ბევრი ძახილის ნიშანი და ემოციური ტონი"), true],
          [l("A photo that may not be connected to the claim", "ფოტო, რომელიც შეიძლება მტკიცებას არ უკავშირდებოდეს"), true],
          [l("It mentions a day of the week", "მასში კვირის დღეა ნახსენები"), false],
        ],
        l("Missing sources, urgency and emotional style are classic signs. Mentioning a date is normal and not suspicious by itself.", "წყაროს არარსებობა, აჩქარება და ემოციური სტილი კლასიკური ნიშნებია. თარიღის ხსენება ჩვეულებრივია და თავისთავად საეჭვო არ არის."),
      ),
      choice(
        "m2-check",
        l("What is the most reliable way to check the claim?", "როგორ შეიძლება მტკიცების ყველაზე საიმედოდ შემოწმება?"),
        [
          ["a", l("Ask in the group chat whether anyone has heard about it.", "ჯგუფურ ჩატში ვიკითხო, ვინმეს თუ გაუგია.")],
          ["b", l("Look for an announcement on the Ministry of Education’s official website and in several established news outlets.", "მოვძებნო განცხადება განათლების სამინისტროს ოფიციალურ ვებგვერდზე და რამდენიმე აღიარებულ მედიასაშუალებაში.")],
          ["c", l("Check whether the post has many shares.", "შევამოწმო, ბევრჯერ არის თუ არა გაზიარებული.")],
          ["d", l("Trust it if the photo looks real.", "დავიჯერო, თუ ფოტო ნამდვილს ჰგავს.")],
        ],
        "b",
        l("A decision like closing all schools would be announced officially and reported by many outlets.", "ყველა სკოლის დახურვის მსგავს გადაწყვეტილებას ოფიციალურად გამოაცხადებდნენ და ბევრი მედია გააშუქებდა."),
      ),
      choice(
        "m2-photo",
        l("A reverse image search shows the photo was taken in another country in 2020. What does that tell you?", "სურათის უკუძიებამ აჩვენა, რომ ფოტო 2020 წელს სხვა ქვეყანაშია გადაღებული. რას გვეუბნება ეს?"),
        [
          ["a", l("The claim must be true, but the photo is old.", "მტკიცება ალბათ მართალია, უბრალოდ ფოტოა ძველი.")],
          ["b", l("Photos can never be checked.", "ფოტოების შემოწმება შეუძლებელია.")],
          ["c", l("It proves the virus is spreading worldwide.", "ეს ამტკიცებს, რომ ვირუსი მთელ მსოფლიოში ვრცელდება.")],
          ["d", l("The photo is used out of context — a common misinformation technique.", "ფოტო კონტექსტიდან ამოგლეჯილია — ეს მცდარი ინფორმაციის გავრცელებული ხერხია.")],
        ],
        "d",
        l("Old or unrelated images make false claims look real. It is a strong reason to distrust the post.", "ძველი ან შეუსაბამო ფოტოები ყალბ მტკიცებას სარწმუნოს ხდის. ეს პოსტის მიმართ უნდობლობის სერიოზული მიზეზია."),
      ),
      choice(
        "m2-respond",
        l("A friend has already shared the post. What is the most helpful reaction?", "მეგობარმა პოსტი უკვე გააზიარა. რა რეაქცია იქნება ყველაზე სასარგებლო?"),
        [
          ["a", l("Publicly tell them they are stupid for sharing it.", "საჯაროდ ვუთხრა, რომ სისულელე ჩაიდინა.")],
          ["b", l("Privately and politely tell them what you found, with a link to the official source.", "პირადად და თავაზიანად ვუთხრა, რა აღმოვაჩინე, და ოფიციალური წყაროს ბმული გავუზიარო.")],
          ["c", l("Ignore it — it doesn’t matter.", "ყურადღება არ მივაქციო — არ აქვს მნიშვნელობა.")],
          ["d", l("Share it too, just in case.", "მეც გავაზიარო, ყოველი შემთხვევისთვის.")],
        ],
        "b",
        l("People correct mistakes more easily when they are not embarrassed in public. Evidence plus kindness works best.", "ადამიანები შეცდომას უფრო ადვილად ასწორებენ, როცა საჯაროდ არ არცხვენენ. მტკიცებულება და კეთილგანწყობა საუკეთესოდ მუშაობს."),
      ),
    ],
  },

  // ---------------------------------------------------------- Source evaluation
  {
    id: "ct-sources-1",
    kind: "sources",
    topic: "source_evaluation",
    difficulty: 2,
    minutes: 10,
    title: l("Evaluating sources", "წყაროების შეფასება"),
    intro: l(
      "Six decisions a researcher makes: primary or secondary, how recent, who wrote it, how strong the evidence is, signs of bias and whether sources are really independent.",
      "ექვსი გადაწყვეტილება, რომელსაც მკვლევარი იღებს: პირველადი თუ მეორადი, რამდენად ახალი, ვინ დაწერა, რამდენად ძლიერია მტკიცებულება, მიკერძოების ნიშნები და მართლა დამოუკიდებელია თუ არა წყაროები.",
    ),
    items: [
      choice(
        "s1-primary",
        l("For a project on how the river in your town has changed, which is a primary source?", "პროექტისთვის იმაზე, როგორ შეიცვალა შენი ქალაქის მდინარე, რომელია პირველადი წყარო?"),
        [
          ["a", l("A textbook chapter about rivers", "სახელმძღვანელოს თავი მდინარეების შესახებ")],
          ["b", l("Water-quality measurements you took yourself", "წყლის ხარისხის გაზომვები, რომლებიც თავად ჩაატარე")],
          ["c", l("A news article summarising an environmental report", "გარემოსდაცვითი ანგარიშის შემაჯამებელი სტატია")],
          ["d", l("A video essay about pollution", "ვიდეოესე დაბინძურებაზე")],
        ],
        "b",
        l("Primary sources are original evidence: your own measurements, original data, documents or eyewitness accounts. The others report on such evidence.", "პირველადი წყარო ორიგინალური მტკიცებულებაა: შენი გაზომვები, ორიგინალური მონაცემები, დოკუმენტები ან თვითმხილველის ნაამბობი. დანარჩენები ასეთ მტკიცებულებაზე მოგვითხრობს."),
      ),
      choice(
        "s1-date",
        l("You are researching how teenagers use smartphones today. Which source is most appropriate?", "იკვლევ, როგორ იყენებენ დღეს მოზარდები სმარტფონებს. რომელი წყაროა ყველაზე შესაფერისი?"),
        [
          ["a", l("A 2009 article about mobile phones", "2009 წლის სტატია მობილურ ტელეფონებზე")],
          ["b", l("An undated forum post", "ფორუმის პოსტი თარიღის გარეშე")],
          ["c", l("A recent survey by a national statistics office", "ეროვნული სტატისტიკის სამსახურის ახალი გამოკითხვა")],
          ["d", l("An advert from a phone company", "ტელეფონების კომპანიის რეკლამა")],
        ],
        "c",
        l("For a fast-changing topic, recent data from an organisation with a clear method is best. Always note the date.", "სწრაფად ცვალებადი თემისთვის საუკეთესოა ახალი მონაცემები ორგანიზაციისგან, რომელსაც მკაფიო მეთოდოლოგია აქვს. თარიღი ყოველთვის ჩაინიშნე."),
      ),
      choice(
        "s1-author",
        l("A website about sugar and health is run by a company that sells sweets. What should you do?", "ვებგვერდს შაქრისა და ჯანმრთელობის შესახებ ტკბილეულის მწარმოებელი კომპანია მართავს. რა უნდა გააკეთო?"),
        [
          ["a", l("Reject everything it says.", "უარვყო ყველაფერი, რასაც წერს.")],
          ["b", l("Use it with care and check its claims against independent sources, such as health organisations.", "სიფრთხილით გამოვიყენო და მისი მტკიცებები დამოუკიდებელ წყაროებს, მაგალითად ჯანდაცვის ორგანიზაციებს, შევადარო.")],
          ["c", l("Trust it — companies know their products best.", "ვენდო — კომპანიებმა თავიანთი პროდუქცია ყველაზე კარგად იციან.")],
          ["d", l("Use it only if the design looks professional.", "გამოვიყენო მხოლოდ მაშინ, თუ დიზაინი პროფესიონალურად გამოიყურება.")],
        ],
        "b",
        l("A conflict of interest does not make every claim false, but it means independent confirmation is needed.", "ინტერესთა კონფლიქტი ყველა მტკიცებას მცდარს არ ხდის, მაგრამ დამოუკიდებელ დადასტურებას მოითხოვს."),
      ),
      choice(
        "s1-evidence",
        l("Which is the strongest evidence that a new reading programme works?", "რომელია ყველაზე ძლიერი მტკიცებულება, რომ ახალი საკითხავი პროგრამა მუშაობს?"),
        [
          ["a", l("The programme’s website has many positive reviews.", "პროგრამის ვებგვერდზე ბევრი დადებითი შეფასებაა.")],
          ["b", l("One teacher says students seem happier.", "ერთი მასწავლებელი ამბობს, რომ მოსწავლეები უფრო ბედნიერები ჩანან.")],
          ["c", l("It is used in 50 schools.", "მას 50 სკოლა იყენებს.")],
          ["d", l("Classes randomly chosen to use it improved more than similar classes that did not.", "შემთხვევით შერჩეულმა კლასებმა, რომლებიც მას იყენებდნენ, უფრო მეტად გაიუმჯობესეს შედეგები, ვიდრე მსგავსმა კლასებმა, რომლებიც არ იყენებდნენ.")],
        ],
        "d",
        l("A fair comparison with a control group is much stronger than reviews, impressions or popularity.", "საკონტროლო ჯგუფთან სამართლიანი შედარება ბევრად ძლიერია, ვიდრე შეფასებები, შთაბეჭდილებები ან პოპულარობა."),
      ),
      multi(
        "s1-bias",
        l("Which could be signs that a source is one-sided? Select all that apply.", "რა შეიძლება იყოს წყაროს ცალმხრივობის ნიშანი? მონიშნე ყველა შესაფერისი."),
        [
          [l("It presents arguments for only one view", "მხოლოდ ერთი მოსაზრების არგუმენტებს წარმოადგენს"), true],
          [l("It uses emotional language instead of evidence", "მტკიცებულების ნაცვლად ემოციურ ენას იყენებს"), true],
          [l("Its funder benefits from the conclusion", "დამფინანსებელი დასკვნით სარგებლობს"), true],
          [l("It includes a list of references", "მას წყაროების სია ახლავს"), false],
          [l("It explains the limits of its own data", "საკუთარი მონაცემების შეზღუდვებს ხსნის"), false],
        ],
        l("References and honest limitations are signs of care, not bias. One-sidedness, emotion instead of evidence and interested funders call for caution.", "წყაროების სია და შეზღუდვების გულახდილი აღიარება სიფრთხილის ნიშანია და არა მიკერძოების. ცალმხრივობა, ემოცია მტკიცებულების ნაცვლად და დაინტერესებული დამფინანსებელი სიფრთხილეს მოითხოვს."),
      ),
      choice(
        "s1-corroboration",
        l("Two websites report the same surprising statistic. Both link to the same blog post, which gives no source. How much does the second website add?", "ორი ვებგვერდი ერთსა და იმავე მოულოდნელ სტატისტიკას აქვეყნებს. ორივე ერთი და იმავე ბლოგის პოსტს უთითებს, რომელიც წყაროს არ ასახელებს. რამდენს მატებს მეორე ვებგვერდი?"),
        [
          ["a", l("Very little — both rely on one unverified source.", "ძალიან ცოტას — ორივე ერთ გადაუმოწმებელ წყაროს ეყრდნობა.")],
          ["b", l("It doubles the reliability.", "სანდოობას აორმაგებს.")],
          ["c", l("It proves the statistic is true.", "ამტკიცებს, რომ სტატისტიკა სწორია.")],
          ["d", l("It shows the blog is written by an expert.", "აჩვენებს, რომ ბლოგი ექსპერტს ეკუთვნის.")],
        ],
        "a",
        l("Corroboration means independent confirmation. Copies of the same source are not independent.", "დადასტურება დამოუკიდებელ წყაროს ნიშნავს. ერთი და იმავე წყაროს ასლები დამოუკიდებელი არ არის."),
      ),
    ],
  },
];
