#include <cstdio>
int main() {
    printf("%d %5d|%-5d|%05d|%+d\n", 42, 42, 42, 42, 42);
    printf("%x %X %o %#x %#o\n", 255, 255, 8, 255, 8);
    printf("%f %.2f %8.3f|%-8.1f|%e %.3e %g %g %g\n", 3.14159, 3.14159, 3.14159, 3.14159, 12345.6789, 12345.6789, 0.0001, 100000.0, 1e-5);
    printf("%c %s %10s|%-10s|%.3s\n", 'A', "hello", "hi", "hi", "abcdef");
    printf("%lld %llu %ld %u\n", 9000000000000000000LL, 18000000000000000000ULL, 123456789012L, 4000000000u);
    printf("%5.1f%%\n", 45.678);
    printf("%d%%\n", 50);
    printf("%3d|%-3d|%03d\n", 1234, 1234, 1234);
    printf("%.0f %.0f %.0f %.0f\n", 0.5, 1.5, 2.5, 3.5);
    printf("%s\n", "end");
    printf("%*d|%-*d|\n", 6, 42, 6, 42);
    printf("%5c|%-5c|\n", 'x', 'y');
    printf("%i %hd %hhd\n", 7, 70000, 300);
    return 0;
}
