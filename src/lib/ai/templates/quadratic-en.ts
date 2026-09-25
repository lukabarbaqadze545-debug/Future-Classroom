import { discussion, exercise, exitTicket, multipleChoice, plot, poll, quiz, section } from "./builders";
import type { CuratedLesson } from "./types";

export const quadraticEn: CuratedLesson = {
  key: "quadratic-en",
  match: /quadratic|parabola|discriminant/i,
  subject: "mathematics",
  language: "en",
  title: "Quadratic Equations",
  topic: "Quadratic equations",
  grade: 11,
  durationMin: 45,
  difficulty: "standard",
  objective: "Students solve quadratic equations by factoring and with the quadratic formula, and use the discriminant to predict the number of real solutions.",
  content: {
    objectives: [
      "Recognise a quadratic equation in standard form ax² + bx + c = 0 and identify a, b and c.",
      "Solve quadratic equations by factoring.",
      "Use the quadratic formula and the discriminant to decide how many real solutions an equation has.",
      "Connect the solutions of an equation with the x-intercepts of a parabola.",
    ],
    sections: [
      section(
        "s1",
        "introduction",
        "Warm-up: a rectangle puzzle",
        5,
        `A rectangle has an area of 12 m², and one side is 1 m longer than the other. How long are the sides?

Let the shorter side be x. Then x(x + 1) = 12, which becomes x² + x − 12 = 0. This is a quadratic equation — the highest power of the unknown is 2.

Ask the class: can you find x by guessing? Is there more than one number that works? (x = 3 works; x = −4 also satisfies the equation but cannot be a length.)`,
      ),
      section(
        "s2",
        "explanation",
        "Standard form and roots",
        8,
        `A quadratic equation can always be written in standard form:

ax² + bx + c = 0, where a ≠ 0.

The solutions are called roots. On the graph of y = ax² + bx + c (a parabola), the roots are the x-values where the curve crosses the x-axis, because there y = 0.

Example: y = x² − 5x + 6 crosses the x-axis at x = 2 and x = 3, so the equation x² − 5x + 6 = 0 has roots 2 and 3.`,
        plot("x^2 - 5x + 6", -1, 6, "y = x² − 5x + 6 crosses the x-axis at x = 2 and x = 3"),
      ),
      section(
        "s3",
        "example",
        "Solving by factoring",
        8,
        `Solve x² − 5x + 6 = 0.

1. Look for two numbers that multiply to c = 6 and add to b = −5. They are −2 and −3.
2. Write the equation as a product: (x − 2)(x − 3) = 0.
3. A product is zero only when one factor is zero: x − 2 = 0 or x − 3 = 0.
4. So x = 2 or x = 3.
5. Check: 2² − 5·2 + 6 = 0 ✓ and 3² − 5·3 + 6 = 0 ✓.

Factoring is fast when the numbers are "nice". When they are not, we use the quadratic formula.`,
      ),
      section(
        "s4",
        "explanation",
        "The quadratic formula and the discriminant",
        10,
        `For ax² + bx + c = 0:

x = (−b ± √(b² − 4ac)) / (2a)

The expression under the root, D = b² − 4ac, is the discriminant. It tells us how many real roots there are:
• D > 0 → two different real roots (the parabola crosses the x-axis twice)
• D = 0 → one repeated root (the parabola touches the x-axis)
• D < 0 → no real roots (the parabola does not reach the x-axis)

Example: 2x² + 3x − 2 = 0. Here a = 2, b = 3, c = −2, so D = 9 + 16 = 25 and x = (−3 ± 5) / 4, giving x = 1/2 or x = −2.`,
        plot("2x^2 + 3x - 2", -3, 1.5, "y = 2x² + 3x − 2 has roots x = −2 and x = 1/2"),
      ),
      section(
        "s5",
        "practice",
        "Practice with feedback",
        10,
        `Students work through the classroom activities on their workstations. Encourage them to use hints before asking for the full solution, and to check every answer by substituting it back into the equation.

While students work, watch the live results: if many students choose the same wrong answer, pause and discuss it with the whole class.`,
      ),
      section(
        "s6",
        "summary",
        "Summary and exit ticket",
        4,
        `• A quadratic equation has the form ax² + bx + c = 0 with a ≠ 0.
• When a = 1, factoring works well if we can find two numbers whose product is c and whose sum is b.
• The quadratic formula always works; the discriminant b² − 4ac predicts the number of real roots.
• Roots are where the parabola meets the x-axis.

Finish with the exit ticket.`,
      ),
    ],
    activities: [
      multipleChoice(
        "a1",
        "Which of these is a quadratic equation?",
        ["3x + 5 = 0", "x² − 4x + 3 = 0", "x³ − x = 0", "2/x = 7"],
        1,
        {
          title: "Spot the quadratic",
          hints: [
            "A quadratic equation is defined by the highest power of x that appears. Which power is it?",
            "Look for the equation where the highest power of x is exactly 2.",
            "Check each option: what is the highest power in 3x + 5 = 0? In x³ − x = 0? Is 2/x a power of x at all?",
            "A quadratic has the form ax² + bx + c = 0 with a ≠ 0. Only one option has x² as its highest power with no x³ or 1/x terms.",
          ],
          solution: "x² − 4x + 3 = 0 is quadratic: its highest power of x is 2 (a = 1, b = −4, c = 3). 3x + 5 = 0 is linear, x³ − x = 0 is cubic, and 2/x = 7 is not a polynomial equation.",
          explanation: "Quadratic means the highest power of the unknown is 2. Here a = 1, b = −4 and c = 3.",
        },
      ),
      exercise("a2", "Solve by factoring: x² − 5x + 6 = 0", ["2, 3"], {
        title: "Factor and solve",
        hints: [
          "Try to write x² − 5x + 6 as a product of two brackets (x + p)(x + q). What must p·q and p + q be equal to?",
          "What two numbers multiply to 6 and add to −5?",
          "The numbers are −2 and −3, so x² − 5x + 6 = (x − 2)(x − 3). When is a product of two brackets equal to zero?",
          "(x − 2)(x − 3) = 0 means x − 2 = 0 or x − 3 = 0. Solve each small equation, then check both values in the original equation.",
        ],
        solution: "x² − 5x + 6 = (x − 2)(x − 3) = 0, so x = 2 or x = 3. Check: 2² − 5·2 + 6 = 0 ✓ and 3² − 5·3 + 6 = 0 ✓.",
        explanation: "A product is zero only when one of its factors is zero. The roots 2 and 3 are also where the parabola y = x² − 5x + 6 crosses the x-axis.",
      }),
      multipleChoice(
        "a3",
        "The discriminant of x² + 2x + 5 = 0 is D = 2² − 4·1·5 = −16. How many real solutions does the equation have?",
        ["Two", "One", "None", "Infinitely many"],
        2,
        {
          title: "Read the discriminant",
          hints: [
            "The sign of the discriminant tells you how many times the parabola meets the x-axis.",
            "Is D = −16 positive, zero or negative? What does that sign mean?",
            "In the formula x = (−b ± √D) / 2a you would need √(−16). Is that a real number?",
            "D < 0 means the square root in the formula is not a real number, so the parabola never reaches the x-axis.",
          ],
          solution: "D = −16 < 0, so there are no real solutions: √(−16) is not a real number, and the parabola y = x² + 2x + 5 stays above the x-axis.",
          explanation: "When D < 0 the parabola does not touch the x-axis, so the equation has no real roots.",
        },
      ),
      exercise("a4", "Use the quadratic formula to solve 2x² + 3x − 2 = 0.", ["1/2, -2", "0.5, -2"], {
        title: "Use the formula",
        hints: [
          "Start by identifying a, b and c in ax² + bx + c = 0.",
          "Here a = 2, b = 3 and c = −2. Compute the discriminant D = b² − 4ac first.",
          "D = 9 + 16 = 25, so √D = 5. Now substitute into x = (−b ± √D) / (2a).",
          "x = (−3 + 5) / 4 and x = (−3 − 5) / 4. Simplify both fractions.",
        ],
        solution: "a = 2, b = 3, c = −2. D = 3² − 4·2·(−2) = 25, √D = 5. x = (−3 ± 5)/4, so x = 2/4 = 1/2 or x = −8/4 = −2.",
        explanation: "Always compute the discriminant first: it tells you whether real roots exist before you do any more work.",
      }),
      discussion(
        "a5",
        "The equation x² + 4 = 0 has no real solutions. A classmate says “x = −2, because (−2)² = −4.” What would you tell them? How does the graph of y = x² + 4 support your answer?",
        {
          title: "Discuss a mistake",
          hints: [
            "Calculate (−2)² carefully. Is the result negative?",
            "Can the square of any real number be negative? Think about where the parabola y = x² + 4 lies.",
          ],
        },
      ),
      poll("a6", "How confident do you feel about choosing between factoring and the quadratic formula?", ["Very confident", "Mostly confident", "Not yet — I need more practice"], {
        title: "Confidence check",
      }),
      exitTicket("a7", "In one or two sentences: when would you use the quadratic formula instead of factoring?", {
        title: "Exit ticket",
        hints: ["Think about equations where it is hard to find two “nice” numbers for the product and the sum."],
      }),
    ],
    discussionQuestions: [
      "Why does a quadratic equation have at most two real solutions?",
      "What does the discriminant tell us about the graph of the parabola?",
      "In the rectangle warm-up, why did we reject x = −4?",
    ],
    assessment: [
      "Live check: accuracy on the factoring and formula exercises (target: most students correct within two attempts).",
      "Common error to watch: sign mistakes when b or c is negative.",
      "Exit ticket: can students justify their choice of method?",
    ],
    homework: [
      "Solve by factoring: x² − 7x + 10 = 0 and x² + x − 12 = 0.",
      "Use the discriminant to decide how many real roots 3x² − 2x + 5 = 0 has, without solving it.",
      "Write your own quadratic equation that has roots 4 and −1.",
    ],
    teacherNotes:
      "Common misconceptions: forgetting the ± in the formula, dividing both sides by x (which loses the root x = 0), and sign errors with negative b or c. Encourage students to check answers by substitution. Verify notation and terminology against the class textbook.",
    sources: [],
  },
  quiz: {
    title: "Quadratic Equations — Check-up",
    questions: [
      quiz.mc("q1", "What are the roots of (x − 4)(x + 1) = 0?", ["4 and −1", "−4 and 1", "4 and 1", "Only 4"], 0, "Set each bracket to zero: x − 4 = 0 gives 4, x + 1 = 0 gives −1."),
      quiz.trueFalse("q2", "The equation x² + 1 = 0 has two real solutions.", false, "x² + 1 is always at least 1, so it is never 0 for a real x (D = −4 < 0)."),
      quiz.numerical("q3", "What is the discriminant of x² − 6x + 9 = 0?", 0, 0, "D = (−6)² − 4·1·9 = 36 − 36 = 0, so there is one repeated root, x = 3."),
      quiz.short("q4", "Solve x² − 9 = 0. Give both solutions.", ["3, -3", "±3", "+-3"], "x² = 9, so x = 3 or x = −3."),
      quiz.numerical("q5", "The equation x² + bx + 12 = 0 has roots 3 and 4. What is b?", -7, 0, "(x − 3)(x − 4) = x² − 7x + 12, so b = −7."),
      quiz.mc("q6", "How many real solutions does 3x² − 2x + 5 = 0 have?", ["Two", "One", "None"], 2, "D = 4 − 60 = −56 < 0, so there are no real solutions."),
    ],
  },
};
