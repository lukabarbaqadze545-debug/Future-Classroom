#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string s = "hello world";
    s.insert(5, ",");
    s.insert(s.end(), '!');
    s.erase(s.find(' '), 1);
    cout << s << "\n";
    s.replace(s.find("world"), 5, "there");
    cout << s << " " << s.size() << "\n";
    s.resize(5);
    cout << s << "|" << s.capacity() / 100 << "\n";
    s.resize(8, '.');
    cout << s << "\n";
    s.assign("abc");
    s.append(3, 'x').append("yz", 1);
    cout << s << "\n";
    cout << s.substr(2, 100) << "|" << s.substr(s.size()) << "|" << "\n";
    string a = "apple", b = "Apple";
    cout << (a < b) << (a == b) << a.compare(b) << " " << a.compare(0, 2, "ap") << "\n";
    string t = "a-b-c";
    replace(t.begin(), t.end(), '-', '+');
    cout << t << " " << count(t.begin(), t.end(), '+') << "\n";
    string num = "007";
    cout << stoi(num) << " " << stoi("  42abc") << " " << stol("-123456789012") << " " << stod("1e3") << " " << stoi("1010", nullptr, 2) << " " << stoul("ff", nullptr, 16) << "\n";
    cout << to_string(0.5) << " " << to_string(-7) << " " << to_string(1e10) << " " << to_string(100000000000LL) << " " << to_string(3.0f) << "\n";
    string w = "madam";
    cout << equal(w.begin(), w.begin() + w.size() / 2, w.rbegin()) << "\n";
    cout << string(5, 'a') + string("bc") << " " << string("xyz", 2) << " " << string(w, 1, 3) << "\n";
    string e;
    cout << e.empty() << e.size() << "[" << e << "]" << (e == "") << "\n";
    e += "x";
    e = e + e + "y";
    cout << e << " " << e.front() << e.back() << "\n";
    cout << s.find("zz") << " " << (s.find("zz") == string::npos) << " " << string::npos << "\n";
    char buf[20] = "cstr";
    string fromBuf = buf;
    fromBuf += buf;
    cout << fromBuf << " " << fromBuf.c_str()[1] << "\n";
    string up = "MiXeD 123";
    for (auto &ch : up) ch = isupper(ch) ? tolower(ch) : toupper(ch);
    cout << up << "\n";
    cout << (string("a") + 'b' + "c" + to_string(1)) << "\n";
    string lines = "one\ntwo\nthree";
    cout << count(lines.begin(), lines.end(), '\n') << " " << lines.find('\n') << " " << lines.rfind('\n') << "\n";
    cout << s.at(0) << s[1] << *s.begin() << *(s.end() - 1) << "\n";
    return 0;
}
