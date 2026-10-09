#include <iostream>
#include <string>
#include <algorithm>
#include <vector>
#include <sstream>
using namespace std;
bool isPalin(string s) { string t = s; reverse(t.begin(), t.end()); return s == t; }
string caesar(string s, int k) { for (char &c : s) if (c >= 'a' && c <= 'z') c = 'a' + (c - 'a' + k) % 26; return s; }
vector<string> split(const string &s, char d) { vector<string> out; string cur; for (char c : s) { if (c == d) { out.push_back(cur); cur.clear(); } else cur += c; } out.push_back(cur); return out; }
int main() {
    cout << isPalin("level") << isPalin("hello") << "\n";
    cout << caesar("hello world", 3) << "\n";
    for (auto &p : split("a,bb,,ccc", ',')) cout << "[" << p << "]";
    cout << "\n";
    string s = "the quick brown fox";
    stringstream ss(s);
    string w, longest;
    int words = 0;
    while (ss >> w) { words++; if (w.size() > longest.size()) longest = w; }
    cout << words << longest << "\n";
    sort(s.begin(), s.end());
    cout << s << "|\n";
    string t = "aabbbcccc";
    string comp;
    for (size_t i = 0; i < t.size();) { size_t j = i; while (j < t.size() && t[j] == t[i]) j++; comp += t[i]; comp += to_string(j - i); i = j; }
    cout << comp << "\n";
    string u = "Hello";
    transform(u.begin(), u.end(), u.begin(), ::toupper);
    cout << u << "\n";
    cout << count(t.begin(), t.end(), 'c') << " " << (find(t.begin(), t.end(), 'z') == t.end()) << "\n";
    string a = "apple", b = "apricot";
    int i = 0;
    while (i < (int)a.size() && i < (int)b.size() && a[i] == b[i]) i++;
    cout << a.substr(0, i) << "\n";
    string num = "12345";
    int sum = 0;
    for (char c : num) sum += c - '0';
    cout << sum << " " << stoi(num) * 2 << "\n";
    string big = "99999999999999999999";
    string add = "1";
    int carry = 1;
    string res;
    for (int k = big.size() - 1; k >= 0; k--) { int d = big[k] - '0' + carry; res += char('0' + d % 10); carry = d / 10; }
    if (carry) res += '1';
    reverse(res.begin(), res.end());
    cout << res << "\n";
    return 0;
}
