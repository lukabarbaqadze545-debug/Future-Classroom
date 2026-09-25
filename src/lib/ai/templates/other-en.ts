import { discussion, exercise, exitTicket, multipleChoice, plot, poll, quiz, section, shortAnswer } from "./builders";
import type { CuratedLesson } from "./types";

export const algorithmsEn: CuratedLesson = {
  key: "algorithms-en",
  match: /algorithm|binary search|linear search|ალგორითმ/i,
  subject: "computer_science",
  language: "en",
  title: "Introduction to Algorithms",
  topic: "Introduction to algorithms",
  grade: 8,
  durationMin: 45,
  difficulty: "foundation",
  objective: "Students describe what an algorithm is and compare linear and binary search by counting steps.",
  content: {
    objectives: [
      "Explain what an algorithm is using everyday examples.",
      "Carry out linear search and binary search by hand.",
      "Compare the two searches by counting the steps they need.",
    ],
    sections: [
      section("s1", "introduction", "Algorithms are everywhere", 5, `An algorithm is a precise, step-by-step set of instructions that solves a problem. A recipe, directions to school and the steps to solve an equation are all algorithms.

Warm-up: in pairs, write the steps to find a word in a paper dictionary.`),
      section("s2", "explanation", "Linear search", 10, `Linear search checks items one by one from the start until it finds the target (or reaches the end).

• Works on any list, sorted or not.
• In the worst case it checks every item: a list of n items may need n checks.`),
      section("s3", "explanation", "Binary search", 12, `Binary search only works on a sorted list. It looks at the middle item:
1. If the middle item is the target, stop.
2. If the target is smaller, repeat on the left half; if larger, on the right half.

Each step halves the part of the list still to search. A sorted list of 1,000 items needs at most about 10 steps, because 2¹⁰ = 1,024.`, plot("ln(x)/ln(2)", 1, 64, "Binary search steps grow very slowly (log₂ n) as the list gets longer")),
      section("s4", "practice", "Unplugged game", 10, `Play "guess my number" between 1 and 100. The only feedback allowed is "higher" or "lower". Which strategy wins fastest? Connect the winning strategy to binary search.`),
      section("s5", "summary", "Summary", 5, `• An algorithm is a precise sequence of steps.
• Linear search: simple, works on any list, may check every item.
• Binary search: needs a sorted list, halves the search space each step — much faster on long lists.`),
    ],
    activities: [
      multipleChoice("a1", "What must be true about a list before you can use binary search?", ["It must be sorted", "It must be short", "It must contain numbers only", "It must have an even number of items"], 0, {
        title: "Binary search rule",
        hints: [
          "Binary search decides to go left or right after looking at the middle item. What must be true for that decision to make sense?",
          "If the middle item is bigger than the target, why can we ignore the right half?",
          "We can only ignore half the list if everything on one side is bigger and everything on the other side is smaller.",
          "That is only guaranteed when the list is in order.",
        ],
        solution: "The list must be sorted. Otherwise, looking at the middle item tells you nothing about which half contains the target.",
        explanation: "Binary search relies on order to discard half of the list at each step.",
      }),
      exercise("a2", "Linear search checks items one by one. In the worst case, how many items does it check in a list of 50 items?", ["50"], {
        title: "Worst case for linear search",
        hints: ["What is the worst place for the target to be — or not be?", "If the target is the last item, or not in the list at all, how many items are checked?"],
        solution: "50 — in the worst case every item is checked.",
        explanation: "Linear search may need to check all n items.",
      }),
      exercise("a3", "A sorted list has 1,000 items. Each step of binary search halves the part still to search. After how many halvings is at most one item left?", ["10"], {
        title: "Count the halvings",
        hints: [
          "Try halving 1,000 again and again. How quickly does it shrink?",
          "Powers of two can help: 2, 4, 8, 16, … Which power of two first reaches at least 1,000?",
          "2⁹ = 512 and 2¹⁰ = 1,024.",
          "Since 1,024 ≥ 1,000, ten halvings are enough.",
        ],
        solution: "10, because 2¹⁰ = 1,024 ≥ 1,000 while 2⁹ = 512 is too small.",
        explanation: "Each halving divides the search space by two, so the number of steps grows like log₂ n.",
      }),
      shortAnswer("a4", "What is the name of the search that checks every item in order, one by one?", ["linear search", "linear", "sequential search"], {
        title: "Name the search",
        hints: ["It goes along the list in a straight line…"],
        solution: "Linear (sequential) search.",
        explanation: "Linear search is also called sequential search.",
      }),
      discussion("a5", "Where do you use search algorithms in everyday life — on your phone, in a library, or at home?", { title: "Searches around us" }),
      poll("a6", "Which search would you choose for an unsorted list of 20 names?", ["Linear search", "Binary search"], { title: "Choose a search" }),
      exitTicket("a7", "Explain in your own words why binary search is faster than linear search on a long sorted list.", { title: "Exit ticket" }),
    ],
    discussionQuestions: ["Is the fastest algorithm always the best choice?", "How could you sort a list before searching it?"],
    assessment: ["Can students carry out binary search on a sorted list of 15 numbers?", "Correct step counts in the exercises."],
    homework: ["Write the steps of binary search as a numbered algorithm that a classmate could follow."],
    teacherNotes: "Some students think binary search works on any list. Use a shuffled deck of numbered cards to show why it fails. Links to the future Programming Lab module (Python implementation).",
    sources: [],
  },
  quiz: {
    title: "Algorithms — Quick Check",
    questions: [
      quiz.mc("q1", "Which list can binary search be used on?", ["[2, 5, 9, 14, 20]", "[9, 2, 20, 5, 14]", "Both"], 0, "Only the sorted list."),
      quiz.numerical("q2", "At most how many halvings does binary search need for 64 sorted items until one is left?", 6, 0, "2⁶ = 64."),
      quiz.trueFalse("q3", "A recipe can be seen as an algorithm.", true, "It is a precise sequence of steps."),
    ],
  },
};

