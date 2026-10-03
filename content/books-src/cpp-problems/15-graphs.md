# თავი 15. გრაფები და ბადეზე ძებნა
weeks: 12+

გრაფი წვეროებისა და წიბოების (კავშირების) ერთობლიობაა: ქალაქები და გზები, ადამიანები და მეგობრობა, სამუშაოები და მათი დამოკიდებულებები. ბადეც (მაგალითად, ლაბირინთი) გრაფია: უჯრები წვეროებია, მეზობელი უჯრები — წიბოები.

ამ თავის ძირითადი ინსტრუმენტებია: გრაფის შენახვა (მეზობლობის სია), სიგანეში ძებნა (BFS) უმოკლესი გზებისთვის, კომპონენტებისა და ორმხრივობის შემოწმება, წარმოდგენა `DSU`-ით (გაერთიანება-ძებნის სტრუქტურა), ტოპოლოგიური დალაგება და დეიკსტრას ალგორითმი წონიან გრაფში.

წინაპირობა: რეკურსია, STL (`queue`, `priority_queue`, `vector`). წვეროები დანომრილია 1-დან `n`-მდე, თუ სხვაგვარად არ წერია. დიდ გრაფზე (10⁵ წვერო) რეკურსიული DFS სტეკის გადავსებას შეიძლება გამოიწვიოს, ამიტომ ამ თავის ამოხსნებში ძირითადად `queue` ან `stack` გამოიყენება.

გრაფის შეყვანის ფორმატი: პირველ ხაზზე წვეროების რაოდენობა `n` და წიბოების რაოდენობა `m`, შემდეგ `m` ხაზზე წიბო `u v`. თუ პირობაში სხვა არ წერია, გრაფი არაორიენტირებულია, პარალელურ წიბოებს და მარყუჟებს (`u = v`) არ შეიცავს.

## წვეროების ხარისხები
level: 2
tags: გრაფი, ხარისხი, წიბოები

წვეროს ხარისხი არის მასზე მიმაგრებული წიბოების რაოდენობა. გამოთვალეთ ყველა წვეროს ხარისხი.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `m` ხაზზე წიბო `u v`.

### გამოტანა

ერთ ხაზზე `n` რიცხვი: წვეროების ხარისხები 1-დან `n`-მდე.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ m ≤ 10⁵

### მაგალითი

```in
4 3
1 2
2 3
2 4
```

```out
1 3 1 1
```

### შემოწმება

```in
3 0
```

```out
0 0 0
```

### მინიშნებები

1. ყოველი წიბო ორი წვეროს ხარისხს ზრდის.
2. საკმარისია მრიცხველების მასივი: `degree[1..n]`.
3. ყოველი წიბოსთვის `degree[u]++` და `degree[v]++`.

### ამოხსნა

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<int> degree(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        degree[u]++;
        degree[v]++;
    }
    for (int v = 1; v <= n; v++) {
        cout << degree[v] << " ";
    }
    cout << endl;
    return 0;
}
```

წვეროები 1-დან არის დანომრილი, ამიტომ მასივს `n + 1` ზომა აქვს და უჯრა 0 გამოუყენებელია: ეს ხშირი და მოსახერხებელი ჩვევაა. ხარისხების ჯამი ყოველთვის `2m`-ია (ყოველი წიბო ორჯერ ითვლება): ეს კარგი თვითშემოწმებაა.

## არსებობს თუ არა წიბო
level: 2
tags: გრაფი, მეზობლობის მატრიცა, შეკითხვები

მოცემულია გრაფი და `q` შეკითხვა. ყოველ შეკითხვაზე გამოიტანეთ `YES`, თუ წვეროებს `u` და `v` შორის წიბო არსებობს, და `NO` — თუ არა.

### შეყვანა

პირველ ხაზზე `n`, `m` და `q`. შემდეგ `m` ხაზზე წიბო `u v`. შემდეგ `q` ხაზზე შეკითხვა `u v`.

### გამოტანა

`q` ხაზი: `YES` ან `NO`.

### შეზღუდვები

1 ≤ n ≤ 1000, 0 ≤ m ≤ 10⁵, 1 ≤ q ≤ 10⁵

### მაგალითი

```in
4 3 3
1 2
2 3
2 4
1 2
1 3
4 2
```

```out
YES
NO
YES
```

### შემოწმება

```in
1 0 1
1 1
```

```out
NO
```

### მინიშნებები

1. წიბოს არსებობა უნდა შევამოწმოთ ერთ ოპერაციაში. რა გამოდგება ამისთვის?
2. ორგანზომილებიანი ცხრილი `adj[u][v]`: ჭეშმარიტია, თუ წიბო არსებობს.
3. არაორიენტირებული წიბოსთვის ჩაწერეთ ორივე `adj[u][v]` და `adj[v][u]`. `n = 1000` ნიშნავს `10⁶` უჯრას: მეხსიერებაში ეტევა.

### ამოხსნა

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m, q;
    cin >> n >> m >> q;
    vector<vector<bool>> adj(n + 1, vector<bool>(n + 1, false));
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u][v] = true;
        adj[v][u] = true;
    }
    for (int i = 0; i < q; i++) {
        int u, v;
        cin >> u >> v;
        cout << (adj[u][v] ? "YES" : "NO") << "\n";
    }
    return 0;
}
```

