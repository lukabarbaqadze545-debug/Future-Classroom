#include <iostream>
#include <cctype>
#include <string>
using namespace std;
int main() {
    string s = "Hello World 123 !?";
    int up = 0, lo = 0, dg = 0, sp = 0, pu = 0, al = 0;
    for (char c : s) {
        if (isupper(c)) up++;
        if (islower(c)) lo++;
        if (isdigit(c)) dg++;
        if (isspace(c)) sp++;
        if (ispunct(c)) pu++;
        if (isalpha(c)) al++;
    }
    cout << up << lo << dg << sp << pu << al << "\n";
    for (char &c : s) c = toupper(c);
    cout << s << "\n";
    for (char &c : s) c = tolower(c);
    cout << s << "\n";
    cout << (char)toupper('z') << toupper('z') << " " << isalnum('_') << isalnum('9') << "\n";
    cout << ('a' < 'b') << ('Z' < 'a') << (int)'0' << " " << ('9' - '0') << " " << (char)('a' + 25) << "\n";
    char d = '7';
    int v = d - '0';
    cout << v * 2 << "\n";
    return 0;
}
