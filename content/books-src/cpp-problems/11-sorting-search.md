# თავი 11. დახარისხება, ძებნა და ორი მაჩვენებელი
weeks: 8

დახარისხებული მონაცემები ბევრ ამოცანას ამარტივებს: ახლობელი ელემენტები გვერდიგვერდ დგას, ძებნა `O(log n)`-ში ხდება, წყვილების პოვნა ერთ გავლაზე. ამ თავში ვივარჯიშებთ `sort`-ში (საკუთარი შედარებით), ორობით ძებნაში (მათ შორის პასუხზე), ორ მაჩვენებელში, პრეფიქსულ და სხვაობით მასივებში და ინტერვალებთან მუშაობაში.

წინაპირობა: მასივები (მე-6 თავი) და სირთულის შეფასება (მე-10 თავი). ამ თავის ამოცანებში `n` ხშირად 10⁵-ია, ამიტომ `O(n²)` გადარჩევა აღარ გამოდგება: შეზღუდვებით ჩანს, რომელი მეთოდია საჭირო.

## რიცხვების დახარისხება
level: 1
tags: sort, დახარისხება

წაიკითხეთ `n` რიცხვი და გამოიტანეთ ისინი ზრდადობით.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

იგივე რიცხვები ზრდადობით, ერთ ხაზზე.

### შეზღუდვები

1 ≤ n ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
5
3 1 4 1 5
```

```out
1 1 3 4 5
```

### შემოწმება

```in
1
-7
```

```out
-7
```

### მინიშნებები

1. დახარისხების ალგორითმის თვითონ წერა საჭირო არ არის: C++ ბიბლიოთეკა მზა ფუნქციას გვთავაზობს.
2. ფუნქცია `sort` განთავსებულია `<algorithm>`-ში და იღებს ორ იტერატორს: დასაწყისსა და ბოლოს.
3. `sort(a.begin(), a.end());` ალაგებს ვექტორს ზრდადობით. დროის სირთულე `O(n log n)`-ია.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a.begin(), a.end());
    for (int i = 0; i < n; i++) {
        cout << a[i] << " ";
    }
    cout << endl;
    return 0;
}
```

`a.begin()` და `a.end()` ვექტორის დასაწყისსა და ბოლოს აღნიშნავს (`end` ბოლო ელემენტის შემდეგ ადგილია). ნახევარგახსნილი ინტერვალი `[begin, end)` ბიბლიოთეკაში ყველგან გვხვდება. `n = 10⁵`-ზე `sort` ათეულობით მილიწამში მუშაობს, მაშინ როცა `O(n²)` ბუშტუკოვანი დახარისხება ძალიან ნელი იქნებოდა.

## k უდიდესი ელემენტი
level: 2
tags: sort, greater, დახარისხება

გამოიტანეთ მასივის `k` უდიდესი ელემენტი კლებადობით.

### შეყვანა

პირველ ხაზზე `n` და `k`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

`k` რიცხვი კლებადობით, ერთ ხაზზე. განმეორებადი მნიშვნელობები ცალ-ცალკე ითვლება.

### შეზღუდვები

1 ≤ k ≤ n ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
6 3
5 1 9 3 7 2
```

```out
9 7 5
```

### შემოწმება

```in
4 4
2 2 1 2
```

```out
2 2 2 1
```

### მინიშნებები

1. დახარისხებული მასივის ერთ ბოლოში უდიდესები დგანან.
2. შეგიძლიათ დაალაგოთ ზრდადობით და გამოიტანოთ ბოლო `k` უკუღმა, ან დაალაგოთ კლებადობით.
3. კლებადობით დასალაგებლად: `sort(a.begin(), a.end(), greater<int>())`. გამოიტანეთ პირველი `k` ელემენტი.

### ამოხსნა

```cpp
#include <algorithm>
#include <functional>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a.begin(), a.end(), greater<int>());
    for (int i = 0; i < k; i++) {
        cout << a[i] << " ";
    }
    cout << endl;
    return 0;
}
```

მესამე არგუმენტი `greater<int>()` `sort`-ს ეუბნება, რომ დიდი პატარაზე წინ დააყენოს. ეს „შედარების წესი“ შემდეგ ამოცანაში საკუთარი წესით ჩაიცვლება.

## განსხვავებული ელემენტები
level: 2
tags: sort, unique, დახარისხება

გამოიტანეთ მასივის განსხვავებული ელემენტები ზრდადობით, თითოეული ერთხელ.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

განსხვავებული რიცხვები ზრდადობით, ერთ ხაზზე.

### შეზღუდვები

1 ≤ n ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
6
3 1 3 2 1 5
```

```out
1 2 3 5
```

### შემოწმება

```in
3
7 7 7
```

```out
7
```

### მინიშნებები

