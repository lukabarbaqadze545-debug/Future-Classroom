# თავი 14. სიხარბე და დინამიური პროგრამირება
weeks: 10–12

ამ თავში ორი ძლიერი იდეაა, რომლებიც „გადარჩევას“ ჭკვიანად ანაცვლებს.

**სიხარბე (greedy).** ყოველ ნაბიჯზე ვირჩევთ ლოკალურად საუკეთესოს და არასოდეს ვბრუნდებით უკან. ის სწრაფია, მაგრამ ყოველთვის სწორი არ არის: ყოველი სიხარბის ამოხსნა დამტკიცებას ითხოვს (ან ძლიერ შემოწმებას გადარჩევასთან შედარებით).

**დინამიური პროგრამირება (DP).** ამოცანას ვყოფთ გადაფარვადი პატარა ამოცანებად, ყოველ მათგანს ერთხელ ვხსნით და პასუხებს ვინახავთ. ყოველი DP ამოხსნა სამი კითხვით იწყება: 1) რას ნიშნავს მასივის ერთი უჯრა (`dp[i]`)? 2) როგორ გამოითვლება ის წინა უჯრებიდან? 3) რა არის საწყისი მნიშვნელობა?

წინაპირობა: რეკურსია (მე-13 თავი), სრული გადარჩევა (მე-10 თავი). ამ თავის ბევრ ამოცანას მათი „ნელი“ ვერსია უკვე ნახეთ: შეადარეთ, რამდენად შემცირდა მუშაობა.

## მონეტების გაცვლა
level: 2
tags: სიხარბე, მონეტები, ციკლი

მონეტებია 1, 2, 5, 10, 20 და 50 თეთრის ნომინალით (ყოველი ნომინალის მონეტა საკმარისი გაქვთ). გაცვალეთ თანხა `n` თეთრი მონეტების უმცირესი რაოდენობით.

### შეყვანა

ერთი მთელი რიცხვი `n`.

### გამოტანა

ერთი რიცხვი: მონეტების უმცირესი რაოდენობა.

### შეზღუდვები

1 ≤ n ≤ 10⁹

### მაგალითი

```in
93
```

```out
5
```

### განმარტება

93 = 50 + 20 + 20 + 2 + 1: ხუთი მონეტა.

### მაგალითი

```in
7
```

```out
2
```

### შემოწმება

```in
1000000000
```

```out
20000000
```

### მინიშნებები

1. სიცოცხლეში როგორ აგროვებთ თანხას მონეტებით? ჯერ ყველაზე დიდს იღებთ.
2. დაიწყეთ უდიდესი ნომინალით: რამდენჯერ ეტევა ის დარჩენილ თანხაში? შემდეგ გადადით შემდეგ ნომინალზე.
3. მასივი `{50, 20, 10, 5, 2, 1}`; ყოველი `c`-სთვის `count += n / c; n %= c`.

### ამოხსნა

```cpp
#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    const int coins[6] = {50, 20, 10, 5, 2, 1};
    long long count = 0;
    for (int c : coins) {
        count += n / c;
        n %= c;
    }
    cout << count << endl;
    return 0;
}
```

ეს ნომინალთა სისტემა სიხარბისთვის „კარგია“: უდიდესი მონეტის აღება არასოდეს აფუჭებს პასუხს (ჩვეულებრივი ფულის სისტემებიც ასეთია). ყველა სისტემა ასე არ არის: ნომინალებზე `{1, 3, 4}` თანხა 6 სიხარბით 4 + 1 + 1 (სამი მონეტა) გამოდის, მაგრამ უკეთესია 3 + 3 (ორი მონეტა). ასეთ ნომინალებზე დაგჭირდებათ DP (ამ თავის ერთ-ერთი ამოცანა).

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> dp(n + 1, 1 << 30);
    dp[0] = 0;
    int coins[6] = {1, 2, 5, 10, 20, 50};
    for (int i = 1; i <= n; i++)
        for (int c : coins)
            if (i >= c) dp[i] = min(dp[i], dp[i - c] + 1);
    cout << dp[n] << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
print(random.randint(1, 300))
```

## წერტილების დაფარვა
level: 3
tags: სიხარბე, დახარისხება, დაფარვა

ღერძზე მოცემულია `n` წერტილი. გაქვთ ნებისმიერი რაოდენობის მონაკვეთი სიგრძით `L`. მონაკვეთი, რომლის მარცხენა ბოლოც `x`-ია, ფარავს ყველა წერტილს `[x, x + L]` ინტერვალში (ბოლოების ჩათვლით). იპოვეთ მონაკვეთების უმცირესი რაოდენობა, რომელიც ყველა წერტილს დაფარავს.

### შეყვანა

პირველ ხაზზე `n` და `L`. მეორე ხაზზე `n` მთელი რიცხვი: წერტილების კოორდინატები.

### გამოტანა

ერთი რიცხვი: მონაკვეთების უმცირესი რაოდენობა.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ L ≤ 10⁹, 0 ≤ კოორდინატი ≤ 10⁹

### მაგალითი

```in
5 3
1 2 3 7 8
```

```out
2
```

### განმარტება

პირველი მონაკვეთი `[1, 4]` ფარავს 1, 2, 3; მეორე `[7, 10]` ფარავს 7, 8.

### მაგალითი

```in
1 5
100
```

```out
1
```

### შემოწმება

```in
3 0
5 5 6
```

```out
2
```

### მინიშნებები

1. წერტილების გადახედვა მარცხნიდან მარჯვნივ უფრო ბუნებრივია, ვიდრე ნებისმიერი რიგით.
2. პირველი (უმარცხენესი) წერტილი რაღაც მონაკვეთმა უნდა დაფაროს. ამ მონაკვეთის მარცხენა ბოლოს რა არჩევანი ყველაზე გამოსადეგია?
3. დაალაგეთ წერტილები. აიღეთ პირველი დაუფარავი წერტილი `x`, ჩადეთ მონაკვეთი `[x, x + L]`, გამოტოვეთ ყველა წერტილი, რომელიც ამ მონაკვეთში ხვდება, და გაიმეორეთ.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long L;
    cin >> n >> L;
    vector<long long> p(n);
    for (int i = 0; i < n; i++) {
        cin >> p[i];
    }
    sort(p.begin(), p.end());
    int segments = 0;
    int i = 0;
    while (i < n) {
        long long start = p[i];
        segments++;
        while (i < n && p[i] <= start + L) {
            i++;
        }
    }
    cout << segments << endl;
    return 0;
}
```

