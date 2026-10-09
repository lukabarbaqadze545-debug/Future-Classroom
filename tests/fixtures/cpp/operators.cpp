#include <iostream>
using namespace std;
struct Vec2 {
    int x, y;
    Vec2(int x = 0, int y = 0) : x(x), y(y) {}
    Vec2 operator+(const Vec2 &o) const { return Vec2(x + o.x, y + o.y); }
    Vec2 operator*(int k) const { return Vec2(x * k, y * k); }
    bool operator==(const Vec2 &o) const { return x == o.x && y == o.y; }
    bool operator<(const Vec2 &o) const { return x < o.x || (x == o.x && y < o.y); }
    Vec2 &operator+=(const Vec2 &o) { x += o.x; y += o.y; return *this; }
    int &operator[](int i) { return i == 0 ? x : y; }
};
ostream &operator<<(ostream &os, const Vec2 &v) { return os << "(" << v.x << "," << v.y << ")"; }
istream &operator>>(istream &is, Vec2 &v) { return is >> v.x >> v.y; }
int main() {
    Vec2 a(1, 2), b(3, 4);
    cout << a + b << " " << a * 3 << " " << (a == b) << (a < b) << "\n";
    a += b;
    cout << a << " " << a[0] << a[1] << "\n";
    a[1] = 50;
    cout << a << "\n";
    Vec2 c;
    cin >> c;
    cout << c << "\n";
    return 0;
}
