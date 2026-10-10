#include <iostream>
using namespace std;
int main() {
    int a[5] = {5, 3, 1};
    cout << a[0] << a[1] << a[2] << a[3] << a[4] << "\n";
    int b[] = {9, 8, 7, 6};
    int n = sizeof(b) / sizeof(b[0]);
    cout << n << " " << sizeof(int) << " " << sizeof(long long) << " " << sizeof(double) << " " << sizeof(char) << " " << sizeof(bool) << "\n";
    int g[3][4] = {};
    for (int i = 0; i < 3; i++) for (int j = 0; j < 4; j++) g[i][j] = i * j;
    for (int i = 0; i < 3; i++) { for (int j = 0; j < 4; j++) cout << g[i][j] << " "; cout << "\n"; }
    int m[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int t = 0;
    for (auto &row : m) for (int x : row) t += x;
    cout << t << "\n";
    char name[10] = "abc";
    cout << name << " " << sizeof(name) << "\n";
    int copy[4];
    for (int i = 0; i < 4; i++) copy[i] = b[3 - i];
    for (int x : copy) cout << x << " ";
    cout << "\n";
    bool seen[10] = {};
    seen[3] = true;
    cout << seen[3] << seen[4] << "\n";
    long long big[3] = {1LL << 40, 2, 3};
    cout << big[0] + big[1] << "\n";
    double d[3] = {1.5, 2.5};
    cout << d[0] + d[1] + d[2] << "\n";
    return 0;
}
