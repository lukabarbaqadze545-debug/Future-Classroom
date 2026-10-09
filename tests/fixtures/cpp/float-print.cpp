#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;
int main() {
    double vals[] = {0.0, 1.0, -1.5, 100.0, 1e5, 1e6, 1e7, 123456.789, 1234567.89, 0.1, 0.01, 0.001, 0.0001, 0.00001, 1e-6, 1e-7, 3.14159265358979, 2.718281828459045, 1.0 / 3, 2.0 / 3, 1e15, 1e16, 1e17, 123456789012345678.0, 5e-324, 1.7976931348623157e308};
    for (double v : vals) cout << v << " ";
    cout << "\n";
    for (double v : vals) cout << fixed << setprecision(3) << v << " ";
    cout << defaultfloat << "\n";
    for (double v : vals) cout << scientific << setprecision(2) << v << " ";
    cout << defaultfloat << "\n";
    cout << setprecision(10);
    for (double v : {1.0 / 3, 22.0 / 7, 1e10, 1e-10, 12345.6789012345}) cout << v << " ";
    cout << "\n";
    cout << setprecision(1) << 0.5 << " " << 1.5 << " " << 2.5 << " " << 0.05 << " " << 0.15 << " " << 0.25 << " " << 0.35 << "\n";
    cout << fixed << setprecision(0) << 0.5 << " " << 1.5 << " " << 2.5 << " " << 3.5 << " " << -0.5 << "\n";
    cout << fixed << setprecision(2) << 2.675 << " " << 1.005 << " " << 0.125 << " " << 0.375 << "\n";
    cout << defaultfloat << setprecision(6);
    float fl[] = {0.1f, 1.0f / 3, 16777217.0f, 3.4e38f, 1.5e-5f};
    for (float v : fl) cout << v << " ";
    cout << "\n";
    cout << sqrt(-1.0) << " " << 1.0 / 0 << " " << -1.0 / 0 << " " << log(0.0) << "\n";
    cout << (0.0 == -0.0) << " " << -0.0 << " " << 0.0 * -1 << "\n";
    cout << setw(10) << 3.14159 << "|" << setw(10) << left << 2.5 << "|" << right << setw(10) << setfill('0') << 1.5 << "\n";
    return 0;
}