მეზობლობის მატრიცა სწრაფად პასუხობს „არის თუ არა წიბო“ შეკითხვას (`O(1)`), მაგრამ ხარჯავს `n²` მეხსიერებას: `n = 10⁵`-ზე ეს ათი მილიარდი უჯრაა, ამიტომ დიდი გრაფებისთვის შეუძლებელია. მაშინ გამოიყენება მეზობლობის სიები (`vector<vector<int>>`), როგორც შემდეგ ამოცანებში.

## კავშირის კომპონენტები
level: 3
tags: გრაფი, BFS, კომპონენტები, მეზობლობის სია

გრაფის კავშირის კომპონენტი არის წვეროთა ისეთი მაქსიმალური ჯგუფი, რომლის ნებისმიერი ორი წვერო ერთმანეთთან გზით არის დაკავშირებული. დაითვალეთ კომპონენტების რაოდენობა (იზოლირებული წვეროც ცალკე კომპონენტია).

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `m` ხაზზე წიბო `u v`.

### გამოტანა

ერთი რიცხვი: კომპონენტების რაოდენობა.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ m ≤ 10⁵

### მაგალითი

```in
5 3
1 2
2 3
4 5
```

```out
2
```

### მაგალითი

```in
6 2
1 2
3 4
```

```out
4
```

### შემოწმება

```in
1 0
```

```out
1
```

### მინიშნებები

1. აიღეთ წვერო და მონიშნეთ ყველა წვერო, რომლამდეც მისგან გზა არსებობს. ეს ერთი კომპონენტია.
2. შეინახეთ გრაფი მეზობლობის სიებით და მასივი `visited[]`. გაიარეთ წვეროები 1-დან `n`-მდე: თუ წვერო ჯერ არ მონახულებულა, ეს ახალი კომპონენტია.
3. ახალი კომპონენტისთვის გაუშვით BFS (რიგით): გაზარდეთ მრიცხველი, ჩაამატეთ წვერო რიგში, ამოიღეთ და მონიშნეთ მისი ყველა ჯერ მიუღწეველი მეზობელი.

### ამოხსნა

```cpp
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    vector<bool> visited(n + 1, false);
    int components = 0;
    for (int start = 1; start <= n; start++) {
        if (visited[start]) {
            continue;
        }
        components++;
        queue<int> q;
        q.push(start);
        visited[start] = true;
        while (!q.empty()) {
            int v = q.front();
            q.pop();
            for (int next : graph[v]) {
                if (!visited[next]) {
                    visited[next] = true;
                    q.push(next);
                }
            }
        }
    }
    cout << components << endl;
    return 0;
}
```

ყოველი წვერო რიგში ერთხელ მოხვდება და ყოველი წიბო ორჯერ განიხილება, ამიტომ დრო `O(n + m)`-ია. წვეროს მონიშვნა რიგში ჩადებისთანავე ხდება, რომ ის ორჯერ არ ჩაიდოს. DFS-ით (რეკურსიით ან სტეკით) იგივე შედეგი მიიღებოდა.

### სტრესი

```brute
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

vector<int> parent;

int find(int x) {
    return parent[x] == x ? x : parent[x] = find(parent[x]);
}

int main() {
    int n, m;
    cin >> n >> m;
    parent.resize(n + 1);
    iota(parent.begin(), parent.end(), 0);
    int components = n;
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        int a = find(u), b = find(v);
        if (a != b) {
            parent[a] = b;
            components--;
        }
    }
    cout << components << endl;
    return 0;
}
```

```gen
import random, sys, itertools
random.seed(int(sys.argv[1]))
n = random.randint(1, 7)
pairs = list(itertools.combinations(range(1, n + 1), 2))
edges = random.sample(pairs, random.randint(0, min(len(pairs), 6)))
print(n, len(edges))
for u, v in edges:
    print(u, v)
```

## უმოკლესი გზა გრაფში
level: 3
tags: გრაფი, BFS, უმოკლესი გზა

იპოვეთ უმცირესი რაოდენობის წიბო, რომელიც წვეროს 1-დან წვერო `n`-მდე მიგიყვანთ. თუ გზა არ არსებობს, გამოიტანეთ `-1`.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `m` ხაზზე წიბო `u v`.

### გამოტანა

ერთი რიცხვი: უმოკლესი გზის სიგრძე (წიბოების რაოდენობა) ან `-1`.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ m ≤ 10⁵

### მაგალითი

```in
5 5
1 2
2 3
3 5
1 4
4 5
```

```out
2
```

### განმარტება

უმოკლესი გზა 1 → 4 → 5: ორი წიბო. გზა 1 → 2 → 3 → 5 უფრო გრძელია (3).

### მაგალითი

```in
3 1
1 2
```

```out
-1
```

### შემოწმება

```in
1 0
```

```out
0
```

### მინიშნებები

