#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> v;
    for (int i = 1; i <= 5; i++) v.push_back(i * i);
    cout << v.size() << " " << v.front() << " " << v.back() << " " << v[2] << " " << v.at(3) << "\n";
    v.pop_back();
    v.insert(v.begin() + 1, 100);
    v.insert(v.end(), 3, 7);
    v.erase(v.begin());
    for (int x : v) cout << x << " ";
    cout << "\n";
    v.erase(v.begin() + 1, v.begin() + 3);
    for (size_t i = 0; i < v.size(); i++) cout << v[i] << ",";
    cout << "\n";
    vector<int> w(5, 9);
    vector<int> z = {3, 1, 2};
    vector<int> c = z;
    c.push_back(4);
    cout << w.size() << w[4] << " " << z.size() << " " << c.size() << "\n";
    vector<vector<int>> g(3, vector<int>(4, 0));
    for (int i = 0; i < 3; i++) for (int j = 0; j < 4; j++) g[i][j] = i + j;
    for (auto &row : g) { for (int x : row) cout << x << " "; cout << "\n"; }
    g[1].push_back(99);
    cout << g[1].size() << " " << g.size() << "\n";
    vector<string> names = {"bob", "alice"};
    names.push_back("carol");
    names[0] += "!";
    for (const auto &n : names) cout << n << " ";
    cout << "\n";
    v.clear();
    cout << v.empty() << " " << v.size() << "\n";
    v.resize(3);
    cout << v[0] << v[1] << v[2] << "\n";
    v.assign(4, 2);
    cout << v.size() << v[3] << "\n";
    vector<int> a = {1, 2, 3}, b = {1, 2, 4};
    cout << (a < b) << (a == b) << (a != b) << "\n";
    swap(a, b);
    cout << a[2] << b[2] << "\n";
    vector<bool> flags(5, false);
    flags[2] = true;
    int cnt = 0;
    for (bool f : flags) cnt += f;
    cout << cnt << "\n";
    vector<double> d = {1.5, 2.5};
    d.emplace_back(3.5);
    double s = 0;
    for (double x : d) s += x;
    cout << s << "\n";
    auto it = d.begin();
    cout << *it << " " << *(it + 2) << " " << d.end() - d.begin() << "\n";
    for (auto jt = d.begin(); jt != d.end(); ++jt) *jt *= 2;
    for (auto x : d) cout << x << " ";
    cout << "\n";
    return 0;
}
