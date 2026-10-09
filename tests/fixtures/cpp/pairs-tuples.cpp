#include <iostream>
#include <vector>
#include <algorithm>
#include <tuple>
#include <map>
using namespace std;
int main() {
    pair<int, string> p = {3, "three"};
    cout << p.first << p.second << "\n";
    auto q = make_pair(1, 2.5);
    cout << q.first << " " << q.second << "\n";
    vector<pair<int, int>> v = {{3, 1}, {1, 2}, {3, 0}, {2, 9}};
    sort(v.begin(), v.end());
    for (auto &e : v) cout << e.first << ":" << e.second << " ";
    cout << "\n";
    sort(v.begin(), v.end(), [](const pair<int, int> &a, const pair<int, int> &b) { return a.second < b.second; });
    for (auto [a, b] : v) cout << a << ":" << b << " ";
    cout << "\n";
    tuple<int, char, string> t = make_tuple(1, 'x', "tup");
    cout << get<0>(t) << get<1>(t) << get<2>(t) << "\n";
    int a; char c; string s;
    tie(a, c, s) = t;
    cout << a << c << s << "\n";
    pair<int, int> x = {1, 2}, y = {1, 3};
    cout << (x < y) << (x == y) << "\n";
    swap(x, y);
    cout << x.second << y.second << "\n";
    map<string, pair<int, int>> m;
    m["a"] = {1, 2};
    m["b"].first = 5;
    for (auto &[k, val] : m) cout << k << val.first << val.second << " ";
    cout << "\n";
    return 0;
}
