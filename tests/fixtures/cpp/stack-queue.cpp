#include <iostream>
#include <stack>
#include <queue>
#include <deque>
using namespace std;
int main() {
    stack<int> st;
    for (int i = 1; i <= 4; i++) st.push(i * 10);
    cout << st.top() << " " << st.size() << "\n";
    st.pop();
    while (!st.empty()) { cout << st.top() << " "; st.pop(); }
    cout << "\n";
    queue<string> q;
    q.push("a"); q.push("b"); q.push("c");
    cout << q.front() << q.back() << q.size() << "\n";
    q.pop();
    cout << q.front() << "\n";
    priority_queue<int> pq;
    for (int x : {5, 1, 8, 3}) pq.push(x);
    cout << pq.top() << " ";
    pq.pop();
    cout << pq.top() << pq.size() << "\n";
    priority_queue<int, vector<int>, greater<int>> mn;
    for (int x : {5, 1, 8, 3}) mn.push(x);
    while (!mn.empty()) { cout << mn.top() << " "; mn.pop(); }
    cout << "\n";
    priority_queue<pair<int, string>> pp;
    pp.push({2, "b"}); pp.push({9, "z"}); pp.push({2, "c"});
    while (!pp.empty()) { cout << pp.top().first << pp.top().second << " "; pp.pop(); }
    cout << "\n";
    deque<int> d;
    d.push_back(1); d.push_back(2); d.push_front(0); d.push_front(-1);
    cout << d.front() << d.back() << d.size() << d[1] << "\n";
    d.pop_front(); d.pop_back();
    for (int x : d) cout << x << " ";
    cout << "\n";
    stack<char> br;
    string s = "{[()]}";
    bool ok = true;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') br.push(c);
        else {
            if (br.empty()) { ok = false; break; }
            char t = br.top(); br.pop();
            if ((c == ')' && t != '(') || (c == ']' && t != '[') || (c == '}' && t != '{')) ok = false;
        }
    }
    cout << (ok && br.empty()) << "\n";
    return 0;
}
