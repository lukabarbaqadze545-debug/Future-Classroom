#include <iostream>
#include <vector>
#include <string>
using namespace std;
int counter = 10;
vector<int> gv = {1, 2, 3};
string gs = "global";
int garr[5];
double gd;
bool gb;
char gc;
struct S { int a; double b; };
S gS;
int initFn() { return 77; }
int viaFn = initFn();
void bump() { counter++; gv.push_back(counter); }
int main() {
    bump(); bump();
    cout << counter << gv.size() << gs << garr[2] << gd << gb << (int)gc << gS.a << gS.b << viaFn << "\n";
    for (int x : gv) cout << x << " ";
    cout << "\n";
    return 0;
}
