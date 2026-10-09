#include <iostream>
#include <string>
#include <sstream>
using namespace std;
int main() {
    int n;
    cin >> n;
    cin.ignore();
    for (int i = 0; i < n; i++) {
        string line;
        getline(cin, line);
        cout << i << ": " << line << " (" << line.size() << ")\n";
    }
    string rest;
    while (getline(cin, rest)) {
        stringstream ss(rest);
        string tok;
        int cnt = 0;
        while (ss >> tok) cnt++;
        cout << cnt << ";";
    }
    cout << "\n";
    return 0;
}
