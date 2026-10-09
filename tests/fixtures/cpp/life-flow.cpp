#include <iostream>
#include <string>
using namespace std;
struct T {
    string n;
    T(string s) : n(s) { cout << "+" << n << " "; }
    T(const T &o) : n(o.n + "'") { cout << "copy:" << n << " "; }
    ~T() { cout << "-" << n << " "; }
};
T make(string s) { T t(s); return t; }
T makeTmp(string s) { return T(s); }
void take(T t) { cout << "take:" << t.n << " "; }
void showRef(const T &t) { cout << "ref:" << t.n << " "; }
int early(int k) {
    T a("A");
    if (k == 1) return 1;
    T b("B");
    if (k == 2) return 2;
    return 3;
}
int main() {
    for (int i = 0; i < 3; i++) {
        T loop("L" + to_string(i));
        if (i == 0) continue;
        if (i == 2) break;
        cout << "body ";
    }
    cout << "\n";
    cout << early(1) << " ";
    cout << early(2) << " ";
    cout << early(3) << "\n";
    T m = make("m");
    cout << "got:" << m.n << "\n";
    T n = makeTmp("n");
    cout << "got:" << n.n << "\n";
    T c = m;
    cout << "\n";
    take(m);
    cout << "\n";
    take(T("temp"));
    cout << "\n";
    showRef(T("tmp2"));
    cout << "\n";
    T("discarded");
    cout << "after\n";
    int w = 0;
    while (w < 2) {
        T inner("w" + to_string(w));
        w++;
    }
    cout << "\n";
    switch (w) {
        case 2: {
            T s("sw");
            break;
        }
        default: break;
    }
    cout << "\nend ";
    return 0;
}
