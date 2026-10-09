#include <iostream>
#include <string>
using namespace std;
class Tracer {
    string id;
public:
    Tracer(string i) : id(i) { cout << "make " << id << "\n"; }
    Tracer(const Tracer &o) : id(o.id + "'") { cout << "copy " << id << "\n"; }
    ~Tracer() { cout << "drop " << id << "\n"; }
    void hi() const { cout << "hi " << id << "\n"; }
};
void byValue(Tracer t) { t.hi(); }
void byRef(const Tracer &t) { t.hi(); }
int main() {
    Tracer a("a");
    {
        Tracer b("b");
        b.hi();
    }
    byRef(a);
    byValue(a);
    Tracer *p = new Tracer("heap");
    delete p;
    cout << "end\n";
    return 0;
}
