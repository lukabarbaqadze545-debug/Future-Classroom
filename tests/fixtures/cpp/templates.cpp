#include <iostream>
#include <vector>
#include <string>
using namespace std;
template <typename T>
T maxOf(T a, T b) { return a > b ? a : b; }
template <typename T>
T sumAll(const vector<T> &v) {
    T s = T();
    for (const T &x : v) s += x;
    return s;
}
template <typename T, typename U>
auto addMixed(T a, U b) { return a + b; }
template <typename T>
class Box {
    T val;
public:
    Box(T v) : val(v) {}
    T get() const { return val; }
    void set(T v) { val = v; }
};
template <typename T>
struct Pair2 { T a, b; T sum() const { return a + b; } };
template <class T> void show(T x) { cout << "[" << x << "]"; }
int main() {
    cout << maxOf(3, 7) << maxOf(2.5, 1.5) << maxOf<string>("abc", "abd") << maxOf('a', 'z') << "\n";
    cout << sumAll(vector<int>{1, 2, 3}) << " " << sumAll(vector<double>{0.5, 0.25}) << " " << sumAll(vector<string>{"a", "b"}) << "\n";
    cout << addMixed(1, 2.5) << " " << addMixed(string("x"), "y") << "\n";
    Box<int> bi(5);
    Box<string> bs("str");
    bi.set(bi.get() * 2);
    cout << bi.get() << bs.get() << "\n";
    Pair2<int> p{3, 4};
    Pair2<double> d{1.5, 2.5};
    cout << p.sum() << d.sum() << "\n";
    show(1); show("s"); show(2.5); show('c');
    cout << "\n";
    return 0;
}
