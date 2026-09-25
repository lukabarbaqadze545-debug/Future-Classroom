import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const MATHEMATICS: BiLesson[] = [
  {
    group: "linear-equations",
    subject: "mathematics",
    grade: 7,
    durationMin: 45,
    difficulty: "foundation",
    match: /linear equation|solve for x|წრფივი განტოლებ|განტოლების ამოხსნ/i,
    title: l("Linear Equations", "წრფივი განტოლებები"),
    topic: l("Linear equations", "წრფივი განტოლებები"),
    objective: l(
      "Students solve linear equations by doing the same operation on both sides, check their answer, and write an equation for a word problem.",
      "მოსწავლეები ხსნიან წრფივ განტოლებებს ორივე მხარეზე ერთი და იმავე მოქმედებით, ამოწმებენ პასუხს და ტექსტური ამოცანისთვის განტოლებას ადგენენ.",
    ),
    objectives: [
      l("Recognise a linear equation and explain what its solution (root) is.", "ამოიცნოს წრფივი განტოლება და ახსნას, რა არის მისი ფესვი."),
      l("Solve linear equations, including equations with brackets and with x on both sides.", "ამოხსნას წრფივი განტოლებები, მათ შორის ფრჩხილებიანი და ისეთი, სადაც x ორივე მხარესაა."),
      l("Check a solution by substitution and write an equation for a word problem.", "შეამოწმოს ფესვი ჩასმით და ტექსტური ამოცანისთვის შეადგინოს განტოლება."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("A shopping puzzle", "ამოცანა მაღაზიიდან"),
        minutes: 5,
        body: l(
          `Nino bought 3 notebooks and a pen that cost 1 GEL. She paid 10 GEL in total. How much does one notebook cost?

If one notebook costs x lari, the story becomes an equation:

3x + 1 = 10

You can probably guess the answer (3 GEL). Today you will learn a method that works even when guessing is hard.`,
          `ნინომ იყიდა 3 რვეული და 1 ლარიანი კალამი. სულ 10 ლარი გადაიხადა. რა ღირს ერთი რვეული?

თუ ერთი რვეულის ფასს x ლარით აღვნიშნავთ, ეს ამბავი განტოლებად იქცევა:

3x + 1 = 10

პასუხის გამოცნობა ალბათ ადვილია (3 ლარი). დღეს ისწავლი მეთოდს, რომელიც მაშინაც მუშაობს, როცა გამოცნობა რთულია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("The balance idea", "სასწორის პრინციპი"),
        minutes: 10,
        body: l(
          `An equation is like a balance: the left side and the right side have the same value. A linear equation contains the unknown only to the first power — no x², no 1/x.

To solve it, we keep the balance level: whatever we do to one side, we do to the other.
• To undo "+ 1", subtract 1 from both sides.
• To undo "× 3", divide both sides by 3.

3x + 1 = 10
3x = 9 (subtract 1)
x = 3 (divide by 3)

The number that makes the equation true is its solution, or root. Always check it: 3 · 3 + 1 = 10 ✓`,
          `განტოლება სასწორს ჰგავს: მარცხენა და მარჯვენა მხარეს ერთი და იგივე მნიშვნელობა აქვს. წრფივ განტოლებაში უცნობი მხოლოდ პირველ ხარისხშია — არც x², არც 1/x.

ამოსახსნელად სასწორი წონასწორობაში უნდა დავტოვოთ: რასაც ერთ მხარეს ვაკეთებთ, იმასვე ვაკეთებთ მეორე მხარესაც.
• „+ 1“-ის გასაუქმებლად ორივე მხარეს 1 გამოვაკლოთ.
• „× 3“-ის გასაუქმებლად ორივე მხარე 3-ზე გავყოთ.

3x + 1 = 10
3x = 9 (გამოვაკელით 1)
x = 3 (გავყავით 3-ზე)

რიცხვს, რომელიც განტოლებას ჭეშმარიტ ტოლობად აქცევს, განტოლების ფესვი ჰქვია. ყოველთვის შეამოწმე: 3 · 3 + 1 = 10 ✓`,
        ),
      },
      {
        kind: "example",
        title: l("x on both sides, and brackets", "x ორივე მხარეს და ფრჩხილები"),
        minutes: 10,
        body: l(
          `Example 1. Solve 5x − 7 = 2x + 8.
1. Collect the x-terms on one side: subtract 2x from both sides → 3x − 7 = 8.
2. Add 7 to both sides → 3x = 15.
3. Divide by 3 → x = 5.
4. Check: 5 · 5 − 7 = 18 and 2 · 5 + 8 = 18 ✓

Example 2. Solve 2(x + 3) = 14.
Either divide both sides by 2 first (x + 3 = 7, so x = 4), or open the brackets (2x + 6 = 14, 2x = 8, x = 4). Both ways give the same root.`,
          `მაგალითი 1. ამოხსენი 5x − 7 = 2x + 8.
1. x-ის შემცველი წევრები ერთ მხარეს მოვაგროვოთ: ორივე მხარეს გამოვაკლოთ 2x → 3x − 7 = 8.
2. ორივე მხარეს დავუმატოთ 7 → 3x = 15.
3. გავყოთ 3-ზე → x = 5.
4. შემოწმება: 5 · 5 − 7 = 18 და 2 · 5 + 8 = 18 ✓

მაგალითი 2. ამოხსენი 2(x + 3) = 14.
შეგიძლია ჯერ ორივე მხარე 2-ზე გაყო (x + 3 = 7, ანუ x = 4) ან ფრჩხილები გახსნა (2x + 6 = 14, 2x = 8, x = 4). ორივე გზა ერთსა და იმავე ფესვს გვაძლევს.`,
        ),
      },
      {
        kind: "example",
        title: l("From words to an equation", "ტექსტიდან განტოლებამდე"),
        minutes: 8,
        body: l(
          `A rectangle is 4 cm longer than it is wide. Its perimeter is 28 cm. Find its sides.

1. Choose the unknown: let the width be x cm. Then the length is x + 4 cm.
2. Write what the story says: 2(x + x + 4) = 28.
3. Solve: 4x + 8 = 28, so 4x = 20 and x = 5.
4. Answer in words: the width is 5 cm and the length is 9 cm. Check: 2 · (5 + 9) = 28 ✓

Writing "let x be…" and answering in words are part of the solution, not decoration.`,
          `მართკუთხედის სიგრძე სიგანეზე 4 სმ-ით მეტია. მისი პერიმეტრი 28 სმ-ია. იპოვე გვერდები.

1. ავირჩიოთ უცნობი: სიგანე იყოს x სმ. მაშინ სიგრძეა x + 4 სმ.
2. ჩავწეროთ პირობა: 2(x + x + 4) = 28.
3. ამოვხსნათ: 4x + 8 = 28, ანუ 4x = 20 და x = 5.
4. პასუხი სიტყვებით: სიგანე 5 სმ-ია, სიგრძე — 9 სმ. შემოწმება: 2 · (5 + 9) = 28 ✓

ჩანაწერი „ვთქვათ, x არის…“ და სიტყვიერი პასუხი ამოხსნის ნაწილია და არა მორთულობა.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 4,
        body: l(
          `• Do the same operation on both sides so the equation stays balanced.
• Undo operations in reverse order: first + and −, then × and ÷.
• Collect x-terms on one side, numbers on the other.
• Check the root by putting it back into the original equation.`,
          `• ორივე მხარეს ერთი და იგივე მოქმედება შეასრულე, რომ ტოლობა არ დაირღვეს.
• მოქმედებები უკუღმა თანმიმდევრობით გააუქმე: ჯერ + და −, შემდეგ × და ÷.
• x-ის შემცველი წევრები ერთ მხარეს მოაგროვე, რიცხვები — მეორეზე.
• ფესვი შეამოწმე — ჩასვი საწყის განტოლებაში.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Which one is linear?", "რომელია წრფივი?"),
        prompt: l("Which of these is a linear equation?", "რომელია წრფივი განტოლება?"),
        options: ["3x + 2 = 11", "x² = 9", "2/x = 4", "x · x + x = 6"],
        correct: 0,
        hints: [
          l("In a linear equation, x appears only to the first power.", "წრფივ განტოლებაში x მხოლოდ პირველ ხარისხშია."),
          l("Look for x², x · x or x in a denominator — those are not linear.", "მოძებნე x², x · x ან მნიშვნელში მდგომი x — ასეთი განტოლება წრფივი არ არის."),
        ],
        explanation: l("3x + 2 = 11 is linear. x² = 9 and x · x + x = 6 contain x², and 2/x has x in the denominator.", "3x + 2 = 11 წრფივია. x² = 9 და x · x + x = 6 შეიცავს x²-ს, ხოლო 2/x-ში x მნიშვნელშია."),
      },
      {
        type: "exercise",
        title: l("Two steps", "ორი ნაბიჯი"),
        prompt: l("Solve: 4x + 5 = 29", "ამოხსენი: 4x + 5 = 29"),
        accepted: ["6", "x = 6"],
        hints: [
          l("Which operation undoes \"+ 5\"?", "რომელი მოქმედება აუქმებს „+ 5“-ს?"),
          l("Subtract 5 from both sides. What equation do you get?", "ორივე მხარეს გამოაკელი 5. რა განტოლება მიიღე?"),
          l("You should have 4x = 24. Which operation undoes \"× 4\"?", "უნდა მიიღო 4x = 24. რომელი მოქმედება აუქმებს „× 4“-ს?"),
          l("Divide both sides by 4, then check your answer in the original equation.", "ორივე მხარე 4-ზე გაყავი და პასუხი საწყის განტოლებაში შეამოწმე."),
        ],
        solution: l("4x + 5 = 29 → 4x = 24 → x = 6. Check: 4 · 6 + 5 = 29 ✓", "4x + 5 = 29 → 4x = 24 → x = 6. შემოწმება: 4 · 6 + 5 = 29 ✓"),
        explanation: l("Undo the addition first, then the multiplication.", "ჯერ შეკრება გააუქმე, შემდეგ — გამრავლება."),
      },
      {
        type: "exercise",
        title: l("Brackets and x on both sides", "ფრჩხილები და x ორივე მხარეს"),
        prompt: l("Solve: 3(x − 2) = 2x + 5", "ამოხსენი: 3(x − 2) = 2x + 5"),
        accepted: ["11", "x = 11"],
        hints: [
          l("Start by opening the brackets on the left.", "დაიწყე მარცხენა მხარეს ფრჩხილების გახსნით."),
          l("3(x − 2) = 3x − 6. Now bring the x-terms to one side.", "3(x − 2) = 3x − 6. ახლა x-ის შემცველი წევრები ერთ მხარეს გადაიტანე."),
          l("Subtract 2x from both sides: x − 6 = 5.", "ორივე მხარეს გამოაკელი 2x: x − 6 = 5."),
          l("Add 6 to both sides and check.", "ორივე მხარეს დაუმატე 6 და შეამოწმე."),
        ],
        solution: l("3x − 6 = 2x + 5 → x − 6 = 5 → x = 11. Check: 3 · 9 = 27 and 22 + 5 = 27 ✓", "3x − 6 = 2x + 5 → x − 6 = 5 → x = 11. შემოწმება: 3 · 9 = 27 და 22 + 5 = 27 ✓"),
      },
      {
        type: "exercise",
        title: l("School trip", "სასკოლო ექსკურსია"),
        prompt: l(
          "A class trip costs 8 GEL per student plus 40 GEL for the bus. The class paid 240 GEL in total. How many students went on the trip?",
          "კლასის ექსკურსია თითო მოსწავლეზე 8 ლარი ღირს, ავტობუსი კი დამატებით 40 ლარი. კლასმა სულ 240 ლარი გადაიხადა. რამდენი მოსწავლე წავიდა ექსკურსიაზე?",
        ),
        accepted: ["25", "x = 25"],
        hints: [
          l("Let x be the number of students. How much do the students pay together?", "ვთქვათ, x მოსწავლეების რაოდენობაა. რამდენს იხდიან მოსწავლეები ერთად?"),
          l("Students pay 8x. Add the bus and set the total equal to 240.", "მოსწავლეები იხდიან 8x-ს. დაუმატე ავტობუსის ფასი და ჯამი 240-ს გაუტოლე."),
          l("Solve 8x + 40 = 240.", "ამოხსენი 8x + 40 = 240."),
        ],
        solution: l("8x + 40 = 240 → 8x = 200 → x = 25. 25 students went on the trip.", "8x + 40 = 240 → 8x = 200 → x = 25. ექსკურსიაზე 25 მოსწავლე წავიდა."),
      },
      {
        type: "discussion",
        prompt: l(
          "Why do we have to do the same thing to both sides of an equation? What would go wrong if we only subtracted from one side?",
          "რატომ უნდა შევასრულოთ ერთი და იგივე მოქმედება განტოლების ორივე მხარეს? რა მოხდება, თუ მხოლოდ ერთ მხარეს გამოვაკლებთ?",
        ),
      },
      {
        type: "exit",
        prompt: l("Write your own equation whose root is x = 4, and show that 4 really is its root.", "შეადგინე განტოლება, რომლის ფესვიც x = 4-ია, და აჩვენე, რომ 4 მართლაც მისი ფესვია."),
      },
    ],
    discussion: [
      l("Where in everyday life could you write an equation to find an unknown amount?", "ყოველდღიურ ცხოვრებაში სად შეიძლება დაგჭირდეს განტოლება უცნობი სიდიდის საპოვნელად?"),
      l("Can a linear equation have no solution? Try 2x + 1 = 2x + 3.", "შეიძლება წრფივ განტოლებას ფესვი არ ჰქონდეს? სცადე 2x + 1 = 2x + 3."),
    ],
    assessment: [
      l("Students solve a two-step equation and an equation with x on both sides without help.", "მოსწავლე დამოუკიდებლად ხსნის ორბიჯიან განტოლებას და განტოლებას, სადაც x ორივე მხარესაა."),
      l("Students write an equation for a short word problem and answer in words.", "მოსწავლე მოკლე ტექსტური ამოცანისთვის ადგენს განტოლებას და პასუხს სიტყვებით წერს."),
    ],
    homework: [
      l("Solve: 6x − 4 = 20; 5(x + 1) = 3x + 11; 7 − 2x = x + 1. Check every root.", "ამოხსენი: 6x − 4 = 20; 5(x + 1) = 3x + 11; 7 − 2x = x + 1. ყველა ფესვი შეამოწმე."),
      l("Write one word problem of your own that leads to a linear equation, and solve it.", "მოიფიქრე ტექსტური ამოცანა, რომელიც წრფივ განტოლებამდე მიდის, და ამოხსენი."),
    ],
    teacherNotes: l(
      "A physical or drawn balance helps students who struggle with \"moving\" terms: avoid the phrase \"move it to the other side and change the sign\" until students understand why it works. Common mistakes: forgetting to multiply every term inside the brackets, and dividing only one term by the coefficient.",
      "რეალური ან დახატული სასწორი ეხმარება მოსწავლეებს, ვისაც წევრების „გადატანა“ უჭირს: ფრაზა „გადაიტანე მეორე მხარეს და ნიშანი შეუცვალე“ გამოიყენეთ მხოლოდ მას შემდეგ, რაც მოსწავლეები მიხვდებიან, რატომ მუშაობს ეს წესი. ხშირი შეცდომები: ფრჩხილებში ყველა წევრის გადამრავლება ავიწყდებათ ან კოეფიციენტზე მხოლოდ ერთ წევრს ყოფენ.",
    ),
    quiz: {
      title: l("Linear equations — check yourself", "წრფივი განტოლებები — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("Solve: 7x − 4 = 31", "ამოხსენი: 7x − 4 = 31"), answer: 5, explanation: l("7x = 35, so x = 5.", "7x = 35, ანუ x = 5.") },
        {
          type: "mc",
          prompt: l("What is a good first step to solve 2x + 9 = 1?", "რა არის კარგი პირველი ნაბიჯი განტოლების 2x + 9 = 1 ამოსახსნელად?"),
          options: [l("Subtract 9 from both sides", "ორივე მხარეს გამოვაკლოთ 9"), l("Divide only the left side by 2", "მხოლოდ მარცხენა მხარე გავყოთ 2-ზე"), l("Add 9 to both sides", "ორივე მხარეს დავუმატოთ 9"), l("Subtract 2 from both sides", "ორივე მხარეს გამოვაკლოთ 2")],
          correct: 0,
          explanation: l("Undo \"+ 9\" first: 2x = −8, then x = −4.", "ჯერ „+ 9“ გავაუქმოთ: 2x = −8, შემდეგ x = −4."),
        },
        { type: "tf", prompt: l("x = 3 is a root of 5x − 2 = 13.", "x = 3 განტოლების 5x − 2 = 13 ფესვია."), answer: true, explanation: l("5 · 3 − 2 = 13 ✓", "5 · 3 − 2 = 13 ✓") },
        { type: "num", prompt: l("Solve: 2(x + 5) = 3x + 4", "ამოხსენი: 2(x + 5) = 3x + 4"), answer: 6, explanation: l("2x + 10 = 3x + 4, so x = 6.", "2x + 10 = 3x + 4, ანუ x = 6.") },
        {
          type: "mc",
          prompt: l("How many roots does 2x + 1 = 2x + 3 have?", "რამდენი ფესვი აქვს განტოლებას 2x + 1 = 2x + 3?"),
          options: [l("None", "არცერთი"), l("One", "ერთი"), l("Two", "ორი"), l("Infinitely many", "უსასრულოდ ბევრი")],
          correct: 0,
          explanation: l("Subtracting 2x gives 1 = 3, which is never true, so there is no root.", "2x-ის გამოკლების შემდეგ ვიღებთ 1 = 3-ს, რაც არასოდეს სრულდება, ამიტომ ფესვი არ არსებობს."),
        },
      ],
    },
  },
  {
    group: "functions",
    subject: "mathematics",
    grade: 8,
    durationMin: 45,
    difficulty: "standard",
    match: /function|graph of|slope|ფუნქცი|გრაფიკ|კუთხური კოეფიციენტ/i,
    title: l("Functions and Their Graphs", "ფუნქცია და მისი გრაფიკი"),
    topic: l("Functions", "ფუნქციები"),
    objective: l(
      "Students describe a function as a rule that gives exactly one output for each input, use tables and graphs, and interpret the slope of a linear function in context.",
      "მოსწავლეები ფუნქციას აღწერენ, როგორც წესს, რომელიც თითოეულ არგუმენტს ზუსტად ერთ მნიშვნელობას შეუსაბამებს, იყენებენ ცხრილსა და გრაფიკს და კონტექსტში ხსნიან წრფივი ფუნქციის კუთხური კოეფიციენტის აზრს.",
    ),
    objectives: [
      l("Explain what a function is and decide whether a rule or table is a function.", "ახსნას, რა არის ფუნქცია, და გაარკვიოს, არის თუ არა მოცემული წესი ან ცხრილი ფუნქცია."),
      l("Move between a formula, a table of values and a graph.", "გადავიდეს ფორმულიდან მნიშვნელობათა ცხრილზე და გრაფიკზე და პირიქით."),
      l("Interpret k and b in y = kx + b in a real situation.", "ახსნას k-სა და b-ს აზრი ფუნქციაში y = kx + b რეალურ სიტუაციაში."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("A machine with a rule", "მანქანა წესით"),
        minutes: 5,
        body: l(
          `Imagine a machine: you put in a number x, and it gives back 2x + 1. Put in 3 and you get 7; put in 0 and you get 1.

A function is exactly this: a rule that gives one output for every input. The input is the argument (x), the output is the value of the function (y or f(x)).`,
          `წარმოიდგინე მანქანა: შედის რიცხვი x, გამოდის 2x + 1. თუ შევიყვანთ 3-ს, მივიღებთ 7-ს; თუ 0-ს — 1-ს.

ფუნქცია სწორედ ესაა: წესი, რომელიც ყოველ შემავალ რიცხვს ერთ გამომავალს შეუსაბამებს. შემავალს არგუმენტი ჰქვია (x), გამომავალს — ფუნქციის მნიშვნელობა (y ან f(x)).`,
        ),
      },
      {
        kind: "explanation",
        title: l("Formula, table and graph", "ფორმულა, ცხრილი და გრაფიკი"),
        minutes: 12,
        body: l(
          `The same function can be shown in three ways.

Formula: y = 2x + 1
Table:
x: −1, 0, 1, 2, 3
y: −1, 1, 3, 5, 7
Graph: plot the points (x, y) and join them. For y = 2x + 1 the points lie on a straight line.

A table is a function only if no x appears twice with different y values. On a graph, this means a vertical line never crosses the graph twice.`,
          `ერთი და იგივე ფუნქცია სამნაირად შეიძლება ჩაიწეროს.

ფორმულა: y = 2x + 1
ცხრილი:
x: −1, 0, 1, 2, 3
y: −1, 1, 3, 5, 7
გრაფიკი: დავიტანოთ წერტილები (x, y) და შევაერთოთ. y = 2x + 1-ის შემთხვევაში წერტილები ერთ წრფეზე ლაგდება.

ცხრილი ფუნქციაა მხოლოდ მაშინ, თუ ერთი და იგივე x ორჯერ სხვადასხვა y-ით არ გვხვდება. გრაფიკზე ეს ნიშნავს, რომ ვერტიკალური წრფე გრაფიკს ორ წერტილში არასოდეს კვეთს.`,
        ),
        plot: { expression: "2x + 1", xMin: -2, xMax: 4, caption: l("y = 2x + 1 is a straight line", "y = 2x + 1 წრფეა") },
      },
      {
        kind: "explanation",
        title: l("Linear functions: y = kx + b", "წრფივი ფუნქცია: y = kx + b"),
        minutes: 10,
        body: l(
          `In y = kx + b:
• b is the value when x = 0 — where the line crosses the y-axis.
• k (the slope) says how much y changes when x grows by 1.

Example: a mobile plan costs 5 GEL a month plus 0.10 GEL per minute of calls. The monthly bill is y = 0.1x + 5, where x is the number of minutes. Here b = 5 GEL is the fixed part, and k = 0.1 GEL is the price of each extra minute. (The prices are an example, not a real tariff.)

If k > 0 the line goes up from left to right; if k < 0 it goes down; if k = 0 it is horizontal.`,
          `ფუნქციაში y = kx + b:
• b არის მნიშვნელობა, როცა x = 0 — წერტილი, სადაც წრფე y ღერძს კვეთს.
• k (კუთხური კოეფიციენტი) გვიჩვენებს, რამდენით იცვლება y, როცა x 1-ით იზრდება.

მაგალითი: მობილური ტარიფი თვეში 5 ლარი ღირს, დამატებით კი ზარის ყოველი წუთი — 0,10 ლარი. თვის გადასახადია y = 0,1x + 5, სადაც x წუთების რაოდენობაა. აქ b = 5 ლარი ფიქსირებული ნაწილია, ხოლო k = 0,1 ლარი ყოველი დამატებითი წუთის ფასი. (ფასები მაგალითისთვისაა და რეალურ ტარიფს არ ასახავს.)

თუ k > 0, წრფე მარცხნიდან მარჯვნივ ადის; თუ k < 0 — ეშვება; თუ k = 0 — ჰორიზონტალურია.`,
        ),
        plot: { expression: "0.1x + 5", xMin: 0, xMax: 100, caption: l("Monthly bill y = 0.1x + 5 (x = minutes)", "თვის გადასახადი y = 0,1x + 5 (x — წუთები)") },
      },
      {
        kind: "practice",
        title: l("Practice and the lab", "პრაქტიკა და ლაბორატორია"),
        minutes: 13,
        body: l(
          `Work through the activities. Then open the STEM Laboratory simulation "Fitting a line to data": drag the line until it fits the points and read off k and b. What do k and b mean for the data you see?`,
          `შეასრულე აქტივობები. შემდეგ გახსენი STEM ლაბორატორიის სიმულაცია „წრფის მორგება მონაცემებზე“: გადააადგილე წრფე, სანამ წერტილებს არ მოერგება, და წაიკითხე k და b. რას ნიშნავს k და b შენს მონაცემებში?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• A function gives exactly one output for each input.
• Formula, table and graph are three views of the same function.
• In y = kx + b, b is the starting value and k is the change per step.`,
          `• ფუნქცია ყოველ არგუმენტს ზუსტად ერთ მნიშვნელობას შეუსაბამებს.
• ფორმულა, ცხრილი და გრაფიკი ერთი და იმავე ფუნქციის სამი ხედია.
• y = kx + b-ში b საწყისი მნიშვნელობაა, k — ცვლილება ერთ ნაბიჯზე.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("Evaluate", "გამოთვალე"),
        prompt: l("f(x) = 3x − 4. Find f(5).", "f(x) = 3x − 4. იპოვე f(5)."),
        accepted: ["11"],
        hints: [
          l("f(5) means: put 5 in place of x.", "f(5) ნიშნავს: x-ის ნაცვლად ჩასვი 5."),
          l("Calculate 3 · 5 − 4.", "გამოთვალე 3 · 5 − 4."),
        ],
        solution: l("f(5) = 3 · 5 − 4 = 11", "f(5) = 3 · 5 − 4 = 11"),
      },
      {
        type: "mc",
        title: l("Is it a function?", "ფუნქციაა?"),
        prompt: l(
          "Which table does NOT describe a function of x?",
          "რომელი ცხრილი არ აღწერს x-ის ფუნქციას?",
        ),
        options: [
          l("x: 1, 2, 3 → y: 5, 5, 5", "x: 1, 2, 3 → y: 5, 5, 5"),
          l("x: 1, 2, 2 → y: 4, 6, 8", "x: 1, 2, 2 → y: 4, 6, 8"),
          l("x: 0, 1, 2 → y: 0, 1, 4", "x: 0, 1, 2 → y: 0, 1, 4"),
          l("x: −1, 0, 1 → y: 2, 1, 2", "x: −1, 0, 1 → y: 2, 1, 2"),
        ],
        correct: 1,
        hints: [
          l("A function cannot give two different outputs for the same input.", "ფუნქცია ერთსა და იმავე არგუმენტს ორ სხვადასხვა მნიშვნელობას ვერ შეუსაბამებს."),
          l("Look for an x that appears twice.", "მოძებნე x, რომელიც ორჯერ გვხვდება."),
        ],
        explanation: l("In the second table x = 2 gives both 6 and 8, so it is not a function. The same output for different inputs (first table) is allowed.", "მეორე ცხრილში x = 2-ს შეესაბამება 6-იც და 8-იც, ამიტომ ფუნქცია არ არის. სხვადასხვა არგუმენტისთვის ერთი და იგივე მნიშვნელობა (პირველი ცხრილი) დასაშვებია."),
      },
      {
        type: "exercise",
        title: l("Read the slope", "იპოვე კუთხური კოეფიციენტი"),
        prompt: l(
          "A taxi ride costs y = 1.5x + 3 lari, where x is the distance in km. How much does each extra kilometre cost?",
          "ტაქსით მგზავრობა ღირს y = 1,5x + 3 ლარი, სადაც x მანძილია კილომეტრებში. რა ღირს ყოველი დამატებითი კილომეტრი?",
        ),
        accepted: { en: ["1.5", "1.5 GEL", "1.5 lari"], ka: ["1,5", "1.5", "1,5 ლარი", "1.5 ლარი"] },
        hints: [
          l("Which number changes the price when x grows by 1?", "რომელი რიცხვი ცვლის ფასს, როცა x 1-ით იზრდება?"),
          l("In y = kx + b the change per kilometre is k.", "y = kx + b-ში ცვლილება ყოველ კილომეტრზე არის k."),
        ],
        solution: l("k = 1.5, so each extra kilometre costs 1.5 GEL. The 3 GEL is the fixed starting price.", "k = 1,5, ანუ ყოველი დამატებითი კილომეტრი 1,5 ლარი ღირს. 3 ლარი ფიქსირებული საწყისი ფასია."),
      },
      {
        type: "exercise",
        title: l("Where does it cross?", "სად კვეთს?"),
        prompt: l("Where does the graph of y = −2x + 6 cross the x-axis? Give x.", "სად კვეთს y = −2x + 6-ის გრაფიკი x ღერძს? ჩაწერე x."),
        accepted: ["3", "x = 3"],
        hints: [
          l("On the x-axis, y = 0.", "x ღერძზე y = 0."),
          l("Solve −2x + 6 = 0.", "ამოხსენი −2x + 6 = 0."),
        ],
        solution: l("−2x + 6 = 0 → x = 3. The graph crosses the x-axis at (3, 0).", "−2x + 6 = 0 → x = 3. გრაფიკი x ღერძს წერტილში (3, 0) კვეთს."),
      },
      {
        type: "discussion",
        prompt: l(
          "Give an example from your life of a quantity that depends on another (e.g. cost and number of items). Is the relationship linear? How could you tell?",
          "მოიყვანე მაგალითი შენი ცხოვრებიდან, სადაც ერთი სიდიდე მეორეზეა დამოკიდებული (მაგ. ფასი და ნივთების რაოდენობა). წრფივია ეს დამოკიდებულება? როგორ მიხვდებოდი?",
        ),
      },
      { type: "exit", prompt: l("In your own words: what do k and b tell you about the line y = kx + b?", "შენი სიტყვებით: რას გვეუბნება k და b წრფის y = kx + b შესახებ?") },
    ],
    discussion: [
      l("Can two different formulas give the same graph?", "შეიძლება ორმა სხვადასხვა ფორმულამ ერთი და იგივე გრაფიკი მოგვცეს?"),
      l("Why is a vertical line not the graph of a function?", "რატომ არ არის ვერტიკალური წრფე ფუნქციის გრაფიკი?"),
    ],
    assessment: [
      l("Students evaluate a function, complete a table and sketch a linear graph.", "მოსწავლე ითვლის ფუნქციის მნიშვნელობას, ავსებს ცხრილს და ხაზავს წრფივ გრაფიკს."),
      l("Students interpret k and b in a price or distance problem.", "მოსწავლე ფასის ან მანძილის ამოცანაში ხსნის k-სა და b-ს აზრს."),
    ],
    homework: [
      l("Make a table and graph for y = x − 2 and y = −x + 4. Where do the lines meet?", "შეადგინე ცხრილი და ააგე გრაფიკი ფუნქციებისთვის y = x − 2 და y = −x + 4. სად იკვეთება წრფეები?"),
      l("Find a real price list (e.g. a delivery service). Can you write it as y = kx + b?", "მოძებნე რეალური ფასები (მაგ. მიწოდების სერვისის). შეიძლება ჩაწერო ისინი სახით y = kx + b?"),
    ],
    teacherNotes: l(
      "Keep the three representations side by side on the board. The \"Fitting a line to data\" simulation in the STEM Laboratory works well on the touchscreen for the slope discussion. Students often confuse k with the y-intercept; ask \"what happens when x grows by one?\" every time.",
      "დაფაზე სამივე წარმოდგენა გვერდიგვერდ დატოვეთ. STEM ლაბორატორიის სიმულაცია „წრფის მორგება მონაცემებზე“ კარგად მუშაობს სენსორულ ეკრანზე კუთხური კოეფიციენტის განხილვისას. მოსწავლეები ხშირად ურევენ k-ს y ღერძთან გადაკვეთის წერტილში; ყოველ ჯერზე ჰკითხეთ: „რა ხდება, როცა x ერთით იზრდება?“",
    ),
    quiz: {
      title: l("Functions — check yourself", "ფუნქციები — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("g(x) = x² − 1. Find g(−3).", "g(x) = x² − 1. იპოვე g(−3)."), answer: 8, explanation: l("(−3)² − 1 = 9 − 1 = 8", "(−3)² − 1 = 9 − 1 = 8") },
        { type: "num", prompt: l("What is the slope k of y = 4 − 3x?", "რისი ტოლია კუთხური კოეფიციენტი k ფუნქციაში y = 4 − 3x?"), answer: -3, explanation: l("y = −3x + 4, so k = −3.", "y = −3x + 4, ანუ k = −3.") },
        { type: "tf", prompt: l("The line y = 2x + 5 crosses the y-axis at y = 5.", "წრფე y = 2x + 5 y ღერძს y = 5 წერტილში კვეთს."), answer: true, explanation: l("At x = 0, y = b = 5.", "როცა x = 0, y = b = 5.") },
        {
          type: "mc",
          prompt: l("A line goes down from left to right. What do you know about k?", "წრფე მარცხნიდან მარჯვნივ ეშვება. რა იცი k-ს შესახებ?"),
          options: [l("k < 0", "k < 0"), l("k = 0", "k = 0"), l("k > 0", "k > 0"), l("Nothing", "არაფერი")],
          correct: 0,
          explanation: l("When k is negative, y decreases as x grows.", "როცა k უარყოფითია, x-ის ზრდასთან ერთად y მცირდება."),
        },
      ],
    },
  },
  {
    group: "probability-basics",
    subject: "mathematics",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /probabilit|chance|dice|ალბათობ|კამათელ|ხდომილებ/i,
    title: l("Probability Basics", "ალბათობის საფუძვლები"),
    topic: l("Probability", "ალბათობა"),
    objective: l(
      "Students calculate simple probabilities as favourable outcomes over all equally likely outcomes, and compare theory with experiment.",
      "მოსწავლეები ითვლიან მარტივ ალბათობებს, როგორც ხელსაყრელი შედეგების შეფარდებას ყველა თანაბრად შესაძლებელ შედეგთან, და ადარებენ თეორიას ცდის შედეგებს.",
    ),
    objectives: [
      l("Use the words outcome, event and probability correctly.", "სწორად გამოიყენოს ცნებები: შედეგი, ხდომილება და ალბათობა."),
      l("Calculate the probability of an event with equally likely outcomes.", "გამოთვალოს ხდომილების ალბათობა, როცა შედეგები თანაბრად შესაძლებელია."),
      l("Explain why experimental frequencies get closer to the theoretical probability when there are many trials.", "ახსნას, რატომ უახლოვდება ცდის შედეგად მიღებული სიხშირე თეორიულ ალბათობას, როცა ცდა ბევრჯერ ტარდება."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Is it fair?", "სამართლიანია?"),
        minutes: 5,
        body: l(
          `Two friends decide who starts a game by rolling one die: Ana starts if the result is 6, Luka starts otherwise. Is this fair?

Most people feel it is not — but by how much? Probability lets us measure chance with a number from 0 (impossible) to 1 (certain).`,
          `ორი მეგობარი კამათლის გაგორებით წყვეტს, ვინ დაიწყებს თამაშს: ანა იწყებს, თუ 6 მოვა, სხვა შემთხვევაში — ლუკა. სამართლიანია ეს?

უმეტესობა გრძნობს, რომ არა — მაგრამ რამდენად? ალბათობა შანსს რიცხვით ზომავს: 0-დან (შეუძლებელი) 1-მდე (აუცილებელი).`,
        ),
      },
      {
        kind: "explanation",
        title: l("Outcomes, events and the formula", "შედეგები, ხდომილებები და ფორმულა"),
        minutes: 12,
        body: l(
          `• An outcome is one possible result: rolling a die has 6 outcomes: 1, 2, 3, 4, 5, 6.
• An event is a set of outcomes we are interested in, e.g. "an even number" = {2, 4, 6}.

If all outcomes are equally likely:

P(event) = number of favourable outcomes / number of all outcomes

P(even) = 3/6 = 1/2
P(6) = 1/6
P(7) = 0 (impossible), P(number from 1 to 6) = 1 (certain)

The probability that an event does NOT happen is 1 − P(event). So P(not 6) = 5/6: Luka starts five times more often than Ana.`,
          `• შედეგი ერთ-ერთი შესაძლო გამოსავალია: კამათლის გაგორებისას 6 შედეგია: 1, 2, 3, 4, 5, 6.
• ხდომილება ჩვენთვის საინტერესო შედეგების ერთობლიობაა, მაგ. „ლუწი რიცხვი“ = {2, 4, 6}.

თუ ყველა შედეგი თანაბრად შესაძლებელია:

P(ხდომილება) = ხელსაყრელი შედეგების რაოდენობა / ყველა შედეგის რაოდენობა

P(ლუწი) = 3/6 = 1/2
P(6) = 1/6
P(7) = 0 (შეუძლებელი), P(რიცხვი 1-დან 6-მდე) = 1 (აუცილებელი)

ალბათობა იმისა, რომ ხდომილება არ მოხდება, არის 1 − P(ხდომილება). ანუ P(არა 6) = 5/6: ლუკა ხუთჯერ უფრო ხშირად დაიწყებს, ვიდრე ანა.`,
        ),
      },
      {
        kind: "example",
        title: l("Two dice", "ორი კამათელი"),
        minutes: 10,
        body: l(
          `Roll two dice and add the numbers. The sums 2 to 12 are NOT equally likely. Make a 6 × 6 table of all 36 equally likely pairs:
• sum 2 appears once (1 + 1) → P = 1/36
• sum 7 appears six times (1+6, 2+5, 3+4, 4+3, 5+2, 6+1) → P = 6/36 = 1/6

This is why 7 is the most common sum in board games with two dice.`,
          `გააგორე ორი კამათელი და შეკრიბე რიცხვები. ჯამები 2-დან 12-მდე თანაბრად შესაძლებელი არ არის. შეადგინე 6 × 6 ცხრილი ყველა 36 თანაბრად შესაძლებელი წყვილით:
• ჯამი 2 ერთხელ გვხვდება (1 + 1) → P = 1/36
• ჯამი 7 ექვსჯერ გვხვდება (1+6, 2+5, 3+4, 4+3, 5+2, 6+1) → P = 6/36 = 1/6

სწორედ ამიტომ არის 7 ყველაზე ხშირი ჯამი ორკამათლიან სამაგიდო თამაშებში.`,
        ),
      },
      {
        kind: "practice",
        title: l("Theory meets experiment", "თეორია და ცდა"),
        minutes: 13,
        body: l(
          `Open the STEM Laboratory simulation "Dice and probability". Roll one die 10 times, then 100, then 1000 times. Compare the bars with the theoretical probability 1/6 ≈ 0.17.

With few rolls, results jump around. With many rolls, the frequencies settle close to the theory — this is called the law of large numbers.`,
          `გახსენი STEM ლაბორატორიის სიმულაცია „კამათლები და ალბათობა“. გააგორე ერთი კამათელი 10-ჯერ, შემდეგ 100-ჯერ და 1000-ჯერ. შეადარე სვეტები თეორიულ ალბათობას 1/6 ≈ 0,17.

ცოტა გაგორებისას შედეგები ხტუნავს. ბევრი გაგორებისას სიხშირეები თეორიულ მნიშვნელობას უახლოვდება — ამას დიდ რიცხვთა კანონი ჰქვია.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• Probability is a number from 0 to 1.
• With equally likely outcomes: favourable / all.
• P(not A) = 1 − P(A).
• Experiments approach the theory only over many trials.`,
          `• ალბათობა რიცხვია 0-დან 1-მდე.
• თანაბრად შესაძლებელი შედეგებისას: ხელსაყრელი / ყველა.
• P(არა A) = 1 − P(A).
• ცდის შედეგები თეორიას მხოლოდ ბევრი გამეორებისას უახლოვდება.`,
        ),
      },
    ],
    activities: [
      {
        type: "exercise",
        title: l("A bag of marbles", "ბურთულები ტომარაში"),
        prompt: l(
          "A bag has 3 red, 5 blue and 2 green marbles. You take one without looking. What is the probability that it is blue? (Give a fraction or a decimal.)",
          "ტომარაში 3 წითელი, 5 ლურჯი და 2 მწვანე ბურთულაა. შეუხედავად იღებ ერთს. რა არის ალბათობა, რომ ლურჯი იქნება? (ჩაწერე წილადი ან ათწილადი.)",
        ),
        accepted: ["1/2", "5/10", "0.5"],
        hints: [
          l("How many marbles are there in total?", "სულ რამდენი ბურთულაა?"),
          l("There are 10 marbles; 5 of them are blue.", "სულ 10 ბურთულაა, მათგან 5 ლურჯია."),
        ],
        solution: l("P(blue) = 5/10 = 1/2", "P(ლურჯი) = 5/10 = 1/2"),
      },
      {
        type: "exercise",
        title: l("Not a six", "არა ექვსიანი"),
        prompt: l("What is the probability of NOT rolling a 6 with one die?", "რა არის ალბათობა, რომ ერთი კამათლის გაგორებისას 6 არ მოვა?"),
        accepted: ["5/6"],
        hints: [
          l("Use P(not A) = 1 − P(A).", "გამოიყენე P(არა A) = 1 − P(A)."),
          l("P(6) = 1/6, so P(not 6) = 1 − 1/6.", "P(6) = 1/6, ანუ P(არა 6) = 1 − 1/6."),
        ],
        solution: l("1 − 1/6 = 5/6", "1 − 1/6 = 5/6"),
      },
      {
        type: "mc",
        title: l("Most likely sum", "ყველაზე სავარაუდო ჯამი"),
        prompt: l("With two dice, which sum is the most likely?", "ორი კამათლის გაგორებისას რომელი ჯამია ყველაზე სავარაუდო?"),
        options: ["2", "6", "7", "12"],
        correct: 2,
        hints: [l("Count how many pairs give each sum.", "დაითვალე, რამდენი წყვილი იძლევა თითოეულ ჯამს."), l("7 can be made in six different ways.", "7 ექვსი სხვადასხვა გზით მიიღება.")],
        explanation: l("7 has 6 of the 36 pairs; 6 has 5; 2 and 12 have only 1 each.", "7-ს 36 წყვილიდან 6 შეესაბამება, 6-ს — 5, ხოლო 2-სა და 12-ს მხოლოდ თითო."),
      },
      {
        type: "mc",
        title: l("After five heads", "ხუთი „გერბის“ შემდეგ"),
        prompt: l(
          "A fair coin landed on heads five times in a row. What is the probability of heads on the next toss?",
          "სამართლიანმა მონეტამ ზედიზედ ხუთჯერ „გერბი“ აჩვენა. რა არის ალბათობა, რომ შემდეგ ჯერზეც „გერბი“ მოვა?",
        ),
        options: [l("Less than 1/2 — tails is \"due\"", "1/2-ზე ნაკლები — ახლა „საფასურის“ ჯერია"), l("Exactly 1/2", "ზუსტად 1/2"), l("More than 1/2 — heads is \"on a streak\"", "1/2-ზე მეტი — „გერბი“ სერიაშია"), l("It is impossible to say", "თქმა შეუძლებელია")],
        correct: 1,
        hints: [l("Does the coin remember its earlier tosses?", "ახსოვს მონეტას წინა აგდებები?")],
        explanation: l("Each toss is independent: the probability stays 1/2. Believing otherwise is called the gambler's fallacy.", "ყოველი აგდება დამოუკიდებელია: ალბათობა ისევ 1/2-ია. საწინააღმდეგოს დაჯერებას „მოთამაშის შეცდომა“ ჰქვია."),
      },
      {
        type: "discussion",
        prompt: l(
          "Design a fair way for three friends to choose who goes first using one die. Explain why it is fair.",
          "მოიფიქრე სამართლიანი გზა, რომ სამმა მეგობარმა ერთი კამათლით აირჩიოს, ვინ დაიწყებს. ახსენი, რატომ არის ის სამართლიანი.",
        ),
      },
      { type: "exit", prompt: l("Give one event with probability 0, one with probability 1, and one with probability 1/2.", "მოიყვანე ერთი ხდომილება, რომლის ალბათობაა 0, ერთი — 1 და ერთი — 1/2.") },
    ],
    discussion: [
      l("A weather forecast says \"70% chance of rain\". What does that mean — and what does it not mean?", "ამინდის პროგნოზი ამბობს: „წვიმის ალბათობა 70%-ია“. რას ნიშნავს ეს და რას — არა?"),
      l("Why do lotteries make money for their organisers?", "რატომ იღებენ ლატარიის ორგანიზატორები მოგებას?"),
    ],
    assessment: [
      l("Students calculate probabilities with equally likely outcomes and complements.", "მოსწავლე ითვლის ალბათობებს თანაბრად შესაძლებელი შედეგებისას და საწინააღმდეგო ხდომილებისთვის."),
      l("Students explain the difference between one experiment and many trials.", "მოსწავლე ხსნის განსხვავებას ერთ ცდასა და ბევრ გამეორებას შორის."),
    ],
    homework: [
      l("Toss a coin 30 times and record the results. Compare the share of heads with 1/2. Combine results with a classmate: what happens?", "ააგდე მონეტა 30-ჯერ და ჩაიწერე შედეგები. შეადარე „გერბების“ წილი 1/2-ს. გააერთიანე შედეგები თანაკლასელისას: რა ხდება?"),
      l("Make the full 6 × 6 table of sums for two dice and find P(sum ≥ 10).", "შეადგინე ორი კამათლის ჯამების სრული 6 × 6 ცხრილი და იპოვე P(ჯამი ≥ 10)."),
    ],
    teacherNotes: l(
      "The dice simulation lets the whole class roll 1000 times in a second; compare it with a real-dice experiment of 20 rolls per pair to show the variation of small samples. Watch for students who think that with more trials the counts of each outcome become equal — it is the proportions that settle, not the counts.",
      "კამათლის სიმულაციით მთელი კლასი წამში 1000-ჯერ „აგორებს“; შეადარეთ ის რეალურ ცდას, სადაც თითო წყვილი 20-ჯერ აგორებს, რომ მცირე შერჩევის მერყეობა გამოჩნდეს. ყურადღება მიაქციეთ მოსწავლეებს, ვისაც ჰგონია, რომ ბევრი გამეორებისას თითოეული შედეგის რაოდენობა ტოლდება — სტაბილიზდება წილები და არა რაოდენობები.",
    ),
    quiz: {
      title: l("Probability — check yourself", "ალბათობა — შეამოწმე თავი"),
      questions: [
        { type: "num", prompt: l("A class has 12 girls and 18 boys. One student is chosen at random. What is the probability it is a girl? (decimal)", "კლასში 12 გოგონა და 18 ბიჭია. შემთხვევით ირჩევენ ერთ მოსწავლეს. რა არის ალბათობა, რომ გოგონა იქნება? (ათწილადით)"), answer: 0.4, tolerance: 0.001, explanation: l("12/30 = 0.4", "12/30 = 0,4") },
        { type: "tf", prompt: l("A probability can be greater than 1.", "ალბათობა შეიძლება 1-ზე მეტი იყოს."), answer: false, explanation: l("Probabilities are always between 0 and 1.", "ალბათობა ყოველთვის 0-სა და 1-ს შორისაა.") },
        {
          type: "mc",
          prompt: l("P(rain) = 0.3. What is P(no rain)?", "P(წვიმა) = 0,3. რისი ტოლია P(არ იწვიმებს)?"),
          options: [l("0.3", "0,3"), l("0.7", "0,7"), l("1.3", "1,3"), "0"],
          correct: 1,
          explanation: l("1 − 0.3 = 0.7", "1 − 0,3 = 0,7"),
        },
        { type: "num", prompt: l("Two dice: how many of the 36 pairs give a sum of 4?", "ორი კამათელი: 36 წყვილიდან რამდენი იძლევა ჯამს 4?"), answer: 3, explanation: l("1+3, 2+2, 3+1", "1+3, 2+2, 3+1") },
      ],
    },
  },
];