1. წიბოები ერთნაირი „წონის“ არის: სიგრძე მათი რაოდენობაა. რა საშუალებით ვიპოვით პირველად მიღწეულ დონეს?
2. სიგანეში ძებნა (BFS) წვეროებს მანძილის ზრდის მიხედვით ათვალიერებს.
3. `dist[v]` — მანძილი 1-დან `v`-მდე (თავიდან `-1`). დაიწყეთ `dist[1] = 0`-ით; როცა `v`-დან მეზობლად აღმოაჩენთ `next`-ს, რომლისთვისაც `dist[next] == -1`, ჩაწერეთ `dist[next] = dist[v] + 1` და ჩაამატეთ რიგში.

### ამოხსნა

```cpp
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    vector<int> dist(n + 1, -1);
    queue<int> q;
    dist[1] = 0;
    q.push(1);
    while (!q.empty()) {
        int v = q.front();
        q.pop();
        for (int next : graph[v]) {
            if (dist[next] == -1) {
                dist[next] = dist[v] + 1;
                q.push(next);
            }
        }
    }
    cout << dist[n] << endl;
    return 0;
}
```

BFS-ში რიგი ინახავს წვეროებს მანძილის ზრდის რიგით: ჯერ ის, ვინც დასაწყისიდან 0 ბიჯზეა, შემდეგ 1, შემდეგ 2 და ა. შ. ამიტომ წვერო პირველად მაშინ მიიღწევა, როცა უმოკლესი გზით მივაღწიეთ. თუ `n`-მდე ვერ მივედით, `dist[n]` კვლავ `-1` რჩება.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    const int INF = 1 << 28;
    vector<vector<int>> d(n + 1, vector<int>(n + 1, INF));
    for (int i = 1; i <= n; i++) d[i][i] = 0;
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        d[u][v] = d[v][u] = 1;
    }
    for (int k = 1; k <= n; k++)
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
    cout << (d[1][n] >= INF ? -1 : d[1][n]) << endl;
    return 0;
}
```

```gen
import random, sys, itertools
random.seed(int(sys.argv[1]))
n = random.randint(1, 7)
pairs = list(itertools.combinations(range(1, n + 1), 2))
edges = random.sample(pairs, random.randint(0, min(len(pairs), 9)))
print(n, len(edges))
for u, v in edges:
    print(u, v)
```

## კუნძულების რაოდენობა
level: 3
tags: ბადე, BFS, კომპონენტები

რუკაზე `#` ხმელეთია, `.` — წყალი. კუნძული არის ხმელეთის უჯრათა ჯგუფი, რომელშიც ნებისმიერი ორი უჯრა დაკავშირებულია გვერდებით (ზემოთ, ქვემოთ, მარცხნივ, მარჯვნივ; დიაგონალი არ ითვლება). დაითვალეთ კუნძულები.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `n` ხაზზე `m`-სიმბოლოიანი სტრიქონი.

### გამოტანა

ერთი რიცხვი: კუნძულების რაოდენობა.

### შეზღუდვები

1 ≤ n, m ≤ 1000

### მაგალითი

```in
4 5
##...
#..#.
..##.
....#
```

```out
3
```

### განმარტება

კუნძულებია: ზედა მარცხენა (3 უჯრა), შუა (3 უჯრა) და ქვედა მარჯვენა (1 უჯრა).

### შემოწმება

```in
1 1
.
```

```out
0
```

```in
2 2
#.
.#
```

```out
2
```

### მინიშნებები

1. ეს ისევ „კომპონენტების დათვლაა“: გრაფი ბადეშია დაფარული.
2. თითოეული უჯრა წვეროა, მისი მეზობლები — ოთხი გვერდითი უჯრა.
3. გაიარეთ ყველა უჯრა. როცა ჯერ არმონახულებულ `#` უჯრას ნახავთ, გაზარდეთ მრიცხველი და BFS-ით მონიშნეთ მთელი კუნძული. მეზობლის ინდექსები ბადიდან არ უნდა გავიდეს.

### ამოხსნა

```cpp
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<string> grid(n);
    for (int i = 0; i < n; i++) {
        cin >> grid[i];
    }
    vector<vector<bool>> seen(n, vector<bool>(m, false));
    const int di[4] = {1, -1, 0, 0};
    const int dj[4] = {0, 0, 1, -1};
    int islands = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (grid[i][j] != '#' || seen[i][j]) {
                continue;
            }
            islands++;
            queue<pair<int, int>> q;
            q.push({i, j});
            seen[i][j] = true;
            while (!q.empty()) {
                pair<int, int> cell = q.front();
                q.pop();
                for (int d = 0; d < 4; d++) {
                    int ni = cell.first + di[d];
                    int nj = cell.second + dj[d];
                    if (ni < 0 || ni >= n || nj < 0 || nj >= m) {
                        continue;
                    }
                    if (grid[ni][nj] == '#' && !seen[ni][nj]) {
                        seen[ni][nj] = true;
                        q.push({ni, nj});
                    }
                }
            }
        }
    }
    cout << islands << endl;
    return 0;
}
```

მასივები `di`, `dj` ოთხ მიმართულებას აღწერს და ციკლში `d = 0..3` ოთხივე მეზობელს ამოწმებს. ყოველი უჯრა ერთხელ ხვდება რიგში: `O(nm)`. ეს სქემა (მეზობლები მიმართულებებით, საზღვრების შემოწმება, `seen` მასივი) უჯრებზე ნებისმიერ ძებნას ერგება.