1. დახარისხების შემდეგ ერთნაირი ელემენტები გვერდიგვერდ დგას.
2. გაიარეთ დახარისხებული მასივი და ელემენტი გამოიტანეთ მხოლოდ მაშინ, როცა ის წინა ელემენტისგან განსხვავდება.
3. პირველი ელემენტი ყოველთვის გამოიტანება. დანარჩენებზე შეადარეთ `a[i]` და `a[i - 1]`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a.begin(), a.end());
    for (int i = 0; i < n; i++) {
        if (i == 0 || a[i] != a[i - 1]) {
            cout << a[i] << " ";
        }
    }
    cout << endl;
    return 0;
}
```

დახარისხება ერთნაირ ელემენტებს „აჯგუფებს“, ამიტომ დუბლიკატების მოშორებისთვის საკმარისია მეზობელთან შედარება. „დახარისხება, შემდეგ ერთი გავლა“ ძალიან ხშირი სქემაა. არსებობს `unique` ფუნქციაც, რომელიც ამავეს აკეთებს, მაგრამ ხელით ვერსია უფრო გასაგებია.

## მოსწავლეთა სია
level: 3
tags: sort, საკუთარი შედარება, pair, string

მოცემულია `n` მოსწავლის სახელი და ქულა. დაალაგეთ ისინი ქულის კლებადობით; თანაბარი ქულის შემთხვევაში — სახელის ანბანური რიგით.

### შეყვანა

პირველ ხაზზე `n`. შემდეგ `n` ხაზზე სახელი (ლათინური პატარა ასოები) და ქულა.

### გამოტანა

`n` ხაზი: სახელი და ქულა დახარისხებული რიგით.

### შეზღუდვები

1 ≤ n ≤ 10⁵, ქულა 0-დან 100-მდეა, სახელის სიგრძე ≤ 20

### მაგალითი

```in
4
alex 90
bob 85
anna 90
carl 70
```

```out
alex 90
anna 90
bob 85
carl 70
```

### შემოწმება

```in
1
zoe 0
```

```out
zoe 0
```

### მინიშნებები

1. დახარისხებისას ორი სხვადასხვა წესია: ქულა მთავარია, სახელი მეორეხარისხოვანი.
2. შეინახეთ მოსწავლე წყვილად `pair<int, string>` ან `struct`-ად და მიაწოდეთ `sort`-ს საკუთარი შედარება (ფუნქცია `bool before(a, b)`).
3. `a` წინ დგას `b`-ზე, თუ `a.score > b.score`, ან ქულები ტოლია და `a.name < b.name`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Student {
    string name;
    int score;
};

bool before(const Student &a, const Student &b) {
    if (a.score != b.score) {
        return a.score > b.score;
    }
    return a.name < b.name;
}

int main() {
    int n;
    cin >> n;
    vector<Student> s(n);
    for (int i = 0; i < n; i++) {
        cin >> s[i].name >> s[i].score;
    }
    sort(s.begin(), s.end(), before);
    for (int i = 0; i < n; i++) {
        cout << s[i].name << " " << s[i].score << "\n";
    }
    return 0;
}
```

`struct` რამდენიმე მნიშვნელობას ერთ „ჩანაწერად“ აერთიანებს. შედარების ფუნქცია აბრუნებს `true`-ს, თუ პირველი ელემენტი მეორეზე **წინ** უნდა იდგეს. სტრიქონების შედარება `<` ანბანურია. ამ ფუნქციას მკაცრი შედარება სჭირდება (`>` და არა `>=`), წინააღმდეგ შემთხვევაში `sort` შეიძლება გაჩერდეს ან შეცდომა მისცეს.

## უმცირესი სხვაობა
level: 3
tags: sort, წყვილები, ეფექტურობა

იპოვეთ ორი სხვადასხვა პოზიციის ელემენტს შორის უმცირესი სხვაობა (აბსოლუტური მნიშვნელობით).

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

ერთი რიცხვი: უმცირესი `|a[i] − a[j]|`, სადაც `i ≠ j`.

### შეზღუდვები

2 ≤ n ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
5
8 1 14 4 11
```

```out
3
```

### შემოწმება

```in
2
5 5
```

```out
0
```

```in
2
-1000000000 1000000000
```

```out
2000000000
```

### მინიშნებები

1. ყველა წყვილის შემოწმება `n = 10⁵`-ზე ძალიან ნელია. ვისთან არის ყველაზე ახლოს რიცხვი?
2. დახარისხების შემდეგ ყველაზე ახლო რიცხვი მეზობელია.
3. დაალაგეთ და გადაიარეთ მეზობელი წყვილები: პასუხი არის უმცირესი `a[i + 1] - a[i]`. სხვაობა 2 · 10⁹-ს აღწევს: `long long`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a.begin(), a.end());
    long long best = a[1] - a[0];
    for (int i = 2; i < n; i++) {
        best = min(best, a[i] - a[i - 1]);
    }
    cout << best << endl;
    return 0;
}
```

