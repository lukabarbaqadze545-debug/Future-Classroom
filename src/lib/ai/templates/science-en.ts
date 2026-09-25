import { discussion, exercise, exitTicket, multipleChoice, plot, poll, quiz, section, shortAnswer } from "./builders";
import type { CuratedLesson } from "./types";

export const newtonEn: CuratedLesson = {
  key: "newton-en",
  match: /newton|force|inertia|ნიუტონ|ძალ/i,
  subject: "physics",
  language: "en",
  title: "Newton's Laws of Motion",
  topic: "Newton's laws",
  grade: 9,
  durationMin: 45,
  difficulty: "standard",
  objective: "Students explain everyday motion with Newton's three laws and use F = m·a in simple calculations.",
  content: {
    objectives: [
      "State Newton's first law and explain inertia with everyday examples.",
      "Use the second law, F = m·a, to calculate force, mass or acceleration.",
      "Identify action–reaction force pairs using the third law.",
    ],
    sections: [
      section("s1", "introduction", "Why do things start and stop moving?", 5, `Slide a book across the desk: it stops. Push a shopping trolley: it starts moving. Ask the class: what makes objects start, stop or change direction?

Collect a few answers on the board. Many students think a force is needed to keep something moving — this lesson tests that idea.`),
      section("s2", "explanation", "First law: inertia", 8, `An object stays at rest, or keeps moving in a straight line at constant speed, unless a net (unbalanced) force acts on it.

This tendency to keep doing what it is doing is called inertia. The book stops because friction acts on it — not because moving things "naturally" stop.

Everyday example: when a bus brakes suddenly, passengers lurch forward. Their bodies keep moving forward while the bus slows down.`),
      section("s3", "explanation", "Second law: F = m·a", 12, `The acceleration of an object depends on the net force and on its mass:

F = m · a   (force in newtons N, mass in kg, acceleration in m/s²)

• The same force gives a small mass a large acceleration.
• To give a larger mass the same acceleration, you need a larger force.

Worked example: a net force of 12 N acts on a 3 kg cart. a = F / m = 12 / 3 = 4 m/s².`, plot("x/2", 0, 20, "Acceleration of a 2 kg object as the net force increases (a = F / m)")),
      section("s4", "explanation", "Third law: action and reaction", 8, `When object A pushes on object B, object B pushes back on A with a force of equal size in the opposite direction.

The two forces act on different objects, so they do not cancel each other out.

Examples: a swimmer pushes water backwards and the water pushes the swimmer forwards; a rocket pushes gas down and the gas pushes the rocket up.`),
      section("s5", "summary", "Summary", 5, `• 1st law: no net force → no change in motion (inertia).
• 2nd law: F = m·a.
• 3rd law: forces come in equal and opposite pairs acting on different objects.

Safety note for follow-up experiments: use trolleys and ramps on the floor or low benches, and keep feet clear of moving objects.`),
    ],
    activities: [
      multipleChoice("a1", "A bus brakes suddenly and the standing passengers lurch forward. Which idea explains this best?", [
        "Inertia — their bodies keep moving forward",
        "The bus pushes them forward",
        "Gravity pulls them forward",
        "Air pushes them forward",
      ], 0, {
        title: "Explain the lurch",
        hints: [
          "Think about Newton's first law: what do moving objects do if nothing changes their motion?",
          "The bus slows down. Does anything slow down the passengers' bodies at the same moment?",
          "The passengers were moving at the same speed as the bus. When only the bus slows, what happens to the passengers relative to the bus?",
          "Their feet are slowed by friction with the floor, but the rest of their body keeps moving forward because of inertia.",
        ],
        solution: "Inertia: the passengers' bodies keep moving forward at the bus's old speed while the bus slows down, so they lurch forward relative to the bus.",
        explanation: "No forward force acts on the passengers — they simply keep their motion (first law).",
      }),
      exercise("a2", "A net force of 12 N acts on a 3 kg cart. What is the cart's acceleration in m/s²?", ["4", "4 m/s2", "4 m/s²"], {
        title: "Use F = m·a",
        hints: [
          "Which law links force, mass and acceleration?",
          "Rearrange F = m·a to find a.",
          "a = F / m. Substitute F = 12 N and m = 3 kg.",
          "Divide 12 by 3. The unit of acceleration is m/s².",
        ],
        solution: "a = F / m = 12 N / 3 kg = 4 m/s².",
        explanation: "Dividing the force by the mass gives the acceleration: 12 / 3 = 4 m/s².",
      }),
      shortAnswer("a3", "What net force (in newtons) is needed to accelerate a 1500 kg car at 2 m/s²?", ["3000", "3000 N", "3 000 N"], {
        title: "Force on a car",
        hints: [
          "Here you know the mass and the acceleration. Which quantity is missing?",
          "Use F = m·a directly.",
          "F = 1500 kg × 2 m/s².",
          "Multiply and give the unit newtons (N).",
        ],
        solution: "F = m·a = 1500 kg × 2 m/s² = 3000 N.",
        explanation: "F = m·a = 1500 × 2 = 3000 N.",
      }),
      multipleChoice("a4", "A swimmer pushes the water backwards. According to the third law, what does the water do?", [
        "Pushes the swimmer forwards with an equal force",
        "Pushes the swimmer backwards",
        "Does nothing, water cannot push",
        "Pushes the swimmer forwards with a smaller force",
      ], 0, {
        title: "Action and reaction",
        hints: [
          "The third law is about pairs of forces. How are the two forces in a pair related?",
          "The forces in a pair have equal size. What about their directions?",
          "If the swimmer pushes the water backwards, the reaction force must point the opposite way.",
          "Equal size, opposite direction, acting on the other object: the water pushes the swimmer.",
        ],
        solution: "The water pushes the swimmer forwards with a force of equal size — the reaction to the swimmer's push.",
        explanation: "Action and reaction are equal in size, opposite in direction and act on different objects.",
      }),
      discussion("a5", "Why do cars have seat belts? Use Newton's first law in your explanation.", {
        title: "Seat belts",
        hints: ["What happens to a passenger's body when a car stops very suddenly?", "What force does the seat belt provide, and on whom?"],
      }),
      poll("a6", "Which law do you find hardest to apply?", ["First law", "Second law", "Third law"], { title: "Quick poll" }),
      exitTicket("a7", "Give one example from your own life of each law.", { title: "Exit ticket" }),
    ],
    discussionQuestions: [
      "If there were no friction, what would happen to a book slid across a desk?",
      "Why is it harder to push a full shopping trolley than an empty one?",
      "Action and reaction forces are equal — so why does anything move at all?",
    ],
    assessment: [
      "Accuracy on the F = m·a calculations.",
      "Can students name the two objects in an action–reaction pair?",
    ],
    homework: [
      "Calculate the acceleration of a 50 kg sled pulled with a net force of 100 N.",
      "Draw force arrows for a rocket at lift-off and label the action–reaction pair.",
    ],
    teacherNotes:
      "Common misconception: 'a force is needed to keep an object moving'. Emphasise friction as the hidden force. Remind students that action–reaction forces act on different objects. Verify units and notation against the school physics textbook.",
    sources: [],
  },
  quiz: {
    title: "Newton's Laws — Quick Quiz",
    questions: [
      quiz.mc("q1", "Which law is also called the law of inertia?", ["First law", "Second law", "Third law"], 0, "The first law describes inertia."),
      quiz.numerical("q2", "A 2 kg ball is pushed with a net force of 10 N. What is its acceleration in m/s²?", 5, 0, "a = F / m = 10 / 2 = 5 m/s²."),
      quiz.trueFalse("q3", "Action and reaction forces cancel each other out because they are equal and opposite.", false, "They act on different objects, so they cannot cancel each other."),
      quiz.numerical("q4", "What net force (N) gives a 4 kg trolley an acceleration of 3 m/s²?", 12, 0, "F = m·a = 4 × 3 = 12 N."),
      quiz.short("q5", "What is the unit of force?", ["newton", "newtons", "N"], "Force is measured in newtons (N)."),
    ],
  },
};