### სტრესი

```brute
#include <iostream>
#include <numeric>
#include <string>
#include <vector>
using namespace std;

vector<int> parent;

int find(int x) {
    return parent[x] == x ? x : parent[x] = find(parent[x]);
}

int main() {
    int n, m;
    cin >> n >> m;
    vector<string> g(n);
    for (auto &s : g) cin >> s;
    parent.resize(n * m);
    iota(parent.begin(), parent.end(), 0);
    int count = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            if (g[i][j] == '#') count++;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (g[i][j] != '#') continue;
            if (i + 1 < n && g[i + 1][j] == '#') {
                int a = find(i * m + j), b = find((i + 1) * m + j);
                if (a != b) { parent[a] = b; count--; }
            }
            if (j + 1 < m && g[i][j + 1] == '#') {
                int a = find(i * m + j), b = find(i * m + j + 1);
                if (a != b) { parent[a] = b; count--; }
            }
        }
    }
    cout << count << endl;
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
    print("".join(random.choice("#.") for _ in range(m)))
```

## ლაბირინთი
level: 4
tags: ბადე, BFS, უმოკლესი გზა

ლაბირინთში `S` სტარტია, `E` გასასვლელი, `.` თავისუფალი უჯრაა, `#` — კედელი. ყოველ ნაბიჯზე შეგიძლიათ გადახვიდეთ ერთ უჯრაზე ზემოთ, ქვემოთ, მარცხნივ ან მარჯვნივ (კედელში არა). იპოვეთ უმცირესი რაოდენობის ნაბიჯი `S`-დან `E`-მდე, ან `-1`, თუ გზა არ არსებობს.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `n` ხაზზე `m`-სიმბოლოიანი სტრიქონი. `S` და `E` თითოეული ზუსტად ერთხელ გვხვდება.

### გამოტანა

ერთი რიცხვი.

### შეზღუდვები

1 ≤ n, m ≤ 1000

### მაგალითი

```in
3 4
S..#
.#..
...E
```

```out
5
```

### მაგალითი

```in
1 3
S#E
```

```out
-1
```

### შემოწმება

```in
1 2
SE
```

```out
1
```

### მინიშნებები

1. ეს წინა გრაფის ამოცანის ბადური ვერსიაა: მანძილი ნაბიჯების რაოდენობაა.
2. გამოიყენეთ BFS ბადეზე; `dist[i][j]` ინახავს მანძილს `S`-დან.
3. იპოვეთ `S`-ის კოორდინატები, დაიწყეთ მისგან `dist = 0`-ით. ოთხი მეზობლიდან თითოეულისთვის: თუ ის ბადეშია, კედელი არ არის და ჯერ არ მონახულებულა, ჩაწერეთ `dist[ni][nj] = dist[i][j] + 1` და ჩაამატეთ რიგში. პასუხი `E`-ს მანძილია.

### ამოხსნა

```cpp
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<string> grid(n);
    for (int i = 0; i < n; i++) {
        cin >> grid[i];
    }
    vector<vector<int>> dist(n, vector<int>(m, -1));
    queue<pair<int, int>> q;
    int endI = 0, endJ = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (grid[i][j] == 'S') {
                dist[i][j] = 0;
                q.push({i, j});
            } else if (grid[i][j] == 'E') {
                endI = i;
                endJ = j;
            }
        }
    }
    const int di[4] = {1, -1, 0, 0};
    const int dj[4] = {0, 0, 1, -1};
    while (!q.empty()) {
        pair<int, int> cell = q.front();
        q.pop();
        for (int d = 0; d < 4; d++) {
            int ni = cell.first + di[d];
            int nj = cell.second + dj[d];
            if (ni < 0 || ni >= n || nj < 0 || nj >= m) {
                continue;
            }
            if (grid[ni][nj] == '#' || dist[ni][nj] != -1) {
                continue;
            }
            dist[ni][nj] = dist[cell.first][cell.second] + 1;
            q.push({ni, nj});
        }
    }
    cout << dist[endI][endJ] << endl;
    return 0;
}
```

BFS უჯრებს მანძილის ზრდის რიგით ამუშავებს: ჯერ ყველა უჯრა მანძილით 1, მერე 2 და ა. შ. `dist` მასივი ერთდროულად „მონახულებულის“ როლსაც ასრულებს (`-1` ნიშნავს, რომ ჯერ არ მივსულვართ). თუ `E` მიუღწეველია, `dist[endI][endJ]` `-1`-ად დარჩება. DFS უმოკლეს გზას არ იძლევა: ამისთვის სწორედ BFS გვჭირდება.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<string> g(n);
    for (auto &s : g) cin >> s;
    const int INF = 1 << 28;
    vector<vector<int>> d(n, vector<int>(m, INF));
    int ei = 0, ej = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++) {
            if (g[i][j] == 'S') d[i][j] = 0;
            if (g[i][j] == 'E') { ei = i; ej = j; }
        }
    bool changed = true;
    while (changed) {
        changed = false;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < m; j++) {
                if (g[i][j] == '#' || d[i][j] >= INF) continue;
                int di[4] = {1, -1, 0, 0}, dj[4] = {0, 0, 1, -1};
                for (int k = 0; k < 4; k++) {
                    int a = i + di[k], b = j + dj[k];
                    if (a < 0 || a >= n || b < 0 || b >= m || g[a][b] == '#') continue;
                    if (d[a][b] > d[i][j] + 1) { d[a][b] = d[i][j] + 1; changed = true; }
                }
            }
    }
    cout << (d[ei][ej] >= INF ? -1 : d[ei][ej]) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 5)
