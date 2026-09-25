import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const BIOLOGY: BiLesson[] = [
  {
    group: "cell-structure",
    subject: "biology",
    grade: 7,
    durationMin: 45,
    difficulty: "foundation",
    match: /cell|organelle|microscope|nucleus|უჯრედ|ორგანოიდ|მიკროსკოპ/i,
    title: l("Cell Structure", "უჯრედის აღნაგობა"),
    topic: l("Cells", "უჯრედი"),
    objective: l(
      "Students name the main parts of animal and plant cells, explain their functions, and calculate microscope magnification.",
      "მოსწავლეები ასახელებენ ცხოველური და მცენარეული უჯრედის ძირითად ნაწილებს, ხსნიან მათ ფუნქციებს და ითვლიან მიკროსკოპის გადიდებას.",
    ),
    objectives: [
      l("State the main ideas of cell theory.", "ჩამოაყალიბოს უჯრედული თეორიის ძირითადი დებულებები."),
      l("Compare animal and plant cells and name the function of each part.", "შეადაროს ცხოველური და მცენარეული უჯრედები და დაასახელოს თითოეული ნაწილის ფუნქცია."),
      l("Calculate the total magnification of a light microscope.", "გამოთვალოს სინათლის მიკროსკოპის საერთო გადიდება."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("The building blocks of life", "სიცოცხლის სამშენებლო ბლოკები"),
        minutes: 5,
        body: l(
          `Your body is made of trillions of cells; a bacterium is just one. Cell theory sums it up:
• all living things are made of one or more cells;
• the cell is the basic unit of life;
• new cells come only from existing cells.`,
          `შენი სხეული ტრილიონობით უჯრედისგან შედგება, ბაქტერია კი — მხოლოდ ერთისგან. უჯრედული თეორია ამას ასე აჯამებს:
• ყველა ცოცხალი ორგანიზმი ერთი ან მეტი უჯრედისგან შედგება;
• უჯრედი სიცოცხლის ძირითადი ერთეულია;
• ახალი უჯრედი მხოლოდ არსებული უჯრედისგან წარმოიქმნება.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Parts of a cell", "უჯრედის ნაწილები"),
        minutes: 14,
        body: l(
          `In both animal and plant cells:
• Cell membrane — controls what enters and leaves the cell.
• Cytoplasm — jelly-like fluid where most chemical reactions happen.
• Nucleus — contains DNA and controls the cell's activities.
• Mitochondria — release energy from food through respiration.
• Ribosomes — build proteins.

Only in plant cells:
• Cell wall (made of cellulose) — gives strength and shape.
• Chloroplasts — contain chlorophyll and carry out photosynthesis.
• A large permanent vacuole filled with cell sap — keeps the cell firm.

Bacteria are simpler: they have no nucleus; their DNA floats in the cytoplasm.`,
          `ცხოველურ და მცენარეულ უჯრედს ორივეს აქვს:
• უჯრედის მემბრანა — არეგულირებს, რა შედის უჯრედში და რა გამოდის.
• ციტოპლაზმა — ლორწოვანი სითხე, სადაც ქიმიური რეაქციების უმეტესობა მიმდინარეობს.
• ბირთვი — შეიცავს დნმ-ს და მართავს უჯრედის ცხოველმოქმედებას.
• მიტოქონდრიები — სუნთქვის პროცესში საკვებიდან ენერგიას გამოყოფენ.
• რიბოსომები — ცილებს ასინთეზებენ.

მხოლოდ მცენარეულ უჯრედს აქვს:
• უჯრედის კედელი (ცელულოზისგან) — ანიჭებს სიმტკიცესა და ფორმას.
• ქლოროპლასტები — შეიცავს ქლოროფილს და ახორციელებს ფოტოსინთეზს.
• დიდი მუდმივი ვაკუოლი უჯრედის წვენით — უჯრედს დაჭიმულს ინარჩუნებს.

ბაქტერიები უფრო მარტივია: ბირთვი არ აქვთ, მათი დნმ ციტოპლაზმაში თავისუფლად მდებარეობს.`,
        ),
      },
      {
        kind: "example",
        title: l("Using a microscope", "მიკროსკოპით მუშაობა"),
        minutes: 10,
        body: l(
          `total magnification = eyepiece lens × objective lens

With a 10× eyepiece and a 40× objective: 10 × 40 = 400×.

Onion skin is a classic first specimen: a thin layer on a slide with a drop of iodine solution shows the cell walls and nuclei clearly. Cheek cells (with a cotton bud, stained with methylene blue) show animal cells — there is no cell wall.`,
          `საერთო გადიდება = ოკულარის გადიდება × ობიექტივის გადიდება

10× ოკულარითა და 40× ობიექტივით: 10 × 40 = 400×.

ხახვის კანი კლასიკური პირველი პრეპარატია: სასაგნე მინაზე დადებული თხელი ფენა იოდის ხსნარის წვეთით უჯრედის კედლებსა და ბირთვებს მკაფიოდ აჩვენებს. ლოყის უჯრედები (ბამბის ჩხირით აღებული, მეთილენის ლურჯით შეღებილი) ცხოველურ უჯრედს აჩვენებს — უჯრედის კედელი არ აქვს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 11,
        body: l(
          `Complete the activities. If your class has microscopes, prepare an onion-skin slide and draw what you see, labelling the parts you can identify. Handle glass slides carefully and report any breakage to the teacher.`,
          `შეასრულე აქტივობები. თუ კლასს მიკროსკოპები აქვს, მოამზადე ხახვის კანის პრეპარატი, დახატე, რასაც ხედავ, და მონიშნე ნაწილები, რომლებსაც ამოიცნობ. მინის ნაწილებს ფრთხილად მოეპყარი და ნებისმიერი გატეხვის შესახებ მასწავლებელს აცნობე.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• All organisms are made of cells; cells come from cells.
• Both: membrane, cytoplasm, nucleus, mitochondria, ribosomes.
• Plants also: cell wall, chloroplasts, large vacuole.
• Magnification = eyepiece × objective.`,
          `• ყველა ორგანიზმი უჯრედებისგან შედგება; უჯრედი უჯრედისგან წარმოიქმნება.
• ორივეს აქვს: მემბრანა, ციტოპლაზმა, ბირთვი, მიტოქონდრიები, რიბოსომები.
• მცენარეებს დამატებით: უჯრედის კედელი, ქლოროპლასტები, დიდი ვაკუოლი.
• გადიდება = ოკულარი × ობიექტივი.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Only in plants", "მხოლოდ მცენარეებში"),
        prompt: l("Which part is found in plant cells but NOT in animal cells?", "რომელი ნაწილია მცენარეულ უჯრედში და არ არის ცხოველურში?"),
        options: [l("Chloroplast", "ქლოროპლასტი"), l("Nucleus", "ბირთვი"), l("Cell membrane", "უჯრედის მემბრანა"), l("Mitochondrion", "მიტოქონდრია")],
        correct: 0,
        hints: [l("Which part carries out photosynthesis?", "რომელი ნაწილი ახორციელებს ფოტოსინთეზს?"), l("Animals cannot make their own food from light.", "ცხოველებს სინათლით საკვების შექმნა არ შეუძლიათ.")],
        explanation: l("Chloroplasts (and the cell wall and large vacuole) are found only in plant cells.", "ქლოროპლასტები (ასევე უჯრედის კედელი და დიდი ვაკუოლი) მხოლოდ მცენარეულ უჯრედშია."),
      },
      {
        type: "exercise",
        title: l("Magnification", "გადიდება"),
        prompt: l("A microscope has a 10× eyepiece and a 40× objective. What is the total magnification?", "მიკროსკოპს აქვს 10× ოკულარი და 40× ობიექტივი. რისი ტოლია საერთო გადიდება?"),
        accepted: ["400", "400x", "400×"],
        hints: [l("Multiply the two lens magnifications.", "გადაამრავლე ორი ლინზის გადიდება."), l("10 × 40 = ?", "10 × 40 = ?")],
        solution: l("10 × 40 = 400×", "10 × 40 = 400×"),
      },
      {
        type: "mc",
        title: l("Control centre", "მართვის ცენტრი"),
        prompt: l("Which part contains the genetic material and controls the cell?", "რომელი ნაწილი შეიცავს გენეტიკურ მასალას და მართავს უჯრედს?"),
        options: [l("Nucleus", "ბირთვი"), l("Vacuole", "ვაკუოლი"), l("Cell wall", "უჯრედის კედელი"), l("Cytoplasm", "ციტოპლაზმა")],
        correct: 0,
        hints: [
          l("Where is the DNA kept in animal and plant cells?", "სად ინახება დნმ ცხოველურ და მცენარეულ უჯრედებში?"),
          l("Bacteria do not have this part — their DNA floats in the cytoplasm.", "ბაქტერიებს ეს ნაწილი არ აქვთ — მათი დნმ ციტოპლაზმაში თავისუფლად მდებარეობს."),
        ],
      },
      {
        type: "short",
        title: l("Energy release", "ენერგიის გამოყოფა"),
        prompt: l("Which organelle releases energy from food by respiration?", "რომელი ორგანოიდი გამოყოფს საკვებიდან ენერგიას სუნთქვის პროცესში?"),
        accepted: { en: ["mitochondria", "mitochondrion", "the mitochondria"], ka: ["მიტოქონდრია", "მიტოქონდრიები"] },
        hints: [l("It is sometimes called the \"powerhouse\" of the cell.", "მას ზოგჯერ უჯრედის „ელექტროსადგურს“ უწოდებენ.")],
        solution: l("Mitochondria.", "მიტოქონდრიები."),
      },
      { type: "discussion", prompt: l("Why do you think muscle cells contain many more mitochondria than skin cells?", "როგორ ფიქრობ, რატომ აქვს კუნთის უჯრედებს კანის უჯრედებზე გაცილებით მეტი მიტოქონდრია?") },
      { type: "exit", prompt: l("Draw a plant cell and label five parts.", "დახატე მცენარეული უჯრედი და მონიშნე ხუთი ნაწილი.") },
    ],
    discussion: [
      l("A virus is not made of cells. Is it alive? Discuss using cell theory.", "ვირუსი უჯრედებისგან არ შედგება. ცოცხალია ის? იმსჯელე უჯრედული თეორიის საფუძველზე."),
      l("Why are most cells so small?", "რატომ არის უჯრედების უმეტესობა ასეთი პატარა?"),
    ],
    assessment: [
      l("Labelled diagrams of animal and plant cells.", "ცხოველური და მცენარეული უჯრედების მონიშნული სქემები."),
      l("Correct magnification calculations.", "გადიდების სწორი გამოთვლა."),
    ],
    homework: [l("Make a comparison table of animal, plant and bacterial cells.", "შეადგინე ცხოველური, მცენარეული და ბაქტერიული უჯრედების შედარებითი ცხრილი.")],
    teacherNotes: l(
      "Iodine solution and methylene blue stain skin and clothes; use small droppers and gloves. If microscopes are not available, use the OpenStax Biology 2e micrographs in the School Library.",
      "იოდის ხსნარი და მეთილენის ლურჯი კანსა და ტანსაცმელს ღებავს; გამოიყენეთ პატარა პიპეტები და ხელთათმანები. თუ მიკროსკოპები არ გაქვთ, გამოიყენეთ სასკოლო ბიბლიოთეკაში არსებული OpenStax Biology 2e-ის მიკროფოტოები.",
    ),
    quiz: {
      title: l("Cells — check yourself", "უჯრედი — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("Animal cells have a cell wall.", "ცხოველურ უჯრედს უჯრედის კედელი აქვს."), answer: false },
        { type: "num", prompt: l("Eyepiece 15×, objective 10×. Total magnification?", "ოკულარი 15×, ობიექტივი 10×. საერთო გადიდება?"), answer: 150 },
        {
          type: "mc",
          prompt: l("What does the cell membrane do?", "რას აკეთებს უჯრედის მემბრანა?"),
          options: [l("Controls what enters and leaves", "არეგულირებს, რა შედის და რა გამოდის"), l("Makes food from light", "სინათლით საკვებს ქმნის"), l("Stores DNA", "ინახავს დნმ-ს"), l("Makes the cell rigid", "უჯრედს მყარს ხდის")],
          correct: 0,
        },
        { type: "tf", prompt: l("Bacteria have no nucleus.", "ბაქტერიებს ბირთვი არ აქვთ."), answer: true },
      ],
    },
  },
  {
    group: "genetics-basics",
    subject: "biology",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /genetic|gene|dna|allele|inherit|mendel|punnett|გენეტიკ|გენ|დნმ|ალელ|მემკვიდრეობ|მენდელ/i,
    title: l("Genetics Basics: Genes and Inheritance", "გენეტიკის საფუძვლები: გენები და მემკვიდრეობა"),
    topic: l("Genetics", "გენეტიკა"),
    objective: l(
      "Students describe the relationship between DNA, genes and chromosomes, use the terms dominant and recessive, and predict offspring ratios with a Punnett square.",
      "მოსწავლეები აღწერენ კავშირს დნმ-ს, გენებსა და ქრომოსომებს შორის, იყენებენ ცნებებს დომინანტური და რეცესიული და პანეტის ცხაურით წინასწარმეტყველებენ შთამომავლობის თანაფარდობებს.",
    ),
    objectives: [
      l("Explain what DNA, genes, chromosomes and alleles are.", "ახსნას, რა არის დნმ, გენი, ქრომოსომა და ალელი."),
      l("Use genotype, phenotype, dominant and recessive correctly.", "სწორად გამოიყენოს ცნებები გენოტიპი, ფენოტიპი, დომინანტური და რეცესიული."),
      l("Draw a Punnett square and calculate probabilities of offspring.", "დახაზოს პანეტის ცხაური და გამოთვალოს შთამომავლობის ალბათობები."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why do we look like our parents?", "რატომ ვგავართ მშობლებს?"),
        minutes: 5,
        body: l(
          `Children often have their mother's eyes or their father's hair colour — but sometimes a trait "skips" a generation. In the 1860s Gregor Mendel explained this by breeding pea plants and counting their offspring carefully. His ideas are the start of genetics.`,
          `ბავშვებს ხშირად დედის თვალები ან მამის თმის ფერი აქვთ — მაგრამ ზოგჯერ ნიშანი თითქოს ერთ თაობას „გამოტოვებს“. 1860-იან წლებში გრეგორ მენდელმა ეს ბარდის მცენარეების შეჯვარებითა და შთამომავლობის გულდასმით დათვლით ახსნა. მისი იდეებით იწყება გენეტიკა.`,
        ),
      },
      {
        kind: "explanation",
        title: l("DNA, genes and chromosomes", "დნმ, გენები და ქრომოსომები"),
        minutes: 12,
        body: l(
          `• DNA is a long molecule that carries genetic information.
• A gene is a section of DNA that codes for a particular protein and so affects a trait.
• Chromosomes are long, tightly packed DNA molecules in the nucleus. Human body cells have 46 chromosomes — 23 pairs, one of each pair from each parent.
• Alleles are different versions of the same gene (e.g. for pea flower colour: purple or white).

A dominant allele (capital letter, A) shows its effect even if only one copy is present. A recessive allele (small letter, a) shows only when both copies are recessive (aa).

Genotype = the alleles (AA, Aa, aa). Phenotype = the visible trait (purple or white flowers).`,
          `• დნმ გრძელი მოლეკულაა, რომელიც გენეტიკურ ინფორმაციას ატარებს.
• გენი დნმ-ის მონაკვეთია, რომელიც კონკრეტულ ცილას აკოდირებს და ამით ნიშანზე მოქმედებს.
• ქრომოსომები ბირთვში მჭიდროდ დახვეული დნმ-ის გრძელი მოლეკულებია. ადამიანის სხეულის უჯრედებში 46 ქრომოსომაა — 23 წყვილი; თითოეული წყვილიდან ერთი დედისგანაა, მეორე — მამისგან.
• ალელები ერთი და იმავე გენის სხვადასხვა ვარიანტია (მაგ. ბარდის ყვავილის ფერისთვის: იისფერი ან თეთრი).

დომინანტური ალელი (დიდი ასო, A) თავს იჩენს მაშინაც, როცა მხოლოდ ერთი ასლია. რეცესიული ალელი (პატარა ასო, a) მხოლოდ მაშინ ვლინდება, როცა ორივე ასლი რეცესიულია (aa).

გენოტიპი = ალელების ერთობლიობა (AA, Aa, aa). ფენოტიპი = გარეგნული ნიშანი (იისფერი ან თეთრი ყვავილი).`,
        ),
      },
      {
        kind: "example",
        title: l("A Punnett square", "პანეტის ცხაური"),
        minutes: 12,
        body: l(
          `Two pea plants, both Aa (purple, carrying the white allele), are crossed. Each parent passes on one allele:

        A      a
A     AA     Aa
a     Aa     aa

Genotypes: 1 AA : 2 Aa : 1 aa
Phenotypes: 3 purple : 1 white

So each offspring has a 1/4 (25%) chance of being white. This is a probability, not a guarantee: in a family of four, all four could be purple.`,
          `ორი ბარდის მცენარე, ორივე Aa (იისფერი, მაგრამ თეთრი ალელის მატარებელი), შეაჯვარეს. თითოეული მშობელი ერთ ალელს გადასცემს:

        A      a
A     AA     Aa
a     Aa     aa

გენოტიპები: 1 AA : 2 Aa : 1 aa
ფენოტიპები: 3 იისფერი : 1 თეთრი

ანუ თითოეული შთამომავლის თეთრი ყვავილით დაბადების ალბათობაა 1/4 (25%). ეს ალბათობაა და არა გარანტია: ოთხ შთამომავალში შეიძლება ოთხივე იისფერი აღმოჩნდეს.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 11,
        body: l(
          `Complete the Punnett square activities. Many human traits (height, skin colour) are controlled by many genes and by the environment, so they do not follow the simple 3 : 1 pattern.`,
          `შეასრულე პანეტის ცხაურის აქტივობები. ადამიანის ბევრ ნიშანს (სიმაღლე, კანის ფერი) მრავალი გენი და გარემო განსაზღვრავს, ამიტომ ისინი მარტივ 3 : 1 კანონზომიერებას არ მიჰყვება.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• DNA → genes → chromosomes (46 in human body cells).
• Alleles: dominant (A) and recessive (a).
• Genotype = alleles; phenotype = visible trait.
• Aa × Aa → 3 : 1 phenotypes on average.`,
          `• დნმ → გენები → ქრომოსომები (ადამიანის სხეულის უჯრედში 46).
• ალელები: დომინანტური (A) და რეცესიული (a).
• გენოტიპი = ალელები; ფენოტიპი = გარეგნული ნიშანი.
• Aa × Aa → ფენოტიპები საშუალოდ 3 : 1.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Recessive trait", "რეცესიული ნიშანი"),
        prompt: l("White flowers are recessive (a). Which genotype gives white flowers?", "თეთრი ყვავილი რეცესიული ნიშანია (a). რომელი გენოტიპი იძლევა თეთრ ყვავილს?"),
        options: ["aa", "Aa", "AA", "A"],
        correct: 0,
        hints: [l("A recessive allele only shows when there is no dominant allele.", "რეცესიული ალელი მხოლოდ მაშინ ვლინდება, როცა დომინანტური ალელი არ არის."), l("Capital A is dominant. Which option has no capital A?", "დიდი A დომინანტურია. რომელ ვარიანტში არ არის დიდი A?")],
      },
      {
        type: "exercise",
        title: l("Chance of white", "თეთრის ალბათობა"),
        prompt: l("Aa × aa. What percentage of the offspring is expected to have white (aa) flowers?", "Aa × aa. შთამომავლობის რა პროცენტს ექნება მოსალოდნელად თეთრი (aa) ყვავილი?"),
        accepted: ["50", "50%"],
        hints: [
          l("Draw a 2 × 2 Punnett square with A and a on one side, a and a on the other.", "დახაზე 2 × 2 პანეტის ცხაური: ერთ მხარეს A და a, მეორეზე a და a."),
          l("The four boxes are Aa, Aa, aa, aa.", "ოთხი უჯრაა: Aa, Aa, aa, aa."),
        ],
        solution: l("2 of 4 boxes are aa → 50%.", "4 უჯრიდან 2 არის aa → 50%."),
      },
      {
        type: "short",
        title: l("Name it", "დაასახელე"),
        prompt: l("What do we call the visible trait of an organism, such as flower colour?", "რა ჰქვია ორგანიზმის გარეგნულ ნიშანს, მაგალითად, ყვავილის ფერს?"),
        accepted: { en: ["phenotype", "the phenotype"], ka: ["ფენოტიპი"] },
        solution: l("Phenotype.", "ფენოტიპი."),
      },
      {
        type: "exercise",
        title: l("Chromosomes", "ქრომოსომები"),
        prompt: l("How many chromosomes are there in a human body cell?", "რამდენი ქრომოსომაა ადამიანის სხეულის უჯრედში?"),
        accepted: ["46"],
        hints: [l("There are 23 pairs.", "23 წყვილია."), l("23 pairs × 2 = ?", "23 წყვილი × 2 = ?")],
        solution: l("46 (23 pairs).", "46 (23 წყვილი)."),
      },
      { type: "discussion", prompt: l("Genetic tests can tell people about some risks for their health. Who should be allowed to see this information, and why?", "გენეტიკურ ტესტებს შეუძლია ადამიანს ჯანმრთელობის ზოგიერთი რისკის შესახებ უთხრას. ვის უნდა ჰქონდეს ამ ინფორმაციის ნახვის უფლება და რატომ?") },
      { type: "exit", prompt: l("Explain the difference between a gene and an allele in one or two sentences.", "ერთ-ორ წინადადებაში ახსენი განსხვავება გენსა და ალელს შორის.") },
    ],
    discussion: [
      l("Why can two brown-eyed parents have a blue-eyed child? (The real genetics of eye colour involves several genes — use it as a simplified model.)", "როგორ შეიძლება ორ მუქთვალება მშობელს ცისფერთვალება შვილი ჰყავდეს? (თვალის ფერს სინამდვილეში რამდენიმე გენი განსაზღვრავს — გამოიყენე როგორც გამარტივებული მოდელი.)"),
      l("Which traits are shaped by both genes and environment?", "რომელ ნიშნებს აყალიბებს როგორც გენები, ისე გარემო?"),
    ],
    assessment: [
      l("Correct Punnett squares with genotype and phenotype ratios.", "სწორად შედგენილი პანეტის ცხაური გენოტიპებისა და ფენოტიპების თანაფარდობით."),
      l("Accurate use of the key terms.", "ძირითადი ცნებების ზუსტი გამოყენება."),
    ],
    homework: [l("Cross AA × aa and Aa × Aa. For each, give genotype and phenotype ratios.", "შეაჯვარე AA × aa და Aa × Aa. თითოეულისთვის მიუთითე გენოტიპებისა და ფენოტიპების თანაფარდობა.")],
    teacherNotes: l(
      "Avoid examples that single out students' own families or appearance. Eye colour is often taught as a single gene but is influenced by several; say so if students raise it. Link to probability lessons: a Punnett square is a probability table.",
      "მოერიდეთ მაგალითებს, რომლებიც მოსწავლეების ოჯახებს ან გარეგნობას გამოარჩევს. თვალის ფერს ხშირად ერთი გენის მაგალითად ასწავლიან, თუმცა მასზე რამდენიმე გენი მოქმედებს; თუ მოსწავლეები იკითხავენ, უთხარით. დაუკავშირეთ ალბათობის გაკვეთილს: პანეტის ცხაური ალბათობების ცხრილია.",
    ),
    quiz: {
      title: l("Genetics — check yourself", "გენეტიკა — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("An organism with genotype Aa shows the dominant trait.", "Aa გენოტიპის მქონე ორგანიზმში დომინანტური ნიშანი ვლინდება."), answer: true },
        { type: "num", prompt: l("Aa × Aa: what fraction of offspring is expected to be aa? (decimal)", "Aa × Aa: შთამომავლობის რა ნაწილი იქნება მოსალოდნელად aa? (ათწილადით)"), answer: 0.25, tolerance: 0.001 },
        {
          type: "mc",
          prompt: l("What is a gene?", "რა არის გენი?"),
          options: [l("A section of DNA that affects a trait", "დნმ-ის მონაკვეთი, რომელიც ნიშანზე მოქმედებს"), l("A type of cell", "უჯრედის სახეობა"), l("A whole chromosome pair", "ქრომოსომების მთელი წყვილი"), l("A protein in the membrane", "მემბრანის ცილა")],
          correct: 0,
        },
        { type: "num", prompt: l("How many pairs of chromosomes do human body cells have?", "ქრომოსომების რამდენი წყვილია ადამიანის სხეულის უჯრედში?"), answer: 23 },
      ],
    },
  },
];
