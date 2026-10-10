#include <iostream>
#include <climits>
using namespace std;
int main() {
    int big = INT_MAX;
    unsigned u = big;
    u += 1;
    cout << u << "\n";
    unsigned z = 0;
    z--;
    cout << z << "\n";
    long long ll = 1LL << 40;
    cout << ll << " " << ll * 1000000 << " " << LLONG_MAX << " " << LLONG_MIN << "\n";
    unsigned long long ull = 18446744073709551615ULL;
    cout << ull << " " << ull + 1 << " " << ull / 3 << "\n";
    short s = 32767;
    s = s + 1;
    cout << s << "\n";
    char c = 127;
    c = c + 1;
    cout << (int)c << "\n";
    unsigned char uc = 255;
    uc++;
    cout << (int)uc << "\n";
    int m = 1000000;
    long long p = (long long)m * m;
    cout << p << "\n";
    int q = 46341;
    cout << (unsigned)(q * q) << "\n";
    cout << (long long)INT_MIN * -1 << " " << -(long long)INT_MIN << "\n";
    cout << 7ULL * 1000000007ULL % 998244353ULL << "\n";
    long long f = 1;
    for (int i = 1; i <= 20; i++) f *= i;
    cout << f << "\n";
    cout << (unsigned long long)f * 21 << "\n";
    return 0;
}