თუ `a[i] < a[j] < a[k]`, მაშინ `a[k] - a[i]` აღემატება `a[j] - a[i]`-ს: საუკეთესო წყვილში არ შეიძლება შუაში სხვა ელემენტი იყოს, ამიტომ საუკეთესო წყვილი მეზობლებს შორის გვხვდება. დახარისხებამ `O(n²)`-ს `O(n log n)` შეუცვალა.

### სტრესი

```brute
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    long long best = llabs(a[0] - a[1]);
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) best = min(best, llabs(a[i] - a[j]));
    cout << best << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(2, 8)
print(n)
print(*[random.randint(-30, 30) for _ in range(n)])
```

## ორობითი ძებნა
level: 3
tags: binary_search, დახარისხება, შეკითხვები

მოცემულია `n` რიცხვი და `q` შეკითხვა. ყოველ შეკითხვაზე გამოიტანეთ `YES`, თუ რიცხვი მასივში არის, და `NO` — თუ არა.

### შეყვანა

პირველ ხაზზე `n` და `q`. მეორე ხაზზე `n` მთელი რიცხვი. მესამე ხაზზე `q` მთელი რიცხვი.

### გამოტანა

`q` ხაზი: `YES` ან `NO`.

### შეზღუდვები

1 ≤ n, q ≤ 10⁵, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
5 3
7 2 9 4 1
4 5 1
```

```out
YES
NO
YES
```

### შემოწმება

```in
1 1
3
3
```

```out
YES
```

### მინიშნებები

1. ყოველი შეკითხვისთვის მთელი მასივის გავლა `n · q = 10¹⁰` ოპერაციაა.
2. დაალაგეთ მასივი ერთხელ. დახარისხებულ მასივში ეძებეთ შუა ელემენტიდან: ყოველი შედარება მასივს ორჯერ ამცირებს.
3. ბიბლიოთეკური ფუნქცია `binary_search(a.begin(), a.end(), x)` აბრუნებს `true`-ს, თუ `x` არის დახარისხებულ მასივში. შეგიძლიათ ხელითაც დაწეროთ: `lo = 0`, `hi = n - 1`, ვადარებთ `a[mid]`-ს.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a.begin(), a.end());
    for (int i = 0; i < q; i++) {
        int x;
        cin >> x;
        cout << (binary_search(a.begin(), a.end(), x) ? "YES" : "NO") << "\n";
    }
    return 0;
}
```

ორობითი ძებნა ყოველ ნაბიჯზე ძებნის არეს ნახევრად ამცირებს: `n = 10⁵`-ზე მხოლოდ 17 შედარებაა საჭირო. პირობა: მასივი **უკვე დახარისხებული** უნდა იყოს. დახარისხება ერთხელ ხდება, შემდეგ ყოველი შეკითხვა `O(log n)`-ია: სულ `O((n + q) log n)`.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    while (q--) {
        int x;
        cin >> x;
        bool found = false;
        for (int v : a) if (v == x) found = true;
        cout << (found ? "YES" : "NO") << "\n";
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 8)
q = random.randint(1, 6)
print(n, q)
print(*[random.randint(-6, 6) for _ in range(n)])
print(*[random.randint(-6, 6) for _ in range(q)])
```

## რამდენი ელემენტია x-ზე ნაკლები
level: 3
tags: lower_bound, დახარისხება, შეკითხვები

მოცემულია `n` რიცხვი და `q` შეკითხვა. ყოველი შეკითხვა ითხოვს, რამდენი ელემენტია მასივში `x`-ზე **მკაცრად ნაკლები**.

### შეყვანა

პირველ ხაზზე `n` და `q`. მეორე ხაზზე `n` მთელი რიცხვი. მესამე ხაზზე `q` რიცხვი `x`.

### გამოტანა

`q` ხაზი: ყოველი შეკითხვის პასუხი.

### შეზღუდვები

1 ≤ n, q ≤ 10⁵, |რიცხვი|, |x| ≤ 10⁹

### მაგალითი

```in
5 3
7 2 9 4 1
5 1 10
```

```out
3
0
5
```

### შემოწმება

```in
3 2
2 2 2
2 3
```

```out
0
3
```

### მინიშნებები

1. დახარისხებულ მასივში `x`-ზე ნაკლები ელემენტები დასაწყისში ერთ უწყვეტ ნაწილს ქმნის.
2. საკმარისია იპოვოთ პირველი ადგილი, სადაც ელემენტი `x`-ზე ნაკლები აღარ არის.
3. `lower_bound(a.begin(), a.end(), x)` იტერატორს აბრუნებს პირველ ელემენტზე, რომელიც `≥ x`-ია. მისი მანძილი დასაწყისიდან (`- a.begin()`) არის პასუხი.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a.begin(), a.end());
    for (int i = 0; i < q; i++) {
        int x;
        cin >> x;
        cout << lower_bound(a.begin(), a.end(), x) - a.begin() << "\n";
    }
    return 0;
}
```

