import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const GEOGRAPHY: BiLesson[] = [
  {
    group: "georgia-relief",
    subject: "geography",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /relief|landform|caucasus|physical geography of georgia|რელიეფ|კავკასიონ|საქართველოს ფიზიკური გეოგრაფი/i,
    title: l("Georgia's Landforms, Rivers and Climate Zones", "საქართველოს რელიეფი, მდინარეები და კლიმატური ზონები"),
    topic: l("Physical geography of Georgia", "საქართველოს ფიზიკური გეოგრაფია"),
    objective: l(
      "Students describe the main landforms of Georgia, locate major rivers, and explain why western and eastern Georgia have different climates.",
      "მოსწავლეები აღწერენ საქართველოს რელიეფის ძირითად ფორმებს, რუკაზე პოულობენ მთავარ მდინარეებს და ხსნიან, რატომ აქვს დასავლეთ და აღმოსავლეთ საქართველოს განსხვავებული კლიმატი.",
    ),
    objectives: [
      l("Name and locate the Greater Caucasus, the Lesser Caucasus, the Kolkheti Lowland and the Likhi Range.", "დაასახელოს და რუკაზე აჩვენოს დიდი კავკასიონი, მცირე კავკასიონი, კოლხეთის დაბლობი და ლიხის ქედი."),
      l("Name major rivers and the seas they flow to.", "დაასახელოს მთავარი მდინარეები და ზღვები, რომლებშიც ისინი ჩაედინება."),
      l("Explain the difference between the climates of western and eastern Georgia.", "ახსნას დასავლეთ და აღმოსავლეთ საქართველოს კლიმატებს შორის განსხვავება."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("A small country with great variety", "პატარა ქვეყანა დიდი მრავალფეროვნებით"),
        minutes: 5,
        body: l(
          `In a single day you can travel from the subtropical Black Sea coast near Batumi to snowy mountain passes. Georgia is small, but its landforms create very different landscapes and climates. Open a physical map of Georgia for this lesson.`,
          `ერთ დღეში შეგიძლია ბათუმის მახლობლად შავი ზღვის სუბტროპიკული სანაპიროდან თოვლიან მთის უღელტეხილებამდე იმოგზაურო. საქართველო პატარაა, მაგრამ მისი რელიეფი სრულიად განსხვავებულ ლანდშაფტებსა და კლიმატებს ქმნის. ამ გაკვეთილისთვის საქართველოს ფიზიკური რუკა გახსენი.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Mountains and lowlands", "მთები და დაბლობები"),
        minutes: 12,
        body: l(
          `• The Greater Caucasus runs along the north of the country. Its highest peaks rise above 5,000 m; Shkhara is the highest peak in Georgia, and Mkinvartsveri (Kazbek) is another famous summit.
• The Lesser Caucasus lies in the south; the volcanic Javakheti Plateau is part of the southern highlands.
• Between them lies a depression: the Kolkheti Lowland in the west and, in the east, plains and plateaus along the Mtkvari (Kura) and Alazani rivers.
• The Likhi Range connects the Greater and Lesser Caucasus and divides the country into western and eastern Georgia.`,
          `• დიდი კავკასიონი ქვეყნის ჩრდილოეთით გადაჭიმულია. მისი უმაღლესი მწვერვალები 5000 მეტრს აღემატება; შხარა საქართველოს უმაღლესი მწვერვალია, მყინვარწვერი (ყაზბეგი) კი კიდევ ერთი ცნობილი მწვერვალი.
• მცირე კავკასიონი სამხრეთითაა; ვულკანური ჯავახეთის ზეგანი სამხრეთის მთიანეთის ნაწილია.
• მათ შორის ქვაბული მდებარეობს: დასავლეთით — კოლხეთის დაბლობი, აღმოსავლეთით კი — ვაკეები და ზეგნები მტკვრისა და ალაზნის გასწვრივ.
• ლიხის ქედი დიდ და მცირე კავკასიონს აერთებს და ქვეყანას დასავლეთ და აღმოსავლეთ საქართველოდ ყოფს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Rivers and two climates", "მდინარეები და ორი კლიმატი"),
        minutes: 12,
        body: l(
          `Rivers of western Georgia, such as the Rioni and the Enguri, flow to the Black Sea. The Mtkvari flows east through Tbilisi and on to the Caspian Sea; the Alazani and Iori join it on the way.

Western Georgia is open to moist air from the Black Sea and is protected from cold northern air by the Greater Caucasus, so it has a humid subtropical climate — Adjara around Batumi is one of the wettest places in Georgia. The Likhi Range blocks much of this moisture, so eastern Georgia is drier, with hotter summers and colder winters.`,
          `დასავლეთ საქართველოს მდინარეები, მაგალითად რიონი და ენგური, შავ ზღვაში ჩაედინება. მტკვარი აღმოსავლეთისკენ, თბილისის გავლით მიედინება და კასპიის ზღვაში ჩაედინება; გზად მას ალაზანი და იორი უერთდება.

დასავლეთ საქართველო შავი ზღვიდან მომავალი ნოტიო ჰაერისთვის ღიაა, ჩრდილოეთის ცივი ჰაერისგან კი დიდი კავკასიონი იცავს, ამიტომ აქ ნოტიო სუბტროპიკული კლიმატია — ბათუმის შემოგარენი, აჭარა, საქართველოს ერთ-ერთი ყველაზე ნალექიანი მხარეა. ლიხის ქედი ამ ტენის დიდ ნაწილს აკავებს, ამიტომ აღმოსავლეთ საქართველო უფრო მშრალია, უფრო ცხელი ზაფხულითა და ცივი ზამთრით.`,
        ),
      },
      {
        kind: "practice",
        title: l("Map work", "რუკაზე მუშაობა"),
        minutes: 11,
        body: l(
          `On a blank outline map of Georgia, mark: the Greater and Lesser Caucasus, the Likhi Range, the Kolkheti Lowland, the rivers Rioni, Enguri, Mtkvari and Alazani, the Black Sea, and the cities Tbilisi, Kutaisi and Batumi. Then complete the activities.`,
          `საქართველოს კონტურულ რუკაზე მონიშნე: დიდი და მცირე კავკასიონი, ლიხის ქედი, კოლხეთის დაბლობი, მდინარეები რიონი, ენგური, მტკვარი და ალაზანი, შავი ზღვა და ქალაქები თბილისი, ქუთაისი და ბათუმი. შემდეგ შეასრულე აქტივობები.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• North: Greater Caucasus; south: Lesser Caucasus; in between: lowlands and plains.
• The Likhi Range divides west and east.
• West: rivers to the Black Sea, humid subtropical climate. East: Mtkvari to the Caspian, drier climate.`,
          `• ჩრდილოეთით — დიდი კავკასიონი; სამხრეთით — მცირე კავკასიონი; შუაში — დაბლობები და ვაკეები.
• ლიხის ქედი დასავლეთსა და აღმოსავლეთს ყოფს.
• დასავლეთი: მდინარეები შავ ზღვაში, ნოტიო სუბტროპიკული კლიმატი. აღმოსავლეთი: მტკვარი კასპიის ზღვაში, უფრო მშრალი კლიმატი.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Dividing range", "გამყოფი ქედი"),
        prompt: l("Which range divides Georgia into western and eastern parts?", "რომელი ქედი ყოფს საქართველოს დასავლეთ და აღმოსავლეთ ნაწილებად?"),
        options: [l("The Likhi Range", "ლიხის ქედი"), l("The Greater Caucasus", "დიდი კავკასიონი"), l("The Lesser Caucasus", "მცირე კავკასიონი"), l("The Javakheti Plateau", "ჯავახეთის ზეგანი")],
        correct: 0,
        hints: [
          l("It connects the Greater and the Lesser Caucasus.", "ის დიდ და მცირე კავკასიონს აერთებს."),
          l("It runs from north to south across the middle of the country.", "ის ქვეყნის შუა ნაწილში ჩრდილოეთიდან სამხრეთისკენაა გადაჭიმული."),
        ],
      },
      {
        type: "mc",
        title: l("Where does it flow?", "სად ჩაედინება?"),
        prompt: l("Into which sea does the Mtkvari flow?", "რომელ ზღვაში ჩაედინება მტკვარი?"),
        options: [l("The Caspian Sea", "კასპიის ზღვაში"), l("The Black Sea", "შავ ზღვაში"), l("The Mediterranean Sea", "ხმელთაშუა ზღვაში"), l("The Sea of Azov", "აზოვის ზღვაში")],
        correct: 0,
        hints: [
          l("The Mtkvari flows east through Tbilisi.", "მტკვარი აღმოსავლეთისკენ, თბილისის გავლით მიედინება."),
          l("Which sea lies east of the Caucasus?", "რომელი ზღვაა კავკასიის აღმოსავლეთით?"),
        ],
      },
      {
        type: "short",
        title: l("Highest peak", "უმაღლესი მწვერვალი"),
        prompt: l("What is the name of the highest peak in Georgia?", "რა ჰქვია საქართველოს უმაღლეს მწვერვალს?"),
        accepted: { en: ["Shkhara"], ka: ["შხარა"] },
      },
      {
        type: "mc",
        title: l("Why is the west wetter?", "რატომ არის დასავლეთი უფრო ნალექიანი?"),
        prompt: l("Why does western Georgia get more rain than eastern Georgia?", "რატომ მოდის დასავლეთ საქართველოში უფრო მეტი ნალექი, ვიდრე აღმოსავლეთში?"),
        options: [
          l("Moist air from the Black Sea rises over the mountains, and the Likhi Range keeps much of it in the west", "შავი ზღვიდან მომავალი ნოტიო ჰაერი მთებზე ადის, ლიხის ქედი კი მის დიდ ნაწილს დასავლეთში აკავებს"),
          l("The west is closer to the Caspian Sea", "დასავლეთი კასპიის ზღვასთან უფრო ახლოსაა"),
          l("The west is higher than the east everywhere", "დასავლეთი ყველგან აღმოსავლეთზე მაღლაა"),
          l("There are no mountains in the west", "დასავლეთში მთები არ არის"),
        ],
        correct: 0,
        hints: [
          l("Where does moist air come from in the west?", "საიდან მოდის დასავლეთში ნოტიო ჰაერი?"),
          l("What stands between western and eastern Georgia?", "რა დგას დასავლეთ და აღმოსავლეთ საქართველოს შორის?"),
        ],
      },
      { type: "discussion", prompt: l("How do landforms and climate influence farming in different regions of Georgia? Give two examples.", "როგორ მოქმედებს რელიეფი და კლიმატი მიწათმოქმედებაზე საქართველოს სხვადასხვა რეგიონში? მოიყვანე ორი მაგალითი.") },
      { type: "exit", prompt: l("Describe the route of the Mtkvari through Georgia using at least two compass directions.", "აღწერე მტკვრის დინება საქართველოში, სულ მცირე ორი მიმართულების გამოყენებით.") },
    ],
    discussion: [
      l("Why are most large cities in Georgia located in valleys and lowlands?", "რატომ მდებარეობს საქართველოს დიდი ქალაქების უმეტესობა ხეობებსა და დაბლობებზე?"),
      l("Which natural hazards (floods, landslides, avalanches) are linked to Georgia's relief?", "რომელი სტიქიური მოვლენებია (წყალდიდობა, მეწყერი, ზვავი) დაკავშირებული საქართველოს რელიეფთან?"),
    ],
    assessment: [
      l("Correctly labelled outline map.", "სწორად შევსებული კონტურული რუკა."),
      l("A clear explanation of the two climates.", "ორი კლიმატის მკაფიო ახსნა."),
    ],
    homework: [l("Choose a region of Georgia. Describe its landforms, climate and one way people use the land. Name your sources.", "აირჩიე საქართველოს ერთი რეგიონი. აღწერე მისი რელიეფი, კლიმატი და მიწის გამოყენების ერთი მაგალითი. დაასახელე წყაროები.")],
    teacherNotes: l(
      "Exact heights of peaks differ between sources (surveys, rounding); if you use numbers, name the source. Climate figures should come from the National Environmental Agency or the textbook, with the period they describe.",
      "მწვერვალების ზუსტი სიმაღლეები წყაროების მიხედვით განსხვავდება (აზომვები, დამრგვალება); თუ ციფრებს იყენებთ, წყარო მიუთითეთ. კლიმატური მონაცემები გარემოს ეროვნული სააგენტოდან ან სახელმძღვანელოდან აიღეთ, მათ მიერ აღწერილი პერიოდის მითითებით.",
    ),
    quiz: {
      title: l("Georgia's physical geography — check yourself", "საქართველოს ფიზიკური გეოგრაფია — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("The Rioni flows into the Black Sea.", "რიონი შავ ზღვაში ჩაედინება."), answer: true },
        { type: "mc", prompt: l("Which lowland lies in western Georgia?", "რომელი დაბლობია დასავლეთ საქართველოში?"), options: [l("Kolkheti", "კოლხეთის"), l("Shiraki", "შირაქის"), l("Alazani", "ალაზნის"), l("Javakheti", "ჯავახეთის")], correct: 0 },
        { type: "tf", prompt: l("Eastern Georgia is generally drier than western Georgia.", "აღმოსავლეთ საქართველო, როგორც წესი, დასავლეთზე მშრალია."), answer: true },
      ],
    },
  },
  {
    group: "climate-graphs",
    subject: "geography",
    grade: 9,
    durationMin: 40,
    difficulty: "standard",
    match: /climate graph|climograph|precipitation|temperature graph|კლიმატოგრამ|ნალექ|კლიმატის გრაფიკ/i,
    title: l("Reading Climate Graphs", "კლიმატური გრაფიკების კითხვა"),
    topic: l("Climate data", "კლიმატური მონაცემები"),
    objective: l(
      "Students read a climate graph, calculate temperature range and total precipitation, and use data to compare two places.",
      "მოსწავლეები კითხულობენ კლიმატურ გრაფიკს, ითვლიან ტემპერატურის ამპლიტუდასა და ნალექების ჯამს და მონაცემებით ორ ადგილს ადარებენ.",
    ),
    objectives: [
      l("Read monthly temperature (line) and precipitation (bars) from a climate graph.", "კლიმატური გრაფიკიდან წაიკითხოს თვიური ტემპერატურა (ხაზი) და ნალექები (სვეტები)."),
      l("Calculate the annual temperature range and total precipitation.", "გამოთვალოს ტემპერატურის წლიური ამპლიტუდა და ნალექების წლიური ჯამი."),
      l("Compare climates using data rather than impressions.", "კლიმატები შთაბეჭდილებით კი არა, მონაცემებით შეადაროს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("One picture, a whole year", "ერთი სურათი — მთელი წელი"),
        minutes: 5,
        body: l(
          `A climate graph (climograph) shows a whole year of average weather in one picture: a line for temperature and bars for precipitation. Climate is the average over many years — not the weather on one day.`,
          `კლიმატური გრაფიკი (კლიმატოგრამა) მთელი წლის საშუალო ამინდს ერთ სურათზე გვიჩვენებს: ხაზი — ტემპერატურისთვის, სვეტები — ნალექებისთვის. კლიმატი მრავალწლიური საშუალოა და არა ერთი დღის ამინდი.`,
        ),
      },
      {
        kind: "explanation",
        title: l("How to read it", "როგორ წავიკითხოთ"),
        minutes: 12,
        body: l(
          `• Horizontal axis: months (J F M A M J J A S O N D).
• Left axis: temperature in °C — read the line.
• Right axis: precipitation in mm — read the bars.

Two key calculations:
• annual temperature range = warmest month − coldest month
• total annual precipitation = sum of the 12 bars

Practice data for "Town A" (not a real station — for practice only):
Temperature °C: 1, 3, 7, 12, 17, 21, 24, 24, 19, 13, 7, 3
Precipitation mm: 20, 25, 35, 50, 70, 60, 40, 35, 35, 30, 30, 20

Range = 24 − 1 = 23 °C. Total = 450 mm.`,
          `• ჰორიზონტალური ღერძი: თვეები (ი თ მ ა მ ი ი ა ს ო ნ დ).
• მარცხენა ღერძი: ტემპერატურა °C-ში — იკითხება ხაზზე.
• მარჯვენა ღერძი: ნალექები მმ-ში — იკითხება სვეტებზე.

ორი ძირითადი გამოთვლა:
• ტემპერატურის წლიური ამპლიტუდა = ყველაზე თბილი თვე − ყველაზე ცივი თვე
• ნალექების წლიური ჯამი = 12 სვეტის ჯამი

სავარჯიშო მონაცემები „ქალაქი A“-სთვის (ეს რეალური სადგური არ არის — მხოლოდ ვარჯიშისთვის):
ტემპერატურა °C: 1, 3, 7, 12, 17, 21, 24, 24, 19, 13, 7, 3
ნალექები მმ: 20, 25, 35, 50, 70, 60, 40, 35, 35, 30, 30, 20

ამპლიტუდა = 24 − 1 = 23 °C. ჯამი = 450 მმ.`,
        ),
      },
      {
        kind: "practice",
        title: l("Compare with real data", "შეადარე რეალურ მონაცემებს"),
        minutes: 15,
        body: l(
          `Do the activities with the practice data. Then, with your teacher, find official climate normals for two Georgian cities (for example Batumi and Tbilisi) from the National Environmental Agency or your textbook, enter them in the Research Laboratory as a dataset and draw both graphs. Which city has the larger temperature range? Which is wetter?`,
          `აქტივობები სავარჯიშო მონაცემებით შეასრულე. შემდეგ მასწავლებელთან ერთად გარემოს ეროვნული სააგენტოდან ან სახელმძღვანელოდან მოიძიე საქართველოს ორი ქალაქის (მაგალითად, ბათუმისა და თბილისის) ოფიციალური კლიმატური ნორმები, შეიტანე ისინი კვლევით ლაბორატორიაში მონაცემთა ნაკრებად და ააგე ორივე გრაფიკი. რომელ ქალაქს აქვს ტემპერატურის უფრო დიდი ამპლიტუდა? რომელია უფრო ნალექიანი?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 8,
        body: l(
          `• Line = temperature, bars = precipitation.
• Range = warmest − coldest; total = sum of the bars.
• Always check where data come from and which years they describe.`,
          `• ხაზი = ტემპერატურა, სვეტები = ნალექები.
• ამპლიტუდა = ყველაზე თბილი − ყველაზე ცივი; ჯამი = სვეტების ჯამი.
• ყოველთვის შეამოწმე, საიდან არის მონაცემები და რომელ წლებს აღწერს.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Temperature range", "ტემპერატურის ამპლიტუდა"),
        prompt: l("Coldest month −3 °C, warmest month 22 °C. What is the annual temperature range in °C?", "ყველაზე ცივი თვე −3 °C, ყველაზე თბილი — 22 °C. რისი ტოლია ტემპერატურის წლიური ამპლიტუდა °C-ში?"),
        accepted: ["25", "25 °C", "25°C"],
        hints: [l("Range = warmest − coldest.", "ამპლიტუდა = ყველაზე თბილი − ყველაზე ცივი."), l("22 − (−3) = 22 + 3", "22 − (−3) = 22 + 3")],
        solution: l("22 − (−3) = 25 °C", "22 − (−3) = 25 °C"),
      },
      {
        type: "exercise",
        title: l("Wettest month", "ყველაზე ნალექიანი თვე"),
        prompt: l("In the Town A practice data, how many mm of precipitation fall in the wettest month?", "„ქალაქი A“-ს სავარჯიშო მონაცემებში რამდენი მმ ნალექი მოდის ყველაზე ნალექიან თვეში?"),
        accepted: ["70", "70 mm", "70 მმ"],
        hints: [
          l("Look for the largest number in the precipitation list.", "მოძებნე უდიდესი რიცხვი ნალექების სიაში."),
          l("It falls in May.", "ის მაისში მოდის."),
        ],
      },
      {
        type: "mc",
        title: l("Weather or climate?", "ამინდი თუ კლიმატი?"),
        prompt: l("Which sentence is about climate?", "რომელი წინადადებაა კლიმატზე?"),
        options: [
          l("Summers here are usually hot and dry.", "აქ ზაფხული, როგორც წესი, ცხელი და მშრალია."),
          l("It is raining in Kutaisi today.", "დღეს ქუთაისში წვიმს."),
          l("Tomorrow will be windy.", "ხვალ ქარიანი ამინდი იქნება."),
          l("It snowed last night.", "გუშინ ღამით თოვდა."),
        ],
        correct: 0,
        hints: [
          l("Climate describes what is usual over many years.", "კლიმატი აღწერს, რა არის ჩვეული მრავალი წლის განმავლობაში."),
          l("Words like \"usually\" point to climate; \"today\" and \"tomorrow\" point to weather.", "სიტყვები „როგორც წესი“ კლიმატზე მიუთითებს, „დღეს“ და „ხვალ“ — ამინდზე."),
        ],
      },
      { type: "discussion", prompt: l("Why is one hot summer not enough to say that the climate has changed?", "რატომ არ არის ერთი ცხელი ზაფხული საკმარისი იმის სათქმელად, რომ კლიმატი შეიცვალა?") },
      { type: "exit", prompt: l("Write two sentences comparing two climate graphs using numbers.", "ორი წინადადებით შეადარე ორი კლიმატური გრაფიკი რიცხვების გამოყენებით.") },
    ],
    discussion: [l("How could climate data help a farmer, a tourist or a city planner?", "როგორ შეიძლება კლიმატური მონაცემები ფერმერს, ტურისტს ან ქალაქის დამგეგმავს დაეხმაროს?")],
    assessment: [l("Correct calculations and a data-based comparison.", "სწორი გამოთვლები და მონაცემებზე დაფუძნებული შედარება.")],
    homework: [l("Find official climate data for your town and draw its climate graph by hand or in the Research Laboratory. Name the source and the years.", "მოიძიე შენი ქალაქის ოფიციალური კლიმატური მონაცემები და ააგე კლიმატური გრაფიკი ხელით ან კვლევით ლაბორატორიაში. მიუთითე წყარო და წლები.")],
    teacherNotes: l(
      "\"Town A\" data are invented for practice and labelled as such — do not present them as a real place. Use official climate normals (with the reference period) for real comparisons.",
      "„ქალაქი A“-ს მონაცემები სავარჯიშოდაა მოგონილი და მოსწავლეებსაც ასე უთხარით — ნუ წარმოადგენთ მას რეალურ ადგილად. რეალური შედარებისთვის გამოიყენეთ ოფიციალური კლიმატური ნორმები (საბაზისო პერიოდის მითითებით).",
    ),
    quiz: {
      title: l("Climate graphs — check yourself", "კლიმატური გრაფიკები — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("Monthly precipitation: 10, 20, 30, 40, 50, 60, 60, 50, 40, 30, 20, 10 mm. Total in mm?", "თვიური ნალექები: 10, 20, 30, 40, 50, 60, 60, 50, 40, 30, 20, 10 მმ. ჯამი მმ-ში?"), answer: 420 },
        { type: "tf", prompt: l("On a climate graph, precipitation is usually shown as bars.", "კლიმატურ გრაფიკზე ნალექები ჩვეულებრივ სვეტებით არის ნაჩვენები."), answer: true },
        { type: "num", prompt: l("Coldest −8 °C, warmest 19 °C. Range in °C?", "ყველაზე ცივი −8 °C, ყველაზე თბილი 19 °C. ამპლიტუდა °C-ში?"), answer: 27 },
      ],
    },
  },
];
