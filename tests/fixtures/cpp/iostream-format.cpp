#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    cout << fixed << setprecision(2) << 3.14159 << " " << 2.0 << " " << 1e6 << "\n";
    cout << setw(8) << 42 << "|" << setw(8) << left << 42 << "|" << right << setw(8) << "ab" << "|\n";
    cout << setfill('*') << setw(6) << 7 << setfill(' ') << "\n";
    cout << scientific << setprecision(3) << 12345.678 << " " << 0.00012 << "\n";
    cout << defaultfloat << 12345.678 << " " << 0.00012 << "\n";
    cout << hex << 255 << " " << oct << 8 << " " << dec << 99 << " " << showbase << hex << 255 << dec << noshowbase << "\n";
    cout << boolalpha << true << " " << false << noboolalpha << " " << true << "\n";
    cout << setprecision(3) << 1234.5678 << " " << 0.000123456 << " " << 100.0 << " " << 1.5 << "\n";
    cout << showpos << 5 << " " << -5 << noshowpos << " " << 5 << "\n";
    cout << setw(10) << setprecision(4) << fixed << 3.14159265 << "|\n";
    cout << uppercase << hex << 255 << nouppercase << dec << "\n";
    cout << 'x' << "str" << 42 << 3.5 << true << "\n";
    cout << setw(5) << 'c' << "|" << setw(3) << "toolong" << "|\n";
    cout << 1.0 << " " << 10.0 << " " << 0.5 << " " << 100000.0 << " " << 1000000.0 << " " << 12345678.0 << "\n";
    return 0;
}
