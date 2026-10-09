#include <iostream>
#include <vector>
#include <string>
using namespace std;
class Animal {
public:
    virtual void speak() const = 0;
    virtual string kind() const { return "animal"; }
    virtual ~Animal() {}
};
class Dog : public Animal {
public:
    void speak() const override { cout << "Woof\n"; }
    string kind() const override { return "dog"; }
};
class Cat : public Animal {
public:
    void speak() const override { cout << "Meow\n"; }
};
void talk(const Animal &a) { a.speak(); cout << a.kind() << "\n"; }
int main() {
    Dog d;
    Cat c;
    talk(d);
    talk(c);
    vector<Animal *> zoo = {&d, &c, new Dog()};
    for (auto *a : zoo) a->speak();
    delete zoo[2];
    Animal *p = &c;
    p->speak();
    return 0;
}
