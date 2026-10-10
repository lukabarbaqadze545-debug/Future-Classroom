#include <iostream>
#include <string>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    long long c;
    double d;
    string w;
    char ch;
    cin >> c >> d >> w >> ch;
    cout << a + b << " " << c * 2 << " " << d / 2 << " " << w << " " << ch << "\n";
    string line;
    getline(cin, line);
    getline(cin, line);
    cout << "[" << line << "]\n";
    int n;
    int sum = 0;
    while (cin >> n) sum += n;
    cout << sum << "\n";
    cout << cin.eof() << cin.fail() << "\n";
    return 0;
}