m = random.randint(2, 5)
cells = [random.choice("..#") for _ in range(n * m)]
s, e = random.sample(range(n * m), 2)
cells[s] = "S"
cells[e] = "E"
print(n, m)
for i in range(n):
    print("".join(cells[i * m:(i + 1) * m]))
```

## ორმხრივი გრაფი
level: 4
tags: გრაფი, BFS, ორმხრივობა, ფერადება

გრაფი ორმხრივია, თუ მისი წვეროები ორ ფერად (შავი და თეთრი) შეიძლება შეიღებოს ისე, რომ ყოველი წიბო სხვადასხვა ფერის წვეროებს აერთებდეს. შეამოწმეთ, არის თუ არა მოცემული გრაფი ორმხრივი. გამოიტანეთ `YES` ან `NO`. გრაფი შეიძლება არ იყოს ბმული.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `m` ხაზზე წიბო `u v`.

### გამოტანა

`YES` ან `NO`.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ m ≤ 10⁵

### მაგალითი

```in
4 3
1 2
2 3
3 4
```

```out
YES
```

### მაგალითი

```in
3 3
1 2
2 3
3 1
```

```out
NO
```

### შემოწმება

```in
1 0
```

```out
YES
```

### მინიშნებები

1. თუ წვერო თეთრია, მისი ყველა მეზობელი შავი უნდა იყოს და პირიქით.
2. აირჩიეთ საწყისი წვერო, გააფერადეთ ის და გაავრცელეთ ფერები BFS-ით: მეზობელს ვაძლევთ საპირისპირო ფერს.
3. თუ მეზობელი უკვე გაფერადებულია იმავე ფერით, რაც ახლანდელ წვეროს აქვს, გრაფი ორმხრივი არ არის. გრაფი ბმული არ არის: გაუშვით ძებნა ყოველი არამონახულებული წვეროდან.

### ამოხსნა

```cpp
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        graph[u].push_back(v);
        graph[v].push_back(u);
    }
    vector<int> color(n + 1, -1);
    bool ok = true;
    for (int start = 1; start <= n && ok; start++) {
        if (color[start] != -1) {
            continue;
        }
        color[start] = 0;
        queue<int> q;
        q.push(start);
        while (!q.empty() && ok) {
            int v = q.front();
            q.pop();
            for (int next : graph[v]) {
                if (color[next] == -1) {
                    color[next] = 1 - color[v];
                    q.push(next);
                } else if (color[next] == color[v]) {
                    ok = false;
                    break;
                }
            }
        }
    }
    cout << (ok ? "YES" : "NO") << endl;
    return 0;
}
```

გრაფი ორმხრივია მაშინ და მხოლოდ მაშინ, როცა მასში კენტი სიგრძის ციკლი არ არის (ამიტომ სამკუთხედი არ გამოდგება). BFS დონეებს ზრდის: ცალკე დონეები სხვადასხვა ფერს იღებს, ხოლო ორი წვერო ერთი დონიდან, რომლებიც წიბოთი არის დაკავშირებული, ციკლს კენტი სიგრძით ქმნის. `color`-ის სამი მნიშვნელობაა: `-1` (ჯერ არ არის), 0 და 1.

### სტრესი

```brute
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> edges(m);
    for (auto &e : edges) cin >> e.first >> e.second;
    bool ok = false;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool good = true;
        for (auto &e : edges) {
            int a = (mask >> (e.first - 1)) & 1, b = (mask >> (e.second - 1)) & 1;
            if (a == b) good = false;
        }
        if (good) ok = true;
    }
    cout << (ok ? "YES" : "NO") << endl;
    return 0;
}
```

```gen
import random, sys, itertools
random.seed(int(sys.argv[1]))
n = random.randint(1, 7)
pairs = list(itertools.combinations(range(1, n + 1), 2))
edges = random.sample(pairs, random.randint(0, min(len(pairs), 8)))
print(n, len(edges))
for u, v in edges:
    print(u, v)