მონაკვეთის მარცხენა ბოლოს ზუსტად პირველ დაუფარავ წერტილზე ვდებთ: თუ მას მარცხნივ გავწევთ, დავკარგავთ უფრო მარჯვენა წერტილებს, თუ მარჯვნივ გავწევთ, პირველ წერტილს ვეღარ დავფარავთ. ამიტომ ეს არჩევანი არასოდეს არის საუკეთესოზე უარესი: ამ არგუმენტს „გაცვლის დამტკიცება“ ჰქვია. გამეორებული წერტილებიც ერთად იფარება.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long L;
    cin >> n >> L;
    vector<long long> p(n);
    for (auto &x : p) cin >> x;
    sort(p.begin(), p.end());
    vector<int> dp(n + 1, 1 << 30);
    dp[0] = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            if (p[i - 1] - p[j] <= L) dp[i] = min(dp[i], dp[j] + 1);
        }
    }
    cout << dp[n] << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 8)
print(n, random.randint(0, 6))
print(*[random.randint(0, 20) for _ in range(n)])
```

## ღონისძიებების არჩევა
level: 4
tags: სიხარბე, დახარისხება, ინტერვალები

დარბაზში ღონისძიებების მოთხოვნებია: `i`-ური ღონისძიება იწყება `s[i]` დროს და მთავრდება `e[i]`-ზე. ერთსა და იმავე დროს ორი ღონისძიება არ შეიძლება (თუ ერთი მეორეს ბოლო მომენტში იწყება, ეს დასაშვებია). აირჩიეთ ღონისძიებების მაქსიმალური რაოდენობა.

### შეყვანა

პირველ ხაზზე `n`. შემდეგ `n` ხაზზე ორი რიცხვი `s` და `e`.

### გამოტანა

ერთი რიცხვი: შერჩეული ღონისძიებების უდიდესი რაოდენობა.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ s < e ≤ 10⁹

### მაგალითი

```in
5
1 3
2 4
3 5
0 6
5 7
```

```out
3
```

### განმარტება

საუკეთესოა (1, 3), (3, 5), (5, 7).

### შემოწმება

```in
1
0 1
```

```out
1
```

```in
3
1 5
2 3
3 4
```

```out
2
```

### მინიშნებები

1. რა ღონისძიებით ივარაუდებთ დაწყებას, რომ დანარჩენებისთვის მაქსიმალური დრო დარჩეს?
2. ყველაზე ადრე დამთავრებადი ღონისძიება ყველაზე მეტ ადგილს ტოვებს.
3. დაალაგეთ ღონისძიებები დამთავრების დროით. გადახედეთ რიგით: თუ ღონისძიების დაწყება არ არის ბოლოს არჩეულის დამთავრებაზე ადრე, აირჩიეთ და განაახლეთ „ბოლო დამთავრება“.

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
    vector<pair<long long, long long>> events(n);
    for (int i = 0; i < n; i++) {
        long long s, e;
        cin >> s >> e;
        events[i] = {e, s};
    }
    sort(events.begin(), events.end());
    int count = 0;
    long long lastEnd = -1;
    for (const auto &event : events) {
        long long e = event.first, s = event.second;
        if (s >= lastEnd) {
            count++;
            lastEnd = e;
        }
    }
    cout << count << endl;
    return 0;
}
```

წყვილში დამთავრების დრო პირველია, რომ `sort` ის გამოიყენოს მთავარ გასაღებად. პირობა `s >= lastEnd` დასაშვებად ითვლის ღონისძიებას, რომელიც წინა მთავრდება იმავე მომენტში, როცა ეს იწყება. სიხარბეები „აირჩიე უადრეს დაწყებული“ ან „აირჩიე უმოკლესი“ ამ ამოცანაზე არასწორია: ზემოთ მოცემული ტესტი `1 5`, `2 3`, `3 4` პირველს არღვევს (ის 1 ღონისძიებას აირჩევდა, პასუხი კი 2-ია). სცადეთ თვითონ მოიფიქროთ საპირისპირო მაგალითი მეორისთვის.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> s(n), e(n);
    for (int i = 0; i < n; i++) cin >> s[i] >> e[i];
    int best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (int i = 0; i < n && ok; i++) {
            if (!(mask & (1 << i))) continue;
            for (int j = i + 1; j < n; j++) {
                if (!(mask & (1 << j))) continue;
                if (s[i] < e[j] && s[j] < e[i]) ok = false;
            }
        }
        if (ok) best = max(best, __builtin_popcount(mask));
    }
    cout << best << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 8)
print(n)
for _ in range(n):
    s = random.randint(0, 15)
    print(s, random.randint(s + 1, 20))
