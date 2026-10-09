#include <iostream>
#include <vector>
#include <queue>
#include <array>
#include <numeric>
#include <algorithm>
using namespace std;
int main() {
    int R = 5, C = 6;
    vector<string> g = {
        "S..#..",
        ".#.#.#",
        ".#...#",
        ".####.",
        "....#E"};
    vector<vector<int>> dist(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    q.push({0, 0});
    dist[0][0] = 0;
    int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] == '#' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }
    for (auto &row : dist) { for (int x : row) cout << x << "\t"; cout << "\n"; }
    array<int, 5> a = {5, 4, 3, 2, 1};
    sort(a.begin(), a.end());
    cout << a[0] << a.back() << a.size() << accumulate(a.begin(), a.end(), 0) << "\n";
    vector<vector<long long>> m = {{1, 1}, {1, 0}}, res = {{1, 0}, {0, 1}};
    auto mul = [](const vector<vector<long long>> &x, const vector<vector<long long>> &y) {
        vector<vector<long long>> z(2, vector<long long>(2, 0));
        for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) for (int k = 0; k < 2; k++) z[i][j] += x[i][k] * y[k][j];
        return z;
    };
    for (int e = 50; e > 0; e >>= 1) { if (e & 1) res = mul(res, m); m = mul(m, m); }
    cout << res[0][1] << "\n";
    vector<int> pre(11, 0);
    for (int i = 1; i <= 10; i++) pre[i] = pre[i - 1] + i * i;
    cout << pre[10] - pre[3] << "\n";
    vector<vector<char>> board(3, vector<char>(3, '.'));
    board[1][1] = 'X'; board[0][2] = 'O';
    for (auto &row : board) { for (char ch : row) cout << ch; cout << "\n"; }
    return 0;
}