```

## ციკლი გრაფში
level: 4
tags: გრაფი, DSU, ციკლი

არის თუ არა არაორიენტირებულ გრაფში ციკლი (გზა, რომელიც ბრუნდება საწყის წვეროში და არ იმეორებს წიბოებს)? გამოიტანეთ `YES` ან `NO`.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `m` ხაზზე წიბო `u v` (პარალელური წიბოების გარეშე).

### გამოტანა

`YES` ან `NO`.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ m ≤ 10⁵

### მაგალითი

```in
3 3
1 2
2 3
3 1
```

```out
YES
```

### მაგალითი

```in
4 3
1 2
2 3
3 4
```

```out
NO
```

### შემოწმება

```in
2 1
1 2
```

```out
NO
```

### მინიშნებები

1. ციკლს ქმნის წიბო, რომელიც აერთებს ორ წვეროს, რომლებიც უკვე ერთმანეთთან დაკავშირებული იყო.
2. გჭირდებათ სტრუქტურა, რომელიც სწრაფად პასუხობს: „არიან თუ არა `u` და `v` უკვე ერთ კომპონენტში?“ — DSU (გაერთიანება-ძებნა).
3. თავიდან ყოველი წვერო ცალკე ჯგუფია. ყოველი წიბოსთვის: თუ `find(u) == find(v)`, ციკლი ნაპოვნია; წინააღმდეგ შემთხვევაში გააერთიანეთ ჯგუფები.

### ამოხსნა

```cpp
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

vector<int> parent;

int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

int main() {
    int n, m;
    cin >> n >> m;
    parent.resize(n + 1);
    iota(parent.begin(), parent.end(), 0);
    bool cycle = false;
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        int a = find(u), b = find(v);
        if (a == b) {
            cycle = true;
        } else {
            parent[a] = b;
        }
    }
    cout << (cycle ? "YES" : "NO") << endl;
    return 0;
}
```

DSU ყოველ ჯგუფს „წარმომადგენლით“ ასახავს: `find(x)` პოულობს `x`-ის ჯგუფის წარმომადგენელს ისე, რომ გზას ამოკლებს (`parent[x] = parent[parent[x]]`). ამიტომ ორი ოპერაცია ძალიან სწრაფია (პრაქტიკულად `O(1)`). ციკლის არსებობის შემოწმება სხვა გზითაც შეიძლება: გრაფს ციკლი არ აქვს (ტყეა) მაშინ და მხოლოდ მაშინ, როცა `m = n − (კომპონენტების რაოდენობა)`.

### სტრესი

```brute
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<bool> seen(n + 1, false);
    int components = 0;
    for (int s = 1; s <= n; s++) {
        if (seen[s]) continue;
        components++;
        queue<int> q;
        q.push(s);
        seen[s] = true;
        while (!q.empty()) {
            int v = q.front();
            q.pop();
            for (int w : g[v]) if (!seen[w]) { seen[w] = true; q.push(w); }
        }
    }
    cout << (m > n - components ? "YES" : "NO") << endl;
    return 0;
}
```

```gen
import random, sys, itertools
random.seed(int(sys.argv[1]))
n = random.randint(1, 7)
pairs = list(itertools.combinations(range(1, n + 1), 2))
edges = random.sample(pairs, random.randint(0, min(len(pairs), 7)))
print(n, len(edges))
for u, v in edges:
    print(u, v)
```

## გაერთიანება და შეკითხვა
level: 4
tags: DSU, ბრძანებები

`n` ადამიანი თავიდან ცალ-ცალკე კომპანიაშია. ბრძანებებია:

- `union a b`: `a`-ს და `b`-ს კომპანიები ერთიანდება;
- `same a b`: გამოიტანეთ `YES`, თუ `a` და `b` ერთ კომპანიაშია, და `NO` — თუ არა.

### შეყვანა

პირველ ხაზზე `n` და `q`. შემდეგ `q` ხაზზე თითო ბრძანება.

### გამოტანა

თითო ხაზი ყოველი `same` ბრძანებისთვის.

### შეზღუდვები

1 ≤ n, q ≤ 10⁵

### მაგალითი

```in
5 5
union 1 2
union 3 4
same 1 3
union 2 3
same 1 4
```

```out
NO
YES
```

### შემოწმება

```in
1 1
same 1 1
```

```out
YES
```

### მინიშნებები

1. ყოველ ბრძანებაზე მთელი მასივის გადახედვა 10¹⁰ ოპერაციას გვაძლევს. გჭირდებათ უფრო ჭკვიანი სტრუქტურა.
2. DSU: ყოველ წვეროს აქვს „მშობელი“; ჯგუფის წარმომადგენელი თავისი თავის მშობელია.
3. `find(x)` მშობლებს გაჰყვებით წარმომადგენლამდე. `union a b`: `parent[find(a)] = find(b)`. `same a b`: `find(a) == find(b)`. `find`-ში გზა შეამოკლეთ.

### ამოხსნა

```cpp
#include <iostream>
#include <numeric>
#include <string>
#include <vector>
using namespace std;

vector<int> parent;

int find(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
    }
    return x;
}