```

## ციფრების წაშლა
level: 5
tags: სიხარბე, სტეკი, სტრიქონები

მოცემულია დადებითი რიცხვი ათობითი ჩანაწერით (სტრიქონი) და `k`. წაშალეთ ზუსტად `k` ციფრი ისე, რომ დარჩენილი ციფრებით (თავდაპირველი რიგის დაცვით) შედგენილი რიცხვი შეიძლებოდეს უმცირესი ყოფილიყო. შედეგში წინა ნულები უგულებელყავით; თუ არაფერი დარჩა, გამოიტანეთ `0`.

### შეყვანა

ერთ ხაზზე სტრიქონი `num` (ციფრები, ნულით არ იწყება) და რიცხვი `k`.

### გამოტანა

ერთი რიცხვი: უმცირესი შედეგი წინა ნულების გარეშე.

### შეზღუდვები

1 ≤ `num`-ის სიგრძე ≤ 10⁵, 0 ≤ k ≤ `num`-ის სიგრძე

### მაგალითი

```in
1432219 3
```

```out
1219
```

### მაგალითი

```in
10200 1
```

```out
200
```

### განმარტება

`1`-ის წაშლის შემდეგ რჩება `0200`, ანუ `200`.

### მაგალითი

```in
10 2
```

```out
0
```

### შემოწმება

```in
9 0
```

```out
9
```

### მინიშნებები

1. უფრო მნიშვნელოვანია მარცხენა ციფრები: პატარა მარცხენა ციფრი უფრო მეტს ცვლის, ვიდრე ბოლო ციფრის სიმცირე.
2. თუ ციფრი მეორეზე დიდია მისი მარჯვენა მეზობლისგან, ამ დიდი ციფრის წაშლა რიცხვს ამცირებს.
3. გაიარეთ ციფრები და შეინახეთ შედეგის სტეკი. სანამ `k > 0` და სტეკის თავი ახალ ციფრზე დიდია, ამოიღეთ სტეკის თავი და შეამცირეთ `k`. შემდეგ ჩაამატეთ ახალი ციფრი. ბოლოს, თუ `k > 0` დარჩა, წაშალეთ ბოლო `k` ციფრი. მოაშორეთ წინა ნულები.

### ამოხსნა

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    string num;
    int k;
    cin >> num >> k;
    string kept;
    for (char c : num) {
        while (k > 0 && !kept.empty() && kept.back() > c) {
            kept.pop_back();
            k--;
        }
        kept.push_back(c);
    }
    kept.resize(kept.size() - k);
    size_t first = kept.find_first_not_of('0');
    if (first == string::npos) {
        cout << 0 << endl;
    } else {
        cout << kept.substr(first) << endl;
    }
    return 0;
}
```

როცა ახალი ციფრი უფრო პატარაა, ვიდრე ჩაწერილი უკანასკნელი, ეს უკანასკნელი „ხელს უშლის“: მისი წაშლა რიცხვს ამცირებს. სტეკი ამას ბუნებრივად გვაძლევს. თუ გავლის შემდეგ კიდევ დარჩა წასაშლელი ციფრი, ციფრები უკვე არადიდებადია და უმჯობესია ბოლოდან წაიშალოს (`resize`). ეს ამოცანა ერთ-ერთი ყველაზე რთულია: ჯერ ხელით გაიარეთ `1432219`.

### სტრესი

```brute
#include <iostream>
#include <string>
using namespace std;

int main() {
    string num;
    int k;
    cin >> num >> k;
    int n = num.size();
    int keep = n - k;
    string best;
    bool have = false;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (__builtin_popcount(mask) != keep) continue;
        string s;
        for (int i = 0; i < n; i++) if (mask & (1 << i)) s += num[i];
        size_t f = s.find_first_not_of('0');
        s = f == string::npos ? "0" : s.substr(f);
        if (!have || s.size() < best.size() || (s.size() == best.size() && s < best)) {
            best = s;
            have = true;
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
num = str(random.randint(1, 9)) + "".join(random.choice("0123456789") for _ in range(n - 1))
print(num, random.randint(0, n))
```

## ფიბონაჩი მოდულით
level: 3
tags: DP, ფიბონაჩი, მოდული, long long

გამოთვალეთ `n`-ური ფიბონაჩის რიცხვი `10⁹ + 7`-ზე გაყოფის ნაშთი. `F(1) = F(2) = 1`.

### შეყვანა

ერთი მთელი რიცხვი `n`.

### გამოტანა

ერთი რიცხვი: `F(n) mod (10⁹ + 7)`.

### შეზღუდვები

1 ≤ n ≤ 10⁶

### მაგალითი

```in
10
```

```out
55
```

### მაგალითი

```in
50
```

```out
586268941
```

### შემოწმება

```in
1000000
```

```out
918091266
```

### მინიშნებები

1. მე-13 თავში რეკურსია `n = 30`-ზეც ნელა მუშაობდა. რატომ? ერთსა და იმავეს ბევრჯერ ვითვლით.
2. შეინახეთ უკვე გამოთვლილი მნიშვნელობები მასივში: `dp[i]` არის `F(i)`.
3. `dp[1] = dp[2] = 1`; `dp[i] = (dp[i − 1] + dp[i − 2]) % MOD`. ბიჯები: `n` — წრფივი.

### ამოხსნა

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    const long long MOD = 1000000007;
    int n;
    cin >> n;
    vector<long long> dp(n + 2, 0);
    dp[1] = 1;
    dp[2] = 1;
    for (int i = 3; i <= n; i++) {
        dp[i] = (dp[i - 1] + dp[i - 2]) % MOD;
    }
    cout << dp[n] << endl;
    return 0;
}
```

ეს ყველაზე მარტივი DP-ია: `dp[i]` დამოკიდებულია ორ წინა უჯრაზე, ყოველ უჯრას ერთხელ ვითვლით. რეკურსიული ვერსიის ექსპონენციალური დრო წრფივი გახდა. `% MOD` ყოველი შეკრების შემდეგ აუცილებელია: რიცხვები ძალიან სწრაფად იზრდება და `long long`-შიც ვერ ეტევა. მოდულით ბევრი ამოცანა ასეა ფორმულირებული: „პასუხი ძალიან დიდია, ამიტომ მხოლოდ ნაშთი გვჭირდება“.

### სტრესი

```brute
#include <iostream>
using namespace std;

