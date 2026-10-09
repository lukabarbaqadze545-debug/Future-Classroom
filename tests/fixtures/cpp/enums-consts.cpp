#include <iostream>
#include <string>
using namespace std;
enum Color { RED, GREEN = 5, BLUE };
enum class Level : int { LOW = 1, MID, HIGH };
const int N = 5;
constexpr int M = N * 2;
#define SQUARE(x) ((x) * (x))
#define MAXN 100
typedef long long ll;
using ull = unsigned long long;
string name(Color c) { switch (c) { case RED: return "red"; case GREEN: return "green"; default: return "blue"; } }
int main() {
    Color c = GREEN;
    cout << c << " " << BLUE << " " << name(c) << name(BLUE) << " " << (c == GREEN) << "\n";
    Level l = Level::MID;
    cout << (int)l << " " << (l == Level::MID) << (l < Level::HIGH) << " " << static_cast<int>(Level::HIGH) << "\n";
    int arr[N];
    for (int i = 0; i < N; i++) arr[i] = i * M;
    cout << arr[4] << " " << M << " " << SQUARE(3 + 1) << " " << MAXN << "\n";
    ll big = 1LL << 50;
    ull ub = 18446744073709551615ULL;
    cout << big << " " << ub << "\n";
    for (int i = RED; i <= BLUE; i++) cout << i << ",";
    cout << "\n";
    return 0;
}
