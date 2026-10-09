#include <iostream>
#include <cstring>
using namespace std;
class Buf {
    int *data;
    int n;
public:
    Buf(int n) : n(n), data(new int[n]) { for (int i = 0; i < n; i++) data[i] = i; cout << "ctor(" << n << ") "; }
    Buf(const Buf &o) : n(o.n), data(new int[o.n]) { for (int i = 0; i < n; i++) data[i] = o.data[i]; cout << "copy(" << n << ") "; }
    Buf &operator=(const Buf &o) {
        cout << "assign ";
        if (this != &o) {
            delete[] data;
            n = o.n;
            data = new int[n];
            for (int i = 0; i < n; i++) data[i] = o.data[i];
        }
        return *this;
    }
    ~Buf() { cout << "dtor(" << n << ") "; delete[] data; }
    void set(int i, int v) { data[i] = v; }
    int get(int i) const { return data[i]; }
    int size() const { return n; }
};
int main() {
    Buf a(3);
    Buf b = a;
    b.set(0, 99);
    cout << a.get(0) << b.get(0) << "\n";
    Buf c(5);
    c = a;
    c.set(1, 42);
    cout << c.size() << c.get(1) << a.get(1) << "\n";
    c = c;
    cout << "\n";
    return 0;
}
