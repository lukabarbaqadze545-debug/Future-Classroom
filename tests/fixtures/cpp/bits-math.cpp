#include <iostream>
#include <cmath>
#include <cstdlib>
#include <bitset>
#include <climits>
using namespace std;
int main() {
    cout << abs(-5) << abs(-2.5) << labs(-7L) << " " << fabs(-1.5) << "\n";
    cout << pow(2, 0.5) << " " << sqrt(144) << " " << cbrt(27) << " " << hypot(3, 4) << " " << exp(1) << " " << log(M_E) << " " << log10(1000) << " " << log2(8) << "\n";
    cout << sin(0) << cos(0) << " " << atan2(1, 1) * 4 << " " << floor(2.7) << ceil(2.1) << round(2.5) << trunc(-2.7) << " " << fmod(7.5, 2) << "\n";
    cout << (1 << 10) << " " << (1LL << 40) << " " << (0xFF & 0x0F) << " " << (5 ^ 3) << " " << __builtin_popcount(255) << " " << __builtin_clz(1) << " " << __builtin_ctz(8) << "\n";
    bitset<8> b(37);
    cout << b << " " << b.count() << " " << b[0] << b[1] << " " << b.to_ulong() << "\n";
    b.flip(1); b.set(7); b.reset(0);
    cout << b << " " << b.any() << b.none() << "\n";
    cout << INT_MAX << " " << INT_MIN << " " << LLONG_MAX << " " << UINT_MAX << " " << (long long)INT_MAX + 1 << "\n";
    cout << 7 / 2 << -7 / 2 << 7 % -3 << -7 % 3 << " " << 7.0 / 2 << " " << 1e9 + 7 << " " << (int)(1e9 + 7) << "\n";
    unsigned int u = 1;
    cout << (u << 31) << " " << (u << 31 >> 31) << " " << (~0u) << " " << (-1 >> 1) << "\n";
    cout << isnan(NAN) << isinf(INFINITY) << " " << (0.1 + 0.2 == 0.3) << " " << (fabs(0.1 + 0.2 - 0.3) < 1e-9) << "\n";
    cout << 10 % 3 * 2 + 1 << " " << (2 + 3) * 4 << " " << 2 + 3 * 4 << " " << 10 - 2 - 3 << " " << 100 / 10 / 5 << " " << (1 + 2 == 3 && 2 * 2 == 4) << "\n";
    return 0;
}
