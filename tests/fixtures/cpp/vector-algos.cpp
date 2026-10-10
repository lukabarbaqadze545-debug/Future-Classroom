#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main() {
    vector<int> v = {5, 2, 9, 1, 5, 6, 3};
    sort(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << "\n";
    sort(v.begin(), v.end(), greater<int>());
    for (int x : v) cout << x << " ";
    cout << "\n";
    sort(v.rbegin(), v.rend());
    for (int x : v) cout << x << " ";
    cout << "\n";
    reverse(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << "\n";
    cout << *max_element(v.begin(), v.end()) << *min_element(v.begin(), v.end()) << " " << max_element(v.begin(), v.end()) - v.begin() << "\n";
    cout << accumulate(v.begin(), v.end(), 0) << " " << accumulate(v.begin(), v.end(), 1LL, [](long long a, int b) { return a * b; }) << "\n";
    sort(v.begin(), v.end());
    cout << binary_search(v.begin(), v.end(), 6) << binary_search(v.begin(), v.end(), 7) << " " << (lower_bound(v.begin(), v.end(), 5) - v.begin()) << " " << (upper_bound(v.begin(), v.end(), 5) - v.begin()) << "\n";
    cout << count(v.begin(), v.end(), 5) << " " << count_if(v.begin(), v.end(), [](int x) { return x % 2 == 1; }) << "\n";
    auto f = find(v.begin(), v.end(), 9);
    cout << (f != v.end()) << " " << (f - v.begin()) << " " << (find(v.begin(), v.end(), 42) == v.end()) << "\n";
    v.erase(unique(v.begin(), v.end()), v.end());
    for (int x : v) cout << x << " ";
    cout << "\n";
    vector<int> p = {1, 2, 3};
    do { for (int x : p) cout << x; cout << " "; } while (next_permutation(p.begin(), p.end()));
    cout << "\n";
    vector<int> q(5);
    iota(q.begin(), q.end(), 10);
    for (int x : q) cout << x << " ";
    cout << "\n";
    fill(q.begin(), q.begin() + 2, 0);
    for (int x : q) cout << x << " ";
    cout << "\n";
    vector<int> r = {4, 3, 2, 1};
    partial_sum(r.begin(), r.end(), r.begin());
    for (int x : r) cout << x << " ";
    cout << "\n";
    cout << all_of(r.begin(), r.end(), [](int x) { return x > 0; }) << any_of(r.begin(), r.end(), [](int x) { return x > 9; }) << none_of(r.begin(), r.end(), [](int x) { return x > 10; }) << "\n";
    cout << min(3, 7) << max(3, 7) << min({4, 2, 8}) << max({4, 2, 8}) << " " << __gcd(12, 18) << " " << gcd(12, 18) << " " << lcm(4, 6) << "\n";
    vector<int> s1 = {1, 3, 5}, s2 = {2, 3, 4}, out;
    set_intersection(s1.begin(), s1.end(), s2.begin(), s2.end(), back_inserter(out));
    for (int x : out) cout << x << " ";
    cout << "\n";
    vector<int> t = {3, 1, 2};
    sort(t.begin(), t.end(), [](int a, int b) { return a > b; });
    cout << t[0] << t[1] << t[2] << "\n";
    vector<int> rot = {1, 2, 3, 4, 5};
    rotate(rot.begin(), rot.begin() + 2, rot.end());
    for (int x : rot) cout << x << " ";
    cout << "\n";
    swap(rot[0], rot[4]);
    for (int x : rot) cout << x << " ";
    cout << "\n";
    cout << is_sorted(rot.begin(), rot.end()) << "\n";
    vector<int> m = {1, 2, 3, 4, 5, 6};
    auto part = partition(m.begin(), m.end(), [](int x) { return x % 2 == 0; });
    cout << part - m.begin() << "\n";
    nth_element(m.begin(), m.begin() + 2, m.end());
    cout << m[2] << "\n";
    return 0;
}
