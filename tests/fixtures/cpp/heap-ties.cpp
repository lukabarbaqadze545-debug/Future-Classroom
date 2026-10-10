#include <iostream>
#include <queue>
#include <vector>
#include <algorithm>
using namespace std;
struct Job { int pri; int id; };
struct Cmp { bool operator()(const Job &a, const Job &b) const { return a.pri < b.pri; } };
int main() {
    priority_queue<Job, vector<Job>, Cmp> pq;
    unsigned seed = 7;
    for (int i = 0; i < 30; i++) {
        seed = seed * 1103515245u + 12345u;
        pq.push({(int)((seed >> 16) % 4), i});
    }
    while (!pq.empty()) { cout << pq.top().pri << ":" << pq.top().id << " "; pq.pop(); }
    cout << "\n";
    vector<int> v = {5, 3, 8, 1, 9, 2, 7};
    make_heap(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << "\n";
    v.push_back(10);
    push_heap(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << "\n";
    pop_heap(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << "\n";
    v.pop_back();
    sort_heap(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << "\n";
    vector<int> src = {4, 10, 3, 5, 1};
    priority_queue<int> q(src.begin(), src.end());
    while (!q.empty()) { cout << q.top() << " "; q.pop(); }
    cout << "\n";
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> dj;
    dj.push({5, 1}); dj.push({2, 7}); dj.push({2, 3}); dj.push({9, 0});
    while (!dj.empty()) { cout << dj.top().first << "," << dj.top().second << " "; dj.pop(); }
    cout << "\n";
    return 0;
}