`lower_bound` ორობით ძებნას იყენებს და „პირველი ელემენტი, რომელიც არ არის `x`-ზე ნაკლები“ პოზიციას გვიბრუნებს. ამ პოზიციის ინდექსი ზუსტად იმდენია, რამდენი ელემენტიც `x`-ზე ნაკლებია. შესაბამისი `upper_bound` პირველ ელემენტს `x`-ზე **მეტს** იძლევა; ორის სხვაობა `x`-ის რაოდენობაა მასივში.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    while (q--) {
        int x;
        cin >> x;
        int c = 0;
        for (int v : a) if (v < x) c++;
        cout << c << "\n";
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 8)
q = random.randint(1, 6)
print(n, q)
print(*[random.randint(-6, 6) for _ in range(n)])
print(*[random.randint(-7, 7) for _ in range(q)])
```

## წყვილი მოცემული ჯამით
level: 3
tags: ორი მაჩვენებელი, sort, წყვილები

არის თუ არა მასივში ორი სხვადასხვა პოზიციის ელემენტი, რომელთა ჯამია `x`? გამოიტანეთ `YES` ან `NO`.

### შეყვანა

პირველ ხაზზე `n` და `x`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

`YES` ან `NO`.

### შეზღუდვები

2 ≤ n ≤ 10⁵, |რიცხვი|, |x| ≤ 10⁹

### მაგალითი

```in
5 9
1 3 4 5 8
```

```out
YES
```

### მაგალითი

```in
3 100
1 2 3
```

```out
NO
```

### მაგალითი

```in
2 4
2 2
```

```out
YES
```

### მინიშნებები

1. `O(n²)` წყვილების შემოწმება `n = 10⁵`-ზე 5 მილიარდია. დახარისხება დაგეხმარებათ.
2. დაალაგეთ მასივი და დააყენეთ ორი მაჩვენებელი: ერთი დასაწყისში, მეორე ბოლოში.
3. თუ ჯამი `x`-ზე ნაკლებია, მარცხენა მაჩვენებელი წაწიეთ მარჯვნივ (უფრო დიდი რიცხვი); თუ მეტია, მარჯვენა წაწიეთ მარცხნივ. გააგრძელეთ სანამ `i < j`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long x;
    cin >> n >> x;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    sort(a.begin(), a.end());
    int i = 0, j = n - 1;
    bool found = false;
    while (i < j) {
        long long sum = a[i] + a[j];
        if (sum == x) {
            found = true;
            break;
        }
        if (sum < x) {
            i++;
        } else {
            j--;
        }
    }
    cout << (found ? "YES" : "NO") << endl;
    return 0;
}
```

ეს „ორი მაჩვენებლის“ ტექნიკაა: თუ ჯამი მცირეა, ერთადერთი გზა მის გასაზრდელად მარცხენა მაჩვენებლის წაწევაა; თუ დიდია, ერთადერთი გზა მარჯვენას დაწევაა. ამიტომ არც ერთი შესაძლო წყვილი არ იკარგება და მაჩვენებლები სულ `n` ნაბიჯს აკეთებენ: `O(n)` (დახარისხებასთან ერთად `O(n log n)`).

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
    bool found = false;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[i] + a[j] == x) found = true;
    cout << (found ? "YES" : "NO") << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(2, 8)
print(n, random.randint(-8, 8))
print(*[random.randint(-5, 5) for _ in range(n)])
```

## უმოკლესი ქვემასივი
level: 4
tags: ორი მაჩვენებელი, მოძრავი ფანჯარა, ეფექტურობა

მოცემულია დადებითი რიცხვების მასივი და რიცხვი `S`. იპოვეთ ყველაზე მოკლე ზედიზედ ელემენტების მონაკვეთის სიგრძე, რომლის ჯამი არანაკლებია `S`-ზე. თუ ასეთი მონაკვეთი არ არსებობს, გამოიტანეთ 0.

### შეყვანა

პირველ ხაზზე `n` და `S`. მეორე ხაზზე `n` მთელი დადებითი რიცხვი.

### გამოტანა

ერთი რიცხვი: უმოკლესი სიგრძე ან 0.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 1 ≤ რიცხვი ≤ 10⁴, 1 ≤ S ≤ 10⁹

### მაგალითი

```in
6 7
2 3 1 2 4 3
```

```out
2
```

### განმარტება

საუკეთესოა მონაკვეთი `4 3` (ჯამი 7).

### მაგალითი

```in
3 100
1 2 3
```

```out
0
```

### შემოწმება

```in
1 5
5
```

```out
1
```

### მინიშნებები

1. ყველა მონაკვეთი `O(n²)` რაოდენობაა. ელემენტები დადებითია: რას ნიშნავს ეს მონაკვეთის გაგრძელებისას?
2. მონაკვეთის ბოლოს გაწევა ჯამს ზრდის, დასაწყისის წაწევა კი ამცირებს. „ფანჯარა“ `[l, r]` მხოლოდ წინ მოძრაობს.
3. გაზარდეთ `r` და დაუმატეთ `a[r]` ჯამს. სანამ ჯამი `S`-ზე ნაკლები არ გახდება, აკეთეთ ჩანაწერი სიგრძისთვის (`r - l + 1`) და დაიწყეთ `l`-ის წაწევა (გამოაკელით `a[l]`).

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long S;
    cin >> n >> S;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    int best = n + 1;
    long long sum = 0;
    int l = 0;
    for (int r = 0; r < n; r++) {
        sum += a[r];
        while (sum >= S) {
            best = min(best, r - l + 1);
            sum -= a[l];
            l++;
        }
    }
    cout << (best == n + 1 ? 0 : best) << endl;
    return 0;
}
```

