#include <iostream>
using namespace std;
void setTo(int &r, int v) { r = v; }
void setPtr(int *p, int v) { *p = v; }
int &pick(int &a, int &b, bool first) { return first ? a : b; }
int main() {
    int x = 5;
    int *p = &x;
    int &r = x;
    *p = 6;
    r++;
    cout << x << *p << r << "\n";
    setTo(x, 20);
    setPtr(&x, x + 1);
    cout << x << "\n";
    int a = 1, b = 2;
    pick(a, b, false) = 99;
    cout << a << b << "\n";
    int arr[5] = {10, 20, 30, 40, 50};
    int *q = arr;
    cout << *q << *(q + 2) << q[4] << " " << *(arr + 1) << "\n";
    q += 3;
    cout << *q << " " << (q - arr) << "\n";
    q--;
    *q = 0;
    for (int v : arr) cout << v << " ";
    cout << "\n";
    int **pp = &p;
    **pp = 7;
    cout << x << "\n";
    int *n = nullptr;
    cout << (n == nullptr) << (p != nullptr) << (p == &x) << "\n";
    int *dyn = new int(42);
    int *darr = new int[5];
    for (int i = 0; i < 5; i++) darr[i] = i * i;
    cout << *dyn << darr[4] << "\n";
    delete dyn;
    delete[] darr;
    const int c = 10;
    const int *cp = &c;
    cout << *cp << "\n";
    const char *s = "hello";
    int len = 0;
    while (s[len]) len++;
    cout << len << " " << s[1] << " " << *(s + 4) << "\n";
    swap(a, b);
    cout << a << b << "\n";
    return 0;
}