long long fib(int n) {
    if (n <= 2) return 1;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    int n;
    cin >> n;
    cout << fib(n) % 1000000007 << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
print(random.randint(1, 25))
```

## კიბე
level: 3
tags: DP, გზების დათვლა, მოდული

კიბეს `n` საფეხური აქვს. ერთ ნახტომში შეიძლება 1, 2 ან 3 საფეხურზე ასვლა. რამდენი სხვადასხვა გზით ავიდოდით კიბის ბოლოს (ზუსტად `n`-ურ საფეხურზე)? პასუხი გამოიტანეთ `10⁹ + 7`-ზე გაყოფის ნაშთით.

### შეყვანა

ერთი მთელი რიცხვი `n`.

### გამოტანა

ერთი რიცხვი: გზების რაოდენობა მოდულით.

### შეზღუდვები

1 ≤ n ≤ 10⁶

### მაგალითი

```in
4
```

```out
7
```

### განმარტება

გზებია: 1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2, 1+3, 3+1.

### მაგალითი

```in
10
```

```out
274
```

### შემოწმება

```in
1000000
```

```out
746580045
```

### მინიშნებები

1. იფიქრეთ ბოლო ნახტომზე: რომელი საფეხურიდან შეიძლებოდა `n`-ზე მოხვედრა?
2. `dp[n]` — გზების რაოდენობა `n`-ურ საფეხურზე. ბოლო ნახტომი იყო 1, 2 ან 3 საფეხურიანი.
3. `dp[i] = dp[i − 1] + dp[i − 2] + dp[i − 3]` (თუ ინდექსები არსებობს). საწყისი მნიშვნელობა: `dp[0] = 1` (ერთი გზა ადგილზე დგომის). ყოველი ჯამის შემდეგ აიღეთ ნაშთი.

### ამოხსნა

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    const long long MOD = 1000000007;
    int n;
    cin >> n;
    vector<long long> dp(n + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= n; i++) {
        dp[i] = dp[i - 1];
        if (i >= 2) dp[i] += dp[i - 2];
        if (i >= 3) dp[i] += dp[i - 3];
        dp[i] %= MOD;
    }
    cout << dp[n] << endl;
    return 0;
}
```

მნიშვნელოვანია ახსნა, რატომ ემატება: ყოველი გზა `i`-ზე ბოლო ნახტომით იყოფა: ან `i − 1`-დან, ან `i − 2`-დან, ან `i − 3`-დან. ეს ჯგუფები ერთმანეთს არ გადაიფარავს და ყველა გზას მოიცავს. `dp[0] = 1` მიგვიყვანს `dp[1] = 1`, `dp[2] = 2`, `dp[3] = 4`. ამ ტიპის ამოცანა („რამდენი გზა“) DP-ის კლასიკური გამოყენებაა.

### სტრესი

```brute
#include <iostream>
using namespace std;

long long ways(int n) {
    if (n < 0) return 0;
    if (n == 0) return 1;
    return ways(n - 1) + ways(n - 2) + ways(n - 3);
}

int main() {
    int n;
    cin >> n;
    cout << ways(n) % 1000000007 << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
print(random.randint(1, 20))
```

## გზები ბადეზე DP-ით
level: 3
tags: DP, ბადე, გზების დათვლა, მოდული

მოცემულია ბადე `n × m`: `.` თავისუფალია, `#` დაბრკოლებაა. ზედა მარცხენა უჯრიდან ქვედა მარჯვენამდე ყოველი ნაბიჯი ერთი უჯრით მარჯვნივ ან ქვემოთ. დაითვალეთ გზები (ნაშთი `10⁹ + 7`-ზე). მე-13 თავში იგივე ამოცანა მცირე ბადისთვის გქონდათ.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `n` ხაზზე `m`-სიმბოლოიანი სტრიქონი.

### გამოტანა

ერთი რიცხვი.

### შეზღუდვები

1 ≤ n, m ≤ 1000

### მაგალითი

```in
3 3
...
.#.
...
```

```out
2
```

### შემოწმება

```in
1 1
#
```

```out
0
```

```in
2 2
..
..
```

```out
2
```

### მინიშნებები

1. რეკურსია `1000 × 1000`-ზე შეუძლებლად ნელი იქნებოდა. რას გულისხმობს „უჯრაში გზები ორი წინა უჯრიდან მოდის“?
2. `dp[i][j]` — რამდენი გზით შეიძლება `(i, j)` უჯრაში მოხვედრა.
3. `dp[0][0] = 1`, თუ ის თავისუფალია. `#`-ზე `dp = 0`. წინააღმდეგ შემთხვევაში `dp[i][j] = dp[i − 1][j] + dp[i][j − 1]` (თუ ისინი არსებობს), ნაშთით. პასუხი `dp[n − 1][m − 1]`.

### ამოხსნა

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    const long long MOD = 1000000007;
    int n, m;
    cin >> n >> m;
    vector<string> grid(n);
    for (int i = 0; i < n; i++) {
        cin >> grid[i];
    }
    vector<vector<long long>> dp(n, vector<long long>(m, 0));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (grid[i][j] == '#') {
                dp[i][j] = 0;
            } else if (i == 0 && j == 0) {
                dp[i][j] = 1;
            } else {
                long long fromTop = i > 0 ? dp[i - 1][j] : 0;
                long long fromLeft = j > 0 ? dp[i][j - 1] : 0;
                dp[i][j] = (fromTop + fromLeft) % MOD;
            }
        }
    }
    cout << dp[n - 1][m - 1] << endl;
    return 0;
}
```

ყველა უჯრა ერთხელ გამოითვლება და მისი შედეგი ინახება. რიგი მნიშვნელოვანია: როცა `(i, j)` გამოითვლება, `(i − 1, j)` და `(i, j − 1)` უკვე მზადაა (გავლა მწკრივ-მწკრივ). დრო `O(nm)` — მილიონი უჯრა წამის მცირე ნაწილში.

### სტრესი

```brute
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int n, m;
vector<string> g;

