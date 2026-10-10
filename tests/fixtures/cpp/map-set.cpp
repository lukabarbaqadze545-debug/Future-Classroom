#include <iostream>
#include <map>
#include <set>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
int main() {
    map<string, int> m;
    m["banana"] = 3;
    m["apple"] = 5;
    m["cherry"] += 2;
    m.insert({"date", 7});
    m.emplace("elder", 1);
    for (auto &kv : m) cout << kv.first << "=" << kv.second << " ";
    cout << "\n";
    cout << m.size() << " " << m.count("apple") << m.count("zzz") << " " << m["zzz"] << " " << m.size() << "\n";
    auto it = m.find("banana");
    if (it != m.end()) cout << it->first << it->second << "\n";
    m.erase("zzz");
    m.erase(m.find("apple"));
    for (auto it2 = m.begin(); it2 != m.end(); ++it2) cout << it2->first[0];
    cout << "\n";
    cout << m.begin()->first << " " << m.rbegin()->first << " " << (--m.end())->second << "\n";
    cout << m.lower_bound("c")->first << " " << m.upper_bound("cherry")->first << "\n";
    set<int> s = {5, 1, 3, 1, 5};
    s.insert(4);
    s.insert(3);
    for (int x : s) cout << x << " ";
    cout << s.size() << " " << s.count(3) << s.count(9) << "\n";
    cout << *s.begin() << *s.rbegin() << " " << *s.lower_bound(2) << *s.upper_bound(3) << " " << (s.find(4) != s.end()) << "\n";
    s.erase(3);
    s.erase(s.begin());
    for (int x : s) cout << x << " ";
    cout << "\n";
    multiset<int> ms = {1, 2, 2, 3, 2};
    cout << ms.size() << ms.count(2) << "\n";
    ms.erase(ms.find(2));
    cout << ms.count(2) << "\n";
    map<int, vector<int>> g;
    g[1].push_back(2);
    g[1].push_back(3);
    g[2].push_back(3);
    for (auto &[k, adj] : g) { cout << k << ":"; for (int x : adj) cout << x << ","; cout << " "; }
    cout << "\n";
    map<char, int> freq;
    for (char c : string("mississippi")) freq[c]++;
    for (auto &[c, n] : freq) cout << c << n;
    cout << "\n";
    unordered_map<string, int> um;
    um["x"] = 1; um["y"] = 2; um["x"] += 10;
    cout << um["x"] << um["y"] << um.count("z") << um.size() << "\n";
    unordered_set<int> us = {1, 2, 3, 2};
    cout << us.size() << us.count(2) << us.count(8) << "\n";
    map<int, int, greater<int>> desc = {{1, 1}, {3, 3}, {2, 2}};
    for (auto &kv : desc) cout << kv.first;
    cout << "\n";
    set<pair<int, int>> sp = {{2, 1}, {1, 5}, {1, 2}};
    for (auto &p : sp) cout << p.first << p.second << " ";
    cout << "\n";
    set<string> ss = {"pear", "apple", "fig"};
    for (auto &x : ss) cout << x << " ";
    cout << "\n";
    return 0;
}
