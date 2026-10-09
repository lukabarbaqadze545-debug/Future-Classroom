#include <iostream>
#include <cmath>
using namespace std;
int main() {
    double d = 3.99;
    cout << (int)d << " " << (int)-3.99 << " " << (long long)1e18 << " " << (int)'A' << " " << (char)66 << "\n";
    int i = 7;
    double r = i / 2;
    cout << r << " " << (double)i / 2 << " " << i / 2.0f << "\n";
    float f = 0.1f;
    double g = f;
    cout << f << " " << g << " " << (f == 0.1) << " " << (f == 0.1f) << "\n";
    cout.precision(10);
    cout << f << " " << g << " " << 0.1 << " " << 1.0 / 3 << " " << 100.0 / 3 << "\n";
    cout << 1e10 << " " << 1e-5 << " " << 123456789.0 << " " << 1234567.0 << " " << 0.0001234 << "\n";
    cout << sqrt(2) << " " << pow(2, 10) << " " << pow(2.5, 3) << " " << floor(-2.5) << " " << ceil(-2.5) << " " << round(2.5) << " " << round(-2.5) << " " << fabs(-3.2) << "\n";
    char c = 'a';
    c += 2;
    cout << c << " " << (c - 'a') << " " << (char)(c - 32) << " " << c + 1 << "\n";
    bool b = 5;
    cout << b << " " << (b + b) << "\n";
    cout << (unsigned)-1 << " " << (int)4294967295u << " " << (short)70000 << "\n";
    return 0;
}
