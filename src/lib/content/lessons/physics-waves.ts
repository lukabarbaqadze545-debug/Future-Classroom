import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

/** Waves and light (grade 9): the first optics and wave lessons. */
export const PHYSICS_WAVES: BiLesson[] = [
  {
    group: "waves",
    subject: "physics",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /wave|frequency|wavelength|amplitude|ტალღ|სიხშირ|ამპლიტუდ/i,
    title: l("Waves: Frequency, Wavelength and Speed", "ტალღები: სიხშირე, ტალღის სიგრძე და სიჩქარე"),
    topic: l("Waves", "ტალღები"),
    objective: l(
      "Students tell transverse from longitudinal waves, name the quantities that describe a wave and use v = f · λ.",
      "მოსწავლეები ერთმანეთისგან არჩევენ განივ და გრძივ ტალღებს, ასახელებენ ტალღის აღმწერ სიდიდეებს და იყენებენ ფორმულას v = f · λ.",
    ),
    objectives: [
      l("Explain that a wave carries energy from place to place without carrying the material with it.", "ახსნას, რომ ტალღა ენერგიას ერთი ადგილიდან მეორეზე გადაიტანს, ნივთიერებას კი თან არ მიაქვს."),
      l("Tell transverse waves from longitudinal waves and give an example of each.", "გაარჩიოს განივი და გრძივი ტალღები და თითოეულს მოუყვანოს მაგალითი."),
      l("Use amplitude, wavelength, frequency and period correctly, with units.", "სწორად გამოიყენოს ამპლიტუდა, ტალღის სიგრძე, სიხშირე და პერიოდი, ერთეულებით."),
      l("Calculate wave speed with v = f · λ and rearrange it.", "გამოთვალოს ტალღის სიჩქარე ფორმულით v = f · λ და გამოსახოს მისგან სხვა სიდიდეები."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("What travels in a wave?", "რა ვრცელდება ტალღაში?"),
        minutes: 5,
        body: l(
          `Throw a stone into a lake. Rings spread out, but a leaf floating on the water only bobs up and down — it does not travel to the shore.

In a stadium "wave", each fan only stands up and sits down, yet the wave runs around the whole stadium. What moves along is not the people or the water but a disturbance — and the energy it carries.`,
          `ტბაში ქვა ჩააგდე. წრეები ირგვლივ ვრცელდება, წყალზე მოტივტივე ფოთოლი კი მხოლოდ ზევით-ქვევით ირხევა — ნაპირისკენ არ მიცურავს.

სტადიონზე „ტალღის“ დროს თითოეული გულშემატკივარი მხოლოდ დგება და ჯდება, ტალღა კი მთელ სტადიონს უვლის. წინ მიიწევს არა ადამიანები ან წყალი, არამედ შეშფოთება — და ენერგია, რომელიც მას მიაქვს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Transverse and longitudinal waves", "განივი და გრძივი ტალღები"),
        minutes: 10,
        body: l(
          `• Transverse wave: the particles move at right angles to the direction the wave travels. Examples: a wave on a rope, the stadium wave, light.
• Longitudinal wave: the particles move back and forth along the direction the wave travels, making compressions and rarefactions. Example: sound in air.

Sound needs a material (air, water, a wall) to travel through, so it cannot cross empty space. Light can: it reaches us from the Sun through the vacuum of space.`,
          `• განივი ტალღა: ნაწილაკები ტალღის გავრცელების მიმართულების მართობულად მოძრაობს. მაგალითები: ტალღა თოკზე, სტადიონის „ტალღა“, სინათლე.
• გრძივი ტალღა: ნაწილაკები წინ და უკან ირხევა ტალღის გავრცელების მიმართულებით და წარმოქმნის შემჭიდროებებსა და გაიშვიათებებს. მაგალითი: ბგერა ჰაერში.

ბგერას გასავრცელებლად ნივთიერება სჭირდება (ჰაერი, წყალი, კედელი), ამიტომ ცარიელ სივრცეში ვერ ვრცელდება. სინათლე კი ვრცელდება: მზიდან კოსმოსური ვაკუუმის გავლით აღწევს ჩვენამდე.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Describing a wave: v = f · λ", "ტალღის აღწერა: v = f · λ"),
        minutes: 13,
        body: l(
          `• Amplitude (A): the largest displacement from the rest position. A bigger amplitude carries more energy (a louder sound, a brighter light).
• Wavelength (λ, "lambda"): the distance between two neighbouring crests, in metres (m).
• Frequency (f): how many waves pass a point each second, in hertz (Hz). 1 Hz = one wave per second.
• Period (T): the time for one wave, in seconds (s). T = 1 / f.

In one period the wave moves forward by one wavelength, so its speed is

v = f · λ     (speed = frequency × wavelength)

Example: a wave on a rope has f = 4 Hz and λ = 0.5 m, so v = 4 · 0.5 = 2 m/s.
Sound in air travels at about 340 m/s. If you see lightning and hear the thunder 3 s later, the storm is about 340 · 3 ≈ 1000 m away.

The graph shows the shape of a wave at one moment: the height of each crest is the amplitude, the distance between crests is the wavelength.`,
          `• ამპლიტუდა (A): უდიდესი გადახრა წონასწორობის მდებარეობიდან. დიდი ამპლიტუდის ტალღას მეტი ენერგია მიაქვს (უფრო ხმამაღალი ბგერა, უფრო კაშკაშა სინათლე).
• ტალღის სიგრძე (λ, „ლამბდა“): მანძილი ორ მეზობელ ქიმს შორის, მეტრებში (მ).
• სიხშირე (f): რამდენი ტალღა გაივლის ერთ წერტილს ყოველ წამში, ჰერცებში (ჰც). 1 ჰც = ერთი ტალღა წამში.
• პერიოდი (T): ერთი ტალღის დრო, წამებში (წმ). T = 1 / f.

ერთ პერიოდში ტალღა ერთი ტალღის სიგრძით წაიწევს წინ, ამიტომ მისი სიჩქარეა

v = f · λ     (სიჩქარე = სიხშირე × ტალღის სიგრძე)

მაგალითი: თოკზე ტალღის სიხშირეა f = 4 ჰც, ტალღის სიგრძე λ = 0,5 მ, ამიტომ v = 4 · 0,5 = 2 მ/წმ.
ბგერა ჰაერში დაახლოებით 340 მ/წმ სიჩქარით ვრცელდება. თუ ელვა დაინახე და ქუხილი 3 წმ-ის შემდეგ გაიგე, ქარიშხალი დაახლოებით 340 · 3 ≈ 1000 მ-შია.

გრაფიკი ტალღის ფორმას ერთ მომენტში აჩვენებს: ქიმის სიმაღლე ამპლიტუდაა, მანძილი ქიმებს შორის — ტალღის სიგრძე.`,
        ),
        plot: { expression: "2*sin(x)", xMin: 0, xMax: 19, caption: l("A wave at one moment: amplitude 2, wavelength about 6.3", "ტალღა ერთ მომენტში: ამპლიტუდა 2, ტალღის სიგრძე დაახლოებით 6,3") },
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 12,
        body: l(
          `Complete the activities. Then, in pairs, make a transverse wave on a skipping rope and a longitudinal wave on a stretched spring (a "slinky"), if the class has one. Shake faster: what happens to the wavelength?`,
          `შეასრულე აქტივობები. შემდეგ წყვილებში სახტუნაო თოკზე განივი ტალღა შექმენი, გაჭიმულ ზამბარაზე კი — გრძივი, თუ კლასში ასეთი ზამბარაა. უფრო სწრაფად არხიე: რა ემართება ტალღის სიგრძეს?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• A wave carries energy, not material.
• Transverse: particles move across the direction of travel. Longitudinal: along it (sound).
• v = f · λ; T = 1 / f. Units: m/s, Hz, m, s.
• Same speed, higher frequency → shorter wavelength.`,
          `• ტალღას ენერგია მიაქვს და არა ნივთიერება.
• განივი: ნაწილაკები გავრცელების მიმართულების მართობულად მოძრაობს. გრძივი: მისი გასწვრივ (ბგერა).
• v = f · λ; T = 1 / f. ერთეულები: მ/წმ, ჰც, მ, წმ.
• იგივე სიჩქარისას მეტი სიხშირე → უფრო მოკლე ტალღის სიგრძე.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Which wave is longitudinal?", "რომელი ტალღაა გრძივი?"),
        prompt: l("Which of these is a longitudinal wave?", "რომელია ამათგან გრძივი ტალღა?"),
        options: [l("Sound in air", "ბგერა ჰაერში"), l("A wave on a stretched rope", "ტალღა გაჭიმულ თოკზე"), l("Light", "სინათლე"), l("A stadium wave", "სტადიონის „ტალღა“")],
        correct: 0,
        hints: [
          l("In a longitudinal wave, particles move back and forth along the direction the wave travels.", "გრძივ ტალღაში ნაწილაკები ტალღის გავრცელების მიმართულებით წინ და უკან ირხევა."),
          l("Which wave is made of compressions and rarefactions of air?", "რომელი ტალღა შედგება ჰაერის შემჭიდროებებისა და გაიშვიათებებისგან?"),
        ],
        explanation: l("Sound pushes air molecules back and forth along its direction of travel.", "ბგერა ჰაერის მოლეკულებს გავრცელების მიმართულებით წინ და უკან არხევს."),
      },
      {
        type: "exercise",
        title: l("Wave speed", "ტალღის სიჩქარე"),
        prompt: l("A wave has a frequency of 5 Hz and a wavelength of 2 m. What is its speed in m/s?", "ტალღის სიხშირეა 5 ჰც, ტალღის სიგრძე — 2 მ. რისი ტოლია მისი სიჩქარე (მ/წმ)?"),
        accepted: ["10"],
        hints: [l("Use v = f · λ.", "გამოიყენე ფორმულა v = f · λ."), l("Multiply the frequency by the wavelength: 5 · 2.", "სიხშირე გაამრავლე ტალღის სიგრძეზე: 5 · 2.")],
        solution: l("v = f · λ = 5 Hz · 2 m = 10 m/s", "v = f · λ = 5 ჰც · 2 მ = 10 მ/წმ"),
      },
      {
        type: "exercise",
        title: l("Wavelength of a note", "ნოტის ტალღის სიგრძე"),
        prompt: l(
          "Sound travels at 340 m/s. What is the wavelength, in metres, of a note with a frequency of 170 Hz?",
          "ბგერა 340 მ/წმ სიჩქარით ვრცელდება. რისი ტოლია 170 ჰც სიხშირის ნოტის ტალღის სიგრძე მეტრებში?",
        ),
        accepted: ["2"],
        hints: [l("Rearrange v = f · λ to find λ.", "ფორმულიდან v = f · λ გამოსახე λ."), l("λ = v / f = 340 / 170.", "λ = v / f = 340 / 170.")],
        solution: l("λ = v / f = 340 m/s ÷ 170 Hz = 2 m", "λ = v / f = 340 მ/წმ ÷ 170 ჰც = 2 მ"),
      },
      {
        type: "exercise",
        title: l("Period", "პერიოდი"),
        prompt: l("The mains electricity in Georgia alternates at 50 Hz. What is its period in seconds?", "საქართველოში ქსელის ელექტროდენის სიხშირე 50 ჰც-ია. რისი ტოლია მისი პერიოდი წამებში?"),
        accepted: ["0.02", "0,02", "1/50"],
        hints: [l("Period and frequency are linked: T = 1 / f.", "პერიოდი და სიხშირე ერთმანეთთან დაკავშირებულია: T = 1 / f."), l("Divide 1 by 50.", "1 გაყავი 50-ზე.")],
        solution: l("T = 1 / f = 1 / 50 = 0.02 s", "T = 1 / f = 1 / 50 = 0,02 წმ"),
      },
      {
        type: "mc",
        title: l("Change the frequency", "სიხშირის შეცვლა"),
        prompt: l(
          "A sound wave's frequency doubles while its speed in air stays the same. What happens to its wavelength?",
          "ბგერითი ტალღის სიხშირე ორჯერ იზრდება, ჰაერში მისი სიჩქარე კი არ იცვლება. რა ემართება ტალღის სიგრძეს?",
        ),
        options: [l("It halves", "ორჯერ მცირდება"), l("It doubles", "ორჯერ იზრდება"), l("It stays the same", "არ იცვლება"), l("It becomes four times longer", "ოთხჯერ იზრდება")],
        correct: 0,
        hints: [l("Write v = f · λ and keep v fixed.", "ჩაწერე v = f · λ და v უცვლელი დატოვე."), l("If f becomes twice as big, what must λ do so that f · λ stays the same?", "თუ f ორჯერ გაიზრდება, რა უნდა მოუვიდეს λ-ს, რომ f · λ არ შეიცვალოს?")],
        explanation: l("v = f · λ is fixed, so doubling f halves λ.", "v = f · λ უცვლელია, ამიტომ f-ის გაორმაგებისას λ ორჯერ მცირდება."),
      },
      {
        type: "exercise",
        title: l("How far is the storm?", "რა მანძილზეა ქარიშხალი?"),
        prompt: l(
          "You see a flash of lightning and hear the thunder 3 s later. Sound travels at 340 m/s. How far away is the storm, in metres? (Light arrives almost instantly.)",
          "ელვა დაინახე, ქუხილი კი 3 წმ-ის შემდეგ გაიგე. ბგერა 340 მ/წმ სიჩქარით ვრცელდება. რა მანძილზეა ქარიშხალი (მ)? (სინათლე თითქმის მყისიერად აღწევს.)",
        ),
        accepted: ["1020"],
        hints: [l("The light takes almost no time, so the delay is the time the sound needs.", "სინათლეს თითქმის დრო არ სჭირდება, ამიტომ დაგვიანება ბგერის გავრცელების დროა."), l("distance = speed · time = 340 · 3", "მანძილი = სიჩქარე · დრო = 340 · 3")],
        solution: l("s = v · t = 340 m/s · 3 s = 1020 m (about 1 km)", "s = v · t = 340 მ/წმ · 3 წმ = 1020 მ (დაახლოებით 1 კმ)"),
      },
      {
        type: "discussion",
        prompt: l("You can hear a friend talking around a corner, but you cannot see them. What might be different about sound and light?", "კუთხის იქით მეგობრის ხმა გესმის, თავად კი ვერ ხედავ. რით შეიძლება განსხვავდებოდეს ბგერა და სინათლე?"),
      },
      { type: "exit", prompt: l("Write v = f · λ and explain each letter with its unit.", "ჩაწერე v = f · λ და ახსენი თითოეული ასო მისი ერთეულით.") },
    ],
    discussion: [
      l("Why do astronauts on a spacewalk talk by radio instead of just shouting?", "რატომ ლაპარაკობენ ღია კოსმოსში გასული ასტრონავტები რადიოთი და არა უბრალოდ ყვირილით?"),
      l("Earthquakes send out waves. Why can they damage buildings far from where the earthquake starts?", "მიწისძვრა ტალღებს წარმოქმნის. რატომ შეუძლია მათ დააზიანოს შენობები ეპიცენტრიდან შორს?"),
    ],
    assessment: [
      l("Correct use of v = f · λ and T = 1 / f with units.", "ფორმულების v = f · λ და T = 1 / f სწორი გამოყენება ერთეულებით."),
      l("A labelled sketch of a wave showing amplitude and wavelength.", "ტალღის ესკიზი მონიშნული ამპლიტუდითა და ტალღის სიგრძით."),
    ],
    homework: [
      l("Find the frequency of a radio station you like (in MHz) and calculate its wavelength (radio waves travel at 300 000 000 m/s).", "მოძებნე შენი საყვარელი რადიოსადგურის სიხშირე (მეგაჰერცებში) და გამოთვალე მისი ტალღის სიგრძე (რადიოტალღები 300 000 000 მ/წმ სიჩქარით ვრცელდება)."),
      l("Next thunderstorm: count the seconds between flash and thunder and estimate the distance.", "მომდევნო ჭექა-ქუხილისას დაითვალე წამები ელვასა და ქუხილს შორის და შეაფასე მანძილი."),
    ],
    teacherNotes: l(
      "A long spring or a skipping rope makes both kinds of wave visible in a minute. Students often think that a bigger amplitude makes a wave faster; the speed depends on the material, not on how hard you shake. Keep the lightning estimate as an estimate: 3 s per kilometre is a good rule.",
      "გრძელი ზამბარა ან სახტუნაო თოკი ორივე სახის ტალღას ერთ წუთში აჩვენებს. მოსწავლეებს ხშირად ჰგონიათ, რომ დიდი ამპლიტუდის ტალღა უფრო სწრაფია; სიჩქარე გარემოზეა დამოკიდებული და არა იმაზე, რამდენად ძლიერად არხევ. ელვაზე გათვლა შეფასებად დატოვეთ: 3 წამი ერთ კილომეტრზე კარგი წესია.",
    ),
    quiz: {
      title: l("Waves — check yourself", "ტალღები — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("f = 4 Hz, λ = 0.5 m. Wave speed in m/s?", "f = 4 ჰც, λ = 0,5 მ. ტალღის სიჩქარე მ/წმ-ში?"), answer: 2, explanation: l("v = 4 · 0.5 = 2 m/s", "v = 4 · 0,5 = 2 მ/წმ") },
        { type: "num", prompt: l("f = 4 Hz. Period in seconds?", "f = 4 ჰც. პერიოდი წამებში?"), answer: 0.25, tolerance: 0.001, explanation: l("T = 1 / 4 = 0.25 s", "T = 1 / 4 = 0,25 წმ") },
        { type: "tf", prompt: l("Sound can travel through the vacuum of space.", "ბგერა კოსმოსურ ვაკუუმში ვრცელდება."), answer: false, explanation: l("Sound needs a material to travel through.", "ბგერას გასავრცელებლად ნივთიერება სჭირდება.") },
        {
          type: "mc",
          prompt: l("What is the unit of frequency?", "რა არის სიხშირის ერთეული?"),
          options: [l("Hertz (Hz)", "ჰერცი (ჰც)"), l("Metre (m)", "მეტრი (მ)"), l("Second (s)", "წამი (წმ)"), l("Newton (N)", "ნიუტონი (ნ)")],
          correct: 0,
        },
      ],
    },
  },
  {
    group: "light",
    subject: "physics",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /light|reflect|refract|mirror|lens|optic|სინათლ|არეკვლ|გარდატეხ|სარკე|ლინზ|ოპტიკ/i,
    title: l("Light: Reflection and Refraction", "სინათლე: არეკვლა და გარდატეხა"),
    topic: l("Light and optics", "სინათლე და ოპტიკა"),
    objective: l(
      "Students apply the law of reflection, describe images in a plane mirror and explain refraction when light changes speed.",
      "მოსწავლეები იყენებენ არეკვლის კანონს, აღწერენ ბრტყელ სარკეში გამოსახულებას და ხსნიან სინათლის გარდატეხას, როცა მისი სიჩქარე იცვლება.",
    ),
    objectives: [
      l("Use the law of reflection: angle of incidence = angle of reflection, measured from the normal.", "გამოიყენოს არეკვლის კანონი: დაცემის კუთხე = არეკვლის კუთხე, მართობიდან გაზომილი."),
      l("Describe the image in a plane mirror (distance, size, left–right).", "აღწეროს გამოსახულება ბრტყელ სარკეში (მანძილი, ზომა, მარცხენა-მარჯვენა)."),
      l("Explain refraction: light bends when it enters a material where it travels at a different speed.", "ახსნას გარდატეხა: სინათლე იხრება, როცა სხვა გარემოში გადადის, სადაც სხვა სიჩქარით ვრცელდება."),
      l("Give everyday examples of reflection and refraction (mirrors, lenses, optical fibres).", "მოიყვანოს არეკვლისა და გარდატეხის ყოფითი მაგალითები (სარკეები, ლინზები, ოპტიკური ბოჭკო)."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("The broken pencil", "„გატეხილი“ ფანქარი"),
        minutes: 5,
        body: l(
          `Put a pencil into a glass of water and look from the side: the pencil seems broken at the water surface. Take it out — it is perfectly straight.

Nothing happened to the pencil. Something happened to the light coming from it. Today: what light does when it meets a mirror, and when it passes from one material into another.`,
          `ჭიქა წყალში ფანქარი ჩადე და გვერდიდან შეხედე: წყლის ზედაპირთან ფანქარი თითქოს გატეხილია. ამოიღე — სრულიად სწორია.

ფანქარს არაფერი მოსვლია. რაღაც დაემართა სინათლეს, რომელიც მისგან მოდის. დღეს ვნახავთ, რას აკეთებს სინათლე, როცა სარკეს ხვდება და როცა ერთი გარემოდან მეორეში გადადის.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Reflection", "არეკვლა"),
        minutes: 13,
        body: l(
          `Light travels in straight lines, very fast: about 300 000 km/s in air.

When a ray of light hits a mirror, it bounces off. Draw the normal — a line at 90° to the mirror where the ray hits it.
• angle of incidence (i): between the incoming ray and the normal
• angle of reflection (r): between the reflected ray and the normal

Law of reflection: i = r.

A plane (flat) mirror makes an image that is
• as far behind the mirror as the object is in front of it,
• the same size as the object,
• left–right reversed (raise your right hand: your image raises its left).
That is why, in many countries, AMBULANCE is written in mirror writing on the front of ambulances: drivers ahead read it correctly in their rear-view mirror.`,
          `სინათლე წრფივად და ძალიან სწრაფად ვრცელდება: ჰაერში დაახლოებით 300 000 კმ/წმ სიჩქარით.

როცა სინათლის სხივი სარკეს ხვდება, აირეკლება. დაცემის წერტილში აღმართე მართობი — სარკისადმი 90°-ით დახრილი წრფე.
• დაცემის კუთხე (i): დაცემულ სხივსა და მართობს შორის
• არეკვლის კუთხე (r): არეკლილ სხივსა და მართობს შორის

არეკვლის კანონი: i = r.

ბრტყელ სარკეში გამოსახულება:
• სარკის უკან იმავე მანძილზეა, რა მანძილზეც საგანია სარკის წინ,
• საგნის ტოლი ზომისაა,
• მარცხენა და მარჯვენა მხარე შეცვლილია (მარჯვენა ხელი ასწიე — შენი გამოსახულება მარცხენას სწევს).
ამიტომაა ბევრ ქვეყანაში სასწრაფოს მანქანის წინა მხარეს წარწერა სარკისებურად დაწერილი: წინ მიმავალი მძღოლები მას უკანა ხედვის სარკეში სწორად კითხულობენ.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Refraction", "გარდატეხა"),
        minutes: 12,
        body: l(
          `Light travels more slowly in water (about 225 000 km/s) and in glass (about 200 000 km/s) than in air. When a ray crosses the boundary at an angle, the change of speed makes it change direction: this is refraction.
• Into a slower material (air → water, air → glass): the ray bends towards the normal.
• Into a faster material (water → air): it bends away from the normal.
• Along the normal (at 90° to the surface): it slows down but does not bend.

The pencil looks broken because light from the part under water bends as it leaves the water, and our eyes assume light always travels in straight lines. For the same reason a pool looks shallower than it is.

Uses:
• Lenses bend light on purpose: a converging lens (magnifying glass, camera, the lens in your eye) brings rays together.
• Optical fibres: light hitting the inside of a glass fibre at a large angle is reflected back completely (total internal reflection) and travels for kilometres. Most internet traffic between cities travels this way.`,
          `წყალში (დაახლოებით 225 000 კმ/წმ) და მინაში (დაახლოებით 200 000 კმ/წმ) სინათლე უფრო ნელა ვრცელდება, ვიდრე ჰაერში. როცა სხივი საზღვარს დახრილად კვეთს, სიჩქარის ცვლილება მიმართულებასაც უცვლის: ეს გარდატეხაა.
• უფრო „ნელ“ გარემოში გადასვლისას (ჰაერი → წყალი, ჰაერი → მინა) სხივი მართობისკენ იხრება.
• უფრო „სწრაფ“ გარემოში გადასვლისას (წყალი → ჰაერი) მართობს შორდება.
• მართობის გასწვრივ (ზედაპირისადმი 90°-ით) სხივი ნელდება, მაგრამ არ იხრება.

ფანქარი გატეხილი გვეჩვენება, რადგან წყალქვეშა ნაწილიდან წამოსული სინათლე წყლიდან გამოსვლისას გარდატყდება, თვალი კი ვარაუდობს, რომ სინათლე ყოველთვის წრფივად ვრცელდება. ამავე მიზეზით აუზი უფრო მეჩხერი გვეჩვენება, ვიდრე სინამდვილეშია.

გამოყენება:
• ლინზები სინათლეს განზრახ ხრის: შემკრები ლინზა (გამადიდებელი შუშა, ფოტოაპარატი, თვალის ბროლი) სხივებს ერთ წერტილში კრებს.
• ოპტიკური ბოჭკო: მინის ბოჭკოს შიდა კედელს დიდი კუთხით დაცემული სინათლე სრულად აირეკლება (სრული შინაგანი არეკვლა) და კილომეტრობით ვრცელდება. ქალაქებს შორის ინტერნეტის მონაცემების დიდი ნაწილი ასე გადაიცემა.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 10,
        body: l(
          `Complete the activities. With a torch (or a phone light), a mirror and a protractor, check the law of reflection: shine the light at the mirror at 30°, 45° and 60° from the normal and measure the reflected ray.`,
          `შეასრულე აქტივობები. ფანრის (ან ტელეფონის შუქის), სარკისა და ტრანსპორტირის დახმარებით შეამოწმე არეკვლის კანონი: სინათლე სარკეს მართობიდან 30°, 45° და 60° კუთხით მიანათე და არეკლილი სხივის კუთხე გაზომე.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Angles are measured from the normal. Law of reflection: i = r.
• Plane mirror image: same distance behind, same size, left–right reversed.
• Refraction: light changes direction when its speed changes; into a slower material it bends towards the normal.
• Lenses and optical fibres use refraction and reflection.`,
          `• კუთხეებს მართობიდან ვზომავთ. არეკვლის კანონი: i = r.
• ბრტყელ სარკეში გამოსახულება: იმავე მანძილზე სარკის უკან, იმავე ზომის, მარცხენა-მარჯვენა შეცვლილი.
• გარდატეხა: სიჩქარის შეცვლისას სინათლე მიმართულებას იცვლის; უფრო „ნელ“ გარემოში მართობისკენ იხრება.
• ლინზები და ოპტიკური ბოჭკო გარდატეხასა და არეკვლას იყენებს.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Law of reflection", "არეკვლის კანონი"),
        prompt: l("A ray hits a mirror with an angle of incidence of 35°. What is the angle of reflection, in degrees?", "სხივი სარკეს 35°-იანი დაცემის კუთხით ეცემა. რისი ტოლია არეკვლის კუთხე გრადუსებში?"),
        accepted: ["35"],
        hints: [l("Both angles are measured from the normal.", "ორივე კუთხე მართობიდან იზომება."), l("The law of reflection says the two angles are equal.", "არეკვლის კანონის მიხედვით ეს ორი კუთხე ტოლია.")],
        solution: l("i = r, so the angle of reflection is 35°.", "i = r, ამიტომ არეკვლის კუთხე 35°-ია."),
      },
      {
        type: "exercise",
        title: l("You and your image", "შენ და შენი გამოსახულება"),
        prompt: l("You stand 2 m in front of a plane mirror. How far are you from your image, in metres?", "ბრტყელი სარკის წინ 2 მ-ზე დგახარ. რა მანძილია შენსა და შენს გამოსახულებას შორის (მ)?"),
        accepted: ["4"],
        hints: [l("Where is the image: in front of the mirror or behind it, and how far?", "სად არის გამოსახულება — სარკის წინ თუ უკან, და რა მანძილზე?"), l("2 m to the mirror, then 2 m more behind it.", "2 მ სარკემდე და კიდევ 2 მ მის უკან.")],
        solution: l("The image is 2 m behind the mirror: 2 + 2 = 4 m from you.", "გამოსახულება სარკის უკან 2 მ-ზეა: შენგან 2 + 2 = 4 მ."),
      },
      {
        type: "mc",
        title: l("Straight at the mirror", "პირდაპირ სარკეში"),
        prompt: l("A ray hits a mirror along the normal (at 90° to the mirror surface). Where does it go?", "სხივი სარკეს მართობის გასწვრივ ეცემა (სარკის ზედაპირისადმი 90°-ით). საით წავა?"),
        options: [l("Straight back along the same line", "პირდაპირ უკან, იმავე წრფეზე"), l("Along the mirror surface", "სარკის ზედაპირის გასწვრივ"), l("Through the mirror", "სარკეში გაივლის"), l("At 45° to the mirror", "სარკისადმი 45°-ით")],
        correct: 0,
        hints: [l("Along the normal, the angle of incidence is 0°.", "მართობის გასწვრივ დაცემის კუთხე 0°-ია."), l("If i = 0°, what is r?", "თუ i = 0°, რისი ტოლია r?")],
        explanation: l("i = 0°, so r = 0°: the ray returns along the normal.", "i = 0°, ამიტომ r = 0°: სხივი მართობის გასწვრივ ბრუნდება."),
      },
      {
        type: "mc",
        title: l("Into glass", "მინაში"),
        prompt: l("A ray of light passes at an angle from air into a glass block. What happens?", "სინათლის სხივი ჰაერიდან მინის ფილაში დახრილად გადადის. რა ხდება?"),
        options: [l("It slows down and bends towards the normal", "ნელდება და მართობისკენ იხრება"), l("It speeds up and bends away from the normal", "ჩქარდება და მართობს შორდება"), l("It goes straight on without bending", "გადაუხრელად მიდის"), l("It is all reflected back", "მთლიანად აირეკლება")],
        correct: 0,
        hints: [l("Is light faster in air or in glass?", "სად ვრცელდება სინათლე უფრო სწრაფად — ჰაერში თუ მინაში?"), l("Entering a slower material, light bends towards the normal.", "უფრო „ნელ“ გარემოში გადასვლისას სინათლე მართობისკენ იხრება.")],
        explanation: l("Light is slower in glass, so it bends towards the normal.", "მინაში სინათლე უფრო ნელია, ამიტომ მართობისკენ იხრება."),
      },
      {
        type: "exercise",
        title: l("How far is the Sun?", "რა მანძილზეა მზე?"),
        prompt: l(
          "Light from the Sun takes about 500 s to reach Earth. Light travels at about 300 000 km/s. How far is the Sun, in millions of kilometres?",
          "მზის სინათლე დედამიწამდე დაახლოებით 500 წმ-ში აღწევს. სინათლე დაახლოებით 300 000 კმ/წმ სიჩქარით ვრცელდება. რა მანძილზეა მზე, მილიონ კილომეტრებში?",
        ),
        accepted: ["150"],
        hints: [l("distance = speed · time", "მანძილი = სიჩქარე · დრო"), l("300 000 · 500 = 150 000 000 km. How many millions is that?", "300 000 · 500 = 150 000 000 კმ. რამდენი მილიონია ეს?")],
        solution: l("s = 300 000 km/s · 500 s = 150 000 000 km = 150 million km", "s = 300 000 კმ/წმ · 500 წმ = 150 000 000 კმ = 150 მილიონი კმ"),
      },
      {
        type: "mc",
        title: l("The broken pencil", "„გატეხილი“ ფანქარი"),
        prompt: l("Why does a pencil in a glass of water look broken at the surface?", "რატომ გვეჩვენება წყლიან ჭიქაში ჩადებული ფანქარი ზედაპირთან გატეხილად?"),
        options: [
          l("Light from the pencil bends when it leaves the water", "ფანქრიდან წამოსული სინათლე წყლიდან გამოსვლისას გარდატყდება"),
          l("The water surface reflects all the light", "წყლის ზედაპირი მთელ სინათლეს ირეკლავს"),
          l("Water makes things bigger", "წყალი საგნებს ადიდებს"),
          l("Light travels faster in water", "წყალში სინათლე უფრო სწრაფად ვრცელდება"),
        ],
        correct: 0,
        hints: [l("Think about what happens to light at the boundary between water and air.", "იფიქრე, რა ემართება სინათლეს წყლისა და ჰაერის საზღვარზე."), l("Light changes speed there. What does that do to its direction?", "იქ სინათლე სიჩქარეს იცვლის. რას უშვრება ეს მის მიმართულებას?")],
        explanation: l("Refraction at the surface changes the direction of the light, and our eyes trace it back in a straight line.", "ზედაპირზე გარდატეხა სინათლის მიმართულებას ცვლის, თვალი კი მას წრფის გასწვრივ „აგრძელებს“."),
      },
      {
        type: "discussion",
        prompt: l("Why do lifeguards warn that a pool or a river is deeper than it looks?", "რატომ აფრთხილებენ მაშველები, რომ აუზი ან მდინარე უფრო ღრმაა, ვიდრე ჩანს?"),
      },
      { type: "exit", prompt: l("Draw a ray reflecting from a mirror. Label the normal, the angle of incidence and the angle of reflection.", "დახაზე სარკიდან არეკლილი სხივი. მონიშნე მართობი, დაცემის კუთხე და არეკვლის კუთხე.") },
    ],
    discussion: [
      l("Where do you use mirrors and lenses in a normal day?", "ჩვეულებრივ დღეს სად იყენებ სარკეებსა და ლინზებს?"),
      l("How can light carry internet data inside a glass fibre that bends around corners?", "როგორ გადააქვს სინათლეს ინტერნეტის მონაცემები მინის ბოჭკოში, რომელიც კუთხეებზე იღუნება?"),
    ],
    assessment: [
      l("Ray diagrams with the normal and equal angles drawn correctly.", "სხივების სქემები სწორად დახაზული მართობითა და ტოლი კუთხეებით."),
      l("A correct explanation of refraction in terms of speed.", "გარდატეხის სწორი ახსნა სიჩქარის ცვლილებით."),
    ],
    homework: [
      l("Write your name so that it reads correctly in a mirror. Check it.", "შენი სახელი ისე დაწერე, რომ სარკეში სწორად იკითხებოდეს. შეამოწმე."),
      l("Put a coin in an empty cup, move back until it just disappears, then have someone pour water in. Explain what you see.", "ცარიელ ჭიქაში მონეტა ჩადე, უკან დაიხიე, სანამ მონეტა თვალს არ მოეფარება, შემდეგ ვინმეს ჭიქაში წყალი ჩაასხმევინე. ახსენი, რას ხედავ."),
    ],
    teacherNotes: l(
      "Students often measure angles from the mirror surface instead of from the normal; insist on drawing the normal first. Use low-power torches, never lasers pointed at eyes. The values for the speed of light in water and glass are rounded; the direction of bending is what matters here, not Snell's law.",
      "მოსწავლეები ხშირად კუთხეს სარკის ზედაპირიდან ზომავენ და არა მართობიდან; მოსთხოვეთ, რომ ჯერ მართობი დახაზონ. გამოიყენეთ სუსტი ფანრები და არასდროს მიმართოთ ლაზერი თვალისკენ. სინათლის სიჩქარე წყალსა და მინაში დამრგვალებულია; აქ მთავარია გარდატეხის მიმართულება და არა სნელის კანონი.",
    ),
    quiz: {
      title: l("Light — check yourself", "სინათლე — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("Angle of incidence 50°. Angle of reflection in degrees?", "დაცემის კუთხე 50°-ია. არეკვლის კუთხე გრადუსებში?"), answer: 50, explanation: l("i = r", "i = r") },
        { type: "num", prompt: l("A vase stands 1.5 m in front of a plane mirror. How far behind the mirror is its image, in metres?", "ლარნაკი ბრტყელი სარკის წინ 1,5 მ-ზე დგას. სარკის უკან რა მანძილზეა მისი გამოსახულება (მ)?"), answer: 1.5, tolerance: 0.01, explanation: l("Same distance behind as in front.", "სარკის უკან იმავე მანძილზე, რა მანძილზეც წინ.") },
        { type: "tf", prompt: l("Light going from air into water at an angle bends away from the normal.", "ჰაერიდან წყალში დახრილად გადასული სინათლე მართობს შორდება."), answer: false, explanation: l("Water is slower, so light bends towards the normal.", "წყალში სინათლე უფრო ნელია, ამიტომ მართობისკენ იხრება.") },
        {
          type: "mc",
          prompt: l("Which device uses total internal reflection?", "რომელი მოწყობილობა იყენებს სრულ შინაგან არეკვლას?"),
          options: [l("Optical fibre", "ოპტიკური ბოჭკო"), l("Plane mirror", "ბრტყელი სარკე"), l("Light bulb", "ნათურა"), l("Solar panel", "მზის პანელი")],
          correct: 0,
        },
      ],
    },
  },
];
