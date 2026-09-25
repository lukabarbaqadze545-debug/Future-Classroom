import { l } from "@/lib/labs/localized";
import type { BiLesson } from "../bilingual";

export const COMPUTER_SCIENCE: BiLesson[] = [
  {
    group: "python-basics",
    subject: "computer_science",
    grade: 8,
    durationMin: 45,
    difficulty: "foundation",
    match: /python|variable|print|input\(|if statement|loop|პითონ|ცვლად|ციკლ/i,
    title: l("Python Basics: Variables, Decisions and Loops", "Python-ის საფუძვლები: ცვლადები, პირობები და ციკლები"),
    topic: l("Python basics", "Python-ის საფუძვლები"),
    objective: l(
      "Students write short Python programs that read input, store values in variables, make decisions with if and repeat work with for loops.",
      "მოსწავლეები წერენ მოკლე Python პროგრამებს, რომლებიც კითხულობს შემავალ მონაცემებს, ინახავს მნიშვნელობებს ცვლადებში, იღებს გადაწყვეტილებებს if-ით და იმეორებს მოქმედებებს for ციკლით.",
    ),
    objectives: [
      l("Use variables, input() and print() with numbers and text.", "გამოიყენოს ცვლადები, input() და print() რიცხვებითა და ტექსტით."),
      l("Write if / elif / else decisions.", "დაწეროს განშტოებები if / elif / else."),
      l("Use a for loop to repeat a calculation.", "გამოიყენოს for ციკლი გამოთვლის გასამეორებლად."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Talking to the computer", "ლაპარაკი კომპიუტერთან"),
        minutes: 5,
        body: l(
          `A program is a list of instructions the computer follows exactly — in order, without guessing what you meant. Python is popular in schools and in science because its instructions read almost like English.

print("Hello, class 8!")

Run it in the Programming Laboratory: the problem "Hello, Future Classroom!" is a good first step.`,
          `პროგრამა ინსტრუქციების სიაა, რომელსაც კომპიუტერი ზუსტად ასრულებს — თანმიმდევრობით და ისე, რომ არ ცდილობს გამოიცნოს, რა გინდოდა გეთქვა. Python პოპულარულია სკოლებსა და მეცნიერებაში, რადგან მისი ინსტრუქციები თითქმის ჩვეულებრივ წინადადებებს ჰგავს.

print("გამარჯობა, მერვე კლასო!")

გაუშვი ის პროგრამირების ლაბორატორიაში: ამოცანა „გამარჯობა, მომავლის საკლასო ოთახო!“ კარგი პირველი ნაბიჯია.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Variables, input and types", "ცვლადები, შემავალი მონაცემები და ტიპები"),
        minutes: 12,
        body: l(
          `A variable is a named box for a value:

name = input()          # reads a line of text
age = int(input())      # reads a line and turns it into a whole number
print("Hi,", name)
print("Next year you will be", age + 1)

• input() always gives text (a string, str). To calculate, convert it: int() for whole numbers, float() for decimals.
• "5" + "5" is "55" (text joined), but 5 + 5 is 10.
• Names of variables should explain what they hold: price, total, count — not x1, x2.`,
          `ცვლადი მნიშვნელობისთვის სახელდებული „ყუთია“:

name = input()          # კითხულობს ტექსტის ერთ სტრიქონს
age = int(input())      # კითხულობს სტრიქონს და მთელ რიცხვად აქცევს
print("გამარჯობა,", name)
print("მომავალ წელს იქნები", age + 1, "წლის")

• input() ყოველთვის ტექსტს (სტრიქონს, str) აბრუნებს. გამოსათვლელად ის უნდა გარდაქმნა: int() — მთელი რიცხვისთვის, float() — ათწილადისთვის.
• "5" + "5" არის "55" (ტექსტები გაერთიანდა), 5 + 5 კი — 10.
• ცვლადის სახელი უნდა აღწერდეს, რას ინახავს: price, total, count — და არა x1, x2.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Decisions and loops", "პირობები და ციკლები"),
        minutes: 12,
        body: l(
          `if / elif / else choose what to do:

score = int(input())
if score >= 91:
    print("excellent")
elif score >= 51:
    print("passed")
else:
    print("try again")

The indented lines (4 spaces) belong to the if. Indentation is part of Python's grammar.

A for loop repeats:

total = 0
for i in range(1, 6):   # i = 1, 2, 3, 4, 5
    total = total + i
print(total)            # 15

range(1, 6) stops before 6. This exact idea solves the lab problem "Sum from 1 to n".`,
          `if / elif / else ირჩევს, რა გაკეთდეს:

score = int(input())
if score >= 91:
    print("ფრიადი")
elif score >= 51:
    print("ჩაბარდა")
else:
    print("სცადე თავიდან")

შეწეული სტრიქონები (4 ჰარი) if-ს ეკუთვნის. Python-ში შეწევა ენის გრამატიკის ნაწილია.

for ციკლი იმეორებს:

total = 0
for i in range(1, 6):   # i = 1, 2, 3, 4, 5
    total = total + i
print(total)            # 15

range(1, 6) 6-მდე ჩერდება და 6-ს არ მოიცავს. სწორედ ეს იდეა ხსნის ლაბორატორიის ამოცანას „ჯამი 1-დან n-მდე“.`,
        ),
      },
      {
        kind: "practice",
        title: l("Code in the lab", "კოდი ლაბორატორიაში"),
        minutes: 12,
        body: l(
          `Open the Programming Laboratory and solve, in order: "Personal greeting", "Even or odd", "Sum from 1 to n". Use the sample tests before you submit, and read the error message carefully when something goes wrong — it usually names the line.`,
          `გახსენი პროგრამირების ლაბორატორია და თანმიმდევრობით ამოხსენი: „პერსონალური მისალმება“, „ლუწი თუ კენტი“, „ჯამი 1-დან n-მდე“. გაგზავნამდე სანიმუშო ტესტები გაუშვი, ხოლო თუ რამე არ გამოვა, შეცდომის შეტყობინება ყურადღებით წაიკითხე — ის ჩვეულებრივ სტრიქონის ნომერს გეუბნება.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 4,
        body: l(
          `• Variables store values; input() gives text — convert with int() or float().
• if / elif / else choose; indentation shows what belongs where.
• for i in range(a, b) repeats with i = a … b − 1.`,
          `• ცვლადები მნიშვნელობებს ინახავს; input() ტექსტს აბრუნებს — გარდაქმენი int()-ით ან float()-ით.
• if / elif / else ირჩევს; შეწევა გვიჩვენებს, რა რას ეკუთვნის.
• for i in range(a, b) იმეორებს i = a … b − 1 მნიშვნელობებისთვის.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Text or number?", "ტექსტი თუ რიცხვი?"),
        prompt: l('What does print("3" + "4") show?', 'რას გამოიტანს print("3" + "4")?'),
        options: ["34", "7", "3 4", l("An error", "შეცდომას")],
        correct: 0,
        hints: [l("The quotes make them strings (text).", "ბრჭყალები მათ სტრიქონებად (ტექსტად) აქცევს."), l("+ joins two strings.", "+ ორ სტრიქონს აერთებს.")],
        explanation: l('"3" + "4" joins two strings into "34". Without quotes, 3 + 4 would be 7.', '"3" + "4" ორ სტრიქონს აერთებს და ვიღებთ "34"-ს. ბრჭყალების გარეშე 3 + 4 იქნებოდა 7.'),
      },
      {
        type: "exercise",
        title: l("Predict the loop", "იწინასწარმეტყველე ციკლი"),
        prompt: l(
          "What number does this program print?\n\ntotal = 0\nfor i in range(1, 5):\n    total = total + i * 2\nprint(total)",
          "რა რიცხვს გამოიტანს ეს პროგრამა?\n\ntotal = 0\nfor i in range(1, 5):\n    total = total + i * 2\nprint(total)",
        ),
        accepted: ["20"],
        hints: [
          l("Which values does i take? range(1, 5) stops before 5.", "რა მნიშვნელობებს იღებს i? range(1, 5) 5-მდე ჩერდება."),
          l("i = 1, 2, 3, 4. Add 2, 4, 6, 8.", "i = 1, 2, 3, 4. შეკრიბე 2, 4, 6, 8."),
        ],
        solution: l("2 + 4 + 6 + 8 = 20", "2 + 4 + 6 + 8 = 20"),
      },
      {
        type: "mc",
        title: l("Find the bug", "იპოვე შეცდომა"),
        prompt: l(
          "This program should print the double of a number, but it prints 55 for input 5:\n\nn = input()\nprint(n + n)\n\nHow do you fix it?",
          "ამ პროგრამამ რიცხვის გაორმაგებული მნიშვნელობა უნდა გამოიტანოს, მაგრამ 5-ის შეყვანისას 55-ს გამოიტანს:\n\nn = input()\nprint(n + n)\n\nროგორ გაასწორებ?",
        ),
        options: ["n = int(input())", "print(n * n)", "print(int(n) + n)", 'print("n + n")'],
        correct: 0,
        explanation: l("input() returns text; int() converts it to a number before adding.", "input() ტექსტს აბრუნებს; int() მას შეკრებამდე რიცხვად გარდაქმნის."),
      },
      {
        type: "exercise",
        title: l("Which branch?", "რომელი განშტოება?"),
        prompt: l(
          "Using the grading program from the lesson, what does it print for score = 51?",
          "გაკვეთილის შეფასების პროგრამის მიხედვით, რას გამოიტანს ის, როცა score = 51?",
        ),
        accepted: { en: ["passed"], ka: ["ჩაბარდა"] },
        hints: [l("Check the conditions from the top: is 51 >= 91? Is 51 >= 51?", "პირობები ზემოდან შეამოწმე: 51 >= 91? 51 >= 51?")],
        solution: l("51 >= 91 is false, 51 >= 51 is true → \"passed\".", "51 >= 91 მცდარია, 51 >= 51 ჭეშმარიტია → „ჩაბარდა“."),
      },
      { type: "discussion", prompt: l("Why does Python make indentation part of the language, while many other languages use { }? What are the advantages for a beginner?", "რატომ აქცევს Python შეწევას ენის ნაწილად, როცა ბევრი სხვა ენა { }-ს იყენებს? რა უპირატესობა აქვს ამას დამწყებისთვის?") },
      { type: "exit", prompt: l("Write a program that reads a number and prints \"even\" or \"odd\".", "დაწერე პროგრამა, რომელიც რიცხვს წაიკითხავს და გამოიტანს „ლუწი“ ან „კენტი“.") },
    ],
    discussion: [
      l("What is the difference between a mistake the computer finds (an error) and a mistake it cannot find (a wrong answer)?", "რა განსხვავებაა შეცდომას, რომელსაც კომპიუტერი პოულობს, და შეცდომას შორის, რომელსაც ვერ პოულობს (არასწორი პასუხი)?"),
      l("How can you test a program to be sure it works?", "როგორ შეამოწმებ პროგრამას, რომ დარწმუნდე, რომ მუშაობს?"),
    ],
    assessment: [
      l("Students solve three Programming Laboratory problems at level 1.", "მოსწავლე პროგრამირების ლაბორატორიის 1-ლი დონის სამ ამოცანას ხსნის."),
      l("Students predict the output of short programs with loops and conditions.", "მოსწავლე წინასწარმეტყველებს ციკლებიანი და პირობებიანი მოკლე პროგრამების შედეგს."),
    ],
    homework: [
      l("Solve \"Multiplication table\" in the Programming Laboratory.", "ამოხსენი პროგრამირების ლაბორატორიის ამოცანა „გამრავლების ტაბულა“."),
      l("Write a program that reads three numbers and prints the largest without using max().", "დაწერე პროგრამა, რომელიც სამ რიცხვს წაიკითხავს და უდიდესს გამოიტანს max()-ის გამოყენების გარეშე."),
    ],
    teacherNotes: l(
      "Python runs in each student's browser in the Programming Laboratory, so no installation is needed. Variable names in English (price, total) are common practice; print texts can be in Georgian. Georgian letters in strings work, but students should type code on an English keyboard layout to avoid invisible character mistakes.",
      "პროგრამირების ლაბორატორიაში Python თითოეული მოსწავლის ბრაუზერში მუშაობს, ამიტომ ინსტალაცია არ სჭირდება. ცვლადების ინგლისური სახელები (price, total) ჩვეული პრაქტიკაა, გამოსატანი ტექსტები კი შეიძლება ქართულად იყოს. სტრიქონებში ქართული ასოები მუშაობს, მაგრამ კოდი ინგლისური კლავიატურის განლაგებით აკრიფეთ, რომ უხილავი სიმბოლოების შეცდომები აიცილოთ.",
    ),
    quiz: {
      title: l("Python basics — check yourself", "Python-ის საფუძვლები — შეამოწმე თავი"),
      questions: [
        {
          type: "mc",
          prompt: l("Which line reads a whole number from the user?", "რომელი სტრიქონი კითხულობს მომხმარებლისგან მთელ რიცხვს?"),
          options: ["n = int(input())", "n = input(int)", "int n = input()", "n = print(input())"],
          correct: 0,
        },
        { type: "num", prompt: l("How many times does the body of for i in range(3, 8): run?", "რამდენჯერ შესრულდება for i in range(3, 8): ციკლის ტანი?"), answer: 5, explanation: l("i = 3, 4, 5, 6, 7", "i = 3, 4, 5, 6, 7") },
        { type: "tf", prompt: l("In Python, indentation changes the meaning of a program.", "Python-ში შეწევა პროგრამის აზრს ცვლის."), answer: true },
        { type: "num", prompt: l("What is printed? x = 7\nif x % 2 == 0:\n    print(0)\nelse:\n    print(1)", "რა გამოვა? x = 7\nif x % 2 == 0:\n    print(0)\nelse:\n    print(1)"), answer: 1 },
      ],
    },
  },
  {
    group: "cpp-basics",
    subject: "computer_science",
    grade: 9,
    durationMin: 45,
    difficulty: "standard",
    match: /c\+\+|cpp|iostream|cout|cin|compil|კომპილ/i,
    title: l("C++ Basics: From Python to C++", "C++-ის საფუძვლები: Python-იდან C++-მდე"),
    topic: l("C++ basics", "C++-ის საფუძვლები"),
    objective: l(
      "Students read and write simple C++ programs with input, output, typed variables, conditions and loops, and explain what compiling means.",
      "მოსწავლეები კითხულობენ და წერენ მარტივ C++ პროგრამებს შემავალი და გამოსავალი მონაცემებით, ტიპიზებული ცვლადებით, პირობებითა და ციკლებით, და ხსნიან, რას ნიშნავს კომპილაცია.",
    ),
    objectives: [
      l("Describe the structure of a C++ program and the role of the compiler.", "აღწეროს C++ პროგრამის სტრუქტურა და კომპილატორის როლი."),
      l("Use int, long long, double and string with cin and cout.", "გამოიყენოს int, long long, double და string cin-თან და cout-თან ერთად."),
      l("Translate simple Python loops and conditions into C++.", "მარტივი Python ციკლები და პირობები C++-ზე გადათარგმნოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Why learn C++?", "რატომ ვისწავლოთ C++?"),
        minutes: 5,
        body: l(
          `C++ is used where speed matters: games, operating systems, robotics — and in most programming olympiads, including school olympiads in Georgia. It asks you to be more precise than Python: every variable has a declared type, and the program is compiled (translated to machine code) before it runs.`,
          `C++ იქ გამოიყენება, სადაც სიჩქარე მნიშვნელოვანია: თამაშებში, ოპერაციულ სისტემებში, რობოტიკაში — და პროგრამირების ოლიმპიადების უმეტესობაში, მათ შორის საქართველოს სასკოლო ოლიმპიადებზე. ის Python-ზე მეტ სიზუსტეს მოითხოვს: ყოველ ცვლადს გამოცხადებული ტიპი აქვს, პროგრამა კი გაშვებამდე კომპილირდება (მანქანურ კოდზე ითარგმნება).`,
        ),
      },
      {
        kind: "explanation",
        title: l("The shape of a C++ program", "C++ პროგრამის აგებულება"),
        minutes: 12,
        body: l(
          `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;            // read two whole numbers
    cout << a + b << endl;    // print their sum
    return 0;
}

• #include <iostream> gives access to cin (input) and cout (output).
• Every program starts in main().
• Each statement ends with a semicolon ;
• { } group statements instead of indentation (indent anyway, for readers).
• Types: int (whole numbers up to about 2 billion), long long (much larger whole numbers), double (decimals), string (text, needs #include <string>).`,
          `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;            // ვკითხულობთ ორ მთელ რიცხვს
    cout << a + b << endl;    // გამოგვაქვს მათი ჯამი
    return 0;
}

• #include <iostream> გვაძლევს cin-ს (შეყვანა) და cout-ს (გამოტანა).
• ყოველი პროგრამა main()-ში იწყება.
• ყოველი ბრძანება წერტილ-მძიმით ; მთავრდება.
• ბრძანებებს შეწევის ნაცვლად { } აჯგუფებს (შეწევა მაინც გამოიყენე — მკითხველისთვის).
• ტიპები: int (მთელი რიცხვები დაახლოებით 2 მილიარდამდე), long long (გაცილებით დიდი მთელი რიცხვები), double (ათწილადები), string (ტექსტი, სჭირდება #include <string>).`,
        ),
      },
      {
        kind: "example",
        title: l("Python and C++ side by side", "Python და C++ გვერდიგვერდ"),
        minutes: 12,
        body: l(
          `Sum from 1 to n.

Python:
n = int(input())
total = 0
for i in range(1, n + 1):
    total += i
print(total)

C++:
long long n, total = 0;
cin >> n;
for (long long i = 1; i <= n; i++) {
    total += i;
}
cout << total << endl;

Note long long: for n = 100000 the sum is 5 000 050 000, which does not fit in an int. Choosing the type is part of solving the problem.`,
          `ჯამი 1-დან n-მდე.

Python:
n = int(input())
total = 0
for i in range(1, n + 1):
    total += i
print(total)

C++:
long long n, total = 0;
cin >> n;
for (long long i = 1; i <= n; i++) {
    total += i;
}
cout << total << endl;

შენიშნე long long: n = 100000-ისთვის ჯამი 5 000 050 000-ია, რაც int-ში ვერ ეტევა. ტიპის შერჩევა ამოცანის ამოხსნის ნაწილია.`,
        ),
      },
      {
        kind: "practice",
        title: l("C++ in the lab", "C++ ლაბორატორიაში"),
        minutes: 11,
        body: l(
          `In the Programming Laboratory switch the language to C++. If your school has a checking server, your code is compiled and tested there; otherwise compile on your computer (for example with g++ or an online compiler your teacher recommends) and paste the outputs of the tests — the result is marked as self-checked.

Start with "Area and perimeter", then try "Edge case: overflow".`,
          `პროგრამირების ლაბორატორიაში ენა C++-ზე გადართე. თუ სკოლას შემოწმების სერვერი აქვს, შენი კოდი იქ დაკომპილირდება და შემოწმდება; სხვა შემთხვევაში დააკომპილირე შენს კომპიუტერზე (მაგ. g++-ით ან მასწავლებლის მიერ რეკომენდებული ონლაინ კომპილატორით) და ჩასვი ტესტების შედეგები — პასუხი მოინიშნება, როგორც თვითშემოწმებული.

დაიწყე ამოცანით „ფართობი და პერიმეტრი“, შემდეგ სცადე „ზღვრული შემთხვევა: გადავსება“.`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `• C++ is compiled; errors in syntax stop the program before it runs.
• main(), semicolons, { } and declared types.
• cin >> reads, cout << prints.
• Choose long long when numbers can exceed about 2 × 10⁹.`,
          `• C++ კომპილირებადი ენაა; სინტაქსური შეცდომა პროგრამას გაშვებამდე აჩერებს.
• main(), წერტილ-მძიმეები, { } და გამოცხადებული ტიპები.
• cin >> კითხულობს, cout << გამოაქვს.
• აირჩიე long long, თუ რიცხვები შეიძლება დაახლოებით 2 × 10⁹-ს აღემატებოდეს.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Find the error", "იპოვე შეცდომა"),
        prompt: l("The compiler reports an error at the line  int x = 5  — what is missing?", "კომპილატორი შეცდომას აჩვენებს სტრიქონზე  int x = 5  — რა აკლია?"),
        options: [l("A semicolon ;", "წერტილ-მძიმე ;"), l("Brackets ( )", "ფრჩხილები ( )"), l("The word var", "სიტყვა var"), l("Quotes around 5", "ბრჭყალები 5-ის გარშემო")],
        correct: 0,
      },
      {
        type: "mc",
        title: l("Choose the type", "აირჩიე ტიპი"),
        prompt: l("Which type should store the number 3 000 000 000?", "რომელი ტიპი უნდა გამოვიყენოთ რიცხვისთვის 3 000 000 000?"),
        options: ["long long", "int", "string", "bool"],
        correct: 0,
        hints: [l("int holds whole numbers up to about 2 147 483 647.", "int ინახავს მთელ რიცხვებს დაახლოებით 2 147 483 647-მდე.")],
      },
      {
        type: "exercise",
        title: l("Trace the loop", "მიჰყევი ციკლს"),
        prompt: l("What is printed?\n\nint s = 0;\nfor (int i = 2; i <= 10; i += 2) s += i;\ncout << s;", "რა გამოვა?\n\nint s = 0;\nfor (int i = 2; i <= 10; i += 2) s += i;\ncout << s;"),
        accepted: ["30"],
        hints: [l("i takes the values 2, 4, 6, 8, 10.", "i იღებს მნიშვნელობებს 2, 4, 6, 8, 10.")],
        solution: l("2 + 4 + 6 + 8 + 10 = 30", "2 + 4 + 6 + 8 + 10 = 30"),
      },
      {
        type: "exercise",
        title: l("Integer division", "მთელი გაყოფა"),
        prompt: l("In C++, int a = 7, b = 2; what does cout << a / b; print?", "C++-ში int a = 7, b = 2; რას გამოიტანს cout << a / b;?"),
        accepted: ["3"],
        hints: [l("Dividing two ints drops the fractional part.", "ორი int-ის გაყოფისას წილადი ნაწილი იკარგება.")],
        solution: l("7 / 2 = 3 in integer division (the remainder 1 is dropped; 7 % 2 gives it).", "მთელი გაყოფისას 7 / 2 = 3 (ნაშთი 1 იკარგება; მას 7 % 2 იძლევა)."),
      },
      { type: "discussion", prompt: l("Python found your mistakes while running; C++ finds many before running. Which do you prefer, and why?", "Python შეცდომებს გაშვებისას პოულობს, C++ კი ბევრს — გაშვებამდე. რომელი მოგწონს და რატომ?") },
      { type: "exit", prompt: l("Write a C++ program that reads two numbers and prints the larger one.", "დაწერე C++ პროგრამა, რომელიც ორ რიცხვს წაიკითხავს და უდიდესს გამოიტანს.") },
    ],
    discussion: [
      l("Why do olympiad problems state the limits (constraints) of the input?", "რატომ უთითებენ ოლიმპიადის ამოცანებში შემავალი მონაცემების შეზღუდვებს?"),
      l("What could go wrong in real software if a number overflows?", "რა შეიძლება მოხდეს რეალურ პროგრამაში, თუ რიცხვი გადაივსება?"),
    ],
    assessment: [
      l("Students write a compiling C++ program with input and output.", "მოსწავლე წერს C++ პროგრამას შეყვანა-გამოტანით, რომელიც უშეცდომოდ კომპილირდება."),
      l("Students justify the choice of int or long long.", "მოსწავლე ასაბუთებს int-ის ან long long-ის არჩევანს."),
    ],
    homework: [l("Rewrite your Python solution to \"Even or odd\" in C++ and test it with 0, 7 and −4.", "გადაწერე შენი Python ამოხსნა ამოცანისთვის „ლუწი თუ კენტი“ C++-ზე და შეამოწმე 0-ით, 7-ით და −4-ით.")],
    teacherNotes: l(
      "The Future Classroom server never runs student code. For automatic C++ checking the school can run its own Judge0 sandbox; without it, the self-check mode is honest about being self-reported. Point students to the Competitive Programmer's Handbook in the School Library for further study.",
      "მომავლის საკლასო ოთახის სერვერი მოსწავლეების კოდს არასოდეს უშვებს. C++-ის ავტომატური შემოწმებისთვის სკოლას შეუძლია საკუთარი Judge0 იზოლირებული გარემოს გაშვება; მის გარეშე თვითშემოწმების რეჟიმი პირდაპირ აღნიშნავს, რომ შედეგი მოსწავლის მიერაა მოწოდებული. შემდგომი სწავლისთვის მიუთითეთ სასკოლო ბიბლიოთეკაში არსებული Competitive Programmer's Handbook.",
    ),
    quiz: {
      title: l("C++ basics — check yourself", "C++-ის საფუძვლები — შეამოწმე თავი"),
      questions: [
        { type: "tf", prompt: l("C++ programs are compiled before they run.", "C++ პროგრამები გაშვებამდე კომპილირდება."), answer: true },
        { type: "num", prompt: l("What does cout << 17 % 5; print?", "რას გამოიტანს cout << 17 % 5;?"), answer: 2 },
        {
          type: "mc",
          prompt: l("Which reads a number into x?", "რომელი კითხულობს რიცხვს x-ში?"),
          options: ["cin >> x;", "cout << x;", "x = input();", "read(x)"],
          correct: 0,
        },
        { type: "num", prompt: l("How many times does for (int i = 0; i < 4; i++) run?", "რამდენჯერ შესრულდება for (int i = 0; i < 4; i++)?"), answer: 4 },
      ],
    },
  },
  {
    group: "computational-thinking",
    subject: "computer_science",
    grade: 6,
    durationMin: 40,
    difficulty: "foundation",
    match: /computational thinking|decomposition|abstraction|pattern|გამოთვლითი აზროვნებ|დეკომპოზიცი|აბსტრაქცი/i,
    title: l("Computational Thinking", "გამოთვლითი აზროვნება"),
    topic: l("Computational thinking", "გამოთვლითი აზროვნება"),
    objective: l(
      "Students use decomposition, pattern recognition, abstraction and algorithms to plan a solution before writing any code.",
      "მოსწავლეები იყენებენ დეკომპოზიციას, კანონზომიერებების ამოცნობას, აბსტრაქციასა და ალგორითმებს, რომ ამოხსნა კოდის დაწერამდე დაგეგმონ.",
    ),
    objectives: [
      l("Name and explain the four parts of computational thinking.", "დაასახელოს და ახსნას გამოთვლითი აზროვნების ოთხი კომპონენტი."),
      l("Break an everyday problem into smaller steps and write an algorithm.", "ყოველდღიური ამოცანა მცირე ნაბიჯებად დაშალოს და ალგორითმი დაწეროს."),
      l("Program a robot on a grid with a short, exact sequence of commands.", "ბადეზე მოძრავი რობოტი მოკლე, ზუსტი ბრძანებების თანმიმდევრობით დააპროგრამოს."),
    ],
    sections: [
      {
        kind: "introduction",
        title: l("Thinking like a computer scientist", "იფიქრე, როგორც კომპიუტერულმა მეცნიერმა"),
        minutes: 5,
        body: l(
          `Computational thinking is not "thinking like a computer". It is a way people plan solutions so clearly that a computer — or another person — could follow them. You already use it when you plan a trip or organise a school event.`,
          `გამოთვლითი აზროვნება „კომპიუტერივით ფიქრი“ არ არის. ეს ამოხსნის ისეთი მკაფიო დაგეგმვის გზაა, რომ კომპიუტერმა — ან სხვა ადამიანმა — შეძლოს მისი შესრულება. მას უკვე იყენებ, როცა მოგზაურობას გეგმავ ან სასკოლო ღონისძიებას აწყობ.`,
        ),
      },
      {
        kind: "explanation",
        title: l("Four tools", "ოთხი ინსტრუმენტი"),
        minutes: 12,
        body: l(
          `1. Decomposition — break a big problem into smaller parts. "Organise a class trip" → choose a place, count students, book a bus, collect money, plan the day.
2. Pattern recognition — notice what repeats. Collecting money from every student is the same step repeated → a loop.
3. Abstraction — keep what matters, ignore details. For the bus, the number of seats matters; its colour does not.
4. Algorithm — write the exact steps in order, so anyone could follow them and get the same result.`,
          `1. დეკომპოზიცია — დიდი ამოცანის მცირე ნაწილებად დაშლა. „კლასის ექსკურსიის ორგანიზება“ → ადგილის შერჩევა, მოსწავლეების დათვლა, ავტობუსის დაჯავშნა, თანხის შეგროვება, დღის დაგეგმვა.
2. კანონზომიერების ამოცნობა — იმის შემჩნევა, რა მეორდება. ყველა მოსწავლისგან თანხის შეგროვება ერთი და იმავე ნაბიჯის გამეორებაა → ციკლი.
3. აბსტრაქცია — მნიშვნელოვანის დატოვება და დეტალების უგულებელყოფა. ავტობუსისთვის მნიშვნელოვანია ადგილების რაოდენობა, ფერი — არა.
4. ალგორითმი — ზუსტი ნაბიჯების თანმიმდევრობით ჩაწერა, რომ ნებისმიერმა შეძლოს მათი შესრულება და ერთი და იგივე შედეგის მიღება.`,
        ),
      },
      {
        kind: "example",
        title: l("Precise instructions", "ზუსტი ინსტრუქციები"),
        minutes: 8,
        body: l(
          `"Make a sandwich" seems clear to a person, but a robot needs: take two slices of bread; open the jar; spread butter on one side of slice 1 with the knife; put slice 2 on top with the plain side up.

Every missing detail becomes a bug. Programmers write algorithms at the right level of detail for whoever — or whatever — will follow them.`,
          `„გააკეთე სენდვიჩი“ ადამიანისთვის ნათელია, რობოტს კი სჭირდება: აიღე პურის ორი ნაჭერი; გახსენი ქილა; დანით პირველი ნაჭრის ერთ მხარეს კარაქი წაუსვი; მეორე ნაჭერი ზემოდან დადე, უკარაქო მხარით ზემოთ.

ყოველი გამოტოვებული დეტალი შეცდომად (bug) იქცევა. პროგრამისტები ალგორითმს იმ დონის დეტალურობით წერენ, რაც მის შემსრულებელს — ადამიანს თუ მანქანას — სჭირდება.`,
        ),
      },
      {
        kind: "practice",
        title: l("Program the grid robot", "დააპროგრამე ბადის რობოტი"),
        minutes: 10,
        body: l(
          `Open the STEM Laboratory simulation "Program a robot on a grid". Plan the route on paper first (decomposition), look for repeated moves (patterns), then enter the shortest program you can find. Compare programs with a partner: are both correct? Which is shorter?`,
          `გახსენი STEM ლაბორატორიის სიმულაცია „დააპროგრამე რობოტი ბადეზე“. ჯერ მარშრუტი ქაღალდზე დაგეგმე (დეკომპოზიცია), მოძებნე განმეორებადი სვლები (კანონზომიერებები) და შემდეგ შეიყვანე ყველაზე მოკლე პროგრამა, რომელსაც იპოვი. შეადარე პროგრამები მეწყვილეს: ორივე სწორია? რომელია უფრო მოკლე?`,
        ),
      },
      {
        kind: "summary",
        title: l("Summary", "შეჯამება"),
        minutes: 5,
        body: l(
          `Decompose → find patterns → abstract → write the algorithm. Test it — and fix it when it does not do what you expected.`,
          `დაშალე → იპოვე კანონზომიერებები → გააკეთე აბსტრაქცია → დაწერე ალგორითმი. შეამოწმე — და გაასწორე, თუ მოსალოდნელს არ აკეთებს.`,
        ),
      },
    ],
    activities: [
      {
        type: "mc",
        title: l("Which tool?", "რომელი ინსტრუმენტი?"),
        prompt: l("A school map for new students shows classrooms and stairs but not the colour of the walls. Which part of computational thinking is this?", "ახალი მოსწავლეებისთვის სკოლის რუკაზე საკლასო ოთახები და კიბეებია, კედლების ფერი კი — არა. გამოთვლითი აზროვნების რომელი კომპონენტია ეს?"),
        options: [l("Abstraction", "აბსტრაქცია"), l("Decomposition", "დეკომპოზიცია"), l("Pattern recognition", "კანონზომიერების ამოცნობა"), l("Debugging", "შეცდომების გასწორება")],
        correct: 0,
        explanation: l("Leaving out details that do not matter for the purpose is abstraction.", "მიზნისთვის უმნიშვნელო დეტალების გამოტოვება აბსტრაქციაა."),
      },
      {
        type: "exercise",
        title: l("Spot the pattern", "იპოვე კანონზომიერება"),
        prompt: l("A robot program is: forward, forward, right, forward, forward, right, forward, forward, right, forward, forward, right. How many times is the group \"forward, forward, right\" repeated?", "რობოტის პროგრამაა: წინ, წინ, მარჯვნივ, წინ, წინ, მარჯვნივ, წინ, წინ, მარჯვნივ, წინ, წინ, მარჯვნივ. რამდენჯერ მეორდება ჯგუფი „წინ, წინ, მარჯვნივ“?"),
        accepted: ["4"],
        hints: [l("Count the \"right\" commands.", "დაითვალე ბრძანებები „მარჯვნივ“.")],
        solution: l("4 times — the robot drives around a square. A loop could write it as \"repeat 4: forward, forward, right\".", "4-ჯერ — რობოტი კვადრატს შემოუვლის. ციკლით ასე ჩაიწერება: „გაიმეორე 4-ჯერ: წინ, წინ, მარჯვნივ“."),
      },
      {
        type: "discussion",
        prompt: l("Decompose \"prepare for a test next week\" into at least five smaller tasks. Which ones repeat?", "დაშალე „მოემზადე მომავალი კვირის საკონტროლოსთვის“ სულ მცირე ხუთ პატარა ამოცანად. რომელი მეორდება?"),
      },
      { type: "exit", prompt: l("Write an algorithm (numbered steps) for crossing a road safely at a pedestrian crossing.", "დაწერე ალგორითმი (დანომრილი ნაბიჯები) ფეხით მოსიარულეთა გადასასვლელზე ქუჩის უსაფრთხოდ გადასვლისთვის.") },
    ],
    discussion: [
      l("Where do people use algorithms without computers?", "სად იყენებენ ადამიანები ალგორითმებს კომპიუტერის გარეშე?"),
      l("Can an algorithm be correct but still bad? Give an example.", "შეიძლება ალგორითმი სწორი, მაგრამ მაინც ცუდი იყოს? მოიყვანე მაგალითი."),
    ],
    assessment: [
      l("Students decompose a task and identify a repeated pattern.", "მოსწავლე ამოცანას შლის და განმეორებად კანონზომიერებას პოულობს."),
      l("Students complete the grid-robot challenge.", "მოსწავლე ბადის რობოტის გამოწვევას ასრულებს."),
    ],
    homework: [l("Write step-by-step instructions for a daily task. Ask someone at home to follow them exactly. Where did they get stuck?", "დაწერე ნაბიჯ-ნაბიჯ ინსტრუქცია ყოველდღიური საქმისთვის. სთხოვე ოჯახის წევრს, ზუსტად შეასრულოს. სად გაიჭედა?")],
    teacherNotes: l(
      "The sandwich activity works best as a live demonstration where the teacher follows students' written instructions literally. The grid robot runs on the touchscreen for a whole-class version.",
      "სენდვიჩის აქტივობა საუკეთესოდ ცოცხალ დემონსტრაციად მუშაობს: მასწავლებელი მოსწავლეების დაწერილ ინსტრუქციებს სიტყვასიტყვით ასრულებს. ბადის რობოტი სენსორულ ეკრანზეც მუშაობს — მთელი კლასისთვის.",
    ),
    quiz: {
      title: l("Computational thinking — check yourself", "გამოთვლითი აზროვნება — შეამოწმე თავი"),
      questions: [
        {
          type: "mc",
          prompt: l("Breaking a big problem into smaller parts is called…", "დიდი ამოცანის პატარა ნაწილებად დაშლას ჰქვია…"),
          options: [l("decomposition", "დეკომპოზიცია"), l("abstraction", "აბსტრაქცია"), l("compilation", "კომპილაცია"), l("encryption", "დაშიფვრა")],
          correct: 0,
        },
        { type: "tf", prompt: l("An algorithm must give the same result every time it is followed with the same input.", "ალგორითმმა ერთი და იგივე შემავალი მონაცემებით ყოველ ჯერზე ერთი და იგივე შედეგი უნდა მოგვცეს."), answer: true },
        {
          type: "mc",
          prompt: l("A repeated group of steps in an algorithm is best written as…", "ალგორითმში განმეორებადი ნაბიჯების ჯგუფი საუკეთესოდ ჩაიწერება, როგორც…"),
          options: [l("a loop", "ციკლი"), l("a comment", "კომენტარი"), l("a variable", "ცვლადი"), l("an error", "შეცდომა")],
          correct: 0,
        },
      ],
    },
  },
];