ყოველი ელემენტი ფანჯარაში ერთხელ შედის (`r`-ით) და ერთხელ გამოდის (`l`-ით), ამიტომ ორივე მაჩვენებელი სულ `n`-ჯერ მოძრაობს: `O(n)`. მეთოდი მუშაობს მხოლოდ დადებით რიცხვებზე: უარყოფითებთან ფანჯრის გაფართოება ჯამს შეიძლება შეამციროს. თუ ასეთი მონაკვეთი არ არსებობს, `best` საწყისად დარჩება (`n + 1`) და გამოიტანება 0.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long S;
    cin >> n >> S;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    int best = 0;
    for (int i = 0; i < n; i++) {
        long long sum = 0;
        for (int j = i; j < n; j++) {
            sum += a[j];
            if (sum >= S) {
                int len = j - i + 1;
                if (best == 0 || len < best) best = len;
                break;
            }
        }
    }
    cout << best << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 9)
print(n, random.randint(1, 25))
print(*[random.randint(1, 6) for _ in range(n)])
```

## ხის ჭრა
level: 4
tags: ორობითი ძებნა პასუხზე, ეფექტურობა

ტყეში `n` ხეა სხვადასხვა სიმაღლის. ხერხს აყენებენ სიმაღლეზე `H`: ყოველი ხე, რომელიც `H`-ზე მაღალია, გადაიჭრება `H` სიმაღლეზე და ზედა ნაწილი (`h − H` მეტრი) წაიღებენ; დანარჩენი ხეები უცვლელია. საჭიროა სულ მცირე `M` მეტრი მერქანი. იპოვეთ უდიდესი მთელი `H`, რომლისთვისაც საჭირო მერქანი მიიღება.

### შეყვანა

პირველ ხაზზე `n` და `M`. მეორე ხაზზე `n` ხის სიმაღლე.

### გამოტანა

ერთი რიცხვი: უდიდესი `H`.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 1 ≤ სიმაღლე ≤ 10⁹, 1 ≤ M ≤ 10¹⁴. გარანტირებულია, რომ ყველა ხის სიმაღლეთა ჯამი `M`-ზე ნაკლები არ არის (ანუ `H = 0` ყოველთვის გამოდგება).

### მაგალითი

```in
4 7
20 15 10 17
```

```out
15
```

### განმარტება

`H = 15`: მიიღება 5 + 0 + 0 + 2 = 7 მეტრი. `H = 16`-ზე მხოლოდ 4 + 0 + 0 + 1 = 5.

### მაგალითი

```in
1 5
5
```

```out
0
```

### შემოწმება

```in
2 1000000000
1000000000 1000000000
```

```out
500000000
```

### მინიშნებები

1. `H`-ის გაზრდისას მერქნის რაოდენობა მცირდება: ყოველი შემდგომი `H` ნაკლებს იძლევა ან იგივეს. რა თვისებაა ეს ორობითი ძებნისთვის?
2. თუ რომელიმე `H` გამოდგება, ყველა ნაკლები `H`-ც გამოდგება. ეს ნიშნავს, რომ გამოდგომის საზღვარი ორობითი ძებნით მოიძებნება.
3. ძებნის არე `[0, max(h)]`. `mid`-ისთვის ჯამეთ `max(0, h[i] - mid)` ყველა ხეზე (`long long`). თუ ჯამი `≥ M`, `mid` გამოდგება: `lo = mid`; წინააღმდეგ შემთხვევაში `hi = mid - 1`. `mid`-ის გამოთვლისას დამრგვალება ზემოთ გააკეთეთ: `(lo + hi + 1) / 2`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long M;
    cin >> n >> M;
    vector<long long> h(n);
    long long tallest = 0;
    for (int i = 0; i < n; i++) {
        cin >> h[i];
        tallest = max(tallest, h[i]);
    }
    long long lo = 0, hi = tallest;
    while (lo < hi) {
        long long mid = (lo + hi + 1) / 2;
        long long wood = 0;
        for (int i = 0; i < n; i++) {
            wood += max(0LL, h[i] - mid);
        }
        if (wood >= M) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    cout << lo << endl;
    return 0;
}
```

