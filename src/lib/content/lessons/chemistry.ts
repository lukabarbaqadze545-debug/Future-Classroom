import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const CHEMISTRY: BiLesson[] = [
  {
    group: "atomic-structure",
    subject: "chemistry",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /atom|proton|neutron|electron|isotope|ატომ|პროტონ|ნეიტრონ|ელექტრონ|იზოტოპ/i,
    title: l("Inside the Atom", "ატომის აღნაგობა"),
    topic: l("Atomic structure", "ატომის აღნაგობა"),
    objective: l(
      "Students describe the particles in an atom, use atomic and mass numbers to count them, and write simple electron arrangements.",
      "მოსწავლეები აღწერენ ატომის შემადგენელ ნაწილაკებს, რიგითი ნომრისა და მასური რიცხვის მიხედვით ითვლიან მათ და წერენ ელექტრონების მარტივ განაწილებას შრეებზე.",
    ),
    objectives: [
      l("Name the three particles of an atom with their charge and location.", "დაასახელოს ატომის სამი ნაწილაკი, მათი მუხტი და მდებარეობა."),
      l("Use atomic number and mass number to find protons, neutrons and electrons.", "რიგითი ნომრისა და მასური რიცხვის მიხედვით იპოვოს პროტონების, ნეიტრონებისა და ელექტრონების რაოდენობა."),
      l("Write the electron arrangement of the first 20 elements and explain isotopes.", "ჩაწეროს პირველი 20 ელემენტის ელექტრონების განაწილება შრეებზე და ახსნას, რა არის იზოტოპი."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("How small is an atom?", "რამდენად პატარაა ატომი?"),
        minutes: 5,
        body: l(
          `Everything around you — the desk, the air, your body — is made of atoms. A single atom is about 0.1 nanometres across: a million atoms side by side would not reach the thickness of a sheet of paper. Yet each atom has an inner structure, and that structure decides how the element behaves.`,
          `ყველაფერი შენ გარშემო — მერხი, ჰაერი, შენი სხეული — ატომებისგან შედგება. ერთი ატომის დიამეტრი დაახლოებით 0,1 ნანომეტრია: გვერდიგვერდ დალაგებული მილიონი ატომი ქაღალდის ფურცლის სისქესაც ვერ მიაღწევს. თუმცა ყოველ ატომს შინაგანი აღნაგობა აქვს და სწორედ ის განსაზღვრავს ელემენტის თვისებებს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Protons, neutrons and electrons", "პროტონები, ნეიტრონები და ელექტრონები"),
        minutes: 12,
        body: l(
          `• Protons: positive charge (+1), in the nucleus.
• Neutrons: no charge, in the nucleus.
• Electrons: negative charge (−1), moving around the nucleus in shells. Their mass is tiny compared with protons and neutrons.

Atomic number (Z) = number of protons. It defines the element: every carbon atom has 6 protons.
Mass number (A) = protons + neutrons.
In a neutral atom, electrons = protons.

Example: sodium-23 (Z = 11): 11 protons, 23 − 11 = 12 neutrons, 11 electrons.`,
          `• პროტონები: დადებითი მუხტი (+1), ბირთვში.
• ნეიტრონები: მუხტი არ აქვთ, ბირთვში.
• ელექტრონები: უარყოფითი მუხტი (−1), ბირთვის გარშემო შრეებზე მოძრაობენ. მათი მასა პროტონებისა და ნეიტრონების მასასთან შედარებით უმნიშვნელოა.

რიგითი ნომერი (Z) = პროტონების რაოდენობა. ის ელემენტს განსაზღვრავს: ნახშირბადის ყოველ ატომს 6 პროტონი აქვს.
მასური რიცხვი (A) = პროტონები + ნეიტრონები.
ნეიტრალურ ატომში ელექტრონების რაოდენობა პროტონების რაოდენობის ტოლია.

მაგალითი: ნატრიუმი-23 (Z = 11): 11 პროტონი, 23 − 11 = 12 ნეიტრონი, 11 ელექტრონი.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Electron shells and isotopes", "ელექტრონული შრეები და იზოტოპები"),
        minutes: 12,
        body: l(
          `For the first 20 elements, electrons fill shells in the order 2, 8, 8, 2:
• carbon (6): 2, 4
• oxygen (8): 2, 6
• sodium (11): 2, 8, 1
• chlorine (17): 2, 8, 7

The electrons in the outer shell largely decide how an atom reacts.

Isotopes are atoms of the same element with different numbers of neutrons. Carbon-12 and carbon-14 both have 6 protons; carbon-14 has 8 neutrons instead of 6. Carbon-14 is radioactive, which is used to date archaeological finds.`,
          `პირველი 20 ელემენტისთვის ელექტრონები შრეებს ავსებენ თანმიმდევრობით 2, 8, 8, 2:
• ნახშირბადი (6): 2, 4
• ჟანგბადი (8): 2, 6
• ნატრიუმი (11): 2, 8, 1
• ქლორი (17): 2, 8, 7

გარე შრის ელექტრონები დიდწილად განსაზღვრავს, როგორ შედის ატომი რეაქციაში.

იზოტოპები ერთი და იმავე ელემენტის ატომებია ნეიტრონების სხვადასხვა რაოდენობით. ნახშირბად-12-საც და ნახშირბად-14-საც 6 პროტონი აქვს; ნახშირბად-14-ს 6-ის ნაცვლად 8 ნეიტრონი აქვს. ნახშირბად-14 რადიოაქტიურია, რასაც არქეოლოგიური აღმოჩენების ასაკის დასადგენად იყენებენ.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 11,
        body: l(
          `Work through the activities. Draw each atom as a nucleus with circles for the shells — drawing helps more than memorising.`,
          `შეასრულე აქტივობები. თითოეული ატომი დახატე ბირთვით და შრეების აღმნიშვნელი წრეებით — ხატვა დამახსოვრებაზე მეტად გეხმარება.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Nucleus: protons (+) and neutrons (0); shells: electrons (−).
• Z = protons; A = protons + neutrons; neutrons = A − Z.
• Shells fill 2, 8, 8 …; outer electrons decide chemistry.
• Isotopes: same protons, different neutrons.`,
          `• ბირთვი: პროტონები (+) და ნეიტრონები (0); შრეები: ელექტრონები (−).
• Z = პროტონები; A = პროტონები + ნეიტრონები; ნეიტრონები = A − Z.
• შრეები ივსება 2, 8, 8 …; გარე ელექტრონები ქიმიურ თვისებებს განსაზღვრავს.
• იზოტოპები: პროტონები ერთნაირი, ნეიტრონები განსხვავებული.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Count the neutrons", "დაითვალე ნეიტრონები"),
        prompt: l("An aluminium atom has atomic number 13 and mass number 27. How many neutrons does it have?", "ალუმინის ატომის რიგითი ნომერია 13, მასური რიცხვი — 27. რამდენი ნეიტრონი აქვს მას?"),
        accepted: ["14"],
        hints: [l("Mass number = protons + neutrons.", "მასური რიცხვი = პროტონები + ნეიტრონები."), l("27 − 13", "27 − 13")],
        solution: l("27 − 13 = 14 neutrons", "27 − 13 = 14 ნეიტრონი"),
      },
      {
        type: "short",
        title: l("Electron arrangement", "ელექტრონების განაწილება"),
        prompt: l("Write the electron arrangement of magnesium (Z = 12), e.g. 2, 8, 1.", "ჩაწერე მაგნიუმის (Z = 12) ელექტრონების განაწილება, მაგ. 2, 8, 1."),
        accepted: ["2, 8, 2", "2,8,2", "2 8 2", "2.8.2"],
        hints: [l("A neutral magnesium atom has 12 electrons.", "ნეიტრალურ მაგნიუმის ატომს 12 ელექტრონი აქვს."), l("First shell: 2, second: 8. How many are left?", "პირველ შრეზე 2, მეორეზე 8. რამდენი დარჩა?")],
        solution: l("2, 8, 2", "2, 8, 2"),
      },
      {
        type: "mc",
        title: l("What defines an element?", "რა განსაზღვრავს ელემენტს?"),
        prompt: l("Which number tells you which element an atom is?", "რომელი რიცხვი გვეუბნება, რომელი ელემენტის ატომია?"),
        options: [l("The number of protons", "პროტონების რაოდენობა"), l("The number of neutrons", "ნეიტრონების რაოდენობა"), l("The mass number", "მასური რიცხვი"), l("The number of shells", "შრეების რაოდენობა")],
        correct: 0,
        explanation: l("The atomic number (protons) defines the element; neutrons can vary (isotopes).", "ელემენტს რიგითი ნომერი (პროტონები) განსაზღვრავს; ნეიტრონების რაოდენობა შეიძლება განსხვავდებოდეს (იზოტოპები)."),
      },
      {
        type: "mc",
        title: l("Isotopes", "იზოტოპები"),
        prompt: l("Chlorine-35 and chlorine-37 are isotopes. What is different?", "ქლორი-35 და ქლორი-37 იზოტოპებია. რით განსხვავდებიან?"),
        options: [l("The number of neutrons", "ნეიტრონების რაოდენობით"), l("The number of protons", "პროტონების რაოდენობით"), l("The number of electrons in a neutral atom", "ნეიტრალურ ატომში ელექტრონების რაოდენობით"), l("Their chemical symbol", "ქიმიური სიმბოლოთი")],
        correct: 0,
        hints: [l("Both are chlorine, so Z is the same.", "ორივე ქლორია, ანუ Z ერთნაირია.")],
        explanation: l("Both have 17 protons; chlorine-35 has 18 neutrons and chlorine-37 has 20.", "ორივეს 17 პროტონი აქვს; ქლორ-35-ს 18 ნეიტრონი აქვს, ქლორ-37-ს — 20."),
      },
      { type: "discussion", prompt: l("Scientists changed their model of the atom several times. Why is it normal for a scientific model to change?", "მეცნიერებმა ატომის მოდელი რამდენჯერმე შეცვალეს. რატომ არის ნორმალური, რომ მეცნიერული მოდელი იცვლება?") },
      { type: "exit", prompt: l("Draw an oxygen atom (Z = 8, A = 16) with its particles and shells.", "დახატე ჟანგბადის ატომი (Z = 8, A = 16) ნაწილაკებითა და შრეებით.") },
    ],
    discussion: [
      l("If atoms are mostly empty space, why can't we walk through walls?", "თუ ატომი ძირითადად სიცარიელეა, რატომ ვერ გავდივართ კედელში?"),
      l("How do we know about particles we cannot see?", "საიდან ვიცით ნაწილაკების შესახებ, რომლებსაც ვერ ვხედავთ?"),
    ],
    assessment: [
      l("Students count protons, neutrons and electrons from Z and A.", "მოსწავლე Z-ისა და A-ს მიხედვით ითვლის პროტონებს, ნეიტრონებსა და ელექტრონებს."),
      l("Students write electron arrangements for elements 1–20.", "მოსწავლე წერს 1–20 ელემენტების ელექტრონულ განაწილებას."),
    ],
    homework: [
      l("Make a table for H, He, Li, C, N, O, Na, Cl with Z, A, protons, neutrons, electrons and arrangement.", "შეადგინე ცხრილი H, He, Li, C, N, O, Na, Cl ელემენტებისთვის: Z, A, პროტონები, ნეიტრონები, ელექტრონები და განაწილება შრეებზე."),
    ],
    teacherNotes: l(
      "The 2, 8, 8 model is a simplification that works well for elements 1–20; mention that later courses refine it. Use a printed periodic table. Students often think the mass number is the number of all particles including electrons — ask them to justify why electrons are left out.",
      "2, 8, 8 მოდელი გამარტივებაა, რომელიც 1–20 ელემენტებისთვის კარგად მუშაობს; აღნიშნეთ, რომ შემდგომ კურსებში ის ზუსტდება. გამოიყენეთ დაბეჭდილი პერიოდული სისტემა. მოსწავლეებს ხშირად ჰგონიათ, რომ მასური რიცხვი ელექტრონების ჩათვლით ყველა ნაწილაკის რაოდენობაა — სთხოვეთ, დაასაბუთონ, რატომ არ ითვლება ელექტრონები.",
    ),
    quiz: {
      title: l("The atom — check yourself", "ატომი — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("How many electrons does a neutral calcium atom (Z = 20) have?", "რამდენი ელექტრონი აქვს კალციუმის ნეიტრალურ ატომს (Z = 20)?"), answer: 20 },
        { type: "num", prompt: l("Fluorine: Z = 9, A = 19. Number of neutrons?", "ფთორი: Z = 9, A = 19. ნეიტრონების რაოდენობა?"), answer: 10 },
        { type: "tf", prompt: l("Electrons are found in the nucleus.", "ელექტრონები ბირთვში იმყოფებიან."), answer: false, explanation: l("Electrons are in shells around the nucleus.", "ელექტრონები ბირთვის გარშემო შრეებზეა.") },
        {
          type: "mc",
          prompt: l("Which particle has no electric charge?", "რომელ ნაწილაკს არ აქვს ელექტრული მუხტი?"),
          options: [l("Neutron", "ნეიტრონს"), l("Proton", "პროტონს"), l("Electron", "ელექტრონს")],
          correct: 0,
        },
      ],
    },
  },
  {
    group: "periodic-table",
    subject: "chemistry",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /periodic table|mendeleev|group|period|პერიოდულ|მენდელეევ/i,
    title: l("The Periodic Table", "პერიოდული სისტემა"),
    topic: l("Periodic table", "პერიოდული სისტემა"),
    objective: l(
      "Students explain how the periodic table is organised and use an element's position to predict its properties.",
      "მოსწავლეები ხსნიან, როგორაა ორგანიზებული პერიოდული სისტემა, და ელემენტის მდებარეობით მის თვისებებს წინასწარმეტყველებენ.",
    ),
    objectives: [
      l("Describe groups and periods and how they relate to electron arrangement.", "აღწეროს ჯგუფები და პერიოდები და მათი კავშირი ელექტრონების განაწილებასთან."),
      l("Locate metals and non-metals and describe typical properties.", "იპოვოს ლითონები და არალითონები და აღწეროს მათი ტიპური თვისებები."),
      l("Explain how Mendeleev used the table to predict unknown elements.", "ახსნას, როგორ იწინასწარმეტყველა მენდელეევმა სისტემის დახმარებით უცნობი ელემენტები."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("A map of the elements", "ელემენტების რუკა"),
        minutes: 5,
        body: l(
          `There are 118 known elements. Learning each one separately would be impossible — the periodic table arranges them so that similar elements sit together. Once you can read the table, you can predict how an element behaves without having seen it.`,
          `ცნობილია 118 ელემენტი. თითოეულის ცალ-ცალკე შესწავლა შეუძლებელი იქნებოდა — პერიოდული სისტემა მათ ისე ალაგებს, რომ მსგავსი ელემენტები ერთად აღმოჩნდნენ. თუ სისტემის კითხვა შეგიძლია, ელემენტის თვისებებს წინასწარ გაიგებ, თუნდაც ის არასოდეს გენახოს.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Groups and periods", "ჯგუფები და პერიოდები"),
        minutes: 12,
        body: l(
          `Elements are arranged in order of atomic number.
• A period is a row. Elements in the same period have the same number of electron shells.
• A group is a column. Elements in the same group have the same number of outer electrons — so they react in similar ways.

Examples:
• Group 1 (lithium, sodium, potassium): one outer electron; soft, very reactive metals that react with water. Reactivity increases down the group.
• Group 17, the halogens (fluorine, chlorine, bromine, iodine): seven outer electrons; reactive non-metals.
• Group 18, the noble gases (helium, neon, argon): full outer shell; very unreactive.`,
          `ელემენტები რიგითი ნომრის ზრდის მიხედვითაა დალაგებული.
• პერიოდი ჰორიზონტალური მწკრივია. ერთი პერიოდის ელემენტებს ელექტრონული შრეების ერთნაირი რაოდენობა აქვთ.
• ჯგუფი ვერტიკალური სვეტია. ერთი ჯგუფის ელემენტებს გარე ელექტრონების ერთნაირი რაოდენობა აქვთ — ამიტომ რეაქციებში მსგავსად იქცევიან.

მაგალითები:
• 1-ლი ჯგუფი (ლითიუმი, ნატრიუმი, კალიუმი): ერთი გარე ელექტრონი; რბილი, ძალიან აქტიური ლითონები, რომლებიც წყალთან რეაგირებენ. ჯგუფში ქვემოთ აქტიურობა იზრდება.
• მე-17 ჯგუფი, ჰალოგენები (ფთორი, ქლორი, ბრომი, იოდი): შვიდი გარე ელექტრონი; აქტიური არალითონები.
• მე-18 ჯგუფი, კეთილშობილი აირები (ჰელიუმი, ნეონი, არგონი): გარე შრე შევსებულია; თითქმის არ შედიან რეაქციებში.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Metals, non-metals and Mendeleev's gaps", "ლითონები, არალითონები და მენდელეევის „ცარიელი უჯრები“"),
        minutes: 10,
        body: l(
          `Metals (on the left and in the middle) are usually shiny, conduct electricity and heat, and can be bent. Non-metals (on the right) are usually dull, brittle as solids and poor conductors.

In 1869 Dmitri Mendeleev published a table in which he left gaps for elements nobody had found yet, and predicted their properties from their neighbours. When gallium (1875) and germanium (1886) were discovered, their properties matched his predictions closely. A good scientific model does not only describe — it predicts.`,
          `ლითონები (მარცხნივ და შუაში) ჩვეულებრივ ბზინავს, ატარებს ელექტრობასა და სითბოს და იღუნება. არალითონები (მარჯვნივ) ჩვეულებრივ მქრქალია, მყარ მდგომარეობაში მყიფეა და ცუდი გამტარია.

1869 წელს დიმიტრი მენდელეევმა გამოაქვეყნა სისტემა, რომელშიც ჯერ კიდევ აღმოუჩენელი ელემენტებისთვის ცარიელი უჯრები დატოვა და მეზობელი ელემენტების მიხედვით მათი თვისებები იწინასწარმეტყველა. როცა გალიუმი (1875) და გერმანიუმი (1886) აღმოაჩინეს, მათი თვისებები მის წინასწარმეტყველებას ძალიან დაემთხვა. კარგი მეცნიერული მოდელი მხოლოდ აღწერს კი არა, წინასწარმეტყველებსაც.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice", "პრაქტიკა"),
        minutes: 13,
        body: l(
          `Use a printed or online periodic table for the activities. The Chemistry 2e textbook in the School Library (openly licensed) has a full table and further reading.`,
          `აქტივობებისთვის გამოიყენე დაბეჭდილი ან ონლაინ პერიოდული სისტემა. სასკოლო ბიბლიოთეკაში არსებულ სახელმძღვანელოში Chemistry 2e (ღია ლიცენზიით) სრული სისტემა და დამატებითი საკითხავია.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Ordered by atomic number; rows = periods, columns = groups.
• Same group → same number of outer electrons → similar reactions.
• Metals left, non-metals right, noble gases in group 18.
• Mendeleev's table predicted undiscovered elements.`,
          `• დალაგება რიგითი ნომრით; მწკრივები = პერიოდები, სვეტები = ჯგუფები.
• ერთი ჯგუფი → გარე ელექტრონების ერთნაირი რაოდენობა → მსგავსი რეაქციები.
• ლითონები მარცხნივ, არალითონები მარჯვნივ, კეთილშობილი აირები მე-18 ჯგუფში.
• მენდელეევის სისტემამ აღმოუჩენელი ელემენტები იწინასწარმეტყველა.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Similar elements", "მსგავსი ელემენტები"),
        prompt: l("Which element reacts most like sodium?", "რომელი ელემენტი რეაგირებს ყველაზე მეტად ნატრიუმის მსგავსად?"),
        options: [l("Potassium", "კალიუმი"), l("Magnesium", "მაგნიუმი"), l("Chlorine", "ქლორი"), l("Neon", "ნეონი")],
        correct: 0,
        hints: [l("Elements in the same group react similarly.", "ერთი ჯგუფის ელემენტები მსგავსად რეაგირებენ."), l("Sodium is in group 1. Which option is also in group 1?", "ნატრიუმი 1-ელ ჯგუფშია. რომელი ვარიანტია ასევე 1-ელ ჯგუფში?")],
        explanation: l("Potassium, like sodium, is a group 1 metal with one outer electron.", "კალიუმი, ნატრიუმის მსგავსად, 1-ლი ჯგუფის ლითონია ერთი გარე ელექტრონით."),
      },
      {
        type: "exercise",
        title: l("Period and shells", "პერიოდი და შრეები"),
        prompt: l("Sulfur has the arrangement 2, 8, 6. In which period is it?", "გოგირდის ელექტრონული განაწილებაა 2, 8, 6. რომელ პერიოდშია ის?"),
        accepted: { en: ["3", "period 3", "third"], ka: ["3", "მე-3", "მესამე", "მესამე პერიოდში"] },
        hints: [l("The period number equals the number of shells.", "პერიოდის ნომერი შრეების რაოდენობის ტოლია."), l("Count the numbers in 2, 8, 6.", "დაითვალე რიცხვები 2, 8, 6-ში.")],
        solution: l("Three shells → period 3.", "სამი შრე → მესამე პერიოდი."),
      },
      {
        type: "mc",
        title: l("Noble gases", "კეთილშობილი აირები"),
        prompt: l("Why is argon used inside some light bulbs instead of air?", "რატომ იყენებენ ზოგიერთ ნათურაში ჰაერის ნაცვლად არგონს?"),
        options: [l("It is very unreactive, so the hot filament does not burn", "თითქმის არ შედის რეაქციაში, ამიტომ გავარვარებული ძაფი არ იწვის"), l("It glows by itself", "თავისით ანათებს"), l("It is a metal", "ლითონია"), l("It is heavier than lead", "ტყვიაზე მძიმეა")],
        correct: 0,
        explanation: l("Noble gases have full outer shells and do not react with the hot metal filament.", "კეთილშობილ აირებს გარე შრე შევსებული აქვთ და გავარვარებულ ლითონის ძაფთან რეაქციაში არ შედიან."),
      },
      {
        type: "exercise",
        title: l("Outer electrons", "გარე ელექტრონები"),
        prompt: l("How many outer electrons does an element in group 17 have?", "რამდენი გარე ელექტრონი აქვს მე-17 ჯგუფის ელემენტს?"),
        accepted: ["7"],
        hints: [l("Look at chlorine: 2, 8, 7.", "შეხედე ქლორს: 2, 8, 7.")],
        solution: l("7 outer electrons.", "7 გარე ელექტრონი."),
      },
      { type: "discussion", prompt: l("Mendeleev left gaps in his table. Why was that a brave scientific decision?", "მენდელეევმა თავის სისტემაში ცარიელი უჯრები დატოვა. რატომ იყო ეს გაბედული მეცნიერული გადაწყვეტილება?") },
      { type: "exit", prompt: l("Choose one element. Using only its position, predict two of its properties.", "აირჩიე ერთი ელემენტი. მხოლოდ მისი მდებარეობით იწინასწარმეტყველე მისი ორი თვისება.") },
    ],
    discussion: [
      l("Which elements do you use every day? Where are they in the table?", "რომელ ელემენტებს იყენებ ყოველდღე? სად არიან ისინი სისტემაში?"),
      l("Why might new elements still be added?", "რატომ შეიძლება სისტემას ახალი ელემენტები დაემატოს?"),
    ],
    assessment: [
      l("Students identify group and period and link them to electron arrangement.", "მოსწავლე ადგენს ჯგუფსა და პერიოდს და უკავშირებს მათ ელექტრონულ განაწილებას."),
      l("Students predict properties from position.", "მოსწავლე მდებარეობით ელემენტის თვისებებს წინასწარმეტყველებს."),
    ],
    homework: [l("Write a short \"profile\" of one element: position, properties, uses, and one reliable source you used.", "დაწერე ერთი ელემენტის მოკლე „პროფილი“: მდებარეობა, თვისებები, გამოყენება და ერთი სანდო წყარო, რომელიც გამოიყენე.")],
    teacherNotes: l(
      "Group numbering 1–18 follows current IUPAC practice; some older Georgian textbooks use Roman numerals with A/B subgroups — show both if your textbook does. Demonstrations with alkali metals and water must only be done by the teacher behind a safety screen, in very small amounts.",
      "ჯგუფების 1–18 ნუმერაცია IUPAC-ის მოქმედ პრაქტიკას მიჰყვება; ზოგიერთ ძველ ქართულ სახელმძღვანელოში რომაული რიცხვები და A/B ქვეჯგუფებია — თუ თქვენი სახელმძღვანელო ასეთ ნუმერაციას იყენებს, აჩვენეთ ორივე. ტუტე ლითონებისა და წყლის ცდა მხოლოდ მასწავლებელმა უნდა აჩვენოს, დამცავი ეკრანის მიღმა, ძალიან მცირე რაოდენობით.",
    ),
    quiz: {
      title: l("Periodic table — check yourself", "პერიოდული სისტემა — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("Elements in the same period have the same number of outer electrons.", "ერთი პერიოდის ელემენტებს გარე ელექტრონების ერთნაირი რაოდენობა აქვთ."), answer: false, explanation: l("Same period = same number of shells; same group = same outer electrons.", "ერთი პერიოდი = შრეების ერთნაირი რაოდენობა; ერთი ჯგუფი = გარე ელექტრონების ერთნაირი რაოდენობა.") },
        {
          type: "mc",
          prompt: l("Which group contains the noble gases?", "რომელ ჯგუფშია კეთილშობილი აირები?"),
          options: ["1", "2", "17", "18"],
          correct: 3,
        },
        { type: "num", prompt: l("Lithium has the arrangement 2, 1. In which group is it?", "ლითიუმის ელექტრონული განაწილებაა 2, 1. რომელ ჯგუფშია ის?"), answer: 1 },
        {
          type: "mc",
          prompt: l("A shiny solid that conducts electricity is most likely…", "მბზინავი მყარი ნივთიერება, რომელიც ელექტრობას ატარებს, სავარაუდოდ…"),
          options: [l("a metal", "ლითონია"), l("a noble gas", "კეთილშობილი აირია"), l("a halogen", "ჰალოგენია")],
          correct: 0,
        },
      ],
    },
  },
  {
    group: "chemical-reactions",
    subject: "chemistry",
    grade: 8,
    durationMin: 45,
    difficulty: "standard",
    match: /chemical reaction|equation|balanc|reactant|product|combustion|neutrali|ქიმიური რეაქცი|გატოლებ|ნეიტრალიზაცი|წვის/i,
    title: l("Chemical Reactions and Equations", "ქიმიური რეაქციები და განტოლებები"),
    topic: l("Chemical reactions", "ქიმიური რეაქციები"),
    objective: l(
      "Students recognise signs of a chemical reaction, explain conservation of mass, and balance simple chemical equations.",
      "მოსწავლეები ამოიცნობენ ქიმიური რეაქციის ნიშნებს, ხსნიან მასის შენახვის კანონს და ატოლებენ მარტივ ქიმიურ განტოლებებს.",
    ),
    objectives: [
      l("List observable signs that a chemical reaction has happened.", "ჩამოთვალოს ქიმიური რეაქციის დაკვირვებადი ნიშნები."),
      l("Explain why mass is conserved in a reaction.", "ახსნას, რატომ ინახება მასა რეაქციისას."),
      l("Balance simple equations and recognise combustion and neutralisation.", "გაატოლოს მარტივი განტოლებები და ამოიცნოს წვა და ნეიტრალიზაცია."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("New substances", "ახალი ნივთიერებები"),
        minutes: 5,
        body: l(
          `Melting ice is still water — that is a physical change. Burning gas on a stove produces carbon dioxide and water, which were not there before — that is a chemical change, a reaction.

Signs of a reaction: a gas is produced (bubbles), the colour changes, a solid forms in a solution (a precipitate), light or heat is given out or taken in.`,
          `დნობისას ყინული ისევ წყალია — ეს ფიზიკური ცვლილებაა. ქურაზე აირის წვისას წარმოიქმნება ნახშირორჟანგი და წყალი, რომლებიც მანამდე არ არსებობდა — ეს ქიმიური ცვლილებაა, რეაქცია.

რეაქციის ნიშნები: გამოიყოფა აირი (ბუშტები), იცვლება ფერი, ხსნარში წარმოიქმნება ნალექი, გამოიყოფა ან შთაინთქმება სინათლე ან სითბო.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Atoms are rearranged, not lost", "ატომები გადაჯგუფდება, არ იკარგება"),
        minutes: 12,
        body: l(
          `In a reaction, the starting substances (reactants) turn into new substances (products):

reactants → products

Atoms are not created or destroyed — they are only rearranged. So the total mass of the products equals the total mass of the reactants (law of conservation of mass, described by Antoine Lavoisier in the 18th century).

That is why a chemical equation must be balanced: the same number of each kind of atom on both sides.

Hydrogen burns in oxygen:
H₂ + O₂ → H₂O  ✗ (2 O on the left, 1 O on the right)
2H₂ + O₂ → 2H₂O  ✓ (4 H and 2 O on each side)

We balance by changing the numbers in front (coefficients), never the small numbers in formulas.`,
          `რეაქციისას საწყისი ნივთიერებები (რეაგენტები) ახალ ნივთიერებებად (პროდუქტებად) გარდაიქმნება:

რეაგენტები → პროდუქტები

ატომები არ ჩნდება და არ ქრება — მხოლოდ გადაჯგუფდება. ამიტომ პროდუქტების ჯამური მასა რეაგენტების ჯამური მასის ტოლია (მასის შენახვის კანონი, რომელიც XVIII საუკუნეში ანტუან ლავუაზიემ აღწერა).

სწორედ ამიტომ ქიმიური განტოლება გატოლებული უნდა იყოს: ორივე მხარეს თითოეული სახის ატომი ერთნაირი რაოდენობით უნდა იყოს.

წყალბადი ჟანგბადში იწვის:
H₂ + O₂ → H₂O  ✗ (მარცხნივ 2 O, მარჯვნივ 1 O)
2H₂ + O₂ → 2H₂O  ✓ (თითოეულ მხარეს 4 H და 2 O)

ვატოლებთ ფორმულების წინ მდგომი რიცხვების (კოეფიციენტების) შეცვლით და არასოდეს — ფორმულაში მდგომი ინდექსებისა.`,
        ),
      },
      {
        kind: "example",
        title: l("Two important types", "ორი მნიშვნელოვანი ტიპი"),
        minutes: 10,
        body: l(
          `Combustion: a fuel reacts with oxygen, releasing heat and light.
Natural gas (methane): CH₄ + 2O₂ → CO₂ + 2H₂O

Neutralisation: an acid reacts with a base to form a salt and water.
HCl + NaOH → NaCl + H₂O
(hydrochloric acid + sodium hydroxide → table salt + water)

Indigestion tablets neutralise extra stomach acid; farmers add lime to acidic soil for the same reason.`,
          `წვა: საწვავი ჟანგბადთან რეაგირებს და გამოიყოფა სითბო და სინათლე.
ბუნებრივი აირი (მეთანი): CH₄ + 2O₂ → CO₂ + 2H₂O

ნეიტრალიზაცია: მჟავა ფუძესთან რეაგირებს და წარმოიქმნება მარილი და წყალი.
HCl + NaOH → NaCl + H₂O
(მარილმჟავა + ნატრიუმის ჰიდროქსიდი → სუფრის მარილი + წყალი)

კუჭის მჟავიანობის საწინააღმდეგო ტაბლეტები ჭარბ მჟავას ანეიტრალებს; ფერმერები იმავე მიზეზით მჟავე ნიადაგს კირს უმატებენ.`,
        ),
      },
      {
        kind: "practice",
        title: l("Practice and the lab", "პრაქტიკა და ლაბორატორია"),
        minutes: 13,
        body: l(
          `Balance the equations in the activities. In the STEM Laboratory, the experiment "Red cabbage pH indicator" lets you see acids, bases and neutralisation with safe household liquids.

Safety: wear eye protection, never taste substances in the lab, and follow your teacher's instructions for disposal.`,
          `აქტივობებში განტოლებები გაატოლე. STEM ლაბორატორიაში ექსპერიმენტი „წითელი კომბოსტოს pH ინდიკატორი“ საშუალებას გაძლევს, უსაფრთხო საყოფაცხოვრებო სითხეებით ნახო მჟავები, ფუძეები და ნეიტრალიზაცია.

უსაფრთხოება: გამოიყენე დამცავი სათვალე, ლაბორატორიაში ნივთიერებები არასოდეს გასინჯო და ნარჩენები მასწავლებლის მითითებით გადაყარე.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Reactions make new substances; look for gas, colour change, precipitate, heat or light.
• Atoms are rearranged, so mass is conserved.
• Balance equations with coefficients only.
• Combustion: fuel + oxygen. Neutralisation: acid + base → salt + water.`,
          `• რეაქციისას ახალი ნივთიერებები წარმოიქმნება; ეძებე აირი, ფერის ცვლილება, ნალექი, სითბო ან სინათლე.
• ატომები გადაჯგუფდება, ამიტომ მასა ინახება.
• განტოლებები მხოლოდ კოეფიციენტებით გაატოლე.
• წვა: საწვავი + ჟანგბადი. ნეიტრალიზაცია: მჟავა + ფუძე → მარილი + წყალი.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Physical or chemical?", "ფიზიკური თუ ქიმიური?"),
        prompt: l("Which is a chemical change?", "რომელია ქიმიური ცვლილება?"),
        options: [l("Rusting iron", "რკინის დაჟანგვა"), l("Melting butter", "კარაქის დნობა"), l("Dissolving sugar in tea", "ჩაიში შაქრის გახსნა"), l("Boiling water", "წყლის დუღილი")],
        correct: 0,
        hints: [l("Is a new substance formed?", "წარმოიქმნება ახალი ნივთიერება?")],
        explanation: l("Rust is a new substance (iron oxide). The others change state or mix but stay the same substances.", "ჟანგი ახალი ნივთიერებაა (რკინის ოქსიდი). დანარჩენ შემთხვევებში იცვლება აგრეგატული მდგომარეობა ან ხდება შერევა, ნივთიერებები კი იგივე რჩება."),
      },
      {
        type: "exercise",
        title: l("Conservation of mass", "მასის შენახვა"),
        prompt: l("12 g of carbon burns completely with 32 g of oxygen. What mass of carbon dioxide forms (in g)?", "12 გ ნახშირბადი სრულად იწვის 32 გ ჟანგბადში. რა მასის ნახშირორჟანგი წარმოიქმნება (გ)?"),
        accepted: { en: ["44", "44 g"], ka: ["44", "44 გ"] },
        hints: [l("Mass of products = mass of reactants.", "პროდუქტების მასა = რეაგენტების მასა."), l("12 + 32", "12 + 32")],
        solution: l("12 + 32 = 44 g of CO₂", "12 + 32 = 44 გ CO₂"),
      },
      {
        type: "short",
        title: l("Balance it", "გაატოლე"),
        prompt: l("Balance: __Mg + O₂ → __MgO. Write the two missing coefficients, e.g. \"2, 2\".", "გაატოლე: __Mg + O₂ → __MgO. ჩაწერე ორი გამოტოვებული კოეფიციენტი, მაგ. „2, 2“."),
        accepted: ["2, 2", "2,2", "2 2"],
        hints: [l("Count the oxygen atoms on each side first.", "ჯერ თითოეულ მხარეს ჟანგბადის ატომები დაითვალე."), l("2 O on the left means 2 MgO on the right. Now count Mg.", "მარცხნივ 2 O ნიშნავს მარჯვნივ 2 MgO-ს. ახლა Mg დაითვალე.")],
        solution: l("2Mg + O₂ → 2MgO", "2Mg + O₂ → 2MgO"),
      },
      {
        type: "mc",
        title: l("Neutralisation", "ნეიტრალიზაცია"),
        prompt: l("An acid reacts with a base. What forms?", "მჟავა ფუძესთან რეაგირებს. რა წარმოიქმნება?"),
        options: [l("A salt and water", "მარილი და წყალი"), l("Only a gas", "მხოლოდ აირი"), l("A metal", "ლითონი"), l("Another acid", "სხვა მჟავა")],
        correct: 0,
      },
      { type: "discussion", prompt: l("Why is it wrong to balance H₂ + O₂ → H₂O by writing H₂O₂ on the right?", "რატომ არის არასწორი H₂ + O₂ → H₂O-ს გატოლება მარჯვენა მხარეს H₂O₂-ის დაწერით?") },
      { type: "exit", prompt: l("Name one reaction you have seen at home and one sign that told you it was a reaction.", "დაასახელე ერთი რეაქცია, რომელიც სახლში გინახავს, და ერთი ნიშანი, რომლითაც მიხვდი, რომ რეაქცია იყო.") },
    ],
    discussion: [
      l("A burnt match seems lighter than a new one. Does that break the law of conservation of mass?", "დამწვარი ასანთი ახალზე მსუბუქი ჩანს. არღვევს ეს მასის შენახვის კანონს?"),
      l("Which reactions are useful to people and which are harmful?", "რომელი რეაქციებია ადამიანისთვის სასარგებლო და რომელი — მავნე?"),
    ],
    assessment: [
      l("Correct balancing of three simple equations.", "სამი მარტივი განტოლების სწორი გატოლება."),
      l("Explanation of conservation of mass in terms of atoms.", "მასის შენახვის კანონის ახსნა ატომების დონეზე."),
    ],
    homework: [l("Balance: Na + Cl₂ → NaCl; H₂ + Cl₂ → HCl; CH₄ + O₂ → CO₂ + H₂O.", "გაატოლე: Na + Cl₂ → NaCl; H₂ + Cl₂ → HCl; CH₄ + O₂ → CO₂ + H₂O.")],
    teacherNotes: l(
      "Molecular model kits (or coloured paper circles) make balancing visible: students physically rebuild the reactants into products. The cabbage-pH experiment uses household liquids; still require eye protection and no tasting.",
      "მოლეკულური მოდელების ნაკრები (ან ფერადი ქაღალდის წრეები) გატოლებას თვალსაჩინოს ხდის: მოსწავლეები რეაგენტებს ხელით „აწყობენ“ პროდუქტებად. კომბოსტოს pH-ის ცდა საყოფაცხოვრებო სითხეებს იყენებს, მაგრამ მაინც მოითხოვეთ დამცავი სათვალე და ნივთიერებების გასინჯვის აკრძალვა.",
    ),
    quiz: {
      title: l("Reactions — check yourself", "რეაქციები — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("In a chemical reaction atoms can disappear.", "ქიმიური რეაქციისას ატომები შეიძლება გაქრეს."), answer: false },
        { type: "num", prompt: l("In 2H₂ + O₂ → 2H₂O, how many hydrogen atoms are on the right?", "2H₂ + O₂ → 2H₂O განტოლებაში რამდენი წყალბადის ატომია მარჯვენა მხარეს?"), answer: 4 },
        {
          type: "mc",
          prompt: l("Which is a sign of a chemical reaction?", "რომელია ქიმიური რეაქციის ნიშანი?"),
          options: [l("A precipitate forms", "წარმოიქმნება ნალექი"), l("Ice melts", "ყინული დნება"), l("Salt dissolves", "მარილი იხსნება"), l("Glass breaks", "მინა იმსხვრევა")],
          correct: 0,
        },
        { type: "num", prompt: l("In CH₄ + 2O₂ → CO₂ + 2H₂O, how many oxygen atoms are on each side?", "CH₄ + 2O₂ → CO₂ + 2H₂O განტოლებაში რამდენი ჟანგბადის ატომია თითოეულ მხარეს?"), answer: 4 },
      ],
    },
  },
];
