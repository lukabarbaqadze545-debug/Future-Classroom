import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const PHYSICS: BiLesson[] = [
  {
    group: "motion",
    subject: "physics",
    grade: 7,
    durationMin: 45,
    difficulty: "foundation",
    match: /motion|speed|velocity|distance.time|მოძრაობ|სიჩქარ/i,
    title: l("Speed and Motion Graphs", "სიჩქარე და მოძრაობის გრაფიკები"),
    topic: l("Motion", "მოძრაობა"),
    objective: l(
      "Students calculate average speed, convert between km/h and m/s, and read distance–time graphs.",
      "მოსწავლეები ითვლიან საშუალო სიჩქარეს, გადაჰყავთ km/h m/s-ში და პირიქით, და კითხულობენ მანძილი-დროის გრაფიკებს.",
    ),
    objectives: [
      l("Calculate average speed as distance divided by time, with correct units.", "გამოთვალოს საშუალო სიჩქარე — მანძილი გაყოფილი დროზე — სწორი ერთეულებით."),
      l("Convert speeds between km/h and m/s.", "სიჩქარე გადაიყვანოს km/h-დან m/s-ში და პირიქით."),
      l("Describe motion from a distance–time graph (at rest, steady speed, faster, slower).", "მანძილი-დროის გრაფიკიდან აღწეროს მოძრაობა (უძრაობა, თანაბარი, უფრო სწრაფი, უფრო ნელი)."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Who was faster?", "ვინ იყო უფრო სწრაფი?"),
        minutes: 5,
        body: l(
          `Giorgi walked 1.2 km to school in 15 minutes. Elene cycled 3 km in 10 minutes. Who was faster, and by how much?

To compare, we need the same measure for both: how far each travels in one unit of time. That measure is speed.`,
          `გიორგიმ სკოლამდე 1,2 კმ 15 წუთში გაიარა ფეხით. ელენემ ველოსიპედით 3 კმ 10 წუთში გაიარა. ვინ იყო უფრო სწრაფი და რამდენით?

შესადარებლად ორივესთვის ერთი და იგივე საზომი გვჭირდება: რამდენს გადის თითოეული დროის ერთეულში. ეს საზომი სიჩქარეა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Average speed", "საშუალო სიჩქარე"),
        minutes: 12,
        body: l(
          `average speed = distance ÷ time,   v = s / t

Units: metres per second (m/s) or kilometres per hour (km/h).
• Giorgi: 1.2 km in 0.25 h → 4.8 km/h
• Elene: 3 km in 1/6 h → 18 km/h

Converting: 1 km/h = 1000 m ÷ 3600 s, so divide km/h by 3.6 to get m/s. 18 km/h = 5 m/s.

"Average" matters: on the way Elene stopped at a traffic light and went faster downhill. Average speed describes the whole trip, not each moment.`,
          `საშუალო სიჩქარე = მანძილი ÷ დრო,   v = s / t

ერთეულები: მეტრი წამში (m/s) ან კილომეტრი საათში (km/h).
• გიორგი: 1,2 კმ 0,25 საათში → 4,8 km/h
• ელენე: 3 კმ 1/6 საათში → 18 km/h

გადაყვანა: 1 km/h = 1000 მ ÷ 3600 წმ, ამიტომ m/s-ის მისაღებად km/h გაყავი 3,6-ზე. 18 km/h = 5 m/s.

სიტყვა „საშუალო“ მნიშვნელოვანია: გზაში ელენე შუქნიშანთან გაჩერდა, დაღმართზე კი უფრო სწრაფად იარა. საშუალო სიჩქარე მთელ მგზავრობას აღწერს და არა თითოეულ მომენტს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Distance–time graphs", "მანძილი-დროის გრაფიკები"),
        minutes: 12,
        body: l(
          `Time goes on the horizontal axis, distance on the vertical axis.
• A horizontal line: the distance does not change — the object is at rest.
• A straight sloping line: steady speed. The steeper the line, the faster.
• A curve getting steeper: speeding up. A curve getting flatter: slowing down.

The speed is the slope: distance gained ÷ time taken. The graph below shows a steady 2 m/s.`,
          `დრო ჰორიზონტალურ ღერძზეა, მანძილი — ვერტიკალურზე.
• ჰორიზონტალური ხაზი: მანძილი არ იცვლება — სხეული უძრავია.
• დახრილი წრფე: თანაბარი მოძრაობა. რაც უფრო ციცაბოა წრფე, მით სწრაფია მოძრაობა.
• მრუდი, რომელიც უფრო ციცაბო ხდება: სხეული აჩქარდება. მრუდი, რომელიც უფრო დამრეცი ხდება: ნელდება.

სიჩქარე გრაფიკის დახრილობაა: გავლილი მანძილი ÷ დახარჯული დრო. ქვემოთ მოცემული გრაფიკი თანაბარ 2 m/s სიჩქარეს აჩვენებს.`,
        ),
        plot: { expression: "2x", xMin: 0, xMax: 10, caption: l("Distance (m) against time (s) at a steady 2 m/s", "მანძილი (მ) დროის (წმ) მიხედვით, თანაბარი სიჩქარე 2 m/s") },
      },
      {
        kind: "practice",
        title: l("Practice and simulation", "პრაქტიკა და სიმულაცია"),
        minutes: 12,
        body: l(
          `Complete the activities. Then open the STEM Laboratory simulation "Motion graphs": set a speed and acceleration, predict the shape of the graph, then run it. Was your prediction right?`,
          `შეასრულე აქტივობები. შემდეგ გახსენი STEM ლაბორატორიის სიმულაცია „მოძრაობის გრაფიკები“: დააყენე სიჩქარე და აჩქარება, იწინასწარმეტყველე გრაფიკის ფორმა და გაუშვი. გამართლდა შენი ვარაუდი?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 4,
        body: l(
          `• v = s / t; always write the units.
• km/h ÷ 3.6 = m/s.
• On a distance–time graph: flat = at rest, steeper = faster.`,
          `• v = s / t; ერთეულები ყოველთვის ჩაწერე.
• km/h ÷ 3,6 = m/s.
• მანძილი-დროის გრაფიკზე: ჰორიზონტალური = უძრავი, უფრო ციცაბო = უფრო სწრაფი.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Average speed", "საშუალო სიჩქარე"),
        prompt: l("A train travels 240 km in 3 hours. What is its average speed in km/h?", "მატარებელმა 240 კმ 3 საათში გაიარა. რისი ტოლია მისი საშუალო სიჩქარე (km/h)?"),
        accepted: ["80", "80 km/h"],
        hints: [l("Use v = s / t.", "გამოიყენე v = s / t."), l("Divide 240 by 3.", "240 გაყავი 3-ზე.")],
        solution: l("v = 240 km ÷ 3 h = 80 km/h", "v = 240 კმ ÷ 3 სთ = 80 km/h"),
      },
      {
        type: "exercise",
        title: l("Convert units", "ერთეულების გადაყვანა"),
        prompt: l("A car drives at 72 km/h. What is its speed in m/s?", "მანქანა 72 km/h სიჩქარით მოძრაობს. რისი ტოლია მისი სიჩქარე m/s-ში?"),
        accepted: ["20", "20 m/s"],
        hints: [
          l("1 km = 1000 m and 1 h = 3600 s.", "1 კმ = 1000 მ, 1 სთ = 3600 წმ."),
          l("To go from km/h to m/s, divide by 3.6.", "km/h-დან m/s-ში გადასაყვანად გაყავი 3,6-ზე."),
        ],
        solution: l("72 ÷ 3.6 = 20 m/s", "72 ÷ 3,6 = 20 m/s"),
      },
      {
        type: "mc",
        title: l("Read the graph", "წაიკითხე გრაფიკი"),
        prompt: l("On a distance–time graph, part of the line is horizontal. What was the object doing then?", "მანძილი-დროის გრაფიკზე ხაზის ნაწილი ჰორიზონტალურია. რას აკეთებდა სხეული ამ დროს?"),
        options: [l("Standing still", "იდგა ადგილზე"), l("Moving at a steady speed", "თანაბრად მოძრაობდა"), l("Speeding up", "აჩქარდებოდა"), l("Moving backwards", "უკან მოძრაობდა")],
        correct: 0,
        hints: [l("What happens to the distance while the line is horizontal?", "რა ემართება მანძილს, სანამ ხაზი ჰორიზონტალურია?"), l("If the distance stays the same while time passes, is the object moving?", "თუ დრო გადის, მანძილი კი არ იცვლება, მოძრაობს სხეული?")],
        explanation: l("Time passes but the distance stays the same, so the object is at rest.", "დრო გადის, მანძილი კი არ იცვლება — სხეული უძრავია."),
      },
      {
        type: "exercise",
        title: l("How long?", "რამდენ ხანს?"),
        prompt: l(
          "The distance from Tbilisi to Kutaisi by road is roughly 230 km. How many hours does the trip take at an average speed of 70 km/h? Round to one decimal place.",
          "საავტომობილო გზით თბილისიდან ქუთაისამდე დაახლოებით 230 კმ-ია. რამდენ საათს გასტანს მგზავრობა 70 km/h საშუალო სიჩქარით? დაამრგვალე მეათედებამდე.",
        ),
        accepted: { en: ["3.3", "3.3 h"], ka: ["3,3", "3.3", "3,3 სთ"] },
        hints: [l("Rearrange v = s / t to find t.", "v = s / t-დან გამოსახე t."), l("t = s / v = 230 ÷ 70.", "t = s / v = 230 ÷ 70.")],
        solution: l("t = 230 ÷ 70 ≈ 3.3 hours (about 3 h 17 min).", "t = 230 ÷ 70 ≈ 3,3 საათი (დაახლოებით 3 სთ 17 წთ)."),
      },
      {
        type: "discussion",
        prompt: l(
          "A navigation app says a trip will take 40 minutes, but it took 55. Which assumptions about speed might have been wrong?",
          "ნავიგაციის აპლიკაცია ამბობდა, რომ მგზავრობა 40 წუთს გასტანდა, სინამდვილეში კი 55 წუთი დასჭირდა. სიჩქარის შესახებ რომელი დაშვება შეიძლება ყოფილიყო მცდარი?",
        ),
      },
      { type: "exit", prompt: l("Sketch a distance–time graph of your journey to school, including one stop.", "დახატე სკოლამდე შენი გზის მანძილი-დროის გრაფიკი, ერთი გაჩერებით.") },
    ],
    discussion: [
      l("Why is the speed on a car's speedometer usually different from the average speed of the trip?", "რატომ განსხვავდება მანქანის სპიდომეტრზე ნაჩვენები სიჩქარე ჩვეულებრივ მგზავრობის საშუალო სიჩქარისგან?"),
      l("How could you measure your own walking speed in the school yard?", "როგორ გაზომავდი შენი სიარულის სიჩქარეს სკოლის ეზოში?"),
    ],
    assessment: [
      l("Students calculate speed, distance or time with correct units.", "მოსწავლე სწორი ერთეულებით ითვლის სიჩქარეს, მანძილს ან დროს."),
      l("Students describe each part of a distance–time graph in words.", "მოსწავლე მანძილი-დროის გრაფიკის თითოეულ ნაწილს სიტყვებით აღწერს."),
    ],
    homework: [
      l("Measure how long it takes you to walk 100 m. Calculate your speed in m/s and km/h.", "გაზომე, რამდენ ხანს გჭირდება 100 მ-ის გავლა. გამოთვალე შენი სიჩქარე m/s-სა და km/h-ში."),
      l("Draw a distance–time graph for: 5 min walking at 1.5 m/s, 3 min stop, 4 min running at 3 m/s.", "დახატე მანძილი-დროის გრაფიკი: 5 წთ სიარული 1,5 m/s სიჩქარით, 3 წთ გაჩერება, 4 წთ სირბილი 3 m/s სიჩქარით."),
    ],
    teacherNotes: l(
      "Road distances are rounded on purpose — ask students where they would check a precise figure. A quick outdoor activity (timing 20 m walks and runs with phone stopwatches) makes the formula concrete. Students often read a distance–time graph as a map of the route; ask \"what does a point on this graph tell you?\"",
      "საავტომობილო მანძილები განზრახაა დამრგვალებული — ჰკითხეთ მოსწავლეებს, სად გადაამოწმებდნენ ზუსტ მონაცემს. ეზოში სწრაფი აქტივობა (20 მ-ის გავლისა და გარბენის დროის გაზომვა ტელეფონის წამზომით) ფორმულას ხელშესახებს ხდის. მოსწავლეები ხშირად მანძილი-დროის გრაფიკს მარშრუტის რუკად აღიქვამენ; ჰკითხეთ: „რას გეუბნება გრაფიკის ერთი წერტილი?“",
    ),
    quiz: {
      title: l("Motion — check yourself", "მოძრაობა — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("A runner covers 400 m in 80 s. Average speed in m/s?", "მორბენალმა 400 მ 80 წამში გაირბინა. საშუალო სიჩქარე m/s-ში?"), answer: 5, explanation: l("400 ÷ 80 = 5 m/s", "400 ÷ 80 = 5 m/s") },
        { type: "num", prompt: l("Convert 10 m/s to km/h.", "გადაიყვანე 10 m/s km/h-ში."), answer: 36, explanation: l("10 × 3.6 = 36 km/h", "10 × 3,6 = 36 km/h") },
        { type: "tf", prompt: l("A steeper line on a distance–time graph means a higher speed.", "მანძილი-დროის გრაფიკზე უფრო ციცაბო წრფე მეტ სიჩქარეს ნიშნავს."), answer: true },
        {
          type: "mc",
          prompt: l("How far does a cyclist travel in 2 h at 15 km/h?", "რა მანძილს გაივლის ველოსიპედისტი 2 საათში 15 km/h სიჩქარით?"),
          options: [l("30 km", "30 კმ"), l("7.5 km", "7,5 კმ"), l("17 km", "17 კმ"), l("15 km", "15 კმ")],
          correct: 0,
          explanation: l("s = v · t = 15 × 2 = 30 km", "s = v · t = 15 × 2 = 30 კმ"),
        },
      ],
    },
  },
  {
    group: "energy",
    subject: "physics",
    grade: 8,
    durationMin: 45,
    difficulty: "standard",
    match: /energy|kinetic|potential|power station|ენერგი|კინეტიკ|პოტენციურ/i,
    title: l("Energy: Forms, Transfers and Conservation", "ენერგია: სახეები, გარდაქმნა და შენახვა"),
    topic: l("Energy", "ენერგია"),
    objective: l(
      "Students name energy stores, calculate kinetic and gravitational potential energy, and apply conservation of energy to a falling object and to a hydropower station.",
      "მოსწავლეები ასახელებენ ენერგიის სახეებს, ითვლიან კინეტიკურ და პოტენციურ ენერგიას და ენერგიის შენახვის კანონს იყენებენ ვარდნილი სხეულისა და ჰიდროელექტროსადგურის მაგალითზე.",
    ),
    objectives: [
      l("Describe energy transfers in everyday situations.", "აღწეროს ენერგიის გარდაქმნები ყოველდღიურ სიტუაციებში."),
      l("Use Eₖ = ½mv² and Eₚ = mgh.", "გამოიყენოს ფორმულები Eₖ = ½mv² და Eₚ = mgh."),
      l("Explain conservation of energy and efficiency.", "ახსნას ენერგიის შენახვის კანონი და მარგი ქმედების კოეფიციენტი."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Where does the energy go?", "სად მიდის ენერგია?"),
        minutes: 5,
        body: l(
          `A ball dropped from a height bounces back — but never quite as high. The water in a reservoir behind a dam can light a whole city. Both stories are about energy: it is not created or destroyed, only moved from one store to another.`,
          `სიმაღლიდან დაგდებული ბურთი ახტება, მაგრამ იმავე სიმაღლეზე ვეღარასოდეს. კაშხლის უკან წყალსაცავში დაგროვილ წყალს მთელი ქალაქის განათება შეუძლია. ორივე ამბავი ენერგიაზეა: ის არ ჩნდება და არ ქრება, მხოლოდ ერთი სახიდან მეორეში გადადის.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Kinetic and potential energy", "კინეტიკური და პოტენციური ენერგია"),
        minutes: 12,
        body: l(
          `Energy is measured in joules (J).
• Kinetic energy — energy of motion: Eₖ = ½ m v²
• Gravitational potential energy — energy of height: Eₚ = m g h (g ≈ 10 N/kg on Earth; more precisely 9.8)

Example: a 2 kg book on a shelf 1.5 m high has Eₚ = 2 · 10 · 1.5 = 30 J. If it falls, just before hitting the floor almost all of it has become kinetic energy: ½ · 2 · v² = 30, so v ≈ 5.5 m/s.

Notice: doubling the speed makes the kinetic energy four times larger. This is why speed matters so much in road safety.`,
          `ენერგია ჯოულებში (J) იზომება.
• კინეტიკური ენერგია — მოძრაობის ენერგია: Eₖ = ½ m v²
• პოტენციური ენერგია (მიზიდულობის ველში) — სიმაღლის ენერგია: Eₚ = m g h (დედამიწაზე g ≈ 10 N/kg; უფრო ზუსტად 9,8)

მაგალითი: 1,5 მ სიმაღლის თაროზე მდებარე 2 კგ მასის წიგნს აქვს Eₚ = 2 · 10 · 1,5 = 30 J. თუ ის ჩამოვარდება, იატაკთან შეჯახებამდე ეს ენერგია თითქმის მთლიანად კინეტიკურად გარდაიქმნება: ½ · 2 · v² = 30, ანუ v ≈ 5,5 m/s.

შენიშნე: სიჩქარის გაორმაგება კინეტიკურ ენერგიას ოთხჯერ ზრდის. ამიტომაა სიჩქარე ასეთი მნიშვნელოვანი საგზაო უსაფრთხოებისთვის.`,
        ),
        plot: { expression: "0.5*x^2", xMin: 0, xMax: 10, caption: l("Kinetic energy of a 1 kg object against its speed: Eₖ grows with v²", "1 კგ მასის სხეულის კინეტიკური ენერგია სიჩქარის მიხედვით: Eₖ იზრდება v²-ის პროპორციულად") },
      },
      {
        kind: "example",
        title: l("From a reservoir to your socket", "წყალსაცავიდან შენს როზეტამდე"),
        minutes: 10,
        body: l(
          `A large share of Georgia's electricity comes from hydropower stations, such as the station on the Enguri river. The chain of transfers:
water high in the reservoir (potential energy) → falling water (kinetic energy) → spinning turbine → generator (electrical energy) → your home (light, heat, motion).

At every step some energy is transferred to the surroundings as heat and sound — it is not lost from the universe, but it is no longer useful.

efficiency = useful output energy ÷ input energy × 100%`,
          `საქართველოში გამომუშავებული ელექტროენერგიის დიდი ნაწილი ჰიდროელექტროსადგურებიდან მოდის, მაგალითად, მდინარე ენგურზე მდებარე სადგურიდან. გარდაქმნების ჯაჭვი:
წყალსაცავში მაღლა მდგარი წყალი (პოტენციური ენერგია) → ვარდნილი წყალი (კინეტიკური ენერგია) → მბრუნავი ტურბინა → გენერატორი (ელექტრული ენერგია) → შენი სახლი (სინათლე, სითბო, მოძრაობა).

ყოველ საფეხურზე ენერგიის ნაწილი გარემოს სითბოსა და ხმის სახით გადაეცემა — სამყაროდან ის არ ქრება, მაგრამ ჩვენთვის აღარ არის სასარგებლო.

მარგი ქმედების კოეფიციენტი (მქკ) = სასარგებლო ენერგია ÷ დახარჯული ენერგია × 100%`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 13,
        body: l(
          `Work through the activities. For a hands-on follow-up, the STEM Laboratory experiment "Keeping heat in: testing insulation" measures how quickly energy is transferred as heat.`,
          `შეასრულე აქტივობები. პრაქტიკული გაგრძელებისთვის STEM ლაბორატორიის ექსპერიმენტი „სითბოს შენარჩუნება: თბოიზოლაციის შემოწმება“ ზომავს, რა სისწრაფით გადაიცემა ენერგია სითბოს სახით.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Eₖ = ½mv², Eₚ = mgh, energy in joules.
• Energy is conserved: the total stays the same, it only changes form.
• Efficiency tells us what share of the energy ends up useful.`,
          `• Eₖ = ½mv², Eₚ = mgh; ენერგია ჯოულებში.
• ენერგია ინახება: ჯამი უცვლელია, იცვლება მხოლოდ სახე.
• მქკ გვიჩვენებს, ენერგიის რა წილი ხდება სასარგებლო.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Potential energy", "პოტენციური ენერგია"),
        prompt: l("A 5 kg bag is lifted onto a 2 m high shelf. How much potential energy does it gain? (g = 10 N/kg, answer in J)", "5 კგ მასის ჩანთა 2 მ სიმაღლის თაროზე აიტანეს. რამდენი პოტენციური ენერგია შეიძინა? (g = 10 N/kg, პასუხი J-ში)"),
        accepted: ["100", "100 J"],
        hints: [l("Use Eₚ = m g h.", "გამოიყენე Eₚ = m g h."), l("5 × 10 × 2", "5 × 10 × 2")],
        solution: l("Eₚ = 5 · 10 · 2 = 100 J", "Eₚ = 5 · 10 · 2 = 100 J"),
      },
      {
        type: "exercise",
        title: l("Kinetic energy", "კინეტიკური ენერგია"),
        prompt: l("A 60 kg cyclist rides at 5 m/s. What is the kinetic energy in J?", "60 კგ მასის ველოსიპედისტი 5 m/s სიჩქარით მოძრაობს. რისი ტოლია მისი კინეტიკური ენერგია (J)?"),
        accepted: ["750", "750 J"],
        hints: [l("Use Eₖ = ½ m v².", "გამოიყენე Eₖ = ½ m v²."), l("Square the speed first: 5² = 25.", "ჯერ სიჩქარე აიყვანე კვადრატში: 5² = 25."), l("½ × 60 × 25", "½ × 60 × 25")],
        solution: l("Eₖ = ½ · 60 · 25 = 750 J", "Eₖ = ½ · 60 · 25 = 750 J"),
      },
      {
        type: "mc",
        title: l("Double the speed", "სიჩქარის გაორმაგება"),
        prompt: l("A car doubles its speed. What happens to its kinetic energy?", "მანქანამ სიჩქარე გააორმაგა. რა მოუვა მის კინეტიკურ ენერგიას?"),
        options: [l("It doubles", "გაორმაგდება"), l("It becomes four times larger", "ოთხჯერ გაიზრდება"), l("It stays the same", "არ შეიცვლება"), l("It halves", "განახევრდება")],
        correct: 1,
        hints: [l("Speed is squared in the formula.", "ფორმულაში სიჩქარე კვადრატშია."), l("(2v)² = 4v²", "(2v)² = 4v²")],
        explanation: l("Eₖ depends on v², so doubling v multiplies Eₖ by 4 — and the braking distance grows too.", "Eₖ v²-ზეა დამოკიდებული, ამიტომ v-ს გაორმაგება Eₖ-ს 4-ჯერ ზრდის — და იზრდება დამუხრუჭების მანძილიც."),
      },
      {
        type: "exercise",
        title: l("Efficiency", "მქკ"),
        prompt: l("A lamp uses 200 J of electrical energy and gives out 50 J as light. What is its efficiency in %?", "ნათურა 200 J ელექტრულ ენერგიას იყენებს და 50 J-ს სინათლის სახით გამოსცემს. რისი ტოლია მისი მქკ (%)?"),
        accepted: ["25", "25%"],
        hints: [l("Efficiency = useful ÷ input × 100%.", "მქკ = სასარგებლო ÷ დახარჯული × 100%."), l("50 ÷ 200 = 0.25", "50 ÷ 200 = 0,25")],
        solution: l("50 ÷ 200 × 100% = 25%. The other 150 J become heat.", "50 ÷ 200 × 100% = 25%. დანარჩენი 150 J სითბოდ გარდაიქმნება."),
      },
      {
        type: "discussion",
        prompt: l(
          "Hydropower produces little air pollution, but large dams also change rivers and valleys. What should be weighed when a new power station is planned?",
          "ჰიდროენერგეტიკა ჰაერს ნაკლებად აბინძურებს, მაგრამ დიდი კაშხლები მდინარეებსა და ხეობებსაც ცვლის. რა უნდა აიწონ-დაიწონოს ახალი ელექტროსადგურის დაგეგმვისას?",
        ),
      },
      { type: "exit", prompt: l("Describe the energy transfers when you ride a bicycle down a hill and brake at the bottom.", "აღწერე ენერგიის გარდაქმნები, როცა ველოსიპედით დაღმართზე ეშვები და ბოლოში ამუხრუჭებ.") },
    ],
    discussion: [
      l("If energy is always conserved, why do we talk about \"saving energy\"?", "თუ ენერგია ყოველთვის ინახება, რატომ ვლაპარაკობთ „ენერგიის დაზოგვაზე“?"),
      l("Which energy transfers happen in your home every morning?", "ენერგიის რომელი გარდაქმნები ხდება ყოველ დილით შენს სახლში?"),
    ],
    assessment: [
      l("Correct use of Eₖ and Eₚ with units.", "Eₖ-სა და Eₚ-ს ფორმულების სწორი გამოყენება ერთეულებით."),
      l("An energy-transfer chain described in words for a real device.", "რეალური მოწყობილობისთვის ენერგიის გარდაქმნების ჯაჭვის სიტყვიერი აღწერა."),
    ],
    homework: [
      l("Choose three devices at home. For each, draw the energy transfer chain and mark the useful and the wasted output.", "აირჩიე სახლში სამი მოწყობილობა. თითოეულისთვის დახატე ენერგიის გარდაქმნების ჯაჭვი და მონიშნე სასარგებლო და დაკარგული ენერგია."),
      l("A 0.5 kg ball is dropped from 3.2 m. Ignoring air resistance, how fast is it moving when it hits the ground? (g = 10 N/kg)", "0,5 კგ მასის ბურთი 3,2 მ სიმაღლიდან ჩამოაგდეს. ჰაერის წინააღმდეგობის გაუთვალისწინებლად, რა სიჩქარით მოხვდება ის მიწას? (g = 10 N/kg)"),
    ],
    teacherNotes: l(
      "g = 10 N/kg keeps the arithmetic simple; mention 9.8 N/kg for precise work. The hydropower example is deliberately general — if you add figures (installed capacity, share of electricity), take them from current official sources such as the Georgian State Electrosystem or Geostat and give the year.",
      "g = 10 N/kg გამოთვლებს ამარტივებს; ზუსტი გამოთვლებისთვის მოიხსენიეთ 9,8 N/kg. ჰიდროენერგეტიკის მაგალითი განზრახაა ზოგადი — თუ რიცხვებს დაამატებთ (დადგმული სიმძლავრე, ელექტროენერგიაში წილი), აიღეთ ისინი მოქმედი ოფიციალური წყაროებიდან, მაგალითად, საქართველოს სახელმწიფო ელექტროსისტემის ან საქსტატის მონაცემებიდან, და მიუთითეთ წელი.",
    ),
    quiz: {
      title: l("Energy — check yourself", "ენერგია — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("Eₚ of a 3 kg object at 4 m (g = 10 N/kg), in J?", "3 კგ მასის სხეულის Eₚ 4 მ სიმაღლეზე (g = 10 N/kg), J-ში?"), answer: 120, explanation: l("3 · 10 · 4 = 120 J", "3 · 10 · 4 = 120 J") },
        { type: "num", prompt: l("Eₖ of a 2 kg ball at 3 m/s, in J?", "3 m/s სიჩქარით მოძრავი 2 კგ მასის ბურთის Eₖ, J-ში?"), answer: 9, explanation: l("½ · 2 · 9 = 9 J", "½ · 2 · 9 = 9 J") },
        { type: "tf", prompt: l("A device with 100% efficiency is common in everyday life.", "100%-იანი მქკ-ის მქონე მოწყობილობა ყოველდღიურ ცხოვრებაში ხშირია."), answer: false, explanation: l("Real devices always transfer some energy to the surroundings.", "რეალური მოწყობილობები ენერგიის ნაწილს ყოველთვის გარემოს გადასცემს.") },
        {
          type: "mc",
          prompt: l("In a hydropower station, what does the generator do?", "რას აკეთებს ჰიდროელექტროსადგურის გენერატორი?"),
          options: [l("Turns kinetic energy of rotation into electrical energy", "ბრუნვის კინეტიკურ ენერგიას ელექტრულად გარდაქმნის"), l("Heats the water", "წყალს აცხელებს"), l("Stores water", "წყალს აგროვებს"), l("Creates energy from nothing", "ენერგიას არაფრისგან ქმნის")],
          correct: 0,
        },
      ],
    },
  },
  {
    group: "simple-circuits",
    subject: "physics",
    grade: 8,
    durationMin: 45,
    difficulty: "standard",
    match: /circuit|current|voltage|resistance|ohm|წრედ|დენ|ძაბვ|წინაღობ|ომის/i,
    title: l("Simple Electric Circuits and Ohm's Law", "მარტივი ელექტრული წრედი და ომის კანონი"),
    topic: l("Electric circuits", "ელექტრული წრედი"),
    objective: l(
      "Students build and draw simple circuits, use current, voltage and resistance correctly, apply Ohm's law, and compare series and parallel connections.",
      "მოსწავლეები აწყობენ და ხაზავენ მარტივ წრედებს, სწორად იყენებენ დენის ძალის, ძაბვისა და წინაღობის ცნებებს, იყენებენ ომის კანონს და ადარებენ მიმდევრობით და პარალელურ შეერთებას.",
    ),
    objectives: [
      l("Explain what makes a circuit complete and draw it with standard symbols.", "ახსნას, როდის არის წრედი შეკრული, და დახაზოს ის პირობითი აღნიშვნებით."),
      l("Use I = U / R to calculate current, voltage or resistance.", "გამოიყენოს I = U / R დენის ძალის, ძაბვის ან წინაღობის გამოსათვლელად."),
      l("Compare series and parallel circuits.", "შეადაროს მიმდევრობითი და პარალელური შეერთება."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why does the lamp light up?", "რატომ ანთია ნათურა?"),
        minutes: 5,
        body: l(
          `A battery, two wires and a small lamp: the lamp only lights when there is a complete loop from one terminal of the battery, through the lamp, back to the other terminal. Break the loop anywhere — the lamp goes out. That loop is an electric circuit.`,
          `ბატარეა, ორი სადენი და პატარა ნათურა: ნათურა მხოლოდ მაშინ ანთია, როცა ბატარეის ერთი პოლუსიდან, ნათურის გავლით, მეორე პოლუსამდე შეკრული გზაა. თუ ეს გზა სადმე გაწყდება, ნათურა ჩაქრება. ასეთ შეკრულ გზას ელექტრული წრედი ჰქვია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Current, voltage, resistance", "დენის ძალა, ძაბვა, წინაღობა"),
        minutes: 12,
        body: l(
          `• Current (I) — how much electric charge flows per second, in amperes (A). Measured with an ammeter connected in series.
• Voltage (U) — the "push" that drives the charge, in volts (V). Measured with a voltmeter connected in parallel across a component.
• Resistance (R) — how strongly a component opposes the current, in ohms (Ω).

Ohm's law: I = U / R  (so U = I · R and R = U / I)

Example: a 6 V battery and a 12 Ω resistor: I = 6 / 12 = 0.5 A.`,
          `• დენის ძალა (I) — რამდენი ელექტრული მუხტი გადის წამში; იზომება ამპერებში (A) ამპერმეტრით, რომელიც წრედში მიმდევრობით ირთვება.
• ძაბვა (U) — „ბიძგი“, რომელიც მუხტს ამოძრავებს; იზომება ვოლტებში (V) ვოლტმეტრით, რომელიც ელემენტს პარალელურად უერთდება.
• წინაღობა (R) — რამდენად ეწინააღმდეგება ელემენტი დენს; იზომება ომებში (Ω).

ომის კანონი: I = U / R  (ანუ U = I · R და R = U / I)

მაგალითი: 6 V ბატარეა და 12 Ω რეზისტორი: I = 6 / 12 = 0,5 A.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Series and parallel", "მიმდევრობითი და პარალელური შეერთება"),
        minutes: 10,
        body: l(
          `Series: components one after another in a single loop.
• The same current flows through all of them.
• Resistances add: R = R₁ + R₂.
• If one lamp breaks, all go out.

Parallel: components on separate branches.
• Each branch gets the full battery voltage.
• The total current is the sum of the branch currents.
• If one lamp breaks, the others stay on — this is how the lights and sockets in a home are connected.`,
          `მიმდევრობითი: ელემენტები ერთმანეთის მიყოლებით, ერთ შეკრულ წრედში.
• ყველაში ერთი და იგივე დენი გადის.
• წინაღობები იკრიბება: R = R₁ + R₂.
• თუ ერთი ნათურა გადაიწვება, ყველა ჩაქრება.

პარალელური: ელემენტები ცალკეულ განშტოებებზე.
• თითოეულ განშტოებაზე ბატარეის სრული ძაბვაა.
• საერთო დენი განშტოებების დენების ჯამია.
• თუ ერთი ნათურა გადაიწვება, დანარჩენები ანთებული რჩება — ასეა შეერთებული სახლის განათება და როზეტები.`,
        ),
      },
      {
        kind: "practice",
        title: l("Simulate, then build", "ჯერ სიმულაცია, შემდეგ აწყობა"),
        minutes: 13,
        body: l(
          `Open the STEM Laboratory simulation "Ohm's law circuit": change the voltage and the resistance and watch the current. Then, if your class has a kit, try the experiment "Conductors and insulators".

Safety: use only batteries or low-voltage kits (up to about 12 V). Never experiment with mains sockets — mains electricity can kill.`,
          `გახსენი STEM ლაბორატორიის სიმულაცია „ომის კანონი წრედში“: შეცვალე ძაბვა და წინაღობა და დააკვირდი დენს. შემდეგ, თუ კლასს ნაკრები აქვს, სცადე ექსპერიმენტი „გამტარები და იზოლატორები“.

უსაფრთხოება: გამოიყენე მხოლოდ ბატარეები ან დაბალი ძაბვის ნაკრები (დაახლოებით 12 V-მდე). არასოდეს ჩაატარო ცდები როზეტზე — ქსელის დენი სიცოცხლისთვის საშიშია.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• A circuit needs a complete loop.
• I = U / R (amperes, volts, ohms).
• Series: same current, resistances add. Parallel: same voltage, currents add.`,
          `• წრედს შეკრული გზა სჭირდება.
• I = U / R (ამპერი, ვოლტი, ომი).
• მიმდევრობითი: ერთი დენი, წინაღობები იკრიბება. პარალელური: ერთი ძაბვა, დენები იკრიბება.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Ohm's law", "ომის კანონი"),
        prompt: l("A 9 V battery is connected to a 30 Ω resistor. What is the current in A?", "9 V ბატარეა 30 Ω რეზისტორს უერთდება. რისი ტოლია დენის ძალა (A)?"),
        accepted: ["0.3", "0.3 A", "0,3"],
        hints: [l("Use I = U / R.", "გამოიყენე I = U / R."), l("9 ÷ 30", "9 ÷ 30")],
        solution: l("I = 9 ÷ 30 = 0.3 A", "I = 9 ÷ 30 = 0,3 A"),
      },
      {
        type: "exercise",
        title: l("Series resistance", "მიმდევრობითი წინაღობა"),
        prompt: l("Two resistors of 4 Ω and 8 Ω are connected in series to a 6 V battery. What is the current in A?", "4 Ω და 8 Ω რეზისტორები მიმდევრობით არის შეერთებული 6 V ბატარეასთან. რისი ტოლია დენის ძალა (A)?"),
        accepted: ["0.5", "0.5 A", "0,5"],
        hints: [l("In series, resistances add.", "მიმდევრობით შეერთებისას წინაღობები იკრიბება."), l("R = 12 Ω. Now use I = U / R.", "R = 12 Ω. ახლა გამოიყენე I = U / R.")],
        solution: l("R = 4 + 8 = 12 Ω; I = 6 ÷ 12 = 0.5 A", "R = 4 + 8 = 12 Ω; I = 6 ÷ 12 = 0,5 A"),
      },
      {
        type: "mc",
        title: l("Measuring voltage", "ძაბვის გაზომვა"),
        prompt: l("How is a voltmeter connected to measure the voltage across a lamp?", "როგორ უნდა შევაერთოთ ვოლტმეტრი ნათურაზე ძაბვის გასაზომად?"),
        options: [l("In parallel with the lamp", "ნათურის პარალელურად"), l("In series with the lamp", "ნათურასთან მიმდევრობით"), l("Instead of the battery", "ბატარეის ნაცვლად"), l("It does not matter", "მნიშვნელობა არ აქვს")],
        correct: 0,
        hints: [l("A voltmeter compares two points of the circuit.", "ვოლტმეტრი წრედის ორ წერტილს ადარებს."), l("Connect it across the lamp, one lead on each side — it does not replace a wire in the loop.", "შეაერთე ნათურის ორივე ბოლოზე, თითო სადენი თითო მხარეს — ის შეკრულ წრედში სადენს არ ანაცვლებს.")],
        explanation: l("A voltmeter goes across (in parallel with) the component; an ammeter goes in series.", "ვოლტმეტრი ელემენტს პარალელურად უერთდება, ამპერმეტრი კი მიმდევრობით."),
      },
      {
        type: "mc",
        title: l("Home wiring", "სახლის ელექტროგაყვანილობა"),
        prompt: l("Why are the lamps in a home connected in parallel?", "რატომ არის სახლში ნათურები პარალელურად შეერთებული?"),
        options: [
          l("Each lamp gets the full voltage and can be switched on and off independently", "თითოეულ ნათურას სრული ძაბვა მიეწოდება და მისი ცალკე ჩართვა-გამორთვა შეიძლება"),
          l("Parallel circuits use less wire", "პარალელურ წრედს ნაკლები სადენი სჭირდება"),
          l("The current is the same everywhere", "დენი ყველგან ერთნაირია"),
          l("It makes the lamps dimmer", "ნათურები უფრო მკრთალად ანათებს"),
        ],
        correct: 0,
        explanation: l("In parallel every branch has the full voltage and works independently.", "პარალელური შეერთებისას ყოველ განშტოებაზე სრული ძაბვაა და თითოეული დამოუკიდებლად მუშაობს."),
        hints: [
          l("Think about what happens at home when you switch off one lamp.", "იფიქრე, რა ხდება სახლში, როცა ერთ ნათურას გამორთავ."),
          l("In which kind of connection does each branch get the full voltage and work on its own?", "რომელი შეერთებისას იღებს ყოველი განშტოება სრულ ძაბვას და მუშაობს დამოუკიდებლად?"),
        ],
      },
      {
        type: "discussion",
        prompt: l("Why is it dangerous to touch a broken cable, even though a battery of the same size is harmless?", "რატომ არის დაზიანებული სადენის შეხება საშიში, მაშინ როცა ბატარეა უვნებელია?"),
      },
      { type: "exit", prompt: l("Draw a circuit with a battery, a switch and two lamps in parallel. Which lamps go out when the switch opens?", "დახაზე წრედი ბატარეით, ამომრთველითა და ორი პარალელურად შეერთებული ნათურით. რომელი ნათურები ჩაქრება ამომრთველის გამორთვისას?") },
    ],
    discussion: [
      l("Why do fuses and circuit breakers protect a home?", "როგორ იცავს სახლს დამცველი და ავტომატური ამომრთველი?"),
      l("Where might a very high resistance be useful?", "სად შეიძლება იყოს სასარგებლო ძალიან დიდი წინაღობა?"),
    ],
    assessment: [
      l("Circuit diagrams drawn with correct symbols.", "წრედის სქემები სწორი პირობითი აღნიშვნებით."),
      l("Correct Ohm's law calculations for single and series resistors.", "ომის კანონზე სწორი გამოთვლები ერთი და მიმდევრობით შეერთებული რეზისტორებისთვის."),
    ],
    homework: [
      l("Look at a phone charger or appliance label. Which voltage and current are written on it?", "დახედე ტელეფონის დამტენის ან საყოფაცხოვრებო მოწყობილობის ეტიკეტს. რა ძაბვა და დენია მასზე მითითებული?"),
      l("Calculate the resistance of a lamp that draws 0.25 A from a 12 V supply.", "გამოთვალე ნათურის წინაღობა, რომელიც 12 V კვების წყაროდან 0,25 A დენს მოიხმარს."),
    ],
    teacherNotes: l(
      "Use only low-voltage kits. The STEM Laboratory electronics topics and the \"Ohm's law practice\" challenge give extra practice. Students often think current is \"used up\" by the first lamp in series; the ammeter readings before and after each lamp show that it is not.",
      "გამოიყენეთ მხოლოდ დაბალი ძაბვის ნაკრებები. STEM ლაბორატორიის ელექტრონიკის თემები და გამოწვევა „ომის კანონის ვარჯიში“ დამატებით სავარჯიშოს იძლევა. მოსწავლეებს ხშირად ჰგონიათ, რომ მიმდევრობით შეერთებისას დენს პირველი ნათურა „ხარჯავს“; ამპერმეტრის ჩვენებები თითოეულ ნათურამდე და მის შემდეგ აჩვენებს, რომ ასე არ არის.",
    ),
    quiz: {
      title: l("Circuits — check yourself", "წრედები — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("U = 12 V, R = 4 Ω. Current in A?", "U = 12 V, R = 4 Ω. დენის ძალა A-ში?"), answer: 3, explanation: l("12 ÷ 4 = 3 A", "12 ÷ 4 = 3 A") },
        { type: "num", prompt: l("I = 2 A through R = 5 Ω. Voltage in V?", "R = 5 Ω წინაღობაში გადის I = 2 A. ძაბვა V-ში?"), answer: 10, explanation: l("U = I · R = 10 V", "U = I · R = 10 V") },
        { type: "tf", prompt: l("In a series circuit, if one lamp breaks, the others keep shining.", "მიმდევრობით წრედში ერთი ნათურის გადაწვისას დანარჩენები ანათებს."), answer: false, explanation: l("The single loop is broken, so the current stops everywhere.", "ერთადერთი შეკრული გზა წყდება და დენი ყველგან წყდება.") },
        {
          type: "mc",
          prompt: l("What is the unit of resistance?", "რა არის წინაღობის ერთეული?"),
          options: [l("Ohm (Ω)", "ომი (Ω)"), l("Ampere (A)", "ამპერი (A)"), l("Volt (V)", "ვოლტი (V)"), l("Joule (J)", "ჯოული (J)")],
          correct: 0,
        },
      ],
    },
  },
];
