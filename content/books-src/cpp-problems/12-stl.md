# თავი 12. სტანდარტული კონტეინერები
weeks: 9

C++ ბიბლიოთეკა (STL) მზა მონაცემთა სტრუქტურებს გვაძლევს: `stack` (სტეკი: ბოლოს მოსული პირველი გადის), `queue` (რიგი: პირველი მოსული პირველი გადის), `deque` (ორმხრივი რიგი), `set` (დახარისხებული სიმრავლე, ყოველი ელემენტი ერთხელ), `map` (გასაღები → მნიშვნელობა), `priority_queue` (რიგი, საიდანაც ყოველთვის უდიდესი გამოდის) და `pair`. ამ თავში ვივარჯიშებთ იმაში, რომ ამოცანის ბუნებით ავირჩიოთ სწორი სტრუქტურა.

წინაპირობა: `vector`, დახარისხება, სირთულის შეფასება. ამ თავში ბრძანებების დამუშავების ამოცანები გვხვდება: შეყვანაში ბრძანებები მოდის და თქვენ სტრუქტურაზე მათ ასრულებთ. ბრძანება წაიკითხეთ როგორც სტრიქონი (`cin >> command`), შემდეგ საჭიროებისას არგუმენტი.

ძირითადი წესი: `set` და `map` ელემენტებს დახარისხებულად ინახავს და ოპერაციები `O(log n)` დროს ითხოვს. `stack`, `queue` და `deque` ძირითადი ოპერაციებს `O(1)`-ში ასრულებენ. თითოეული სტრუქტურა რაღაცას ჩქარა აკეთებს და რაღაცას ვერ: ამოცანაში გაარკვიეთ, რა გჭირდებათ.

## რიგი ბრძანებებით
level: 2
tags: queue, ბრძანებები, სიმულაცია

რიგი თავიდან ცარიელია. შესრულეთ ბრძანებები:

- `push x`: დაამატეთ `x` რიგის ბოლოში;
- `pop`: ამოიღეთ რიგის პირველი ელემენტი და გამოიტანეთ ის; თუ რიგი ცარიელია, გამოიტანეთ `EMPTY`;
- `size`: გამოიტანეთ რიგის ზომა.

### შეყვანა

პირველ ხაზზე `q`. შემდეგ `q` ხაზზე თითო ბრძანება.

### გამოტანა

თითო ხაზი ყოველი `pop` და `size` ბრძანებისთვის (`push` არაფერს გამოიტანს).

### შეზღუდვები

1 ≤ q ≤ 10⁵, |x| ≤ 10⁹

### მაგალითი

```in
5
push 3
push 5
pop
size
pop
```

```out
3
1
5
```

### შემოწმება

```in
3
pop
push 1
size
```

```out
EMPTY
1
```

### მინიშნებები

1. „პირველი მოსული პირველი გადის“. რომელი სტრუქტურაა ასეთი?
2. `queue<long long>`: `push` (დამატება), `front` (პირველის წაკითხვა), `pop` (პირველის წაშლა — არაფერს აბრუნებს), `size`, `empty`.
3. წაიკითხეთ ბრძანების სახელი სტრიქონად; `push`-ზე წაიკითხეთ კიდევ რიცხვი. `pop`-ზე ჯერ `empty()` შეამოწმეთ, შემდეგ `front()` გამოიტანეთ და `pop()` გააკეთეთ.

### ამოხსნა

```cpp
#include <iostream>
#include <queue>
#include <string>
using namespace std;

int main() {
    int q;
    cin >> q;
    queue<long long> line;
    while (q--) {
        string command;
        cin >> command;
        if (command == "push") {
            long long x;
            cin >> x;
            line.push(x);
        } else if (command == "pop") {
            if (line.empty()) {
                cout << "EMPTY\n";
            } else {
                cout << line.front() << "\n";
                line.pop();
            }
        } else {
            cout << line.size() << "\n";
        }
    }
    return 0;
}
```

`front()` ცარიელ რიგზე განუსაზღვრელ ქცევას იძლევა: ამიტომ ყოველთვის წინასწარ `empty()` შეამოწმეთ. `pop()` ელემენტს მხოლოდ შლის და არაფერს აბრუნებს: გამოსატანად ჯერ `front()` წაიკითხეთ.

### სტრესი

```brute
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int q;
    cin >> q;
    vector<long long> v;
    while (q--) {
        string c;
        cin >> c;
        if (c == "push") {
            long long x;
            cin >> x;
            v.push_back(x);
        } else if (c == "pop") {
            if (v.empty()) {
                cout << "EMPTY\n";
            } else {
                cout << v[0] << "\n";
                v.erase(v.begin());
            }
        } else {
            cout << v.size() << "\n";
        }
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
q = random.randint(1, 10)
print(q)
for _ in range(q):
    c = random.choice(["push", "push", "pop", "size"])
    print(c + (" " + str(random.randint(-5, 5)) if c == "push" else ""))
```

## ორმხრივი რიგი ბრძანებებით
level: 2
tags: deque, ბრძანებები, სიმულაცია