ეს არის „ორობითი ძებნა პასუხზე“: არა მასივში ელემენტს ვეძებთ, არამედ **ამოხსნის მნიშვნელობას**, რომელსაც მონოტონური თვისება აქვს (დიდი `H` უარესია). `(lo + hi + 1) / 2` აუცილებელია: როცა `lo = mid` ვანახლებთ, ჩვეულებრივი `(lo + hi) / 2` ზოგჯერ `mid = lo`-ს მოგვცემს და ციკლი დაიკიდება. ბიჯების რაოდენობა `log(10⁹) ≈ 30`, თითოეულზე `O(n)` მუშაობა.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long M;
    cin >> n >> M;
    vector<long long> h(n);
    long long tallest = 0;
    for (auto &x : h) {
        cin >> x;
        tallest = max(tallest, x);
    }
    for (long long H = tallest; H >= 0; H--) {
        long long wood = 0;
        for (long long x : h) wood += max(0LL, x - H);
        if (wood >= M) {
            cout << H << endl;
            return 0;
        }
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 6)
h = [random.randint(1, 12) for _ in range(n)]
print(n, random.randint(1, sum(h)))
print(*h)
```

## ინტერვალების გაერთიანება
level: 4
tags: sort, ინტერვალები, სიმულაცია

მოცემულია `n` მონაკვეთი რიცხვით ღერძზე: მონაკვეთი `[l, r]` ფარავს ღერძის ნაწილს სიგრძით `r − l`. მონაკვეთები შეიძლება გადაიფაროს. გამოთვალეთ ღერძის იმ ნაწილის საერთო სიგრძე, რომელსაც ერთი მონაკვეთი მაინც ფარავს.

### შეყვანა

პირველ ხაზზე `n`. შემდეგ `n` ხაზზე ორი რიცხვი `l` და `r`.

### გამოტანა

ერთი რიცხვი: დაფარული ნაწილის სიგრძე.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ l < r ≤ 10⁹

### მაგალითი

```in
3
1 4
2 6
8 10
```

```out
7
```

### განმარტება

პირველი ორი მონაკვეთი ერთიანდება `[1, 6]`-ად (სიგრძე 5), მესამეა `[8, 10]` (სიგრძე 2).

### შემოწმება

```in
2
0 5
1 3
```

```out
5
```

```in
2
0 1
1 2
```

```out
2
```

### მინიშნებები

1. თუ მონაკვეთებს მარცხენა ბოლოთი დაალაგებთ, გადაფარვა მხოლოდ მეზობლებს შორის ხდება.
2. შეინახეთ „მიმდინარე გაერთიანებული მონაკვეთი“ `[curL, curR]`. ახალი მონაკვეთი ან მასთან გადაიფარება (`l ≤ curR`), ან არა.
3. თუ გადაიფარა, გააფართოვეთ `curR = max(curR, r)`. თუ არა, მიმდინარე მონაკვეთის სიგრძე დაამატეთ ჯამს და ახალი დაიწყეთ. ბოლოს ბოლო მონაკვეთიც დაამატეთ.

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
    vector<pair<long long, long long>> seg(n);
    for (int i = 0; i < n; i++) {
        cin >> seg[i].first >> seg[i].second;
    }
    sort(seg.begin(), seg.end());
    long long total = 0;
    long long curL = seg[0].first, curR = seg[0].second;
    for (int i = 1; i < n; i++) {
        if (seg[i].first <= curR) {
            curR = max(curR, seg[i].second);
        } else {
            total += curR - curL;
            curL = seg[i].first;
            curR = seg[i].second;
        }
    }
    total += curR - curL;
    cout << total << endl;
    return 0;
}
```

წყვილების ვექტორი `sort`-ით ავტომატურად ლაგდება პირველი ელემენტით (და ტოლობისას მეორით). გაერთიანებისას `curR` მხოლოდ იზრდება. მონაკვეთები `[0, 1]` და `[1, 2]` ერთმანეთთან ეხება: შეიძლება გაერთიანდეს, პასუხი ორივე შემთხვევაში 2 იქნებოდა. ბოლო მონაკვეთის დამატება ციკლის შემდეგ არ დაივიწყოთ.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<bool> covered(40, false);
    for (int i = 0; i < n; i++) {
        int l, r;
        cin >> l >> r;
        for (int x = l; x < r; x++) covered[x] = true;
    }
    int total = 0;
    for (bool c : covered) total += c;
    cout << total << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 5)
print(n)
for _ in range(n):
    l = random.randint(0, 20)
    print(l, random.randint(l + 1, 25))