export const ecosystemsEn: CuratedLesson = {
  key: "ecosystems-en",
  match: /ecosystem|food (chain|web)|ecolog|ეკოსისტემ/i,
  subject: "biology",
  language: "en",
  title: "Ecosystems and Food Webs",
  topic: "Ecosystems",
  grade: 7,
  durationMin: 40,
  difficulty: "foundation",
  objective: "Students describe the roles of producers, consumers and decomposers and explain how energy moves through a food web.",
  content: {
    objectives: [
      "Define an ecosystem and name its living and non-living parts.",
      "Classify organisms as producers, consumers or decomposers.",
      "Explain why only a small part of the energy passes from one level of a food chain to the next.",
    ],
    sections: [
      section("s1", "introduction", "What lives in a forest?", 5, `Show a photo of a local forest (for example in Borjomi-Kharagauli National Park). Ask: which living things can you see? Which non-living things do they depend on?

An ecosystem is a community of living things together with their non-living environment (water, soil, air, light, temperature).`),
      section("s2", "explanation", "Producers, consumers and decomposers", 10, `• Producers (plants, algae) make their own food from sunlight by photosynthesis.
• Consumers eat other organisms: herbivores eat plants, carnivores eat animals, omnivores eat both.
• Decomposers (fungi, bacteria) break down dead material and return nutrients to the soil.

A food chain shows who eats whom: grass → grasshopper → frog → heron. A food web links many food chains together.`),
      section("s3", "explanation", "Energy flows, matter cycles", 10, `At each step in a food chain, most energy is used for living (moving, keeping warm) or lost as heat. Roughly 10% passes on to the next level.

That is why food chains are short, and why there are fewer top predators than plants.

Nutrients, unlike energy, are recycled by decomposers.`),
      section("s4", "summary", "Summary", 5, `• Ecosystem = living community + non-living environment.
• Producers → consumers → top consumers; decomposers recycle.
• Only about 10% of energy passes to the next level.`),
    ],
    activities: [
      multipleChoice("a1", "Which organism is a producer?", ["Oak tree", "Fox", "Mushroom", "Eagle"], 0, {
        title: "Find the producer",
        hints: [
          "Producers make their own food. What process do they use?",
          "Which of these organisms can use sunlight to make food?",
          "Foxes and eagles eat animals, and mushrooms feed on dead material. Which one is left?",
          "Plants make food by photosynthesis — look for the plant.",
        ],
        solution: "The oak tree is the producer: it makes its own food by photosynthesis. The fox and eagle are consumers and the mushroom is a decomposer.",
        explanation: "Plants are producers because they make food from sunlight.",
      }),
      exercise("a2", "Grass stores 10,000 kJ of energy. Using the 10% rule, about how many kJ reach the grasshoppers that eat it?", ["1000", "1000 kJ", "1 000"], {
        title: "The 10% rule",
        hints: [
          "Only part of the energy passes from one level to the next. What fraction?",
          "The rule says about 10% passes on. What is 10% of a number?",
          "10% of 10,000 = 10,000 ÷ 10.",
          "Divide 10,000 by 10 and give the answer in kJ.",
        ],
        solution: "10% of 10,000 kJ = 10,000 ÷ 10 = 1,000 kJ.",
        explanation: "About 10% of the energy passes on: 10,000 ÷ 10 = 1,000 kJ.",
      }),
      shortAnswer("a3", "What do we call organisms, such as fungi and bacteria, that break down dead material?", ["decomposers", "decomposer"], {
        title: "Name the recyclers",
        hints: ["What happens to fallen leaves and dead animals over time?", "These organisms 'decompose' material. What might they be called?"],
        solution: "Decomposers.",
        explanation: "Decomposers return nutrients to the soil so producers can use them again.",
      }),
      discussion("a4", "What might happen to a forest food web if all the wolves disappeared?", {
        title: "Remove a predator",
        hints: ["What do wolves eat? What happens to that population without wolves?", "Think about the plants that the prey animals eat."],
      }),
      exitTicket("a5", "Draw or write a food chain with four links from a Georgian ecosystem you know.", { title: "Exit ticket" }),
    ],
    discussionQuestions: [
      "Why are there fewer eagles than mice in an ecosystem?",
      "How can humans protect a local ecosystem?",
    ],
    assessment: ["Correct classification of producers, consumers and decomposers.", "Use of the 10% rule in a calculation."],
    homework: ["Build a food web with at least six organisms from a lake or forest ecosystem."],
    teacherNotes: "Students often think energy is recycled like nutrients. Stress that energy flows one way. Check local species examples before the lesson.",
    sources: [],
  },
  quiz: {
    title: "Ecosystems — Check-up",
    questions: [
      quiz.mc("q1", "Which of these is a decomposer?", ["Fungus", "Rabbit", "Grass", "Hawk"], 0, "Fungi break down dead material."),
      quiz.numerical("q2", "A plant stores 5,000 kJ. About how many kJ reach the herbivore that eats it (10% rule)?", 500, 0, "10% of 5,000 = 500 kJ."),
      quiz.trueFalse("q3", "Energy is recycled in an ecosystem in the same way as nutrients.", false, "Energy flows one way; nutrients are recycled."),
      quiz.short("q4", "What process do plants use to make food from sunlight?", ["photosynthesis"], "Photosynthesis."),
    ],
  },
};