ორმხრივი რიგი (`deque`) თავიდან ცარიელია. შესრულეთ ბრძანებები:

- `pf x`: დაამატეთ `x` დასაწყისში;
- `pb x`: დაამატეთ `x` ბოლოში;
- `qf`: ამოიღეთ და გამოიტანეთ პირველი ელემენტი (თუ ცარიელია, `EMPTY`);
- `qb`: ამოიღეთ და გამოიტანეთ ბოლო ელემენტი (თუ ცარიელია, `EMPTY`).

### შეყვანა

პირველ ხაზზე `q`. შემდეგ `q` ხაზზე თითო ბრძანება.

### გამოტანა

თითო ხაზი ყოველი `qf` და `qb` ბრძანებისთვის.

### შეზღუდვები

1 ≤ q ≤ 10⁵, |x| ≤ 10⁹

### მაგალითი

```in
6
pb 1
pb 2
pf 0
qf
qb
qb
```

```out
0
2
1
```

### შემოწმება

```in
2
qf
qb
```

```out
EMPTY
EMPTY
```

### მინიშნებები

1. ორივე ბოლოდან დამატება და ამოღება ერთ სტრუქტურაში: რომელი ტიპია?
2. `deque<long long>`: `push_front`, `push_back`, `front`, `back`, `pop_front`, `pop_back`.
3. `qf`-ზე და `qb`-ზე ჯერ `empty()` შეამოწმეთ.

### ამოხსნა

```cpp
#include <deque>
#include <iostream>
#include <string>
using namespace std;

int main() {
    int q;
    cin >> q;
    deque<long long> d;
    while (q--) {
        string command;
        cin >> command;
        if (command == "pf" || command == "pb") {
            long long x;
            cin >> x;
            if (command == "pf") {
                d.push_front(x);
            } else {
                d.push_back(x);
            }
        } else if (d.empty()) {
            cout << "EMPTY\n";
        } else if (command == "qf") {
            cout << d.front() << "\n";
            d.pop_front();
        } else {
            cout << d.back() << "\n";
            d.pop_back();
        }
    }
    return 0;
}
```

`deque` ორივე ბოლოში ოპერაციებს `O(1)`-ში ასრულებს: `vector` ასე არ მუშაობს (დასაწყისში ჩასმა ყველა ელემენტს გადაწევს). ბრძანებების ამოცნობის შემდეგ `empty()`-ის შემოწმება ორივე `q`-ბრძანებისთვის ერთადაა.

### სტრესი

```brute
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int q;
    cin >> q;
    vector<long long> v;
    while (q--) {
        string c;
        cin >> c;
        if (c == "pf") {
            long long x;
            cin >> x;
            v.insert(v.begin(), x);
        } else if (c == "pb") {
            long long x;
            cin >> x;
            v.push_back(x);
        } else if (v.empty()) {
            cout << "EMPTY\n";
        } else if (c == "qf") {
            cout << v.front() << "\n";
            v.erase(v.begin());
        } else {
            cout << v.back() << "\n";
            v.pop_back();
        }
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
q = random.randint(1, 10)
print(q)
for _ in range(q):
    c = random.choice(["pf", "pb", "qf", "qb"])
    print(c + (" " + str(random.randint(-5, 5)) if c in ("pf", "pb") else ""))
```

## განსხვავებული ელემენტების რაოდენობა
level: 2
tags: set, განსხვავებული ელემენტები

დაითვალეთ, რამდენი განსხვავებული რიცხვია მასივში.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

ერთი რიცხვი.

### შეზღუდვები

1 ≤ n ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
6
3 1 3 2 1 5
```

```out
4
```

### შემოწმება

```in
1
-1
```

```out
1
```

### მინიშნებები

1. წინა თავში ეს დახარისხებით გააკეთეთ. არსებობს სტრუქტურა, რომელიც დუბლიკატებს თვითონ იგდებს.
2. `set<int>` ყოველ მნიშვნელობას ერთხელ ინახავს.
3. ჩაამატეთ ყველა რიცხვა `insert`-ით და გამოიტანეთ `size()`.

### ამოხსნა

```cpp
#include <iostream>
#include <set>
using namespace std;

int main() {
    int n;
    cin >> n;
    set<int> values;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        values.insert(x);
    }
    cout << values.size() << endl;
    return 0;
}
```

`insert` დუბლიკატს უბრალოდ იგნორირებს. `set` ელემენტებს დახარისხებულად ინახავს, ამიტომ ყოველი ჩასმა `O(log n)`-ია. თუ დახარისხება არ გჭირდებათ, `unordered_set` ზოგჯერ უფრო სწრაფია.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    sort(a.begin(), a.end());
    a.erase(unique(a.begin(), a.end()), a.end());
    cout << a.size() << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 10)
print(n)
print(*[random.randint(-4, 4) for _ in range(n)])
```

## წერტილების დახარისხება
level: 2
tags: pair, sort

მოცემულია `n` წერტილი სიბრტყეზე. დაალაგეთ ისინი `x` კოორდინატის ზრდადობით, ხოლო ტოლი `x`-ის შემთხვევაში `y`-ის ზრდადობით.

