#include <iostream>
#include <string>
using namespace std;
int main() {
    string s = "Hello, World";
    cout << s.size() << " " << s.length() << " " << s[0] << " " << s.at(4) << " " << s.front() << s.back() << "\n";
    cout << s.substr(7) << "|" << s.substr(0, 5) << "|" << s.substr(3, 4) << "\n";
    cout << s.find("World") << " " << s.find('o') << " " << s.find('o', 5) << " " << (s.find("xyz") == string::npos) << " " << s.rfind('o') << "\n";
    string t = s + "!" + string(3, '?');
    cout << t << "\n";
    t.append(" end");
    t.insert(0, ">> ");
    cout << t << "\n";
    t.erase(0, 3);
    t.replace(0, 5, "Howdy");
    cout << t << "\n";
    t.pop_back();
    t.push_back('#');
    cout << t << " " << t.empty() << " " << string().empty() << "\n";
    cout << (string("abc") < string("abd")) << (string("b") > string("abc")) << ("abc" == string("abc")) << (string("a") != "b") << "\n";
    cout << string("abc").compare("abd") << " " << string("b").compare("a") << " " << string("a").compare("a") << "\n";
    string u = "abc";
    u[1] = 'X';
    u += "de";
    u += 'f';
    cout << u << " " << u.size() << "\n";
    for (char c : u) cout << (int)c << ",";
    cout << "\n";
    string num = to_string(12345) + to_string(-6) + to_string(2.5) + to_string(true);
    cout << num << "\n";
    cout << stoi("123") + 1 << " " << stoi("-45xyz") << " " << stod("3.5e2") << " " << stoll("9000000000") << " " << stoi("ff", nullptr, 16) << "\n";
    string w = "  padded  ";
    cout << "[" << w << "]" << w.size() << "\n";
    string a = "x", b = a;
    b += "y";
    cout << a << b << "\n";
    cout << s.find_first_of("ol") << " " << s.find_last_of("ol") << " " << s.find_first_not_of("Hel") << "\n";
    string r(s.rbegin(), s.rend());
    cout << r << "\n";
    cout << s.substr(s.size() - 3) << "\n";
    cout << string("a,b,c").find(',') << "\n";
    const char* cs = "c-string";
    string fromC = cs;
    cout << fromC << " " << fromC.c_str() << " " << fromC.size() << "\n";
    return 0;
}