long long paths(int i, int j) {
    if (i >= n || j >= m || g[i][j] == '#') return 0;
    if (i == n - 1 && j == m - 1) return 1;
    return paths(i + 1, j) + paths(i, j + 1);
}

int main() {
    cin >> n >> m;
    g.resize(n);
    for (auto &s : g) cin >> s;
    cout << paths(0, 0) % 1000000007 << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 5)
m = random.randint(1, 5)
print(n, m)
for _ in range(n):
    print("".join(random.choice("..#") for _ in range(m)))
```

## უმცირესი ჯამი გზაზე
level: 3
tags: DP, ბადე, მინიმუმი

ბადის ყოველ უჯრაში დადებითი რიცხვია („ფასი“). ზედა მარცხენა უჯრიდან ქვედა მარჯვენამდე, ყოველ ნაბიჯზე მარჯვნივ ან ქვემოთ, იპოვეთ გზა, რომლის უჯრების ფასების ჯამი უმცირესია. ორივე ბოლო უჯრა ითვლება.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `n` ხაზზე `m` რიცხვი.

### გამოტანა

ერთი რიცხვი: უმცირესი ჯამი.

### შეზღუდვები

1 ≤ n, m ≤ 1000, 1 ≤ ფასი ≤ 10⁴

### მაგალითი

```in
3 3
1 3 1
1 5 1
4 2 1
```

```out
7
```

### განმარტება

საუკეთესო გზა: 1 → 3 → 1 → 1 → 1 (ჯამი 7).

### შემოწმება

```in
1 1
5
```

```out
5
```

```in
1 3
1 2 3
```

```out
6
```

### მინიშნებები

1. ყოველ უჯრაში მოხვედრისას ორი წინა უჯრიდან ერთ-ერთით ვმოდივართ. რომელი სჯობს?
2. `dp[i][j]` — უმცირესი ჯამი `(i, j)` უჯრამდე.
3. `dp[i][j] = ფასი[i][j] + min(dp[i − 1][j], dp[i][j − 1])`, სადაც წინა უჯრა არსებობს. პირველი სტრიქონისა და პირველი სვეტის უჯრებს მხოლოდ ერთი წინა უჯრა აქვთ.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<long long>> dp(n, vector<long long>(m, 0));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            long long cost;
            cin >> cost;
            if (i == 0 && j == 0) {
                dp[i][j] = cost;
            } else if (i == 0) {
                dp[i][j] = cost + dp[i][j - 1];
            } else if (j == 0) {
                dp[i][j] = cost + dp[i - 1][j];
            } else {
                dp[i][j] = cost + min(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    cout << dp[n - 1][m - 1] << endl;
    return 0;
}
```

წინა ამოცანის „ჯამის“ ნაცვლად აქ „მინიმუმია“, ბადე კი იგივე. DP სქემა ერთი და იგივეა: უჯრის მნიშვნელობა წინა უჯრებიდან გამოითვლება. კიდეებზე (პირველი სტრიქონი და სვეტი) შემთხვევები ცალკეა, რადგან იქ ერთი წინა უჯრაა. ასეთი ამოცანა ორი გზით იხსნება: რეკურსია მემოიზაციით (უკვე გამოთვლილი პასუხების შენახვით) ან ციკლური ცხრილი; აქ ცხრილია.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int n, m;
vector<vector<int>> c;

int best(int i, int j) {
    if (i == n - 1 && j == m - 1) return c[i][j];
    int r = 1 << 30;
    if (i + 1 < n) r = min(r, best(i + 1, j));
    if (j + 1 < m) r = min(r, best(i, j + 1));
    return c[i][j] + r;
}

int main() {
    cin >> n >> m;
    c.assign(n, vector<int>(m));
    for (auto &row : c)
        for (auto &x : row) cin >> x;
    cout << best(0, 0) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 5)
m = random.randint(1, 5)
print(n, m)
for _ in range(n):
    print(*[random.randint(1, 9) for _ in range(m)])
```

## მონეტები ნებისმიერი ნომინალით
level: 4
tags: DP, მონეტები, მინიმუმი

გაქვთ `n` სახის მონეტა (ყოველი სახის მონეტა საკმარისია) მოცემული ნომინალებით. გაცვალეთ თანხა `S` მონეტების უმცირესი რაოდენობით. თუ ეს შეუძლებელია, გამოიტანეთ `-1`.

### შეყვანა

პირველ ხაზზე `n` და `S`. მეორე ხაზზე `n` ნომინალი.

### გამოტანა

ერთი რიცხვი: მონეტების უმცირესი რაოდენობა ან `-1`.

### შეზღუდვები

1 ≤ n ≤ 100, 1 ≤ ნომინალი ≤ 10⁴, 1 ≤ S ≤ 10⁵

### მაგალითი

```in
3 11
1 2 5
```

```out
3
```

### განმარტება

11 = 5 + 5 + 1.

### მაგალითი

```in
2 3
2 4
```

```out
-1
```

### შემოწმება

```in
3 6
1 3 4
```

```out
2
```

### მინიშნებები

1. სიხარბე აქ ყოველთვის არ მუშაობს (იხ. ამ თავის პირველი ამოცანა). ნომინალებზე 1, 3, 4 თანხა 6 არ ამოხსნის სიხარბეს.
2. `dp[x]` — უმცირესი რაოდენობა მონეტებისა, რომლებითაც `x` თანხა გროვდება.
3. `dp[0] = 0`; ყველა დანარჩენი თავიდან „უსასრულობაა“. ყოველი `x`-სთვის და ნომინალისთვის `c ≤ x` თუ `dp[x − c]` უსასრულო არ არის, `dp[x] = min(dp[x], dp[x − c] + 1)`. ბოლოს `dp[S]`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, S;
    cin >> n >> S;
    vector<int> coins(n);
    for (int i = 0; i < n; i++) {
        cin >> coins[i];
    }
    const int INF = 1 << 30;
    vector<int> dp(S + 1, INF);
    dp[0] = 0;
    for (int x = 1; x <= S; x++) {
        for (int c : coins) {
            if (c <= x && dp[x - c] != INF) {
                dp[x] = min(dp[x], dp[x - c] + 1);
            }
        }
    }
    cout << (dp[S] == INF ? -1 : dp[S]) << endl;
    return 0;
}
```

