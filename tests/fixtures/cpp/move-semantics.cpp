#include <iostream>
#include <string>
#include <vector>
#include <utility>
using namespace std;
struct S {
    string name;
    S(string n) : name(n) { cout << "ctor " << name << "\n"; }
    S(const S &o) : name(o.name) { cout << "copy " << name << "\n"; }
    S(S &&o) : name(std::move(o.name)) { cout << "move " << name << "\n"; }
    ~S() { cout << "dtor [" << name << "]\n"; }
};
int main() {
    S a("alpha");
    S b = a;
    S c = std::move(a);
    cout << "a=[" << a.name << "] c=[" << c.name << "]\n";
    string s1 = "hello";
    string s2 = std::move(s1);
    cout << "[" << s1 << "][" << s2 << "]\n";
    vector<int> v1 = {1, 2, 3};
    vector<int> v2 = std::move(v1);
    cout << v1.size() << v2.size() << "\n";
    return 0;
}
