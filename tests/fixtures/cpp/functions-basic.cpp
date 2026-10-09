#include <iostream>
using namespace std;
int square(int x) { return x * x; }
double avg(double a, double b) { return (a + b) / 2; }
void swapv(int &a, int &b) { int t = a; a = b; b = t; }
int addDefault(int a, int b = 10, int c = 100) { return a + b + c; }
int over(int x) { return x; }
double over(double x) { return x * 2; }
string over(string x) { return x + x; }
bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;
    return true;
}
long long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
void incr(int *p) { (*p)++; }
int sumArr(int a[], int n) { int s = 0; for (int i = 0; i < n; i++) s += a[i]; return s; }
inline int twice(int x) { return 2 * x; }
int main() {
    cout << square(7) << " " << avg(3, 4) << " " << addDefault(1) << " " << addDefault(1, 2) << " " << addDefault(1, 2, 3) << "\n";
    int a = 1, b = 2;
    swapv(a, b);
    cout << a << b << "\n";
    cout << over(3) << " " << over(3.0) << " " << over(string("ab")) << " " << over('a') << "\n";
    for (int i = 0; i < 20; i++) if (isPrime(i)) cout << i << " ";
    cout << "\n";
    cout << fact(15) << " " << fib(20) << " " << gcd(84, 36) << "\n";
    int z = 5;
    incr(&z);
    incr(&z);
    cout << z << "\n";
    int arr[] = {1, 2, 3, 4, 5};
    cout << sumArr(arr, 5) << " " << twice(21) << "\n";
    return 0;
}