`dp[x]` ცდის ყველა შესაძლო ბოლო მონეტას. უსასრულობა (`INF`) „მიუღწეველი“ თანხის ნიშანია: მას ვაკვირდებით, რომ `INF + 1` არ გავზარდოთ. დრო `O(S · n)` — 10⁷. სიხარბე ამ ამოცანაზე ზოგჯერ ცდება, DP კი ყოველთვის სწორია: ყოველ `x`-ზე ის ყველა შესაძლო ბოლო მონეტას ცდის.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

vector<int> coins;

int go(int left) {
    if (left == 0) return 0;
    int best = 1 << 28;
    for (int c : coins)
        if (c <= left) best = min(best, 1 + go(left - c));
    return best;
}

int main() {
    int n, S;
    cin >> n >> S;
    coins.resize(n);
    for (auto &c : coins) cin >> c;
    int r = go(S);
    cout << (r >= (1 << 28) ? -1 : r) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 3)
print(n, random.randint(1, 14))
print(*[random.randint(1, 6) for _ in range(n)])
```

## ორი თანაბარი ჯგუფი
level: 4
tags: DP, ქვესიმრავლის ჯამი, ლოგიკური მასივი

შეიძლება თუ არა `n` რიცხვის გაყოფა ორ ჯგუფად (ყოველი რიცხვი ზუსტად ერთ ჯგუფში) ისე, რომ ორივე ჯგუფის ჯამი ტოლი იყოს? გამოიტანეთ `YES` ან `NO`.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` დადებითი რიცხვი.

### გამოტანა

`YES` ან `NO`.

### შეზღუდვები

1 ≤ n ≤ 100, 1 ≤ რიცხვი ≤ 100

### მაგალითი

```in
4
1 5 11 5
```

```out
YES
```

### განმარტება

ჯგუფები: {11} და {1, 5, 5}: ორივეს ჯამი 11-ია.

### მაგალითი

```in
3
1 2 5
```

```out
NO
```

### შემოწმება

```in
1
4
```

```out
NO
```

```in
2
3 3
```

```out
YES
```

### მინიშნებები

1. თუ ჯამი კენტია, პასუხი რა იქნება? თუ ლუწია, რა უნდა მოიძებნოს?
2. საკმარისია იპოვოთ ქვესიმრავლე ჯამით `total / 2`. ეს ქვესიმრავლის ჯამის ამოცანაა, მაგრამ `n = 100`-ზე გადარჩევა შეუძლებელია.
3. `can[s]` — შესაძლებელია თუ არა ჯამი `s` მიმდინარე რიცხვებით. თავიდან `can[0] = true`. ყოველი რიცხვისთვის `x` გაიარეთ `s` ზემოდან ქვემოთ `target`-დან `x`-მდე და თუ `can[s − x]`, მაშინ `can[s] = true`.

### ამოხსნა

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    int total = 0;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        total += a[i];
    }
    if (total % 2 != 0) {
        cout << "NO" << endl;
        return 0;
    }
    int target = total / 2;
    vector<bool> can(target + 1, false);
    can[0] = true;
    for (int x : a) {
        for (int s = target; s >= x; s--) {
            if (can[s - x]) {
                can[s] = true;
            }
        }
    }
    cout << (can[target] ? "YES" : "NO") << endl;
    return 0;
}
```

ციკლი `s` ზემოდან ქვემოთ მიდის: ასე ერთი და იგივე რიცხვი ერთხელ მხოლოდ გამოიყენება (თუ ქვემოდან ზემოთ ვივლიდით, `x` ბევრჯერ ჩაითვლებოდა). დრო `O(n · total)` — 10⁶. ეს ქვესიმრავლის ჯამის ამოცანის ეფექტური ამოხსნაა: ბიტმასკით გადარჩევა 2¹⁰⁰ ვარიანტს მოითხოვდა.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    int total = 0;
    for (auto &x : a) {
        cin >> x;
        total += x;
    }
    bool ok = false;
    for (int mask = 0; mask < (1 << n); mask++) {
        int s = 0;
        for (int i = 0; i < n; i++) if (mask & (1 << i)) s += a[i];
        if (2 * s == total) ok = true;
    }
    cout << (ok ? "YES" : "NO") << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 10)
print(n)
print(*[random.randint(1, 9) for _ in range(n)])
```

## ზურგჩანთა: დინამიური პროგრამირება
level: 4
tags: DP, ზურგჩანთა, ოპტიმიზაცია

იგივე ამოცანაა, რაც მე-10 თავის „ზურგჩანთა გადარჩევით“, მხოლოდ შეზღუდვები დიდია. ზურგჩანთა იტევს `W` წონამდე; ყოველ ნივთს აქვს წონა და ფასეულობა; ნივთი ერთხელ შეიძლება აიღოთ. იპოვეთ უდიდესი ჯამური ფასეულობა.

### შეყვანა

პირველ ხაზზე `n` და `W`. შემდეგ `n` ხაზზე ორი რიცხვი: წონა და ფასეულობა.

### გამოტანა

ერთი რიცხვი: უდიდესი ჯამური ფასეულობა.

### შეზღუდვები

1 ≤ n ≤ 100, 1 ≤ W ≤ 10⁴, 1 ≤ წონა ≤ 10⁴, 1 ≤ ფასეულობა ≤ 10⁶

### მაგალითი

```in
3 5
2 3
3 4
4 5
```

```out
7
```

### შემოწმება

```in
1 1
2 100
```

```out
0
```

### მინიშნებები