int main() {
    int n, q;
    cin >> n >> q;
    parent.resize(n + 1);
    iota(parent.begin(), parent.end(), 0);
    while (q--) {
        string command;
        int a, b;
        cin >> command >> a >> b;
        if (command == "union") {
            parent[find(a)] = find(b);
        } else {
            cout << (find(a) == find(b) ? "YES" : "NO") << "\n";
        }
    }
    return 0;
}
```

DSU-ს ორივე ოპერაცია თითქმის მუდმივ დროში მუშაობს (გზის შემოკლებასთან ერთად). ძირითადი იდეა: ჯგუფი ხის სახით ინახება და მისი „ფესვი“ წარმომადგენელია. `union` უბრალოდ ერთი ხის ფესვს მეორისას აბამს. ეს სტრუქტურა კომპონენტების, ციკლების, უმცირესი დამფარავი ხის (კრუსკალის ალგორითმი) ამოცანებში ძალიან გავრცელებულია.

### სტრესი

```brute
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int n, q;
    cin >> n >> q;
    vector<int> label(n + 1);
    for (int i = 0; i <= n; i++) label[i] = i;
    while (q--) {
        string c;
        int a, b;
        cin >> c >> a >> b;
        if (c == "union") {
            int from = label[a], to = label[b];
            for (int i = 1; i <= n; i++) if (label[i] == from) label[i] = to;
        } else {
            cout << (label[a] == label[b] ? "YES" : "NO") << "\n";
        }
    }
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 7)
q = random.randint(1, 10)
print(n, q)
for _ in range(q):
    print(random.choice(["union", "same"]), random.randint(1, n), random.randint(1, n))
```

## კურსების რიგი
level: 5
tags: გრაფი, ტოპოლოგიური დალაგება, priority_queue, ორიენტირებული გრაფი

უნივერსიტეტში `n` კურსია. წყვილი `a b` ნიშნავს, რომ კურსი `a` უნდა გაიაროთ `b`-მდე. შეადგინეთ ყველა კურსის გავლის რიგი, რომელიც ყველა პირობას აკმაყოფილებს. თუ რამდენიმე რიგია, გამოიტანეთ ლექსიკოგრაფიულად უმცირესი (ყველაზე პატარა ნომრებით დაწყებული). თუ ასეთი რიგი არ არსებობს (პირობები ციკლს ქმნის), გამოიტანეთ `IMPOSSIBLE`.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `m` ხაზზე წყვილი `a b`. პარალელური წიბოები და `a = b` არ გვხვდება.

### გამოტანა

ერთ ხაზზე `n` კურსის ნომერი ან `IMPOSSIBLE`.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ m ≤ 10⁵

### მაგალითი

```in
3 2
3 1
2 1
```

```out
2 3 1
```

### განმარტება

კურსი 1 მოითხოვს 2-ს და 3-ს. პირველად ხელმისაწვდომია 2 და 3; ავიღოთ უმცირესი (2), შემდეგ 3, ბოლოს 1.

### მაგალითი

```in
2 2
1 2
2 1
```

```out
IMPOSSIBLE
```

### შემოწმება

```in
3 0
```

```out
1 2 3
```

### მინიშნებები

1. კურსის გავლა შეიძლება მხოლოდ მაშინ, როცა ყველა წინაპირობა გავლილი გაქვთ.
2. ყოველი კურსისთვის დათვალეთ, რამდენი წინაპირობა აქვს ჯერ არგავლილი (`indegree`).
3. ხელმისაწვდომი კურსები (`indegree = 0`) ჩადეთ უმცირესის რიგში (`priority_queue` `greater`-ით). ყოველ ნაბიჯზე აიღეთ უმცირესი, გამოიტანეთ, ხოლო მისგან გამოსულ კურსებს `indegree` შეუმცირეთ და ახლად ხელმისაწვდომები ჩაამატეთ. თუ ბოლოს ყველა კურსი ვერ გამოვიტანეთ, პასუხია `IMPOSSIBLE`.

### ამოხსნა

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> graph(n + 1);
    vector<int> indegree(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int a, b;
        cin >> a >> b;
        graph[a].push_back(b);
        indegree[b]++;
    }
    priority_queue<int, vector<int>, greater<int>> ready;
    for (int v = 1; v <= n; v++) {
        if (indegree[v] == 0) {
            ready.push(v);
        }
    }
    vector<int> order;
    while (!ready.empty()) {
        int v = ready.top();
        ready.pop();
        order.push_back(v);
        for (int next : graph[v]) {
            indegree[next]--;
            if (indegree[next] == 0) {
                ready.push(next);
            }
        }
    }
    if ((int)order.size() < n) {
        cout << "IMPOSSIBLE" << endl;
    } else {
        for (int v : order) {
            cout << v << " ";
        }
        cout << endl;
    }
    return 0;
}
```

ეს „კანის ალგორითმია“ ტოპოლოგიური დალაგებისთვის. თუ გრაფში ციკლია, ციკლის წვეროებს არასოდეს გაუხდება `indegree` ნული და ისინი ვერ მოხვდება პასუხში, ამიტომ `order.size() < n` ციკლის აღმოჩენას გვეუბნება. `priority_queue` (უმცირესი თავში) იძლევა ზუსტად ლექსიკოგრაფიულად უმცირეს რიგს: ყოველ ნაბიჯზე ვირჩევთ უმცირეს ხელმისაწვდომ კურსს. ეს წესი მოითხოვს დამტკიცებას; შეამოწმეთ გადარჩევასთან პატარა ტესტებზე.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<pair<int, int>> edges(m);
    for (auto &e : edges) cin >> e.first >> e.second;
    vector<int> p(n);
    iota(p.begin(), p.end(), 1);
    do {
        vector<int> pos(n + 1);
        for (int i = 0; i < n; i++) pos[p[i]] = i;
        bool ok = true;
        for (auto &e : edges) if (pos[e.first] > pos[e.second]) ok = false;
        if (ok) {
            for (int v : p) cout << v << " ";
            cout << endl;
            return 0;
        }
    } while (next_permutation(p.begin(), p.end()));
    cout << "IMPOSSIBLE" << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 6)