### შეყვანა

პირველ ხაზზე `n`. შემდეგ `n` ხაზზე ორი რიცხვი `x` და `y`.

### გამოტანა

`n` ხაზი: წერტილები დახარისხებული რიგით.

### შეზღუდვები

1 ≤ n ≤ 10⁵, |x|, |y| ≤ 10⁹

### მაგალითი

```in
4
2 3
1 5
2 1
1 2
```

```out
1 2
1 5
2 1
2 3
```

### შემოწმება

```in
1
0 0
```

```out
0 0
```

### მინიშნებები

1. წერტილი ორი რიცხვია, რომლებიც ერთად უნდა გადაადგილდეს.
2. `pair<int, int>` ორ მნიშვნელობას აერთიანებს და შედარებისას ჯერ პირველს ადარებს, შემდეგ მეორეს.
3. ჩაწერეთ წერტილები `vector<pair<int, int>>`-ში და გამოიყენეთ `sort` მეტი არაფრის გარეშე: ის ზუსტად ამ რიგს მისცემს.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> p(n);
    for (int i = 0; i < n; i++) {
        cin >> p[i].first >> p[i].second;
    }
    sort(p.begin(), p.end());
    for (int i = 0; i < n; i++) {
        cout << p[i].first << " " << p[i].second << "\n";
    }
    return 0;
}
```

`pair`-ის სტანდარტული შედარება ლექსიკოგრაფიულია: ჯერ `first`, ტოლობისას `second`. ამიტომ საკუთარი შედარების ფუნქცია არ დაგვჭირდა. თუ სხვა რიგი გჭირდებათ (მაგალითად, `y` კლებადობით), `sort`-ს საკუთარი შედარება გადაეცით, როგორც ადრე.

## ფრჩხილების ბალანსი
level: 3
tags: stack, სტრიქონები, ფრჩხილები

სტრიქონი შედგება ფრჩხილებისგან `()`, `[]`, `{}`. ის სწორია, თუ ყოველ გამხსნელ ფრჩხილს შეესაბამება იმავე ტიპის დამხურავი და ფრჩხილები სწორადაა ჩადგმული (მაგალითად, `{[()]}` სწორია, `([)]` — არა). გამოიტანეთ `YES` ან `NO`.

### შეყვანა

ერთი სტრიქონი.

### გამოტანა

`YES` ან `NO`.

### შეზღუდვები

სტრიქონის სიგრძე 1-დან 10⁵-მდეა.

### მაგალითი

```in
{[()]}
```

```out
YES
```

### მაგალითი

```in
([)]
```

```out
NO
```

### მაგალითი

```in
((
```

```out
NO
```

### შემოწმება

```in
)(
```

```out
NO
```

```in
()[]{}
```

```out
YES
```

### მინიშნებები

1. უკანასკნელად გახსნილი ფრჩხილი პირველად უნდა დაიხუროს. რომელი სტრუქტურა მუშაობს ამგვარად?
2. `stack<char>`: გამხსნელი ფრჩხილისას ჩაამატეთ; დამხურავისას შეამოწმეთ, არის თუ არა სტეკის თავში მისი წყვილი.
3. თუ სტეკი ცარიელია დამხურავისას, ან წყვილი არ ემთხვევა, პასუხია `NO`. ბოლოს სტეკი ცარიელი უნდა იყოს, წინააღმდეგ შემთხვევაში ზოგი ფრჩხილი დაუხურავია.

### ამოხსნა

```cpp
#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    stack<char> open;
    bool ok = true;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            open.push(c);
        } else {
            if (open.empty()) {
                ok = false;
                break;
            }
            char top = open.top();
            open.pop();
            if ((c == ')' && top != '(') || (c == ']' && top != '[') || (c == '}' && top != '{')) {
                ok = false;
                break;
            }
        }
    }
    if (!open.empty()) {
        ok = false;
    }
    cout << (ok ? "YES" : "NO") << endl;
    return 0;
}
```

სტეკი ზუსტად „უკანასკნელი შემოსული პირველი გადის“ ქცევაა და ფრჩხილებისთვის იდეალურია. ორი შემოწმება აუცილებელია: ცარიელი სტეკიდან ამოღება (`)(` ტესტი) და ბოლოს დარჩენილი გახსნილი ფრჩხილები (`((` ტესტი). სირთულე `O(n)`.

### სტრესი

```brute
#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    bool changed = true;
    while (changed) {
        changed = false;
        for (const string &p : {"()", "[]", "{}"}) {
            size_t pos = s.find(p);
            if (pos != string::npos) {
                s.erase(pos, 2);
                changed = true;
            }
        }
    }
    cout << (s.empty() ? "YES" : "NO") << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
print("".join(random.choice("()[]{}") for _ in range(random.randint(1, 8))))
```

## ტელეფონის წიგნი
level: 3
tags: map, ბრძანებები, string

ტელეფონის წიგნი თავიდან ცარიელია. შესრულეთ ბრძანებები:

- `add name number`: ჩაწერეთ ნომერი სახელზე (თუ სახელი უკვე არსებობს, ნომერი შეიცვალოს);
- `find name`: გამოიტანეთ სახელის ნომერი, ან `NOT_FOUND`, თუ სახელი არ არის.

### შეყვანა

პირველ ხაზზე `q`. შემდეგ `q` ხაზზე თითო ბრძანება. სახელი და ნომერი ინტერვალების გარეშე სტრიქონებია.

### გამოტანა

თითო ხაზი ყოველი `find` ბრძანებისთვის.

### შეზღუდვები

1 ≤ q ≤ 10⁵, სახელის და ნომრის სიგრძე ≤ 20

### მაგალითი

```in
5
add ann 123
add bob 456
find ann
add ann 789
find ann
```

```out
123
789
```

### შემოწმება

```in
2
find zed
add zed 1
```

```out
NOT_FOUND
```

### მინიშნებები

1. სახელი „გასაღებია“, ნომერი — „მნიშვნელობა“. რომელი სტრუქტურაა გასაღებით ძებნისთვის?
2. `map<string, string>`: `book[name] = number` ჩაწერს ან შეცვლის; `book.find(name)` ეძებს.
3. `find`-ისას შეამოწმეთ, არსებობს თუ არა გასაღები: `book.find(name) != book.end()`. `book[name]` არარსებულ გასაღებზე ახალ ცარიელ ჩანაწერს შექმნიდა.

### ამოხსნა

```cpp
#include <iostream>
#include <map>
#include <string>
using namespace std;

int main() {
    int q;
    cin >> q;
    map<string, string> book;
    while (q--) {
        string command, name;
        cin >> command >> name;
        if (command == "add") {
            string number;
            cin >> number;
            book[name] = number;
        } else {
            auto it = book.find(name);
            if (it == book.end()) {
                cout << "NOT_FOUND\n";
            } else {
                cout << it->second << "\n";
            }
        }
    }
    return 0;
}
```

`map` ძებნასა და ჩაწერას `O(log n)`-ში აკეთებს. იტერატორი `it` წყვილზე მიუთითებს: `it->first` გასაღებია, `it->second` — მნიშვნელობა. ყურადღება: ოპერატორი `[]` არარსებული გასაღებისას ჩანაწერს ქმნის: მხოლოდ ჩასაწერად გამოიყენეთ, ძებნისთვის კი `find`.

### სტრესი

```brute
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int q;
    cin >> q;
    vector<pair<string, string>> book;
    while (q--) {
        string c, name;
        cin >> c >> name;
        if (c == "add") {
            string number;
            cin >> number;
            bool done = false;
            for (auto &p : book) {
                if (p.first == name) {
                    p.second = number;
                    done = true;
                }
            }
            if (!done) book.push_back({name, number});
        } else {
            string answer = "NOT_FOUND";
            for (auto &p : book) if (p.first == name) answer = p.second;
            cout << answer << "\n";
        }
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
q = random.randint(1, 10)
print(q)
for _ in range(q):
    name = random.choice(["a", "b", "c"])
    if random.random() < 0.5:
        print("add", name, random.randint(1, 99))
    else:
        print("find", name)
```

## ორი სიმრავლის თანაკვეთა
level: 3
tags: set, სიმრავლეები, თანაკვეთა

მოცემულია ორი მასივი. გამოიტანეთ ის განსხვავებული რიცხვები, რომლებიც ორივეში გვხვდება, ზრდადობით. თუ საერთო რიცხვი არ არის, გამოიტანეთ `EMPTY`.

### შეყვანა

პირველ ხაზზე `n` და `m`. მეორე ხაზზე `n` რიცხვი. მესამე ხაზზე `m` რიცხვი.

### გამოტანა

საერთო რიცხვები ზრდადობით, ერთ ხაზზე, ან `EMPTY`.

### შეზღუდვები

1 ≤ n, m ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
4 3
1 2 3 4
3 4 5
```

```out
3 4
```

### მაგალითი

```in
2 2
1 1
2 2
```

```out
EMPTY
```

### შემოწმება

```in
3 3
5 5 5
5 5 5
```

```out
5
```

### მინიშნებები

1. თითოეული მასივიდან ერთი სიმრავლე აიღეთ: დუბლიკატები უკვე აღარ გაწუხებთ.
2. `set<int>` ინახავს ელემენტებს უკვე ზრდადობით. პირველი სიმრავლის თითოეული ელემენტისთვის შეამოწმეთ, არის თუ არა ის მეორეში (`count`).
3. გადაიარეთ პირველი სიმრავლე (ის ზრდადობითაა დახარისხებული) და თუ ელემენტი მეორეშიც არის, გამოიტანეთ.

### ამოხსნა

```cpp
#include <iostream>
#include <set>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    set<int> a, b;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        a.insert(x);
    }
    for (int i = 0; i < m; i++) {
        int x;
        cin >> x;
        b.insert(x);
    }
    bool any = false;
    for (int x : a) {
        if (b.count(x) > 0) {
            cout << x << " ";
            any = true;
        }
    }
    if (!any) {
        cout << "EMPTY";
    }
    cout << endl;
    return 0;
}
```

`set`-ზე ციკლი `for (int x : a)` ელემენტებს ზრდადობით გადის. `b.count(x)` აბრუნებს 1-ს, თუ `x` არის სიმრავლეში, და 0-ს, თუ არა. ეს თანაკვეთის ყველაზე მარტივი ვერსიაა: `O(n log m)`.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<int> a(n), b(m);
    for (auto &x : a) cin >> x;
    for (auto &x : b) cin >> x;
    vector<int> common;
    for (int x : a)
        for (int y : b)
            if (x == y) common.push_back(x);
    sort(common.begin(), common.end());
    common.erase(unique(common.begin(), common.end()), common.end());
    if (common.empty()) {
        cout << "EMPTY" << endl;
    } else {
        for (int x : common) cout << x << " ";
        cout << endl;
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 6)
m = random.randint(1, 6)
print(n, m)
print(*[random.randint(1, 8) for _ in range(n)])
print(*[random.randint(1, 8) for _ in range(m)])
```

## წყვილები ჯამით, map-ით
level: 3
tags: map, წყვილები, სიხშირეები, long long

დაითვალეთ, რამდენ წყვილ `(i, j)` პოზიციას აქვს `i < j` და `a[i] + a[j] = x`. ახლა `n = 10⁵`, ამიტომ `O(n²)` გადარჩევა არ გამოდგება.

### შეყვანა

პირველ ხაზზე `n` და `x`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

ერთი რიცხვი: წყვილების რაოდენობა.

### შეზღუდვები

1 ≤ n ≤ 10⁵, |რიცხვი|, |x| ≤ 10⁹

### მაგალითი

```in
5 6
1 5 2 4 3
```

```out
2
```

### მაგალითი

```in
4 4
2 2 2 2
```

```out
6
```

### შემოწმება

```in
1 2
1
```

```out
0
```

### მინიშნებები

1. ყოველი ელემენტისთვის წყვილის მეორე ელემენტი ერთადერთია: `x − a[j]`. შეგიძლიათ დაითვალოთ, რამდენჯერ გვხვდებოდა ის ადრე?
2. გაიარეთ მასივი მარცხნიდან მარჯვნივ და შეინახეთ `map`, რომელშიც ჩანს, რამდენჯერ გვხვდებოდა თითოეული მნიშვნელობა უკვე გავლილ ნაწილში.
3. ყოველ `a[j]`-ზე პასუხს დაუმატეთ `count[x - a[j]]` (წინა ელემენტებიდან რამდენი ქმნის წყვილს) და შემდეგ გაზარდეთ `count[a[j]]`. პასუხი ჩაწერეთ `long long`-ში: წყვილები 5 · 10⁹-მდე შეიძლება იყოს.

### ამოხსნა

```cpp
#include <iostream>
#include <map>
using namespace std;

int main() {
    int n;
    long long x;
    cin >> n >> x;
    map<long long, int> seen;
    long long pairs = 0;
    for (int j = 0; j < n; j++) {
        long long a;
        cin >> a;
        auto it = seen.find(x - a);
        if (it != seen.end()) {
            pairs += it->second;
        }
        seen[a]++;
    }
    cout << pairs << endl;
    return 0;
}
```

წყვილის დათვლა ხდება მაშინ, როცა მეორე ელემენტი გვხვდება: პირველი უკვე `seen`-შია. ამ დროს `i < j` ავტომატურად სრულდება და ყოველი წყვილი ერთხელ ითვლება. `[2, 2, 2, 2]`-ზე ყოველი ახალი 2 ჯერ ყველა წინა 2-ს ითვლის: 0 + 1 + 2 + 3 = 6. სირთულე `O(n log n)`. პასუხი `int`-ში არ ეტევა: `long long`.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long x;
    cin >> n >> x;
    vector<long long> a(n);
    for (auto &v : a) cin >> v;
    long long count = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[i] + a[j] == x) count++;
    cout << count << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 9)
print(n, random.randint(-6, 6))
print(*[random.randint(-4, 4) for _ in range(n)])
```

## უახლოესი რიცხვი სიმრავლეში
level: 3
tags: set, lower_bound, შეკითხვები

მოცემულია რიცხვების სიმრავლე და `q` შეკითხვა. ყოველი შეკითხვა `x`-ისთვის გამოიტანეთ სიმრავლის ის ელემენტი, რომელიც `x`-თან ყველაზე ახლოსაა. თუ ორი ელემენტი ერთნაირად ახლოსაა, გამოიტანეთ უმცირესი.

### შეყვანა

პირველ ხაზზე `n` და `q`. მეორე ხაზზე `n` რიცხვი. მესამე ხაზზე `q` რიცხვი `x`.

### გამოტანა

`q` ხაზი: ყოველი შეკითხვის პასუხი.

### შეზღუდვები

1 ≤ n, q ≤ 10⁵, |რიცხვი|, |x| ≤ 10⁹

### მაგალითი

```in
5 3
1 5 9 13 20
6 12 100
```

```out
5
13
20
```

### შემოწმება

```in
2 1
2 4
3
```

```out
2
```

### მინიშნებები

1. ყველაზე ახლო ელემენტი `x`-ის მარცხნივ ან მარჯვნივ მეზობელია. ეს ორი კანდიდატი საკმარისია.
2. `set::lower_bound(x)` აბრუნებს პირველ ელემენტს, რომელიც `≥ x`-ია. მისი წინა ელემენტი (თუ არსებობს) ყველაზე დიდია, რაც `x`-ზე ნაკლებია.
3. შეადარეთ სხვაობები. თუ `lower_bound` სიმრავლის ბოლოს გადასცდა, მხოლოდ წინა გვრჩება; თუ ის პირველი ელემენტია, მხოლოდ ის გვრჩება. ტოლობისას დაიტოვეთ უმცირესი.

### ამოხსნა

```cpp
#include <iostream>
#include <set>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    set<long long> s;
    for (int i = 0; i < n; i++) {
        long long v;
        cin >> v;
        s.insert(v);
    }
    for (int i = 0; i < q; i++) {
        long long x;
        cin >> x;
        auto it = s.lower_bound(x);
        long long best;
        if (it == s.end()) {
            best = *prev(it);
        } else if (it == s.begin()) {
            best = *it;
        } else {
            long long right = *it;
            long long left = *prev(it);
            best = (x - left <= right - x) ? left : right;
        }
        cout << best << "\n";
    }
    return 0;
}
```

`lower_bound` დახარისხებულ ვექტორზე უკვე გქონდათ (მე-11 თავი); `set`-ზე ის მეთოდია (`s.lower_bound(x)`) და `O(log n)`-ში მუშაობს. `prev(it)` წინა ელემენტს აბრუნებს. განსაკუთრებული შემთხვევები ცალკე უნდა გაიმართოს: `end()` ელემენტზე არ მიუთითებს და `*end()` განუსაზღვრელ ქცევას იძლევა. პირობა `x - left <= right - x` ტოლობისას უმცირესს (`left`) ირჩევს.

### სტრესი

```brute
#include <cstdlib>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<long long> a(n);
    for (auto &v : a) cin >> v;
    while (q--) {
        long long x;
        cin >> x;
        long long best = a[0];
        for (long long v : a) {
            long long dv = llabs(v - x), db = llabs(best - x);
            if (dv < db || (dv == db && v < best)) best = v;
        }
        cout << best << "\n";
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 6)
q = random.randint(1, 6)
print(n, q)
print(*[random.randint(-8, 8) for _ in range(n)])
print(*[random.randint(-10, 10) for _ in range(q)])
```

## სიტყვების სიხშირეები
level: 3
tags: map, sort, სიხშირეები, string

მოცემულია `n` სიტყვა. გამოიტანეთ ყოველი განსხვავებული სიტყვა და მისი რაოდენობა: ჯერ ყველაზე ხშირი, ტოლი რაოდენობისას ანბანური რიგით.

### შეყვანა

პირველ ხაზზე `n`. შემდეგ `n` სიტყვა (ლათინური პატარა ასოები), ინტერვალით ან ხაზის გადატანით გამოყოფილი.

### გამოტანა

ყოველ ხაზზე სიტყვა და მისი რაოდენობა.

### შეზღუდვები

1 ≤ n ≤ 10⁵, სიტყვის სიგრძე ≤ 20

### მაგალითი

```in
7
a b a c b a d
```

```out
a 3
b 2
c 1
d 1
```

### შემოწმება

```in
1
word
```

```out
word 1
```

### მინიშნებები

1. დათვლისთვის გასაღები-მნიშვნელობის სტრუქტურა გჭირდებათ. `map` სიტყვებს უკვე ანბანურად ინახავს, მაგრამ დახარისხება რაოდენობით არ გვინდა.
2. ჯერ დათვალეთ `map<string, int>`-ში. შემდეგ გადაიტანეთ ჩანაწერები ვექტორში და დაალაგეთ საკუთარი წესით.
3. დახარისხებისთვის საკმარისია წყვილი `(-რაოდენობა, სიტყვა)`: უარყოფითი რაოდენობით ზრდადობით დახარისხებისას ყველაზე ხშირი პირველი გამოვა, ტოლობისას კი სიტყვა გადაწყვეტს.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <map>
#include <string>
#include <utility>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    map<string, int> freq;
    for (int i = 0; i < n; i++) {
        string w;
        cin >> w;
        freq[w]++;
    }
    vector<pair<int, string>> items;
    for (const auto &entry : freq) {
        items.push_back({-entry.second, entry.first});
    }
    sort(items.begin(), items.end());
    for (const auto &item : items) {
        cout << item.second << " " << -item.first << "\n";
    }
    return 0;
}
```

ხრიკი ეწყობა რაოდენობის ნიშნის შეცვლით: `pair`-ის ბუნებრივი რიგი ზრდადია, ხოლო ჩვენ რაოდენობა კლებადობით გვინდა. `freq[w]++` არარსებულ გასაღებს 0-ით ქმნის და ზრდის: ეს დათვლის ყველაზე გავრცელებული სქემაა.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<string> w(n);
    for (auto &x : w) cin >> x;
    sort(w.begin(), w.end());
    vector<pair<string, int>> groups;
    for (const string &x : w) {
        if (!groups.empty() && groups.back().first == x) groups.back().second++;
        else groups.push_back({x, 1});
    }
    sort(groups.begin(), groups.end(), [](const pair<string, int> &a, const pair<string, int> &b) {
        if (a.second != b.second) return a.second > b.second;
        return a.first < b.first;
    });
    for (auto &g : groups) cout << g.first << " " << g.second << "\n";
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 10)
print(n)
print(*[random.choice(["a", "b", "c", "dd", "e"]) for _ in range(n)])
```

## შემდეგი უფრო დიდი ელემენტი
level: 4
tags: stack, მონოტონური სტეკი, ეფექტურობა

თითოეული ელემენტისთვის იპოვეთ მის მარჯვნივ პირველი ელემენტი, რომელიც მასზე **მკაცრად დიდია**. თუ ასეთი არ არსებობს, გამოიტანეთ `-1`.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

`n` რიცხვი ერთ ხაზზე.

### შეზღუდვები

1 ≤ n ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
5
2 1 3 2 4
```

```out
3 3 4 4 -1
```

### შემოწმება

```in
1
5
```

```out
-1
```

```in
3
3 3 3
```

```out
-1 -1 -1
```

### მინიშნებები

1. ყოველი ელემენტისთვის მარჯვნივ სიარული `O(n²)` იქნება. გაიარეთ მასივი ერთხელ.
2. შეინახეთ სტეკში იმ ელემენტების ინდექსები, რომელთათვისაც პასუხი ჯერ არ ვიცით.
3. ყოველი ახალი `a[i]`-სთვის: სანამ სტეკის თავში მყოფი ელემენტი `a[i]`-ზე მკაცრად ნაკლებია, მისი პასუხი არის `a[i]`: ამოიღეთ და ჩაწერეთ. შემდეგ `i` ჩაამატეთ სტეკში. გავლის ბოლოს სტეკში დარჩენილებს პასუხი `-1` რჩებათ.

### ამოხსნა

```cpp
#include <iostream>
#include <stack>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n), answer(n, -1);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    stack<int> waiting;
    for (int i = 0; i < n; i++) {
        while (!waiting.empty() && a[waiting.top()] < a[i]) {
            answer[waiting.top()] = a[i];
            waiting.pop();
        }
        waiting.push(i);
    }
    for (int i = 0; i < n; i++) {
        cout << answer[i] << " ";
    }
    cout << endl;
    return 0;
}
```

სტეკში ელემენტები ყოველთვის არაზრდადი რიგითაა (ზემოდან ქვემოთ „უფრო დიდი“): ამიტომ მას „მონოტონური სტეკი“ ეწოდება. ყოველი ელემენტი ერთხელ ჩაიდება და მაქსიმუმ ერთხელ ამოიღება, ამიტომ `while` ციკლებში ჯამში სულ `n` ბიჯია: `O(n)`, თუმცა ორმაგი ციკლი ჩანს. ეს არის „ამორტიზებული“ ანალიზის მაგალითი.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    for (int i = 0; i < n; i++) {
        long long r = -1;
        for (int j = i + 1; j < n; j++) {
            if (a[j] > a[i]) {
                r = a[j];
                break;
            }
        }
        cout << r << " ";
    }
    cout << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 9)
print(n)
print(*[random.randint(-5, 5) for _ in range(n)])
```

## ქვების გატეხვა
level: 4
tags: priority_queue, სიმულაცია, ხრიკი

გაქვთ `n` ქვა წონებით. ყოველ ნაბიჯზე აიღეთ ორი ყველაზე მძიმე ქვა და დაამტვრიეთ ისინი ერთმანეთზე: თუ ორივე თანაბარია, ორივე ქრება; თუ არა, დარჩება ერთი ქვა წონებს შორის სხვაობით. გაიმეორეთ სანამ ერთზე მეტი ქვა დარჩება. გამოიტანეთ უკანასკნელი დარჩენილი ქვის წონა, ან 0, თუ ქვები აღარ დარჩა.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` დადებითი რიცხვი.

### გამოტანა

ერთი რიცხვი.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 1 ≤ წონა ≤ 10⁹

### მაგალითი

```in
6
2 7 4 1 8 1
```

```out
1
```

### განმარტება

(8, 7) → 1; ქვები: 2 4 1 1 1. (4, 2) → 2; ქვები: 1 1 1 2. (2, 1) → 1; ქვები: 1 1 1. (1, 1) → ქრება; დარჩა 1.

### მაგალითი

```in
2
5 5
```

```out
0
```

### შემოწმება

```in
1
7
```

```out
7
```

### მინიშნებები

1. ყოველ ნაბიჯზე მხოლოდ ორი ყველაზე დიდი გჭირდებათ. რომელი სტრუქტურაა „აიღე უდიდესი“ ოპერაციისთვის?
2. `priority_queue<long long>` ყოველთვის უდიდეს ელემენტს აძლევს `top()`-ით.
3. სანამ რიგში ერთზე მეტი ელემენტია, ამოიღეთ ორი, თუ განსხვავდება, დააბრუნეთ სხვაობა. ბოლოს თუ რიგი ცარიელია, პასუხია 0, სხვა შემთხვევაში `top()`.

### ამოხსნა

```cpp
#include <iostream>
#include <queue>
using namespace std;

int main() {
    int n;
    cin >> n;
    priority_queue<long long> stones;
    for (int i = 0; i < n; i++) {
        long long w;
        cin >> w;
        stones.push(w);
    }
    while (stones.size() > 1) {
        long long first = stones.top();
        stones.pop();
        long long second = stones.top();
        stones.pop();
        if (first != second) {
            stones.push(first - second);
        }
    }
    cout << (stones.empty() ? 0 : stones.top()) << endl;
    return 0;
}
```

`priority_queue` ელემენტებს ისე ინახავს, რომ უდიდესი ყოველთვის ზედაა: ჩასმა და ამოღება `O(log n)`-ია. თუ ყოველ ნაბიჯზე მასივს დავახარისხებდით, `O(n² log n)` გამოვიდოდა. ეს სტრუქტურა სხვა დროსაც გამოგადგებათ: „ყოველთვის გვჭირდება ახლა უდიდესი (ან უმცირესი) ელემენტი“.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> v(n);
    for (auto &x : v) cin >> x;
    while (v.size() > 1) {
        sort(v.begin(), v.end());
        long long a = v.back();
        v.pop_back();
        long long b = v.back();
        v.pop_back();
        if (a != b) v.push_back(a - b);
    }
    cout << (v.empty() ? 0 : v[0]) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 8)
print(n)
print(*[random.randint(1, 9) for _ in range(n)])
```

## მოძრავი მაქსიმუმი
level: 5
tags: deque, მოძრავი ფანჯარა, ეფექტურობა

მოცემულია მასივი და რიცხვი `k`. ყოველი `k` ზედიზედ ელემენტისგან შემდგარი „ფანჯრისთვის“ (მარცხნიდან მარჯვნივ) გამოიტანეთ მასში უდიდესი ელემენტი.

### შეყვანა

პირველ ხაზზე `n` და `k`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

`n − k + 1` რიცხვი ერთ ხაზზე.

### შეზღუდვები

1 ≤ k ≤ n ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
8 3
1 3 -1 -3 5 3 6 7
```

```out
3 3 5 5 6 7
```

### შემოწმება

```in
1 1
9
```

```out
9
```

```in
4 4
2 9 1 3
```

```out
9
```

### მინიშნებები

1. ყოველი ფანჯრისთვის `k` ელემენტის გადახედვა `O(nk)`-ია: ძალიან ბევრი, თუ `k` დიდია. ფანჯარაში გადასვლისას მხოლოდ ერთი ელემენტი ემატება და ერთი გამოდის.
2. თუ ახალი ელემენტი უფრო დიდია, ვიდრე უკვე ფანჯარაში მყოფი ზოგი ელემენტი, მათ აღარასოდეს არ ექნებათ მაქსიმუმის შანსი: ისინი ახალზე ადრე ამოვარდებიან.
3. შეინახეთ `deque`-ში ინდექსები ისე, რომ მათი მნიშვნელობები კლებადი იყოს. ახალ ელემენტამდე ბოლოდან ამოაგდეთ ყველა პატარა; წინიდან ამოაგდეთ ინდექსი, რომელიც ფანჯრიდან გავიდა. ფანჯრის მაქსიმუმი არის `deque`-ის პირველი ელემენტი.

### ამოხსნა

```cpp
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    deque<int> window;
    for (int i = 0; i < n; i++) {
        while (!window.empty() && a[window.back()] <= a[i]) {
            window.pop_back();
        }
        window.push_back(i);
        if (window.front() <= i - k) {
            window.pop_front();
        }
        if (i >= k - 1) {
            cout << a[window.front()] << " ";
        }
    }
    cout << endl;
    return 0;
}
```

`window` ინახავს იმ ინდექსებს, რომლებიც ჯერ კიდევ შეიძლება მომავალში მაქსიმუმი გახდეს, ამიტომ მათი მნიშვნელობები კლებადია და პირველი ყოველთვის ფანჯრის უდიდესია. ყოველი ინდექსი ერთხელ ჩაიდება და ერთხელ ამოიღება: სულ `O(n)`. ეს წიგნის ერთ-ერთი ყველაზე რთული ამოცანაა: თუ პირველად ვერ მიხვდებით, ხელით გაიარეთ მაგალითი და დეკის შიგთავსი ყოველი ნაბიჯის შემდეგ ჩაიწერეთ.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    for (int i = 0; i + k <= n; i++) {
        cout << *max_element(a.begin() + i, a.begin() + i + k) << " ";
    }
    cout << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 9)
print(n, random.randint(1, n))
print(*[random.randint(-6, 6) for _ in range(n)])
```