1. `2¹⁰⁰` ქვესიმრავლის გადარჩევა შეუძლებელია. რას გვეუბნება „პირველი `i` ნივთიდან ამ ტევადობით“ ამოცანა?
2. `dp[w]` — უდიდესი ფასეულობა, რომლის წონა `w`-ს არ აღემატება (თუ გადავხედეთ პირველ `i` ნივთს).
3. ყოველი ნივთისთვის (წონა `a`, ფასეულობა `b`) განაახლეთ `dp[w] = max(dp[w], dp[w − a] + b)` ყოველი `w`-სთვის `W`-დან `a`-მდე (კლებადი რიგით, რომ ნივთი ერთხელ აიღოთ). პასუხი `dp[W]`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, W;
    cin >> n >> W;
    vector<long long> dp(W + 1, 0);
    for (int i = 0; i < n; i++) {
        int a;
        long long b;
        cin >> a >> b;
        for (int w = W; w >= a; w--) {
            dp[w] = max(dp[w], dp[w - a] + b);
        }
    }
    cout << dp[W] << endl;
    return 0;
}
```

დრო `O(n · W)` = 10⁶ ოპერაცია; გადარჩევა 2¹⁰⁰-ს მოითხოვდა. `dp[w]` თავიდან 0-ია, ამიტომ ყოველი `w`-სთვის „ცარიელი ან ნაკლები შევსება“ ითვლება. ციკლი `w` მიმართულებით კლებადობით აუცილებელია: ზრდადობით ერთი ნივთი ბევრჯერ ჩაიტვირთებოდა (ეს შეუზღუდავი ზურგჩანთის ამოცანაა). შეადარეთ მე-10 თავის პასუხებს იმავე პატარა ტესტებზე.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int n;
vector<long long> w, v;

long long go(int i, long long left) {
    if (i == n) return 0;
    long long best = go(i + 1, left);
    if (w[i] <= left) best = max(best, v[i] + go(i + 1, left - w[i]));
    return best;
}

int main() {
    long long W;
    cin >> n >> W;
    w.resize(n);
    v.resize(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> v[i];
    cout << go(0, W) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 8)
print(n, random.randint(1, 20))
for _ in range(n):
    print(random.randint(1, 10), random.randint(1, 20))
```

## უდიდესი ზრდადი ქვემიმდევრობა
level: 4
tags: DP, ქვემიმდევრობა, ჩადგმული ციკლები

ქვემიმდევრობა არის მასივიდან ელემენტების არჩევა თავდაპირველი რიგით (ელემენტები ზედიზედ დგომა არ არის აუცილებელი). იპოვეთ უდიდესი სიგრძის მკაცრად ზრდადი ქვემიმდევრობა.

### შეყვანა

პირველ ხაზზე `n`. მეორე ხაზზე `n` მთელი რიცხვი.

### გამოტანა

ერთი რიცხვი: სიგრძე.

### შეზღუდვები

1 ≤ n ≤ 1000, |რიცხვი| ≤ 10⁹

### მაგალითი

```in
8
10 9 2 5 3 7 101 18
```

```out
4
```

### განმარტება

მაგალითად, 2, 3, 7, 18.

### შემოწმება

```in
1
5
```

```out
1
```

```in
5
5 4 3 2 1
```

```out
1
```

```in
4
7 7 7 7
```

```out
1
```

### მინიშნებები

1. `2ⁿ` ქვემიმდევრობის გადარჩევა `n = 1000`-ზე შეუძლებელია. რა ინფორმაცია გჭირდებათ ყოველი ახალი ელემენტისთვის?
2. `dp[i]` — უდიდესი ზრდადი ქვემიმდევრობის სიგრძე, რომელიც ზუსტად `i`-ურ ელემენტზე მთავრდება.
3. `dp[i] = 1 + max(dp[j])` ყველა `j < i`-ისთვის, სადაც `a[j] < a[i]` (თუ ასეთი `j` არ არის, `dp[i] = 1`). პასუხი — `dp`-ის უდიდესი მნიშვნელობა.

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
    vector<int> dp(n, 1);
    int best = 1;
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (a[j] < a[i]) {
                dp[i] = max(dp[i], dp[j] + 1);
            }
        }
        best = max(best, dp[i]);
    }
    cout << best << endl;
    return 0;
}
```

აქ `dp[i]` განსაზღვრულია „ზუსტად `i`-ურზე ბოლოვდება“: პასუხი არ არის `dp[n − 1]`, არამედ ყველა `dp[i]`-ის მაქსიმუმი. ორი ჩადგმული ციკლი `O(n²)`: `n = 1000`-ზე მილიონი ოპერაციაა. არსებობს ამოხსნა `O(n log n)` დროში, ორობითი ძებნით: სცადეთ თავად მოიფიქროთ.

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
    int best = 0;
    for (int mask = 1; mask < (1 << n); mask++) {
        int last = -1000000, len = 0;
        bool ok = true;
        for (int i = 0; i < n; i++) {
            if (!(mask & (1 << i))) continue;
            if (a[i] <= last) ok = false;
            last = a[i];
            len++;
        }
        if (ok) best = max(best, len);
    }
    cout << best << endl;
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

## უდიდესი საერთო ქვემიმდევრობა
level: 4
tags: DP, ორგანზომილებიანი DP, სტრიქონები

მოცემულია ორი სტრიქონი. იპოვეთ ორივეში ერთდროულად შემავალი უდიდესი სიგრძის ქვემიმდევრობა (სიმბოლოები ორივე სტრიქონში ერთი და იგივე რიგით, მაგრამ ზედიზედ დგომა არ არის აუცილებელი) და გამოიტანეთ მისი სიგრძე.

### შეყვანა

ერთ ხაზზე ორი სტრიქონი `a` და `b` (ინტერვალების გარეშე).

### გამოტანა

ერთი რიცხვი.

### შეზღუდვები

1 ≤ |a|, |b| ≤ 1000

### მაგალითი

```in
abcde ace
```

```out
3
```

### განმარტება

საერთო ქვემიმდევრობაა `ace`.

### მაგალითი

```in
abc def
```

```out
0
```

### შემოწმება

```in
aaaa aa
```

```out
2
```

### მინიშნებები

1. შეადარეთ ორი სტრიქონის ბოლო სიმბოლოები. თუ ისინი ტოლია, რას ნიშნავს ეს პასუხისთვის? თუ განსხვავებულია?
2. `dp[i][j]` — პასუხი პირველი სტრიქონის პირველი `i` და მეორეს პირველი `j` სიმბოლოსთვის.
3. თუ `a[i − 1] == b[j − 1]`, `dp[i][j] = dp[i − 1][j − 1] + 1`. წინააღმდეგ შემთხვევაში `dp[i][j] = max(dp[i − 1][j], dp[i][j − 1])`. `dp[0][*] = dp[*][0] = 0`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string a, b;
    cin >> a >> b;
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    cout << dp[n][m] << endl;
    return 0;
}
```

