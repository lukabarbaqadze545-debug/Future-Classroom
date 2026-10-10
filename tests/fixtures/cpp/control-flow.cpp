#include <iostream>
using namespace std;
int main() {
    for (int i = 0; i < 5; i++) {
        if (i == 1) continue;
        if (i == 4) break;
        cout << i << " ";
    }
    cout << "\n";
    int n = 0;
    while (n < 20) {
        n += 7;
        if (n % 2 == 0) continue;
        cout << n << " ";
    }
    cout << "\n";
    do {
        n--;
    } while (n > 18);
    cout << n << "\n";
    for (int i = 0, j = 10; i < j; i += 3, j -= 2) cout << i << ":" << j << " ";
    cout << "\n";
    int k = 3;
    switch (k) {
        case 1: cout << "one\n"; break;
        case 3: cout << "three\n";
        case 4: cout << "four (fallthrough)\n"; break;
        default: cout << "other\n";
    }
    for (int i = 0; i < 3; i++) {
        switch (i) {
            case 0: cout << "zero "; continue;
            case 1: cout << "one "; break;
            default: cout << "many ";
        }
        cout << "after" << i << " ";
    }
    cout << "\n";
    for (int i = 1; i <= 3; i++)
        for (int j = 1; j <= 3; j++) {
            if (j == 2) continue;
            if (i == 3) break;
            cout << i * j << " ";
        }
    cout << "\n";
    int t = 5;
    string s = t > 3 ? "big" : "small";
    cout << s << " " << (t > 10 ? 1 : t > 4 ? 2 : 3) << "\n";
    if (t == 5) cout << "five\n"; else cout << "not five\n";
    if (t < 3) cout << "a\n"; else if (t < 6) cout << "b\n"; else cout << "c\n";
    for (;;) { if (++t > 8) break; }
    cout << t << "\n";
    goto end;
    cout << "skipped\n";
end:
    cout << "done\n";
    return 0;
}