```

## დიაპაზონში დამატებები
level: 4
tags: სხვაობითი მასივი, ეფექტურობა, შეკითხვები

მასივი თავდაპირველად ნულებისგანაა. ეს გაქვთ `q` ოპერაცია: „`l`-დან `r`-მდე ყველა ელემენტს დაუმატე `v`“. გამოიტანეთ მასივი ყველა ოპერაციის შემდეგ.

### შეყვანა

პირველ ხაზზე `n` და `q`. შემდეგ `q` ხაზზე სამი რიცხვი `l`, `r`, `v` (პოზიციები 1-დან).

### გამოტანა

ერთ ხაზზე `n` რიცხვი: მასივის საბოლოო მდგომარეობა.

### შეზღუდვები

1 ≤ n, q ≤ 10⁵, 1 ≤ l ≤ r ≤ n, |v| ≤ 10⁴

### მაგალითი

```in
5 3
1 3 2
2 5 3
4 4 -1
```

```out
2 5 5 2 3
```

### განმარტება

ოპერაციების შემდეგ მასივი: `[2, 2, 2, 0, 0]` → `[2, 5, 5, 3, 3]` → `[2, 5, 5, 2, 3]`.

### შემოწმება

```in
1 1
1 1 7
```

```out
7
```

### მინიშნებები

1. ყოველ ოპერაციაზე `l`-დან `r`-მდე ელემენტების შეცვლა `O(n)` ღირს, სულ `O(n · q)` — ძალიან ბევრი.
2. იფიქრეთ მასივის „ცვლილებებზე“: დიაპაზონის დამატება მხოლოდ ორ ადგილას ცვლის სხვაობას მეზობლებს შორის.
3. შეინახეთ `d[i]` — სხვაობა ორ მეზობელ ელემენტს შორის. ოპერაცია `(l, r, v)` არის `d[l] += v` და `d[r + 1] -= v`. ბოლოს პრეფიქსული ჯამით აღადგინეთ მასივი.

### ამოხსნა

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<long long> d(n + 2, 0);
    for (int i = 0; i < q; i++) {
        int l, r;
        long long v;
        cin >> l >> r >> v;
        d[l] += v;
        d[r + 1] -= v;
    }
    long long current = 0;
    for (int i = 1; i <= n; i++) {
        current += d[i];
        cout << current << " ";
    }
    cout << endl;
    return 0;
}
```

სხვაობითი მასივი პრეფიქსული ჯამების „შებრუნებული“ ოპერაციაა. დიაპაზონში დამატება `O(1)`-ში სრულდება, ბოლოს ერთი გავლა აღადგენს ყველაფერს: სულ `O(n + q)`. მასივს `n + 2` ზომა აქვს, რომ `d[r + 1]` `r = n`-ზეც არსებობდეს.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<long long> a(n + 1, 0);
    while (q--) {
        int l, r;
        long long v;
        cin >> l >> r >> v;
        for (int i = l; i <= r; i++) a[i] += v;
    }
    for (int i = 1; i <= n; i++) cout << a[i] << " ";
    cout << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 7)
q = random.randint(1, 5)
print(n, q)
for _ in range(q):
    l = random.randint(1, n)
    print(l, random.randint(l, n), random.randint(-9, 9))
```

## ორგანზომილებიანი პრეფიქსული ჯამები
level: 4
tags: პრეფიქსული ჯამი, ორგანზომილებიანი მასივი, შეკითხვები

მოცემულია `n × m` ცხრილი და `q` შეკითხვა. ყოველი შეკითხვა `(r1, c1, r2, c2)` ითხოვს ელემენტების ჯამს მართკუთხედში, რომლის ზედა მარცხენა უჯრაა `(r1, c1)` და ქვედა მარჯვენა — `(r2, c2)` (ნომრები 1-დან).

### შეყვანა

პირველ ხაზზე `n`, `m` და `q`. შემდეგ `n` ხაზზე `m` რიცხვი. შემდეგ `q` ხაზზე ოთხი რიცხვი `r1 c1 r2 c2`.

### გამოტანა

`q` ხაზი: ყოველი მართკუთხედის ჯამი.

### შეზღუდვები

1 ≤ n, m ≤ 500, 1 ≤ q ≤ 10⁵, |რიცხვი| ≤ 10⁴

### მაგალითი

```in
3 3 2
1 2 3
4 5 6
7 8 9
1 1 2 2
2 2 3 3
```

```out
12
28
```

### შემოწმება

```in
1 1 1
-5
1 1 1 1
```

```out
-5
```

### მინიშნებები

1. ყოველი შეკითხვა `500 · 500` უჯრას ითვლის და შეკითხვებია 10⁵. ბევრი ზედმეტი მუშაობა.
2. ერთგანზომილებიანი პრეფიქსული ჯამის ანალოგი: `pre[i][j]` ჯამია მართკუთხედისა `(1, 1)`-დან `(i, j)`-მდე.
3. `pre[i][j] = a[i][j] + pre[i - 1][j] + pre[i][j - 1] - pre[i - 1][j - 1]`. მართკუთხედი `(r1, c1, r2, c2)`: `pre[r2][c2] - pre[r1 - 1][c2] - pre[r2][c1 - 1] + pre[r1 - 1][c1 - 1]`.

### ამოხსნა

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m, q;
    cin >> n >> m >> q;
    vector<vector<long long>> pre(n + 1, vector<long long>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            long long x;
            cin >> x;
            pre[i][j] = x + pre[i - 1][j] + pre[i][j - 1] - pre[i - 1][j - 1];
        }
    }
    for (int k = 0; k < q; k++) {
        int r1, c1, r2, c2;
        cin >> r1 >> c1 >> r2 >> c2;
        cout << pre[r2][c2] - pre[r1 - 1][c2] - pre[r2][c1 - 1] + pre[r1 - 1][c1 - 1] << "\n";
    }
    return 0;
}
```

