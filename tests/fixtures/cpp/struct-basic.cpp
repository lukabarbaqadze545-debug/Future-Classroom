#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
struct Point {
    int x, y;
    double dist() const { return x * x + y * y; }
};
struct Student {
    string name;
    int grade = 5;
    vector<int> marks;
    double avg() const {
        if (marks.empty()) return 0;
        int s = 0;
        for (int m : marks) s += m;
        return (double)s / marks.size();
    }
};
struct Node { int val; Node *next; };
bool byAvg(const Student &a, const Student &b) { return a.avg() > b.avg(); }
int main() {
    Point p = {3, 4};
    Point q{1, 2};
    Point r;
    r.x = 7; r.y = 8;
    cout << p.dist() << " " << q.x + q.y << " " << r.x << r.y << "\n";
    Point arr[3] = {{1, 1}, {2, 2}, {3, 3}};
    int t = 0;
    for (auto &pt : arr) t += pt.x * pt.y;
    cout << t << "\n";
    Point c = p;
    c.x = 100;
    cout << p.x << c.x << "\n";
    Point *pp = &p;
    pp->x = 9;
    (*pp).y = 10;
    cout << p.x << p.y << "\n";
    vector<Student> cls = {{"Ann", 6, {5, 4}}, {"Bob", 7, {10, 9, 8}}, {"Cid"}};
    sort(cls.begin(), cls.end(), byAvg);
    for (auto &s : cls) cout << s.name << s.grade << " " << s.avg() << "; ";
    cout << "\n";
    Node n3{3, nullptr}, n2{2, &n3}, n1{1, &n2};
    for (Node *cur = &n1; cur != nullptr; cur = cur->next) cout << cur->val;
    cout << "\n";
    Node *head = new Node{10, nullptr};
    head->next = new Node{20, nullptr};
    cout << head->val + head->next->val << "\n";
    delete head->next;
    delete head;
    return 0;
}
