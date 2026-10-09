#include <iostream>
#include <string>
#include <vector>
using namespace std;
class Shape {
protected:
    string name;
public:
    Shape(string n) : name(n) {}
    virtual ~Shape() {}
    virtual double area() const = 0;
    virtual string describe() const { return name + " with area " + to_string((int)area()); }
    string getName() const { return name; }
};
class Rect : public Shape {
    double w, h;
public:
    Rect(double w, double h) : Shape("rect"), w(w), h(h) {}
    double area() const override { return w * h; }
};
class Square : public Rect {
public:
    Square(double s) : Rect(s, s) { name = "square"; }
    string describe() const override { return "SQ:" + Rect::describe(); }
};
class Circle : public Shape {
    double r;
public:
    Circle(double r) : Shape("circle"), r(r) {}
    double area() const override { return 3.0 * r * r; }
};
int main() {
    vector<Shape *> shapes;
    shapes.push_back(new Rect(2, 3));
    shapes.push_back(new Square(4));
    shapes.push_back(new Circle(2));
    double total = 0;
    for (Shape *s : shapes) {
        cout << s->describe() << "\n";
        total += s->area();
    }
    cout << total << "\n";
    for (Shape *s : shapes) delete s;
    Square sq(5);
    Shape &ref = sq;
    cout << ref.getName() << ref.area() << "\n";
    return 0;
}