pairs = [(a, b) for a in range(1, n + 1) for b in range(1, n + 1) if a != b]
edges = []
seen = set()
for a, b in random.sample(pairs, random.randint(0, min(len(pairs), 6))):
    if (b, a) in seen:
        continue
    seen.add((a, b))
    edges.append((a, b))
print(n, len(edges))
for a, b in edges:
    print(a, b)
```

## უმოკლესი გზა წონებით
level: 5
tags: გრაფი, დეიკსტრა, priority_queue, long long

გრაფის ყოველ წიბოს აქვს დადებითი სიგრძე. იპოვეთ უმოკლესი გზის სიგრძე წვეროდან 1 წვერომდე `n`. თუ გზა არ არსებობს, გამოიტანეთ `-1`.

### შეყვანა

პირველ ხაზზე `n` და `m`. შემდეგ `m` ხაზზე სამი რიცხვი `u v w`: წიბო `u`-სა და `v`-ს შორის სიგრძით `w`. პარალელური წიბოები შეიძლება იყოს (ერთსა და იმავე წყვილს შორის რამდენიმე წიბო).

### გამოტანა

ერთი რიცხვი: უმოკლესი გზის სიგრძე ან `-1`.

### შეზღუდვები

1 ≤ n ≤ 10⁵, 0 ≤ m ≤ 2 · 10⁵, 1 ≤ w ≤ 10⁹

### მაგალითი

```in
4 4
1 2 1
2 4 5
1 3 2
3 4 2
```

```out
4
```

### განმარტება

გზა 1 → 3 → 4 სიგრძით 2 + 2 = 4. გზა 1 → 2 → 4 უფრო გრძელია (6).

### მაგალითი

```in
3 1
1 2 7
```

```out
-1
```

### შემოწმება

```in
1 0
```

```out
0
```

```in
2 2
1 2 1000000000
1 2 5
```

```out
5
```

### მინიშნებები

1. BFS წონიან გრაფში არასწორია: ერთი გრძელი წიბო შეიძლება რამდენიმე მოკლეს ჯობდეს. რა უნდა ამოვიღოთ რიგიდან?
2. ყოველ ნაბიჯზე ამოიღეთ წვერო, რომლის მიმდინარე მანძილი ყველაზე მცირეა: `priority_queue` წყვილებით `(მანძილი, წვერო)`.
3. `dist[v]` — ჯერჯერობით ცნობილი უმოკლესი მანძილი (თავიდან უსასრულო, `dist[1] = 0`). ამოღებული `(d, v)`-სთვის თუ `d > dist[v]`, გამოტოვეთ. ყოველი წიბოსთვის `v → next` სიგრძით `w`: თუ `d + w < dist[next]`, განაახლეთ და ჩაამატეთ.

### ამოხსნა

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<pair<int, long long>>> graph(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        graph[u].push_back({v, w});
        graph[v].push_back({u, w});
    }
    const long long INF = 4000000000000000000LL;
    vector<long long> dist(n + 1, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    dist[1] = 0;
    pq.push({0, 1});
    while (!pq.empty()) {
        long long d = pq.top().first;
        int v = pq.top().second;
        pq.pop();
        if (d > dist[v]) {
            continue;
        }
        for (const auto &edge : graph[v]) {
            int next = edge.first;
            long long nd = d + edge.second;
            if (nd < dist[next]) {
                dist[next] = nd;
                pq.push({nd, next});
            }
        }
    }
    cout << (dist[n] == INF ? -1 : dist[n]) << endl;
    return 0;
}
```

დეიკსტრას ალგორითმი ყოველთვის ყველაზე ახლო „საბოლოო“ წვეროს ამუშავებს. ჩვენ რიგში წვეროს რამდენჯერმე ვამატებთ (როცა უკეთეს გზას ვპოულობთ): ძველი, უკვე მოძველებული ჩანაწერები პირობით `d > dist[v]` გამოტოვებულია. ალგორითმი მხოლოდ დადებით წიბოებზე მუშაობს. სირთულე `O((n + m) log n)`. გზის სიგრძე 10¹⁴-მდე შეიძლება იყოს: `long long` აუცილებელია.

### სტრესი

```brute
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    const long long INF = 4000000000000000000LL;
    vector<vector<long long>> d(n + 1, vector<long long>(n + 1, INF));
    for (int i = 1; i <= n; i++) d[i][i] = 0;
    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        d[u][v] = min(d[u][v], w);
        d[v][u] = min(d[v][u], w);
    }
    for (int k = 1; k <= n; k++)
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++)
                if (d[i][k] < INF && d[k][j] < INF) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
    cout << (d[1][n] >= INF ? -1 : d[1][n]) << endl;
    return 0;
}
```

```gen
import random, sys
random.seed(int(sys.argv[1]))
n = random.randint(1, 6)
m = random.randint(0, 9)
print(n, m)
for _ in range(m):
    print(random.randint(1, n), random.randint(1, n), random.randint(1, 9))
```
