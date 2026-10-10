#include <iostream>
#include <sstream>
#include <string>
using namespace std;
int main() {
    istringstream in("10 20 abc 3.5");
    int a, b;
    string s;
    double d;
    in >> a >> b >> s >> d;
    cout << a + b << s << d << "\n";
    ostringstream out;
    out << "x=" << 5 << ",y=" << 2.5 << ";";
    cout << out.str() << "\n";
    stringstream ss;
    ss << 42;
    int v;
    ss >> v;
    cout << v + 1 << "\n";
    string csv = "a,b,,c";
    stringstream cs(csv);
    string part;
    while (getline(cs, part, ',')) cout << "[" << part << "]";
    cout << "\n";
    return 0;
}
