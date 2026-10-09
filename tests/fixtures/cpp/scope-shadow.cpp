#include <iostream>
using namespace std;
int g = 100;
int counter() { static int c = 0; return ++c; }
int main() {
    int x = 1;
    {
        int x = 2;
        cout << x << " ";
        {
            int x = 3;
            cout << x << " ";
        }
        cout << x << " ";
    }
    cout << x << "\n";
    cout << g << " " << ::g << "\n";
    int g = 5;
    cout << g << " " << ::g << "\n";
    for (int i = 0; i < 3; i++) cout << counter() << " ";
    cout << "\n";
    for (int i = 0; i < 2; i++) { int i2 = i * 2; cout << i2 << " "; }
    cout << "\n";
    return 0;
}
