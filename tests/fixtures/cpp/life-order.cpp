#include <iostream>
#include <string>
using namespace std;
struct Noisy {
    string n;
    Noisy(string s) : n(s) { cout << "+" << n << " "; }
    ~Noisy() { cout << "-" << n << " "; }
};
struct Holder {
    Noisy a, b;
    Holder() : a("a"), b("b") { cout << "[Holder] "; }
    ~Holder() { cout << "[~Holder] "; }
};
struct Base {
    Noisy bn;
    Base() : bn("bn") { cout << "[Base] "; }
    virtual ~Base() { cout << "[~Base] "; }
};
struct Derived : Base {
    Noisy dn;
    Derived() : dn("dn") { cout << "[Derived] "; }
    ~Derived() { cout << "[~Derived] "; }
};
struct PlainBase {
    ~PlainBase() { cout << "[~PlainBase] "; }
};
struct PlainDerived : PlainBase {
    ~PlainDerived() { cout << "[~PlainDerived] "; }
};
Noisy g1("g1");
Noisy g2("g2");
void f() {
    Noisy x("x");
    {
        Noisy y("y");
        Noisy z("z");
    }
    cout << "f-end ";
}
int main() {
    cout << "main ";
    f();
    cout << "\n";
    {
        Holder h;
        cout << "| ";
    }
    cout << "\n";
    {
        Derived d;
    }
    cout << "\n";
    Base *p = new Derived;
    delete p;
    cout << "\n";
    PlainBase *q = new PlainDerived;
    delete q;
    cout << "\n";
    PlainDerived pd;
    static Noisy st("static");
    Noisy arr[3] = {Noisy("a0"), Noisy("a1"), Noisy("a2")};
    cout << "end ";
    return 0;
}
