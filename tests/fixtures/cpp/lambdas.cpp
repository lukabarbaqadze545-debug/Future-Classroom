#include <iostream>
#include <vector>
#include <functional>
#include <algorithm>
using namespace std;
int applyTwice(function<int(int)> f, int x) { return f(f(x)); }
int main() {
    auto sq = [](int x) { return x * x; };
    cout << sq(7) << "\n";
    int k = 10;
    auto addk = [k](int x) { return x + k; };
    auto addref = [&k](int x) { k += x; return k; };
    cout << addk(1) << addref(5) << k << addk(1) << "\n";
    auto both = [=](int a) { return a * k; };
    cout << both(2) << "\n";
    cout << applyTwice(sq, 3) << applyTwice([](int x) { return x + 1; }, 3) << "\n";
    function<int(int)> fact = [&](int n) { return n <= 1 ? 1 : n * fact(n - 1); };
    cout << fact(10) << "\n";
    vector<int> v = {5, 3, 8, 1};
    int calls = 0;
    sort(v.begin(), v.end(), [&](int a, int b) { calls++; return a < b; });
    cout << v[0] << v[3] << (calls > 0) << "\n";
    vector<function<int()>> fs;
    for (int i = 0; i < 3; i++) fs.push_back([i]() { return i * 10; });
    for (auto &f : fs) cout << f() << " ";
    cout << "\n";
    auto gen = [](int start) { return [start](int x) mutable { start += x; return start; }; };
    auto g1 = gen(100);
    cout << g1(1) << g1(1) << "\n";
    auto cmp = [](const string &a, const string &b) { return a.size() < b.size(); };
    vector<string> w = {"ccc", "a", "bb"};
    sort(w.begin(), w.end(), cmp);
    for (auto &s : w) cout << s << " ";
    cout << "\n";
    cout << [](int a, int b) { return a - b; }(9, 4) << "\n";
    return 0;
}
