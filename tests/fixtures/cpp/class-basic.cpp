#include <iostream>
#include <string>
using namespace std;
class Account {
private:
    string owner;
    double balance;
    static int count;
public:
    Account(string o, double b = 0) : owner(o), balance(b) { count++; }
    void deposit(double x) { if (x > 0) balance += x; }
    bool withdraw(double x) {
        if (x > balance) return false;
        balance -= x;
        return true;
    }
    double getBalance() const { return balance; }
    string getOwner() const { return owner; }
    static int getCount() { return count; }
};
int Account::count = 0;
class Counter {
    int n;
public:
    Counter() : n(0) {}
    Counter &inc() { n++; return *this; }
    int get() const { return n; }
};
int main() {
    Account a("ann", 100);
    Account b("bob");
    a.deposit(50);
    b.deposit(-5);
    cout << a.getBalance() << " " << b.getBalance() << " " << a.withdraw(500) << a.withdraw(30) << " " << a.getBalance() << "\n";
    cout << Account::getCount() << a.getOwner() << "\n";
    Counter c;
    c.inc().inc().inc();
    cout << c.get() << "\n";
    Account *p = new Account("zed", 5);
    cout << p->getOwner() << p->getBalance() << Account::getCount() << "\n";
    delete p;
    return 0;
}
