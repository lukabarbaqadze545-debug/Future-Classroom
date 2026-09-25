import { l } from "../localized";
import type { Experiment } from "./types";

/*
 * Classroom experiments. They need the real materials listed — the platform
 * guides, records and reviews them; it does not pretend to run them.
 */

const GOGGLES = l("Wear eye protection.", "გაიკეთე დამცავი სათვალე.");
const HOT_WATER = l("Hot water can scald: an adult pours it, and cups stand on a stable, heat-proof surface.", "ცხელმა წყალმა შეიძლება დაგწვას: ასხამს ზრდასრული, ჭიქები კი მდგრად, თბოგამძლე ზედაპირზე დგას.");

export const EXPERIMENTS: Experiment[] = [
  {
    id: "pendulum",
    subject: "physics",
    difficulty: 1,
    grades: [7, 10],
    minutes: 40,
    title: l("What sets the rhythm of a pendulum?", "რა განსაზღვრავს ქანქარის რიტმს?"),
    summary: l("Change the length of a pendulum and time its swings to find what affects the period.", "შეცვალე ქანქარის სიგრძე, გაზომე რხევების დრო და გაარკვიე, რაზეა დამოკიდებული პერიოდი."),
    objectives: [
      l("Measure the period of a pendulum accurately by timing ten swings.", "ქანქარის პერიოდის ზუსტად გაზომვა ათი რხევის დროის აღებით."),
      l("Test one variable at a time (length) while keeping others fixed.", "ერთი ცვლადის (სიგრძის) შემოწმება ისე, რომ დანარჩენი უცვლელი დარჩეს."),
      l("Describe the relationship between length and period.", "სიგრძესა და პერიოდს შორის კავშირის აღწერა."),
    ],
    materials: [
      l("String (about 1 m)", "ძაფი (დაახლოებით 1 მ)"),
      l("A small mass, e.g. a washer or a bag of coins", "პატარა ტვირთი, მაგ. საყელური ან მონეტებიანი პარკი"),
      l("Stand or a table edge and tape", "შტატივი ან მაგიდის კიდე და წებოვანი ლენტი"),
      l("Ruler or measuring tape", "სახაზავი ან საზომი ლენტი"),
      l("Stopwatch (a phone is fine)", "წამზომი (ტელეფონიც გამოდგება)"),
    ],
    safety: [l("Keep the swinging mass away from faces and keep swings small (less than 20°).", "მოქანავე ტვირთი სახეს მოარიდე და რხევები პატარა იყოს (20°-ზე ნაკლები).")],
    procedure: [
      l("Tie the mass to the string and fix the string so the pendulum is 20 cm long (from the fixing point to the middle of the mass).", "ტვირთი ძაფზე მიაბი და ძაფი ისე დაამაგრე, რომ ქანქარის სიგრძე 20 სმ იყოს (დამაგრების წერტილიდან ტვირთის შუამდე)."),
      l("Pull the mass a little to the side (small angle) and let go without pushing.", "ტვირთი ოდნავ გვერდზე გადაწიე (მცირე კუთხით) და უბიძგებლად გაუშვი."),
      l("Time 10 complete swings (there and back). Divide by 10 to get the period.", "გაზომე 10 სრული რხევის (წასვლა-დაბრუნების) დრო. გაყავი 10-ზე — ეს არის პერიოდი."),
      l("Repeat for lengths of 40, 60 and 80 cm. Keep the mass and the starting angle the same.", "გაიმეორე 40, 60 და 80 სმ სიგრძისთვის. ტვირთი და საწყისი კუთხე არ შეცვალო."),
      l("If you have time, change only the mass at one length to see whether it matters.", "თუ დრო გაქვს, ერთ სიგრძეზე მხოლოდ ტვირთი შეცვალე და ნახე, აქვს თუ არა მნიშვნელობა."),
    ],
    prediction: l("What do you predict will happen to the period when the pendulum gets longer? Why?", "რა მოუვა პერიოდს, როცა ქანქარა დაგრძელდება? რატომ ფიქრობ ასე?"),
    table: {
      columns: [l("Length (cm)", "სიგრძე (სმ)"), l("Time for 10 swings (s)", "10 რხევის დრო (წმ)"), l("Period (s)", "პერიოდი (წმ)")],
      rows: 4,
    },
    observationsPrompt: l("What pattern do you see in your table? Did anything surprise you?", "რა კანონზომიერებას ხედავ ცხრილში? რამე თუ გაგიკვირდა?"),
    expected: l(
      "Longer pendulums swing more slowly: the period grows with length (about with the square root of the length — four times longer gives about twice the period). The mass makes almost no difference. For 20 cm the period is about 0.9 s; for 80 cm about 1.8 s.",
      "გრძელი ქანქარა უფრო ნელა ირხევა: პერიოდი სიგრძესთან ერთად იზრდება (დაახლოებით სიგრძის კვადრატული ფესვის პროპორციულად — ოთხჯერ გრძელ ქანქარას დაახლოებით ორჯერ მეტი პერიოდი აქვს). ტვირთის მასა თითქმის არაფერს ცვლის. 20 სმ-ზე პერიოდი დაახლოებით 0,9 წმ-ია, 80 სმ-ზე — დაახლოებით 1,8 წმ.",
    ),
    reflection: [
      l("Why is it better to time ten swings instead of one?", "რატომ ჯობია ათი რხევის დროის გაზომვა ერთის ნაცვლად?"),
      l("Which variables did you keep the same, and why was that important?", "რომელი ცვლადები დატოვე უცვლელი და რატომ იყო ეს მნიშვნელოვანი?"),
      l("Where are pendulums or similar swings used in everyday life?", "სად გამოიყენება ქანქარა ან მსგავსი რხევები ყოველდღიურ ცხოვრებაში?"),
    ],
  },
  {
    id: "density",
    subject: "physics",
    difficulty: 2,
    grades: [7, 9],
    minutes: 45,
    title: l("Sink or float? Measuring density", "ჩაიძირება თუ ტივტივებს? სიმკვრივის გაზომვა"),
    summary: l("Measure mass and volume of everyday objects, calculate density and predict which ones float in water.", "გაზომე ყოველდღიური საგნების მასა და მოცულობა, გამოთვალე სიმკვრივე და იწინასწარმეტყველე, რომელი დარჩება წყლის ზედაპირზე."),
    objectives: [
      l("Measure volume by water displacement.", "მოცულობის გაზომვა წყლის გამოდევნით."),
      l("Calculate density as mass ÷ volume.", "სიმკვრივის გამოთვლა ფორმულით: მასა ÷ მოცულობა."),
      l("Explain floating and sinking using density.", "ტივტივისა და ჩაძირვის ახსნა სიმკვრივის საშუალებით."),
    ],
    materials: [
      l("Kitchen or lab scale (grams)", "სამზარეულოს ან ლაბორატორიული სასწორი (გრამებში)"),
      l("Measuring cylinder or jug with ml marks", "საზომი ცილინდრი ან დანაყოფებიანი დოქი (მლ)"),
      l("Water", "წყალი"),
      l("5–6 small objects: stone, cork, eraser, plastic toy, key, apple piece", "5–6 პატარა საგანი: ქვა, საცობი, საშლელი, პლასტმასის სათამაშო, გასაღები, ვაშლის ნაჭერი"),
    ],
    safety: [l("Wipe up spilled water immediately to avoid slipping.", "დაღვრილი წყალი მაშინვე მოწმინდე, რომ არ მოსრიალდე.")],
    procedure: [
      l("Weigh each object and write down its mass in grams.", "აწონე თითოეული საგანი და ჩაწერე მასა გრამებში."),
      l("Fill the cylinder to a known level (e.g. 50 ml). Lower the object in gently and read the new level. The difference is the volume in cm³.", "ცილინდრი გარკვეულ ნიშნულამდე შეავსე (მაგ. 50 მლ). ფრთხილად ჩაუშვი საგანი და წაიკითხე ახალი დონე. სხვაობა არის მოცულობა სმ³-ში."),
      l("For objects that float, push them just under the surface with a thin stick to measure their volume.", "მოტივტივე საგნები თხელი ჯოხით წყლის ზედაპირის ქვემოთ ოდნავ ჩაძირე, რომ მოცულობა გაზომო."),
      l("Calculate density = mass ÷ volume for each object.", "თითოეული საგნისთვის გამოთვალე სიმკვრივე = მასა ÷ მოცულობა."),
      l("Predict, then test, whether each object floats in water (density 1 g/cm³).", "ჯერ იწინასწარმეტყველე, შემდეგ შეამოწმე, ტივტივებს თუ არა თითოეული საგანი წყალში (სიმკვრივე 1 გ/სმ³)."),
    ],
    prediction: l("Which of your objects will float? What do they have in common?", "შენი საგნებიდან რომელი დარჩება ზედაპირზე? რა აქვთ მათ საერთო?"),
    table: {
      columns: [l("Object", "საგანი"), l("Mass (g)", "მასა (გ)"), l("Volume (cm³)", "მოცულობა (სმ³)"), l("Density (g/cm³)", "სიმკვრივე (გ/სმ³)"), l("Floats?", "ტივტივებს?")],
      rows: 6,
    },
    observationsPrompt: l("Compare your densities with 1 g/cm³. Which results match your floating test?", "შეადარე შენი სიმკვრივეები 1 გ/სმ³-ს. რომელი შედეგი ემთხვევა ტივტივის შემოწმებას?"),
    expected: l(
      "Objects with a density below about 1 g/cm³ (cork, most plastics, apple) float; objects above it (stone, metal key, most erasers) sink. Shape does not change density, but boats float because their hollow shape makes their average density low.",
      "საგნები, რომელთა სიმკვრივე დაახლოებით 1 გ/სმ³-ზე ნაკლებია (საცობი, პლასტმასის უმეტესობა, ვაშლი), ტივტივებს; უფრო მკვრივები (ქვა, ლითონის გასაღები, საშლელების უმეტესობა) იძირება. ფორმა სიმკვრივეს არ ცვლის, მაგრამ გემი იმიტომ ტივტივებს, რომ ღრუ ფორმის გამო მისი საშუალო სიმკვრივე დაბალია.",
    ),
    reflection: [
      l("Which measurement was hardest to make accurately, and how could you improve it?", "რომელი გაზომვა იყო ყველაზე რთული ზუსტად ჩასატარებლად და როგორ გააუმჯობესებდი?"),
      l("How can a steel ship float if steel is denser than water?", "როგორ ტივტივებს ფოლადის გემი, თუ ფოლადი წყალზე მკვრივია?"),
    ],
  },
  {
    id: "cabbage-ph",
    subject: "chemistry",
    difficulty: 1,
    grades: [7, 10],
    minutes: 45,
    title: l("Red cabbage pH indicator", "წითელი კომბოსტოს pH ინდიკატორი"),
    summary: l("Make a natural indicator from red cabbage and use its colour to sort household liquids into acids and bases.", "წითელი კომბოსტოსგან დაამზადე ბუნებრივი ინდიკატორი და ფერის მიხედვით დაახარისხე საყოფაცხოვრებო სითხეები მჟავებად და ფუძეებად."),
    objectives: [
      l("Prepare a natural acid–base indicator.", "ბუნებრივი მჟავა-ფუძე ინდიკატორის მომზადება."),
      l("Classify substances as acidic, neutral or basic by colour.", "ნივთიერებების კლასიფიკაცია მჟავა, ნეიტრალურ ან ფუძე ნივთიერებებად ფერის მიხედვით."),
      l("Relate colour changes to the pH scale.", "ფერის ცვლილების დაკავშირება pH სკალასთან."),
    ],
    materials: [
      l("Red cabbage leaves and hot water (prepared by the teacher)", "წითელი კომბოსტოს ფოთლები და ცხელი წყალი (ამზადებს მასწავლებელი)"),
      l("Clear cups or test tubes", "გამჭვირვალე ჭიქები ან სინჯარები"),
      l("Lemon juice, vinegar, water, baking soda solution, soap solution, a clear soft drink", "ლიმონის წვენი, ძმარი, წყალი, საჭმლის სოდის ხსნარი, საპნის ხსნარი, გამჭვირვალე გაზიანი სასმელი"),
      l("Droppers or teaspoons, labels", "პიპეტები ან ჩაის კოვზები, ეტიკეტები"),
    ],
    safety: [
      GOGGLES,
      HOT_WATER,
      l("Never taste anything in the lab. Do not use strong cleaning products such as bleach or drain cleaner.", "ლაბორატორიაში არაფერი გასინჯო. არ გამოიყენო ძლიერი საწმენდი საშუალებები, მაგალითად მათეთრებელი ან მილების საწმენდი."),
    ],
    procedure: [
      l("Your teacher soaks chopped red cabbage in hot water for 10 minutes and pours off the purple liquid (the indicator).", "მასწავლებელი დაჭრილ წითელ კომბოსტოს ცხელ წყალში 10 წუთით აჩერებს და იისფერ სითხეს (ინდიკატორს) გადაწურავს."),
      l("Put the same amount of indicator into each labelled cup.", "ყოველ მარკირებულ ჭიქაში ერთნაირი რაოდენობის ინდიკატორი ჩაასხი."),
      l("Add a few drops or a teaspoon of one test liquid to each cup. Keep one cup with indicator only, for comparison.", "თითოეულ ჭიქაში ერთი საცდელი სითხის რამდენიმე წვეთი ან ერთი კოვზი დაამატე. ერთი ჭიქა შედარებისთვის მხოლოდ ინდიკატორით დატოვე."),
      l("Record the colour and estimate the pH using the colour chart: red/pink ≈ 2–4, purple ≈ 6–7, blue ≈ 8, green ≈ 9–11, yellow ≈ 12.", "ჩაიწერე ფერი და ფერების სკალით შეაფასე pH: წითელი/ვარდისფერი ≈ 2–4, იისფერი ≈ 6–7, ლურჯი ≈ 8, მწვანე ≈ 9–11, ყვითელი ≈ 12."),
    ],
    prediction: l("Which liquids do you think are acids, and which are bases?", "რომელი სითხე მიგაჩნია მჟავად და რომელი ფუძედ?"),
    table: {
      columns: [l("Liquid", "სითხე"), l("Colour", "ფერი"), l("Estimated pH", "სავარაუდო pH"), l("Acid / neutral / base", "მჟავა / ნეიტრალური / ფუძე")],
      rows: 6,
    },
    observationsPrompt: l("Describe the colour changes. Which liquid gave the strongest change?", "აღწერე ფერის ცვლილებები. რომელმა სითხემ გამოიწვია ყველაზე ძლიერი ცვლილება?"),
    expected: l(
      "Lemon juice and vinegar turn the indicator red or pink (acidic, pH about 2–3). Water stays purple (neutral). Baking soda turns it blue-green (weakly basic, pH about 8–9); soap solution usually green (basic). The soft drink is acidic.",
      "ლიმონის წვენი და ძმარი ინდიკატორს წითლად ან ვარდისფრად აფერადებს (მჟავა, pH დაახლ. 2–3). წყალი იისფერი რჩება (ნეიტრალური). საჭმლის სოდა ლურჯ-მწვანედ აფერადებს (სუსტი ფუძე, pH დაახლ. 8–9), საპნის ხსნარი — ჩვეულებრივ მწვანედ (ფუძე). გაზიანი სასმელი მჟავაა.",
    ),
    reflection: [
      l("Why did we keep one cup with indicator only?", "რატომ დავტოვეთ ერთი ჭიქა მხოლოდ ინდიკატორით?"),
      l("How could you get a more exact pH value?", "როგორ მიიღებდი უფრო ზუსტ pH მნიშვნელობას?"),
    ],
  },
  {
    id: "yeast",
    subject: "biology",
    difficulty: 2,
    grades: [8, 11],
    minutes: 50,
    title: l("Yeast, sugar and temperature", "საფუარი, შაქარი და ტემპერატურა"),
    summary: l("Yeast releases carbon dioxide when it uses sugar. Compare how fast balloons inflate at different temperatures.", "საფუარი შაქრის გამოყენებისას ნახშირორჟანგს გამოყოფს. შეადარე, რა სისწრაფით იბერება ბუშტები სხვადასხვა ტემპერატურაზე."),
    objectives: [
      l("Observe respiration in living yeast cells.", "ცოცხალ საფუარის უჯრედებში სუნთქვაზე დაკვირვება."),
      l("Design a fair test that changes only temperature.", "სამართლიანი ცდის დაგეგმვა, რომელშიც მხოლოდ ტემპერატურა იცვლება."),
      l("Explain the effect of temperature on enzymes.", "ტემპერატურის გავლენის ახსნა ფერმენტებზე."),
    ],
    materials: [
      l("3 small plastic bottles and 3 balloons", "3 პატარა პლასტმასის ბოთლი და 3 ბუშტი"),
      l("Dry yeast (3 teaspoons) and sugar (6 teaspoons)", "მშრალი საფუარი (3 ჩაის კოვზი) და შაქარი (6 ჩაის კოვზი)"),
      l("Cold, lukewarm (about 35 °C) and hot (about 60 °C) water", "ცივი, თბილი (დაახლ. 35 °C) და ცხელი (დაახლ. 60 °C) წყალი"),
      l("Thermometer, funnel, string and ruler", "თერმომეტრი, ძაბრი, ძაფი და სახაზავი"),
    ],
    safety: [HOT_WATER, l("Do not drink the mixtures; wash hands afterwards.", "ნარევები არ დალიო; ბოლოს ხელები დაიბანე.")],
    procedure: [
      l("Put 1 teaspoon of yeast and 2 teaspoons of sugar into each bottle.", "თითოეულ ბოთლში ჩაყარე 1 კოვზი საფუარი და 2 კოვზი შაქარი."),
      l("Add 100 ml of water: cold to bottle A, lukewarm to B, hot to C. Measure each temperature.", "დაამატე 100 მლ წყალი: ცივი A ბოთლში, თბილი — B-ში, ცხელი — C-ში. გაზომე თითოეულის ტემპერატურა."),
      l("Swirl gently and stretch a balloon over each neck.", "ფრთხილად შეანჯღრიე და თითოეული ბოთლის ყელზე ბუშტი ჩამოაცვი."),
      l("Every 10 minutes, measure the balloon’s circumference with string and a ruler.", "ყოველ 10 წუთში გაზომე ბუშტის გარშემოწერილობა ძაფით და სახაზავით."),
    ],
    prediction: l("Which balloon will inflate fastest? Will any not inflate at all?", "რომელი ბუშტი გაიბერება ყველაზე სწრაფად? შეიძლება რომელიმე საერთოდ არ გაიბეროს?"),
    table: {
      columns: [l("Time (min)", "დრო (წთ)"), l("A cold (cm)", "A ცივი (სმ)"), l("B lukewarm (cm)", "B თბილი (სმ)"), l("C hot (cm)", "C ცხელი (სმ)")],
      rows: 4,
    },
    observationsPrompt: l("Describe what happened in each bottle. Did the foam or smell differ?", "აღწერე, რა მოხდა თითოეულ ბოთლში. განსხვავდებოდა ქაფი ან სუნი?"),
    expected: l(
      "The lukewarm bottle inflates fastest: yeast enzymes work best around 30–40 °C. Cold water slows the process. Very hot water (about 60 °C) damages the yeast, so that balloon inflates little or not at all.",
      "ყველაზე სწრაფად თბილი ბოთლის ბუშტი იბერება: საფუარის ფერმენტები საუკეთესოდ დაახლ. 30–40 °C-ზე მუშაობს. ცივი წყალი პროცესს ანელებს. ძალიან ცხელი წყალი (დაახლ. 60 °C) საფუარს აზიანებს, ამიტომ ეს ბუშტი ცოტა ან საერთოდ არ იბერება.",
    ),
    reflection: [
      l("Which variables did you control to keep the test fair?", "რომელ ცვლადებს აკონტროლებდი, რომ ცდა სამართლიანი ყოფილიყო?"),
      l("Why is this process useful when baking bread?", "რატომ არის ეს პროცესი სასარგებლო პურის ცხობისას?"),
    ],
  },
  {
    id: "plant-light",
    subject: "biology",
    difficulty: 1,
    grades: [7, 9],
    minutes: 30,
    title: l("Do plants need light to grow?", "სჭირდება თუ არა მცენარეს სინათლე ზრდისთვის?"),
    summary: l("A two-week investigation: grow bean seedlings in light and in darkness and measure them every few days.", "ორკვირიანი კვლევა: გაზარდე ლობიოს აღმონაცენი სინათლეზე და სიბნელეში და რამდენიმე დღეში ერთხელ გაზომე."),
    objectives: [
      l("Run a longer investigation with repeated measurements.", "ხანგრძლივი კვლევის ჩატარება განმეორებითი გაზომვებით."),
      l("Compare height and colour of plants grown with and without light.", "სინათლეზე და სიბნელეში გაზრდილი მცენარეების სიმაღლისა და ფერის შედარება."),
      l("Connect the results to photosynthesis.", "შედეგების დაკავშირება ფოტოსინთეზთან."),
    ],
    materials: [
      l("6 bean seeds soaked overnight", "6 ღამით დალბობილი ლობიოს მარცვალი"),
      l("2 pots or cups with soil", "2 ქოთანი ან ჭიქა ნიადაგით"),
      l("A cupboard or a box for darkness", "კარადა ან ყუთი სიბნელისთვის"),
      l("Ruler and water", "სახაზავი და წყალი"),
    ],
    safety: [l("Wash hands after handling soil.", "ნიადაგთან მუშაობის შემდეგ ხელები დაიბანე.")],
    procedure: [
      l("Plant 3 seeds in each pot at the same depth and water them equally.", "თითოეულ ქოთანში ერთნაირ სიღრმეზე დათესე 3 მარცვალი და თანაბრად მორწყე."),
      l("Put one pot on a sunny windowsill and the other in a dark cupboard at the same temperature.", "ერთი ქოთანი მზიან ფანჯრის რაფაზე დადგი, მეორე — ბნელ კარადაში, იმავე ტემპერატურაზე."),
      l("Every 2–3 days, measure the tallest seedling in each pot and note its colour.", "ყოველ 2–3 დღეში გაზომე თითოეული ქოთნის ყველაზე მაღალი აღმონაცენი და ჩაინიშნე მისი ფერი."),
      l("Give both pots the same amount of water each time.", "ორივე ქოთანს ყოველ ჯერზე ერთნაირი რაოდენობის წყალი მიეცი."),
    ],
    prediction: l("Which plants will be taller after two weeks, and why?", "რომელი მცენარე იქნება უფრო მაღალი ორი კვირის შემდეგ და რატომ?"),
    table: {
      columns: [l("Day", "დღე"), l("Light: height (cm)", "სინათლე: სიმაღლე (სმ)"), l("Dark: height (cm)", "სიბნელე: სიმაღლე (სმ)"), l("Notes (colour, leaves)", "შენიშვნები (ფერი, ფოთლები)")],
      rows: 6,
    },
    observationsPrompt: l("Compare the two groups. Look at height, stem thickness, leaves and colour.", "შეადარე ორი ჯგუფი. დააკვირდი სიმაღლეს, ღეროს სისქეს, ფოთლებსა და ფერს."),
    expected: l(
      "Seedlings in the dark often grow taller at first but are thin, pale yellow and weak — they stretch to find light using the food stored in the seed. Plants in light are shorter, sturdier and green because they make chlorophyll and food by photosynthesis. Without light, the dark plants eventually die.",
      "სიბნელეში აღმონაცენი თავიდან ხშირად უფრო მაღალია, მაგრამ თხელი, ღია ყვითელი და სუსტია — ის სინათლის საძებნელად იწელება და თესლში დაგროვილ საკვებს იყენებს. სინათლეზე მცენარეები უფრო დაბალი, მტკიცე და მწვანეა, რადგან ქლოროფილს გამოიმუშავებენ და ფოტოსინთეზით საკვებს ქმნიან. სინათლის გარეშე მცენარეები საბოლოოდ იღუპება.",
    ),
    reflection: [
      l("Was “taller” the same as “healthier” in this experiment? Explain.", "ამ ექსპერიმენტში „უფრო მაღალი“ ნიშნავდა „უფრო ჯანმრთელს“? ახსენი."),
      l("Why did we plant three seeds in each pot instead of one?", "რატომ დავთესეთ თითოეულ ქოთანში სამი მარცვალი და არა ერთი?"),
    ],
  },
  {
    id: "conductors",
    subject: "physics",
    difficulty: 1,
    grades: [6, 8],
    minutes: 35,
    title: l("Conductors and insulators", "გამტარები და იზოლატორები"),
    summary: l("Build a simple circuit with a battery and a bulb, then test which materials let electricity through.", "ააწყე მარტივი წრედი ბატარეითა და ნათურით და შეამოწმე, რომელი მასალა ატარებს დენს."),
    objectives: [
      l("Build a complete circuit.", "სრული წრედის აწყობა."),
      l("Classify materials as conductors or insulators by testing.", "მასალების დაყოფა გამტარებად და იზოლატორებად შემოწმების საფუძველზე."),
    ],
    materials: [
      l("1.5–4.5 V battery (AA batteries in a holder)", "1,5–4,5 ვ ბატარეა (AA ელემენტები კასეტაში)"),
      l("Small bulb in a holder or an LED with a resistor", "პატარა ნათურა ბუდით ან შუქდიოდი რეზისტორით"),
      l("3 wires with crocodile clips", "3 სადენი „ნიანგის“ სამაგრებით"),
      l("Test objects: coin, paper clip, pencil lead, eraser, plastic ruler, aluminium foil, wooden stick, rubber band", "საცდელი საგნები: მონეტა, ქაღალდის სამაგრი, ფანქრის გული, საშლელი, პლასტმასის სახაზავი, ალუმინის ფოლგა, ხის ჯოხი, რეზინი"),
    ],
    safety: [
      l("Use only batteries. Never experiment with wall sockets (mains electricity is dangerous).", "გამოიყენე მხოლოდ ბატარეები. არასდროს ჩაატარო ცდა კედლის როზეტთან (ქსელის დენი საშიშია)."),
      l("Disconnect the battery if a wire gets warm.", "თუ სადენი გათბება, ბატარეა გამორთე."),
    ],
    procedure: [
      l("Connect battery, bulb and wires in a loop, leaving a gap between two clips.", "შეაერთე ბატარეა, ნათურა და სადენები წრედად და ორ სამაგრს შორის ღიობი დატოვე."),
      l("Touch the two clips together: the bulb should light. This checks your circuit.", "ორი სამაგრი ერთმანეთს შეახე: ნათურა უნდა აინთოს. ასე წრედს ამოწმებ."),
      l("Clip each test object into the gap and record whether the bulb lights.", "თითოეული საცდელი საგანი ღიობში ჩაამაგრე და ჩაიწერე, ანთია თუ არა ნათურა."),
    ],
    prediction: l("Which objects do you think will make the bulb light?", "როგორ ფიქრობ, რომელი საგნები აანთებს ნათურას?"),
    table: {
      columns: [l("Object", "საგანი"), l("Material", "მასალა"), l("Bulb lights? (yes / dim / no)", "ანთია? (კი / მკრთალად / არა)"), l("Conductor or insulator", "გამტარი თუ იზოლატორი")],
      rows: 8,
    },
    observationsPrompt: l("What do the conductors have in common? Was any result surprising?", "რა აქვთ საერთო გამტარებს? რომელიმე შედეგი თუ იყო მოულოდნელი?"),
    expected: l(
      "Metals (coin, paper clip, foil) conduct well. Pencil lead (graphite) conducts too, usually making the bulb dimmer. Plastic, rubber, wood and paper are insulators.",
      "ლითონები (მონეტა, სამაგრი, ფოლგა) კარგად ატარებს დენს. ფანქრის გული (გრაფიტი) ასევე ატარებს, თუმცა ნათურა ჩვეულებრივ მკრთლად ანთია. პლასტმასი, რეზინი, ხე და ქაღალდი იზოლატორებია.",
    ),
    reflection: [
      l("Why are electrical wires made of copper covered with plastic?", "რატომ მზადდება ელექტროსადენები სპილენძისგან და იფარება პლასტმასით?"),
      l("Why did the pencil lead make the bulb dimmer than the coin?", "რატომ ანთია ნათურა ფანქრის გულით უფრო მკრთლად, ვიდრე მონეტით?"),
    ],
  },
  {
    id: "insulation",
    subject: "physics",
    difficulty: 2,
    grades: [8, 10],
    minutes: 50,
    title: l("Keeping heat in: testing insulation", "სითბოს შენარჩუნება: იზოლაციის შემოწმება"),
    summary: l("Wrap cups of hot water in different materials and measure how fast they cool.", "ცხელი წყლით სავსე ჭიქები სხვადასხვა მასალაში შეახვიე და გაზომე, რა სისწრაფით ცივდება."),
    objectives: [
      l("Collect temperature data over time.", "ტემპერატურის მონაცემების შეგროვება დროის მიხედვით."),
      l("Compare materials as thermal insulators.", "მასალების შედარება თბოიზოლატორებად."),
      l("Draw and interpret a cooling curve.", "გაციების მრუდის აგება და ინტერპრეტაცია."),
    ],
    materials: [
      l("4 identical cups", "4 ერთნაირი ჭიქა"),
      l("Wrapping materials: wool/fabric, aluminium foil, newspaper, bubble wrap", "შესახვევი მასალები: მატყლი/ქსოვილი, ალუმინის ფოლგა, გაზეთი, ბუშტუკოვანი შესაფუთი"),
      l("Hot water (about 60 °C), thermometers, stopwatch", "ცხელი წყალი (დაახლ. 60 °C), თერმომეტრები, წამზომი"),
    ],
    safety: [HOT_WATER],
    procedure: [
      l("Wrap three cups in different materials; leave one unwrapped as the control.", "სამი ჭიქა სხვადასხვა მასალაში შეახვიე; ერთი შეუხვეველი დატოვე — ეს საკონტროლო ჭიქაა."),
      l("Pour the same volume of hot water into each cup and cover them with the same lid.", "თითოეულ ჭიქაში ერთნაირი მოცულობის ცხელი წყალი ჩაასხი და ერთნაირი სახურავით დაფარე."),
      l("Measure the temperature in each cup every 5 minutes for 25 minutes.", "25 წუთის განმავლობაში ყოველ 5 წუთში გაზომე თითოეულ ჭიქაში ტემპერატურა."),
    ],
    prediction: l("Which material will keep the water hottest? Why?", "რომელი მასალა შეინარჩუნებს წყალს ყველაზე ცხლად? რატომ?"),
    table: {
      columns: [l("Time (min)", "დრო (წთ)"), l("No wrap (°C)", "შეუხვეველი (°C)"), l("Wool (°C)", "მატყლი (°C)"), l("Foil (°C)", "ფოლგა (°C)"), l("Paper (°C)", "გაზეთი (°C)")],
      rows: 6,
    },
    observationsPrompt: l("Which cup cooled fastest? Is cooling faster at the start or at the end?", "რომელი ჭიქა გაცივდა ყველაზე სწრაფად? გაციება უფრო სწრაფია თავიდან თუ ბოლოს?"),
    expected: l(
      "Materials that trap air (wool, bubble wrap, crumpled paper) insulate best. The unwrapped cup cools fastest. All cups cool faster at the start, when the difference from room temperature is largest.",
      "საუკეთესო იზოლატორია მასალები, რომლებიც ჰაერს იჭერს (მატყლი, ბუშტუკოვანი შესაფუთი, დაჭმუჭნული ქაღალდი). შეუხვეველი ჭიქა ყველაზე სწრაფად ცივდება. ყველა ჭიქა თავიდან უფრო სწრაფად ცივდება, როცა ოთახის ტემპერატურასთან სხვაობა ყველაზე დიდია.",
    ),
    reflection: [
      l("Why did we need a cup without any wrapping?", "რატომ დაგვჭირდა შეუხვეველი ჭიქა?"),
      l("How is this experiment related to insulating houses in winter?", "როგორ უკავშირდება ეს ცდა ზამთარში სახლების დათბუნებას?"),
    ],
  },
  {
    id: "reaction-time",
    subject: "mathematics",
    difficulty: 2,
    grades: [8, 11],
    minutes: 30,
    title: l("Measuring reaction time with a ruler", "რეაქციის დროის გაზომვა სახაზავით"),
    summary: l("Catch a falling ruler, then use the physics of free fall to turn the distance into a reaction time.", "დაიჭირე ვარდნილი სახაზავი და თავისუფალი ვარდნის ფორმულით მანძილი რეაქციის დროდ გადააქციე."),
    objectives: [
      l("Collect repeated measurements and calculate a mean.", "განმეორებითი გაზომვების შეგროვება და საშუალოს გამოთვლა."),
      l("Use the formula t = √(2d ÷ g) with d in metres.", "ფორმულის გამოყენება: t = √(2d ÷ g), სადაც d მეტრებშია."),
      l("Compare conditions, e.g. dominant and non-dominant hand.", "პირობების შედარება, მაგ. წამყვანი და არაწამყვანი ხელი."),
    ],
    materials: [l("30 cm ruler", "30 სმ სახაზავი"), l("A partner", "პარტნიორი"), l("Calculator", "კალკულატორი")],
    safety: [l("Drop the ruler only from a short height, straight down, away from faces.", "სახაზავი მხოლოდ მცირე სიმაღლიდან, პირდაპირ ქვემოთ, სახისგან მოშორებით ჩამოუშვი.")],
    procedure: [
      l("Your partner holds the ruler at the 30 cm end. Hold your thumb and finger open at the 0 mark, without touching it.", "პარტნიორს სახაზავი 30 სმ-იანი ბოლოთი უჭირავს. შენ ცერა და საჩვენებელი თითები გახსნილი გაქვს 0 ნიშნულთან, სახაზავს არ ეხები."),
      l("Without warning, your partner lets go. Catch it as fast as you can and read the distance d (cm) at your fingers.", "პარტნიორი უცებ უშვებს სახაზავს. რაც შეიძლება სწრაფად დაიჭირე და თითებთან წაიკითხე მანძილი d (სმ)."),
      l("Repeat 5 times with each hand.", "გაიმეორე 5-ჯერ თითოეული ხელით."),
      l("Convert each distance into time: t = √(2 × d ÷ 100 ÷ 9.81) seconds.", "თითოეული მანძილი დროდ გადაიყვანე: t = √(2 × d ÷ 100 ÷ 9,81) წამი."),
    ],
    prediction: l("Will your dominant hand be faster? By how much, roughly?", "იქნება თუ არა წამყვანი ხელი უფრო სწრაფი? დაახლოებით რამდენით?"),
    table: {
      columns: [l("Attempt", "ცდა"), l("Hand", "ხელი"), l("Distance d (cm)", "მანძილი d (სმ)"), l("Reaction time (s)", "რეაქციის დრო (წმ)")],
      rows: 10,
    },
    observationsPrompt: l("Calculate the mean time for each hand. How much do your attempts vary?", "გამოთვალე თითოეული ხელის საშუალო დრო. რამდენად განსხვავდება ცდები ერთმანეთისგან?"),
    expected: l(
      "Typical distances are 10–20 cm, which gives reaction times of about 0.14–0.20 s. Results vary between attempts, which is why we repeat and use the mean. Many people are slightly faster with their dominant hand, but not everyone.",
      "ჩვეულებრივი მანძილია 10–20 სმ, რაც დაახლ. 0,14–0,20 წმ რეაქციის დროს შეესაბამება. შედეგები ცდიდან ცდამდე იცვლება — ამიტომ ვიმეორებთ და საშუალოს ვიყენებთ. ბევრი ადამიანი წამყვანი ხელით ოდნავ სწრაფია, მაგრამ არა ყველა.",
    ),
    reflection: [
      l("Why does the ruler method work — what does the distance tell us?", "რატომ მუშაობს სახაზავის მეთოდი — რას გვეუბნება მანძილი?"),
      l("How could guessing the moment of release spoil the results?", "როგორ შეიძლება გაშვების მომენტის გამოცნობამ შედეგები გააფუჭოს?"),
    ],
  },
];

export function findExperiment(id: string) {
  return EXPERIMENTS.find((e) => e.id === id) ?? null;
}
