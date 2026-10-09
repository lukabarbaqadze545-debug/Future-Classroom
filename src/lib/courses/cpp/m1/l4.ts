import { code, exercise, h, lesson, p, predict, quiz, remember, table, tip, ul, warn } from "../../author";

export const l4 = lesson({
  id: "cpp-1-4",
  title: "ცვლადები და ტიპები",
  tagline: "როგორ დავიმახსოვროთ მნიშვნელობა სახელით და რა სახის მონაცემები არსებობს.",
  en: { title: "Variables and types", tagline: "How to remember a value under a name, and what kinds of data there are." },
  minutes: 35,
  goals: ["შექმნი ცვლადს და მიანიჭებ მას მნიშვნელობას", "აირჩევ სწორ ტიპს: `int`, `double`, `char`, `bool`, `string`", "სწორად დაარქმევ ცვლადებს სახელს და გამოიყენებ `const`-ს"],
  blocks: [
    p("პროგრამას ხშირად სჭირდება მნიშვნელობის დამახსოვრება: მოთამაშის ქულა, ფასი, სახელი. ამისთვის არსებობს **ცვლადი**. ცვლადი არის მეხსიერებაში მდებარე **სახელდებული ყუთი**, რომელშიც ერთი მნიშვნელობა ინახება. მნიშვნელობა შეიძლება შეიცვალოს, ამიტომ ეძახიან „ცვლადს“."),
    h("ცვლადის გამოცხადება"),
    p("ცვლადის შექმნისას უნდა ვთქვათ **ტიპი** (რა სახის მნიშვნელობა ეტევა ყუთში) და **სახელი**. ტიპი კომპიუტერს ეუბნება, რამდენი მეხსიერება გამოყოს და როგორ გაიგოს ის ბიტები, რომლებსაც ინახავს."),
    code(
      "declare",
      `
      #include <iostream>
      using namespace std;

      int main() {
          int age = 15;
          double height = 1.65;
          char grade = 'A';
          bool happy = true;
          cout << age << endl;
          cout << height << endl;
          cout << grade << endl;
          cout << happy << endl;
          return 0;
      }
      `,
      { out: "15\n1.65\nA\n1\n" },
    ),
    p("ყურადღება მიაქციე ბოლო ხაზს: `true` იბეჭდება როგორც `1`, ხოლო `false` როგორც `0`."),
    table(
      ["ტიპი", "რას ინახავს", "მაგალითი"],
      [
        ["`int`", "მთელი რიცხვი (დაახლოებით ±2 მილიარდამდე)", "`int n = -7;`"],
        ["`double`", "რიცხვი წილადი ნაწილით (ათწილადი)", "`double x = 3.14;`"],
        ["`char`", "ერთი სიმბოლო, ერთმაგ ბრჭყალებში", "`char c = 'k';`"],
        ["`bool`", "ჭეშმარიტი ან მცდარი", "`bool ok = false;`"],
        ["`string`", "ტექსტი, ორმაგ ბრჭყალებში (საჭიროა `#include <string>`)", "`string name = \"Nika\";`"],
      ],
    ),
    warn("ათწილადში წერტილი კოდში **წერტილია** (`1.65`), და არა მძიმე, თუნდაც ქართულად მძიმეს ვწერდეთ. ასევე `'A'` (ერთმაგი ბრჭყალები) არის ერთი სიმბოლო, `\"A\"` კი ტექსტია, რომელიც ერთი სიმბოლოსგან შედგება."),
    h("მნიშვნელობის ცვლილება და კოპირება"),
    p("ცვლადს ახალი მნიშვნელობა ენიჭება ნიშნით `=`. ეს **არ არის ტოლობა** მათემატიკის გაგებით. ეს ბრძანებაა: „გამოთვალე მარჯვენა მხარე და ჩადე მარცხენა ცვლადში“."),
    code(
      "assign",
      `
      #include <iostream>
      using namespace std;

      int main() {
          int a = 5;
          int b = a;    // b-ში a-ს ახლანდელი მნიშვნელობის ასლი ჩავარდა
          a = 10;       // a შეიცვალა, b კი არა
          cout << a << " " << b << endl;

          int x = 3;
          x = x + 2;    // მარჯვენა მხარე: 3 + 2 = 5; ახლა x == 5
          x = x * x;    // 5 * 5 = 25
          cout << x << endl;
          return 0;
      }
      `,
      { out: "10 5\n25\n" },
    ),
    predict(
      "p1",
      `
      #include <iostream>
      using namespace std;

      int main() {
          int a = 4;
          int b = 7;
          a = b;
          b = a + 1;
          cout << a << " " << b << endl;
          return 0;
      }
      `,
      { ask: "რას დაბეჭდავს პროგრამა?", why: "`a = b` აჭერს `a`-ში 7-ს. შემდეგ `b = a + 1` ანიჭებს `b`-ს `7 + 1 = 8`. ამიტომ იბეჭდება `7 8`." },
    ),
    h("ორი ცვლადის გაცვლა"),
    p("კლასიკური ამოცანა: ორი ცვლადის მნიშვნელობა გავცვალოთ. ორ მოქმედებაში ვერ გავაკეთებთ: თუ `a = b` დავწერთ, `a`-ს ძველი მნიშვნელობა დაიკარგება. ამიტომ გვჭირდება **დამხმარე ცვლადი**:"),
    code(
      "swap",
      `
      #include <iostream>
      using namespace std;

      int main() {
          int a = 1, b = 2;
          int temp = a;   // a-ს ძველი მნიშვნელობა გადავარჩინეთ
          a = b;
          b = temp;
          cout << a << " " << b << endl;
          return 0;
      }
      `,
      { out: "2 1\n" },
    ),
    h("სახელის დარქმევა"),
    ul(
      "სახელი შეიძლება შეიცავდეს ლათინურ ასოებს, ციფრებს და ქვედატირეს `_`. ციფრით **არ იწყება**.",
      "დიდი და პატარა ასოები განსხვავდება: `score` და `Score` ორი სხვადასხვა ცვლადია.",
      "ენის საკვანძო სიტყვები (`int`, `return`, `if`...) სახელად არ გამოდგება.",
      "ცვლადს მნიშვნელობის შესაბამისი სახელი დაარქვი: `price` სჯობს `p`-ს, `studentCount` ან `student_count` სჯობს `x1`-ს. პროგრამა უფრო ადვილად იკითხება.",
    ),
    h("მუდმივები"),
    p("ზოგი მნიშვნელობა არასოდეს უნდა შეიცვალოს, მაგალითად π. ასეთს `const` ეწერება. თუ შემდეგ შეეცდები შეცვლას, კომპილატორი შეგაჩერებს."),
    code(
      "const",
      `
      #include <iostream>
      using namespace std;

      int main() {
          const double PI = 3.14;
          int r = 10;
          cout << PI * r * r << endl;
          return 0;
      }
      `,
      { out: "314\n" },
    ),
    code(
      "const-error",
      `
      #include <iostream>
      using namespace std;

      int main() {
          const int days = 7;
          days = 8;
          cout << days << endl;
          return 0;
      }
      `,
      { error: "assign-const", caption: "const ცვლადის შეცვლა აკრძალულია" },
    ),
    h("მნიშვნელობის გარეშე დარჩენილი ცვლადი"),
    p("თუ ცვლადს გამოაცხადებ, მაგრამ არაფერს ჩაუწერ, მასში **შემთხვევითი ნარჩენია**. ჩვეულებრივ კომპიუტერზე პროგრამა ამ ნარჩენს დაბეჭდავს და ნახავ უცნაურ რიცხვს. ეს ხშირი, ძნელად მოსაძებნი შეცდომაა. ამიტომ ამ საიტის გამშვები გაგაჩერებს და გეტყვის, რომ ცვლადს მნიშვნელობა არ მიგიციათ. **ყოველთვის დაწერე საწყისი მნიშვნელობა**: `int count = 0;`."),
    code(
      "uninit",
      `
      #include <iostream>
      using namespace std;

      int main() {
          int total;
          cout << total << endl;
          return 0;
      }
      `,
      { error: "uninitialized", caption: "ცვლადს მნიშვნელობა არ მიუციათ" },
    ),
    tip("`int a = 1, b = 2;` ერთ ხაზზე ორ ცვლადს აცხადებს. ეს კარგია, როცა ცვლადები ერთმანეთს ჰგავს. მაგრამ ერთ ხაზზე ბევრის დაწერა კოდს აძნელებს."),
    quiz("q1", "რომელი სახელი **არ გამოდგება** ცვლადისთვის?", ["`score2`", "`my_age`", "`2nd`", "`Total`"], 2, "სახელი ციფრით ვერ დაიწყება. `2nd` არასწორია, `score2` კი სწორია, რადგან ციფრი ბოლოშია."),
    quiz("q2", "რომელი ტიპი გამოდგება ფასისთვის `2.50`?", ["`int`", "`double`", "`char`", "`bool`"], 1, "`2.50` წილადი ნაწილის მქონე რიცხვია, ამიტომ `double` უნდა იყოს. `int`-ში წილადი ნაწილი დაიკარგებოდა."),
    quiz("q3", "რა მნიშვნელობა ექნება `b`-ს? `int a = 3; int b = a; a = 8;`", ["3", "8", "11", "ცარიელი"], 0, "`int b = a;` ინახავს `a`-ს **იმ მომენტის** მნიშვნელობის ასლს: 3-ს. `a`-ს მოგვიანებით შეცვლა `b`-ს აღარ ეხება."),
    remember("ცვლადი = ტიპი + სახელი + მნიშვნელობა. `=` ნიშნავს „ჩადე“. ყოველთვის მიეცი ცვლადს საწყისი მნიშვნელობა. მუდმივას `const` ეწერება."),
  ],
  exercises: [
    exercise({
      id: "cpp-1-4-a",
      title: "ბარათი",
      statement: "გამოაცხადე ცვლადები: სახელი `name` (`string`) მნიშვნელობით `Nika`, ასაკი `age` (`int`) მნიშვნელობით `15` და სიმაღლე `height` (`double`) მნიშვნელობით `1.65`. დაბეჭდე სამი ხაზი:\n\n```\nName: Nika\nAge: 15\nHeight: 1.65\n```",
      output: "სამი ხაზი, ზუსტად ისე, როგორც ზემოთაა.",
      solution: `
        #include <iostream>
        #include <string>
        using namespace std;
        int main() {
            string name = "Nika";
            int age = 15;
            double height = 1.65;
            cout << "Name: " << name << endl;
            cout << "Age: " << age << endl;
            cout << "Height: " << height << endl;
            return 0;
        }
      `,
      tests: [""],
      hints: ["ჯერ სამი ცვლადი გამოაცხადე, მერე დაბეჭდე.", "ტექსტი და ცვლადი ერთ `cout`-ში შეგიძლია: `cout << \"Age: \" << age << endl;`", "ტიპები: `string name = \"Nika\";`, `int age = 15;`, `double height = 1.65;`. `string`-ისთვის დაამატე `#include <string>`."],
      wrong: [{ code: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string name = "Nika";\n    int age = 15;\n    int height = 1.65;\n    cout << "Name: " << name << endl;\n    cout << "Age: " << age << endl;\n    cout << "Height: " << height << endl;\n}\n`, why: "int ათწილადისთვის" }],
    }),
    exercise({
      id: "cpp-1-4-b",
      kind: "complete",
      title: "გაცვალე",
      statement: "ცვლადებში `a` და `b` მნიშვნელობებია 7 და 12. გაცვალე ისინი ისე, რომ პროგრამამ დაბეჭდოს `12 7`. გამოიყენე დამხმარე ცვლადი.",
      output: "ერთი ხაზი: `12 7`",
      starter: `
        #include <iostream>
        using namespace std;

        int main() {
            int a = 7;
            int b = 12;

            // აქ გაცვალე a და b

            cout << a << " " << b << endl;
            return 0;
        }
      `,
      solution: `
        #include <iostream>
        using namespace std;

        int main() {
            int a = 7;
            int b = 12;
            int temp = a;
            a = b;
            b = temp;
            cout << a << " " << b << endl;
            return 0;
        }
      `,
      tests: [""],
      hints: ["თუ პირდაპირ `a = b` დაწერე, `a`-ს ძველი მნიშვნელობა დაიკარგება.", "ჯერ `a`-ს მნიშვნელობა სხვა ცვლადში შეინახე.", "`int temp = a; a = b; b = temp;`"],
    }),
    exercise({
      id: "cpp-1-4-c",
      kind: "fix",
      title: "ფასი დაიკარგა",
      statement: "პროგრამას უნდა დაებეჭდა `Price: 2.5`, მაგრამ ის ბეჭდავს `Price: 2`. რატომ? გაასწორე.",
      output: "ერთი ხაზი: `Price: 2.5`",
      starter: `
        #include <iostream>
        using namespace std;

        int main() {
            int price = 2.5;
            cout << "Price: " << price << endl;
            return 0;
        }
      `,
      solution: `
        #include <iostream>
        using namespace std;

        int main() {
            double price = 2.5;
            cout << "Price: " << price << endl;
            return 0;
        }
      `,
      tests: [""],
      hints: ["რა ტიპი აქვს `price`-ს? რა ტიპის რიცხვია `2.5`?", "`int` მხოლოდ მთელ რიცხვს ინახავს და წილადი ნაწილი ეკარგება.", "შეცვალე `int` `double`-ით."],
    }),
    exercise({
      id: "cpp-1-4-d",
      title: "წრის ფართობი",
      statement: "გამოაცხადე მუდმივა `PI` მნიშვნელობით `3.14` და ცვლადი `r` მნიშვნელობით `10`. დაბეჭდე წრის ფართობი ფორმულით `PI * r * r` ფორმატით:\n\n```\nArea: 314\n```",
      output: "ერთი ხაზი: `Area: 314`",
      solution: `
        #include <iostream>
        using namespace std;
        int main() {
            const double PI = 3.14;
            int r = 10;
            cout << "Area: " << PI * r * r << endl;
            return 0;
        }
      `,
      tests: [""],
      hints: ["მუდმივა იწერება `const double PI = 3.14;`.", "ფორმულა: `PI * r * r`.", "`cout << \"Area: \" << PI * r * r << endl;`"],
      weight: 1,
      wrong: [{ code: `#include <iostream>\nusing namespace std;\nint main() {\n    const int PI = 3;\n    int r = 10;\n    cout << "Area: " << PI * r * r << endl;\n}\n`, why: "PI = 3 (მთელი რიცხვი)" }],
    }),
  ],
  mistakes: [
    "`=`-ს მათემატიკური ტოლობის გაგებით კითხულობ: `x = x + 1` არ არის წინააღმდეგობა, ეს ბრძანებაა",
    "ტექსტი `char`-ში ჩასვი: `char c = \"A\";` არასწორია, `char c = 'A';` სწორია",
    "ცვლადი გამოაცხადე და არაფერი ჩაუწერე, შემდეგ გამოიყენე",
    "წილადი რიცხვი `int`-ში ჩასვი და წილადი ნაწილი დაკარგე",
    "დაგავიწყდა `#include <string>` `string`-ის გამოსაყენებლად",
  ],
  summary: ["ცვლადი არის სახელდებული ყუთი: ტიპი, სახელი, მნიშვნელობა", "`int`, `double`, `char`, `bool`, `string` ძირითადი ტიპებია", "`=` ანიჭებს მნიშვნელობას და ასლს აკეთებს", "ორი ცვლადის გასაცვლელად დამხმარე ცვლადი გვჭირდება", "მუდმივას `const` ეწერება, ცვლადს კი ყოველთვის საწყისი მნიშვნელობა უნდა ჰქონდეს"],
});