export const mapReadingEn: CuratedLesson = {
  key: "map-reading-en",
  match: /map|scale|contour|compass|რუკ/i,
  subject: "geography",
  language: "en",
  title: "Map Reading Skills",
  topic: "Map reading",
  grade: 6,
  durationMin: 40,
  difficulty: "foundation",
  objective: "Students use scale, compass directions and contour lines to read a topographic map.",
  content: {
    objectives: [
      "Use a map scale to calculate real distances.",
      "Give directions using the eight compass points.",
      "Interpret contour lines to describe the shape of the land.",
    ],
    sections: [
      section("s1", "introduction", "Why maps?", 5, `Show a topographic map of the area around your school or a nearby national park. Ask: what can a map tell us that a photo cannot?`),
      section("s2", "explanation", "Scale", 10, `A scale such as 1:50,000 means 1 cm on the map is 50,000 cm (500 m) in real life.

To find a real distance: measure on the map in cm, multiply by the scale, then convert units.
Example: on a 1:50,000 map, 2 cm → 100,000 cm = 1 km.`),
      section("s3", "explanation", "Directions and contour lines", 12, `The eight compass points: N, NE, E, SE, S, SW, W, NW.

Contour lines join points of equal height. Lines close together show a steep slope; lines far apart show gentle ground. Circles of increasing height show a hill or mountain summit.`),
      section("s4", "summary", "Summary", 5, `• Scale converts map distance to real distance.
• Eight compass points describe direction.
• Close contour lines = steep; far apart = gentle.`),
    ],
    activities: [
      multipleChoice("a1", "On a 1:50,000 map, how far in real life is 2 cm?", ["1 km", "10 km", "100 m", "50 km"], 0, {
        title: "Use the scale",
        hints: [
          "The scale tells you how many real centimetres one map centimetre represents.",
          "1 cm = 50,000 cm. So how many real centimetres is 2 cm?",
          "2 × 50,000 cm = 100,000 cm. How many centimetres are in a kilometre?",
          "1 km = 100,000 cm.",
        ],
        solution: "2 cm × 50,000 = 100,000 cm = 1,000 m = 1 km.",
        explanation: "Multiply by the scale, then convert: 100,000 cm = 1 km.",
      }),
      exercise("a2", "On a 1:25,000 map two villages are 8 cm apart. What is the real distance in km?", ["2", "2 km"], {
        title: "Village distance",
        hints: ["Multiply the map distance by the scale number.", "8 × 25,000 = 200,000 cm.", "Convert: 100,000 cm = 1 km."],
        solution: "8 cm × 25,000 = 200,000 cm = 2 km.",
        explanation: "200,000 cm is 2 km.",
      }),
      shortAnswer("a3", "What do contour lines that are very close together show?", ["steep slope", "a steep slope", "steep"], {
        title: "Read the contours",
        hints: ["Each contour line marks a height. If the lines are close, how quickly does the height change?", "A big change in height over a short distance means…"],
        solution: "A steep slope.",
        explanation: "Close contour lines mean the height changes quickly over a short distance — a steep slope.",
      }),
      discussion("a4", "When might a paper map be more useful than a phone map?", { title: "Paper vs phone" }),
      exitTicket("a5", "Describe the route from the school entrance to the library using at least two compass directions.", { title: "Exit ticket" }),
    ],
    discussionQuestions: ["Why do hikers in the Caucasus still carry paper maps?"],
    assessment: ["Correct scale calculations.", "Correct use of compass points."],
    homework: ["Draw a simple map of your street with a scale and a north arrow."],
    teacherNotes: "Have physical maps and rulers ready. Check that the local map extracts use a scale students can calculate with.",
    sources: [],
  },
  quiz: {
    title: "Map Reading — Quiz",
    questions: [
      quiz.numerical("q1", "On a 1:100,000 map, how many km is 3 cm?", 3, 0, "3 × 100,000 cm = 300,000 cm = 3 km."),
      quiz.mc("q2", "Which direction is exactly between north and east?", ["Northeast", "Northwest", "Southeast"], 0, "NE is between N and E."),
      quiz.trueFalse("q3", "Contour lines far apart show a steep slope.", false, "Far apart means gentle ground."),
    ],
  },
};