ორგანზომილებიანი DP: ორი სტრიქონის პრეფიქსებს ვადარებთ. ტოლი ბოლო სიმბოლოები საერთო ქვემიმდევრობას აგრძელებს; განსხვავებული — ვცდით ერთ-ერთი სტრიქონიდან ბოლო სიმბოლოს გაგდებას. ცხრილი `(n + 1) × (m + 1)`-ია, რომ ნულოვანი პრეფიქსები (`i = 0` ან `j = 0`) ცალკე შემთხვევებს არ ითხოვდეს. დრო და მეხსიერება `O(nm)`.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <string>
using namespace std;

string a, b;

int go(int i, int j) {
    if (i == (int)a.size() || j == (int)b.size()) return 0;
    if (a[i] == b[j]) return 1 + go(i + 1, j + 1);
    return max(go(i + 1, j), go(i, j + 1));
}

int main() {
    cin >> a >> b;
    cout << go(0, 0) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
a = "".join(random.choice("abc") for _ in range(random.randint(1, 7)))
b = "".join(random.choice("abc") for _ in range(random.randint(1, 7)))
print(a, b)
```

## რედაქტირების მანძილი
level: 5
tags: DP, ორგანზომილებიანი DP, სტრიქონები, რედაქტირება

სტრიქონზე ერთ ნაბიჯში შეიძლება ერთ-ერთი ოპერაცია: სიმბოლოს ჩასმა, სიმბოლოს წაშლა ან სიმბოლოს შეცვლა სხვა სიმბოლოთი. იპოვეთ ნაბიჯების უმცირესი რაოდენობა, რომლითაც `a` გადაიქცევა `b`-ად.

### შეყვანა

ერთ ხაზზე ორი სტრიქონი `a` და `b` (ინტერვალების გარეშე).

### გამოტანა

ერთი რიცხვი: უმცირესი ნაბიჯების რაოდენობა.

### შეზღუდვები

1 ≤ |a|, |b| ≤ 1000

### მაგალითი

```in
kitten sitting
```

```out
3
```

### განმარტება

kitten → sitten (შეცვლა k→s) → sittin (შეცვლა e→i) → sitting (ჩასმა g).

### მაგალითი

```in
abc abc
```

```out
0
```

### შემოწმება

```in
a b
```

```out
1
```

```in
abc a
```

```out
2
```

### მინიშნებები

1. შეადარეთ ორივე სტრიქონის ბოლო სიმბოლოები. თუ ისინი ტოლია, რა ღირს ეს? თუ არა, რა სამი ვარიანტია?
2. `dp[i][j]` — უმცირესი ნაბიჯები `a`-ს პირველი `i` სიმბოლოს `b`-ს პირველ `j` სიმბოლოდ გადასაქცევად.
3. თუ `a[i − 1] == b[j − 1]`, `dp[i][j] = dp[i − 1][j − 1]`. წინააღმდეგ შემთხვევაში `1 + min(dp[i − 1][j] (წაშლა), dp[i][j − 1] (ჩასმა), dp[i − 1][j − 1] (შეცვლა))`. საწყისი: `dp[i][0] = i`, `dp[0][j] = j`.

### ამოხსნა

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string a, b;
    cin >> a >> b;
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 0; i <= n; i++) {
        dp[i][0] = i;
    }
    for (int j = 0; j <= m; j++) {
        dp[0][j] = j;
    }
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
            }
        }
    }
    cout << dp[n][m] << endl;
    return 0;
}
```

საწყისი მნიშვნელობები ბუნებრივია: ცარიელი სტრიქონიდან `j` სიმბოლოს მისაღებად `j` ჩასმაა საჭირო, `i` სიმბოლოს ცარიელი სტრიქონი მისაღებად — `i` წაშლა. სამი ოპერაცია ტრანზიციებს შეესაბამება: წაშლა ეგზავნება `(i − 1, j)`-ზე, ჩასმა `(i, j − 1)`-ზე, შეცვლა `(i − 1, j − 1)`-ზე. ეს ალგორითმი (ლევენშტეინის მანძილი) გამოიყენება ორთოგრაფიის შემოწმებასა და მსგავსი ტექსტების ძიებაში. ეს წიგნის ერთ-ერთი ყველაზე რთული ამოცანაა: პატარა ცხრილი ხელით შეავსეთ.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <string>
using namespace std;

string a, b;

int go(int i, int j) {
    if (i == (int)a.size()) return b.size() - j;
    if (j == (int)b.size()) return a.size() - i;
    if (a[i] == b[j]) return go(i + 1, j + 1);
    return 1 + min({go(i + 1, j), go(i, j + 1), go(i + 1, j + 1)});
}

int main() {
    cin >> a >> b;
    cout << go(0, 0) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
a = "".join(random.choice("abc") for _ in range(random.randint(1, 6)))
b = "".join(random.choice("abc") for _ in range(random.randint(1, 6)))
print(a, b)
```
