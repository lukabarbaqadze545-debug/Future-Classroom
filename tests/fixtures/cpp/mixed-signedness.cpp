#include <iostream>
#include <climits>
#include <cstdint>
using namespace std;
int main() {
    int a = -1;
    unsigned b = 1;
    cout << (a < b) << (a > b) << (a == (int)b) << "\n";
    cout << (-1 < 1u) << (-1LL < 1ULL) << (char)200 << (int)(char)200 << (int)(unsigned char)200 << "\n";
    unsigned char c = 250;
    c += 10;
    cout << (int)c << " " << (c + 10) << "\n";
    short s = 30000;
    s += 30000;
    cout << s << "\n";
    cout << (5u - 10u) << " " << (5 - 10u) << " " << (int)(5u - 10u) << "\n";
    uint8_t u8 = 255;
    u8++;
    int8_t i8 = 127;
    i8++;
    cout << (int)u8 << " " << (int)i8 << "\n";
    uint32_t u32 = 4000000000u;
    int64_t i64 = (int64_t)u32 * 4;
    cout << u32 << " " << i64 << " " << (uint64_t)-1 << "\n";
    long long x = LLONG_MAX;
    unsigned long long y = (unsigned long long)x + 1;
    cout << y << " " << (x - LLONG_MAX) << " " << (long long)(y) << "\n";
    cout << (1 << 31) << " " << (1u << 31) << " " << (1LL << 62) << " " << (3000000000u + 3000000000u) << "\n";
    cout << 7 / 2 * 2.0 << " " << 7 / 2.0 * 2 << " " << (double)(7 / 2) << " " << 1.0 * 7 / 2 << "\n";
    cout << 'a' + 1 << " " << (char)('a' + 1) << " " << 'a' + 'b' << " " << "ab"[1] << "\n";
    int arr[] = {1, 2, 3};
    cout << sizeof(arr) << " " << sizeof(arr[0]) << " " << sizeof(arr) / sizeof(arr[0]) << " " << sizeof(long) << " " << sizeof(short) << " " << sizeof(float) << "\n";
    float f = 16777216.0f;
    f += 1;
    cout << f << " " << (double)f << "\n";
    double d = 0.1 + 0.2;
    cout << d << " " << (d == 0.3) << " ";
    cout.precision(17);
    cout << d << "\n";
    cout << (int)3.99 << (int)-3.99 << (long long)3e9 << " " << (unsigned)3.7 << "\n";
    return 0;
}
