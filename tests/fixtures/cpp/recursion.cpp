#include <iostream>
#include <vector>
#include <string>
using namespace std;
long long fibm[91];
long long fib(int n) { if (n < 2) return n; if (fibm[n]) return fibm[n]; return fibm[n] = fib(n - 1) + fib(n - 2); }
int ackermann(int m, int n) { return m == 0 ? n + 1 : n == 0 ? ackermann(m - 1, 1) : ackermann(m - 1, ackermann(m, n - 1)); }
void hanoi(int n, char a, char b, char c, int &moves) { if (n == 0) return; hanoi(n - 1, a, c, b, moves); moves++; hanoi(n - 1, c, b, a, moves); }
void perms(string s, int l, vector<string> &out) {
    if (l == (int)s.size()) { out.push_back(s); return; }
    for (int i = l; i < (int)s.size(); i++) { swap(s[l], s[i]); perms(s, l + 1, out); swap(s[l], s[i]); }
}
int sumDigits(int n) { return n == 0 ? 0 : n % 10 + sumDigits(n / 10); }
bool isPal(const string &s, int i, int j) { return i >= j || (s[i] == s[j] && isPal(s, i + 1, j - 1)); }
long long power(long long b, int e) { if (e == 0) return 1; long long h = power(b, e / 2); return e % 2 ? h * h * b : h * h; }
int depth(int n) { return n == 0 ? 0 : 1 + depth(n - 1); }
int main() {
    cout << fib(90) << " " << ackermann(2, 3) << " " << sumDigits(98765) << " " << isPal("racecar", 0, 6) << isPal("ab", 0, 1) << " " << power(3, 30) << "\n";
    int moves = 0;
    hanoi(10, 'A', 'B', 'C', moves);
    cout << moves << "\n";
    vector<string> out;
    perms("abc", 0, out);
    for (auto &s : out) cout << s << " ";
    cout << "\n";
    cout << depth(50000) << "\n";
    return 0;
}
