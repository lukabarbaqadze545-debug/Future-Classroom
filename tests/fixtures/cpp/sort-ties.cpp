#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;
struct Rec { int key; int id; };
int main() {
    for (int n : {5, 16, 17, 40, 100, 333}) {
        vector<Rec> v;
        unsigned seed = 12345 + n;
        for (int i = 0; i < n; i++) {
            seed = seed * 1103515245u + 12345u;
            v.push_back({(int)((seed >> 16) % 7), i});
        }
        sort(v.begin(), v.end(), [](const Rec &a, const Rec &b) { return a.key < b.key; });
        long long h = 0;
        for (auto &r : v) h = h * 31 + r.id;
        cout << n << ": ";
        for (int i = 0; i < min(n, 12); i++) cout << v[i].key << ":" << v[i].id << " ";
        cout << h << "\n";
    }
    vector<pair<int, string>> p = {{3, "c"}, {1, "z"}, {3, "a"}, {2, "m"}, {1, "b"}};
    sort(p.begin(), p.end(), [](auto &a, auto &b) { return a.first > b.first; });
    for (auto &x : p) cout << x.first << x.second << " ";
    cout << "\n";
    vector<int> w;
    for (int i = 0; i < 50; i++) w.push_back((i * 37) % 11);
    sort(w.begin(), w.end(), greater<int>());
    for (int x : w) cout << x;
    cout << "\n";
    nth_element(w.begin(), w.begin() + 20, w.end());
    cout << w[20] << "\n";
    vector<int> pp = {9, 4, 7, 1, 8, 2, 6, 3, 5, 0, 11, 10};
    partial_sort(pp.begin(), pp.begin() + 4, pp.end());
    for (int i = 0; i < 4; i++) cout << pp[i] << " ";
    cout << "\n";
    return 0;
}