ფორმულა „ჩართვა-გამორიცხვაა“: `pre[i - 1][j]` და `pre[i][j - 1]` ორივე მოიცავს `pre[i - 1][j - 1]`-ს, ამიტომ ის ერთხელ უნდა გამოვაკლოთ. ზუსტად იგივე სურათია შეკითხვისას. `0` სტრიქონი და სვეტი (`pre[0][*]`, `pre[*][0]`) განსაკუთრებულ შემთხვევებს გვარიდებს. წინასწარი გამოთვლა `O(nm)`, ყოველი შეკითხვა `O(1)`.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m, q;
    cin >> n >> m >> q;
    vector<vector<long long>> a(n + 1, vector<long long>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++) cin >> a[i][j];
    while (q--) {
        int r1, c1, r2, c2;
        cin >> r1 >> c1 >> r2 >> c2;
        long long s = 0;
        for (int i = r1; i <= r2; i++)
            for (int j = c1; j <= c2; j++) s += a[i][j];
        cout << s << "\n";
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 5)
m = random.randint(1, 5)
q = random.randint(1, 5)
print(n, m, q)
for _ in range(n):
    print(*[random.randint(-9, 9) for _ in range(m)])
for _ in range(q):
    r1 = random.randint(1, n)
    c1 = random.randint(1, m)
    print(r1, c1, random.randint(r1, n), random.randint(c1, m))
```

## უდიდესი რიცხვი გადაწყობით
level: 4
tags: sort, საკუთარი შედარება, string

მოცემულია `n` არაუარყოფითი მთელი რიცხვი. დააწყვეთ ისინი ერთმანეთის მიყოლებით ისეთი რიგით, რომ მიღებული დიდი რიცხვი (ჩაწერილი ერთ სტრიქონად) უდიდესი იყოს. გამოიტანეთ ეს რიცხვი.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` რიცხვი.

### გამოტანა

უდიდესი რიცხვი ათობითი ჩანაწერით. თუ ყველა რიცხვი ნულია, გამოიტანეთ `0`.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ რიცხვი ≤ 10⁹

### მაგალითი

```in
3
3 30 34
```

```out
34330
```

### განმარტება

ვარიანტებიდან უდიდესია `34` + `3` + `30`.

### მაგალითი

```in
2
0 0
```

```out
0
```

### შემოწმება

```in
1
5
```

```out
5
```

```in
4
9 91 90 8
```

```out
991908
```

### მინიშნებები

1. უბრალო დახარისხება კლებადობით არ გამოდგება: `30` უფრო დიდია, ვიდრე `3`, მაგრამ `3` უნდა იდგეს წინ.
2. ორი რიცხვისთვის `a` და `b` რომელი რიგი სჯობს: `ab` თუ `ba` (როგორც სტრიქონების გადაბმა)?
3. დაალაგეთ რიცხვები სტრიქონებად საკუთარი შედარებით: `a` წინ დგას `b`-ზე, თუ `a + b > b + a`. შემდეგ გადაბით ყველა. თუ პირველი სიმბოლო `'0'`-ია, ყველა რიცხვი ნულია: გამოიტანეთ `0`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

bool before(const string &a, const string &b) {
    return a + b > b + a;
}

int main() {
    int n;
    cin >> n;
    vector<string> s(n);
    for (int i = 0; i < n; i++) {
        cin >> s[i];
    }
    sort(s.begin(), s.end(), before);
    string result;
    for (const string &x : s) {
        result += x;
    }
    if (result[0] == '0') {
        result = "0";
    }
    cout << result << endl;
    return 0;
}
```

შედარების წესი `a + b > b + a` ნიშნავს: ორი რიგიდან ის, რომელიც დიდ რიცხვს გვაძლევს, ირჩევა. ეს წესი ტრანზიტულია, ამიტომ `sort` სწორად მუშაობს. მეთოდის ძალა: ორი მეზობელი ელემენტის გაცვლა რიგს ვერ გააუმჯობესებს, ამიტომ ლოკალურად ოპტიმალური რიგი გლობალურადაც ოპტიმალურია. ტესტი `0 0` აუცილებლად შეამოწმეთ.

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
    vector<string> s(n);
    for (auto &x : s) cin >> x;
    sort(s.begin(), s.end());
    string best;
    do {
        string t;
        for (auto &x : s) t += x;
        if (t > best) best = t;
    } while (next_permutation(s.begin(), s.end()));
    if (best[0] == '0') best = "0";
    cout << best << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 5)
print(n)
print(*[random.choice([0, 3, 30, 34, 9, 91, 90, 8, random.randint(0, 120)]) for _ in range(n)])
```
