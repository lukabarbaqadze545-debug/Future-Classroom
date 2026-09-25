import { l, type L } from "../localized";
import type { ChallengeSet } from "./types";

/*
 * Robotics: concepts and Arduino-style projects. The projects need a real
 * kit (microcontroller, sensors, motors) that the platform does not provide;
 * they are labelled as physical projects everywhere.
 */

export interface RoboticsConcept {
  id: string;
  group: "sensors" | "actuators" | "control";
  name: L;
  text: L;
}

export const ROBOTICS_CONCEPTS: RoboticsConcept[] = [
  { id: "ultrasonic", group: "sensors", name: l("Ultrasonic distance sensor", "ულტრაბგერითი მანძილის სენსორი"), text: l("Sends a sound pulse and times the echo. Distance = speed of sound × time ÷ 2.", "აგზავნის ბგერით იმპულსს და ზომავს ექოს დროს. მანძილი = ბგერის სიჩქარე × დრო ÷ 2.") },
  { id: "light", group: "sensors", name: l("Light sensor (LDR)", "სინათლის სენსორი (ფოტორეზისტორი)"), text: l("Its resistance falls in bright light. Read it as a changing voltage.", "კაშკაშა სინათლეზე მისი წინაღობა მცირდება. მას ცვალებადი ძაბვის სახით ვკითხულობთ.") },
  { id: "line", group: "sensors", name: l("Infrared line sensor", "ინფრაწითელი ხაზის სენსორი"), text: l("Detects whether the surface below is dark or light — used to follow a line.", "ადგენს, მუქია თუ ღია ქვემოთ მდებარე ზედაპირი — გამოიყენება ხაზის მისაყოლად.") },
  { id: "button", group: "sensors", name: l("Button and touch sensor", "ღილაკი და შეხების სენსორი"), text: l("A digital input: pressed or not pressed.", "ციფრული შესასვლელი: დაჭერილია ან არა.") },
  { id: "dc-motor", group: "actuators", name: l("DC motor with driver", "მუდმივი დენის ძრავა მართვის ბლოკით"), text: l("Spins wheels. A motor driver lets a small microcontroller control a larger current and direction.", "აბრუნებს ბორბლებს. მართვის ბლოკი პატარა მიკროკონტროლერს დიდი დენისა და მიმართულების მართვის საშუალებას აძლევს.") },
  { id: "servo", group: "actuators", name: l("Servo motor", "სერვოძრავა"), text: l("Turns to an exact angle (0–180°). Good for arms, grippers and pointers.", "ზუსტ კუთხეზე (0–180°) ბრუნდება. კარგია მანიპულატორებისთვის, საჭერებისა და მაჩვენებლებისთვის.") },
  { id: "loop", group: "control", name: l("Sense – think – act loop", "აღქმა – ფიქრი – მოქმედება"), text: l("A robot repeats: read sensors, decide, move motors. Arduino’s loop() runs this again and again.", "რობოტი იმეორებს: კითხულობს სენსორებს, იღებს გადაწყვეტილებას, ამოძრავებს ძრავებს. Arduino-ს loop() ამას ისევ და ისევ იმეორებს.") },
  { id: "feedback", group: "control", name: l("Feedback and proportional control", "უკუკავშირი და პროპორციული მართვა"), text: l("Correct in proportion to the error: the further from the line, the harder you turn. Smooth instead of jerky.", "შეასწორე შეცდომის პროპორციულად: რაც უფრო შორს ხარ ხაზიდან, მით უფრო მკვეთრად მოუხვიე. მოძრაობა გლუვია და არა ხტუნვითი.") },
  { id: "states", group: "control", name: l("States", "მდგომარეობები"), text: l("Split behaviour into states (drive, turn, stop) and rules for switching between them.", "ქცევა მდგომარეობებად დაყავი (სვლა, მოხვევა, გაჩერება) და განსაზღვრე მათ შორის გადასვლის წესები.") },
];

export interface RoboticsProject {
  id: string;
  difficulty: 1 | 2 | 3;
  title: L;
  goal: L;
  parts: L[];
  wiring: L[];
  code: string;
  steps: L[];
  extensions: L[];
}

export const ROBOTICS_PROJECTS: RoboticsProject[] = [
  {
    id: "night-light",
    difficulty: 1,
    title: l("Automatic night light", "ავტომატური ღამის სანათი"),
    goal: l("An LED turns on by itself when the room gets dark.", "შუქდიოდი თავისით ირთვება, როცა ოთახში ბნელდება."),
    parts: [
      l("Arduino-compatible board and USB cable", "Arduino-თავსებადი დაფა და USB კაბელი"),
      l("Light sensor (LDR) and 10 kΩ resistor", "სინათლის სენსორი (ფოტორეზისტორი) და 10 kΩ რეზისტორი"),
      l("LED and 220 Ω resistor", "შუქდიოდი და 220 Ω რეზისტორი"),
      l("Breadboard and jumper wires", "სამონტაჟო დაფა და შემაერთებელი სადენები"),
    ],
    wiring: [
      l("LDR from 5V to pin A0; 10 kΩ from A0 to GND (a voltage divider).", "ფოტორეზისტორი 5V-დან A0-მდე; 10 kΩ A0-დან GND-მდე (ძაბვის გამყოფი)."),
      l("Pin 9 → 220 Ω → LED long leg; LED short leg → GND.", "პინი 9 → 220 Ω → შუქდიოდის გრძელი ფეხი; მოკლე ფეხი → GND."),
    ],
    code: `const int SENSOR = A0;
const int LED = 9;
const int DARK = 300;   // adjust after reading the Serial Monitor

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(SENSOR);   // 0 (dark) .. 1023 (bright)
  Serial.println(light);
  if (light < DARK) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
  delay(200);
}
`,
    steps: [
      l("Build the circuit and upload the code.", "ააწყე წრედი და ატვირთე კოდი."),
      l("Open the Serial Monitor and note the readings in light and when you cover the sensor.", "გახსენი Serial Monitor და ჩაიწერე მაჩვენებლები სინათლეზე და სენსორის დაფარვისას."),
      l("Set DARK between the two readings and test again.", "DARK მნიშვნელობა ამ ორ მაჩვენებელს შორის დააყენე და ხელახლა შეამოწმე."),
    ],
    extensions: [
      l("Make the LED brightness depend on how dark it is (analogWrite).", "შუქდიოდის სიკაშკაშე დამოკიდებული გახადე სიბნელის ხარისხზე (analogWrite)."),
      l("Add a gap between on and off thresholds so it does not flicker (hysteresis).", "ჩართვისა და გამორთვის ზღვრებს შორის დაამატე შუალედი, რომ არ ციმციმებდეს (ჰისტერეზისი)."),
    ],
  },
  {
    id: "obstacle-car",
    difficulty: 2,
    title: l("Obstacle-avoiding car", "დაბრკოლებების ამრიდებელი მანქანა"),
    goal: l("A two-wheeled car drives forward and turns away when something is closer than 20 cm.", "ორბორბლიანი მანქანა წინ მიდის და უხვევს, როცა რაიმე 20 სმ-ზე ახლოსაა."),
    parts: [
      l("Arduino-compatible board, battery pack", "Arduino-თავსებადი დაფა, ბატარეების ბლოკი"),
      l("2 DC motors with wheels and a chassis", "2 მუდმივი დენის ძრავა ბორბლებით და შასი"),
      l("Motor driver (e.g. L298N or similar)", "ძრავის მართვის ბლოკი (მაგ. L298N ან მსგავსი)"),
      l("Ultrasonic sensor (HC-SR04 type)", "ულტრაბგერითი სენსორი (HC-SR04 ტიპის)"),
    ],
    wiring: [
      l("Sensor: VCC → 5V, GND → GND, TRIG → pin 7, ECHO → pin 6.", "სენსორი: VCC → 5V, GND → GND, TRIG → პინი 7, ECHO → პინი 6."),
      l("Motor driver inputs: left motor → pins 2 and 3, right motor → pins 4 and 5. Power the motors from the battery pack, not from the board.", "მართვის ბლოკის შესასვლელები: მარცხენა ძრავა → პინები 2 და 3, მარჯვენა → პინები 4 და 5. ძრავები ბატარეების ბლოკით იკვებოს და არა დაფიდან."),
    ],
    code: `const int TRIG = 7, ECHO = 6;
const int L1 = 2, L2 = 3, R1 = 4, R2 = 5;

long distanceCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 30000);   // time of the echo
  return us / 58;                         // sound: ~58 µs per cm there and back
}

void drive(int l1, int l2, int r1, int r2) {
  digitalWrite(L1, l1); digitalWrite(L2, l2);
  digitalWrite(R1, r1); digitalWrite(R2, r2);
}

void setup() {
  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);
  for (int p = 2; p <= 5; p++) pinMode(p, OUTPUT);
}

void loop() {
  long d = distanceCm();
  if (d > 0 && d < 20) {
    drive(LOW, HIGH, HIGH, LOW);   // spin right
    delay(400);
  } else {
    drive(HIGH, LOW, HIGH, LOW);   // forward
  }
  delay(50);
}
`,
    steps: [
      l("Test each motor on its own first; swap its two wires if it turns the wrong way.", "ჯერ თითოეული ძრავა ცალ-ცალკე შეამოწმე; თუ არასწორად ბრუნავს, მისი ორი სადენი გაცვალე."),
      l("Print distanceCm() to the Serial Monitor and check it with a ruler.", "distanceCm() გამოიტანე Serial Monitor-ში და სახაზავით გადაამოწმე."),
      l("Run the full program on the floor with space around it.", "სრული პროგრამა იატაკზე, თავისუფალ სივრცეში გაუშვი."),
    ],
    extensions: [
      l("Look left and right with a servo and turn towards the freer side.", "სერვოძრავით მარცხნივ და მარჯვნივ „გაიხედოს“ და უფრო თავისუფალი მხარისკენ მოუხვიოს."),
      l("Slow down gradually as obstacles get closer (proportional control).", "დაბრკოლებასთან მიახლოებისას თანდათან შეანელოს (პროპორციული მართვა)."),
    ],
  },
  {
    id: "line-follower",
    difficulty: 3,
    title: l("Line-following robot", "ხაზის მიმყოლი რობოტი"),
    goal: l("A robot follows a black line on a white floor using two infrared sensors.", "რობოტი ორი ინფრაწითელი სენსორით თეთრ იატაკზე შავ ხაზს მიჰყვება."),
    parts: [
      l("Car chassis with 2 motors and a motor driver", "მანქანის შასი 2 ძრავით და მართვის ბლოკით"),
      l("2 infrared line sensors", "2 ინფრაწითელი ხაზის სენსორი"),
      l("Black electrical tape for the track", "შავი იზოლაციის ლენტი ტრასისთვის"),
    ],
    wiring: [
      l("Left sensor OUT → pin 8, right sensor OUT → pin 9, both powered from 5V and GND.", "მარცხენა სენსორის OUT → პინი 8, მარჯვენასი → პინი 9; ორივე იკვებება 5V-დან და GND-დან."),
      l("Motors as in the obstacle-avoiding car.", "ძრავები — როგორც დაბრკოლებების ამრიდებელ მანქანაში."),
    ],
    code: `const int LEFT_SENSOR = 8, RIGHT_SENSOR = 9;
const int L1 = 2, L2 = 3, R1 = 4, R2 = 5;

void drive(int l1, int l2, int r1, int r2) {
  digitalWrite(L1, l1); digitalWrite(L2, l2);
  digitalWrite(R1, r1); digitalWrite(R2, r2);
}

void setup() {
  pinMode(LEFT_SENSOR, INPUT); pinMode(RIGHT_SENSOR, INPUT);
  for (int p = 2; p <= 5; p++) pinMode(p, OUTPUT);
}

void loop() {
  bool leftOnLine = digitalRead(LEFT_SENSOR) == HIGH;   // many sensors: HIGH = dark
  bool rightOnLine = digitalRead(RIGHT_SENSOR) == HIGH;
  if (leftOnLine && !rightOnLine) {
    drive(LOW, LOW, HIGH, LOW);     // line is to the left: turn left
  } else if (rightOnLine && !leftOnLine) {
    drive(HIGH, LOW, LOW, LOW);     // line is to the right: turn right
  } else {
    drive(HIGH, LOW, HIGH, LOW);    // straight on
  }
}
`,
    steps: [
      l("Check each sensor over black and white; adjust its sensitivity screw if it has one.", "შეამოწმე თითოეული სენსორი შავზე და თეთრზე; თუ მგრძნობელობის ხრახნი აქვს, დაარეგულირე."),
      l("Place the sensors on each side of the line, a little apart.", "სენსორები ხაზის ორივე მხარეს, ოდნავ დაშორებით განათავსე."),
      l("Start with gentle curves on the track before trying sharp turns.", "ტრასაზე ჯერ რბილი მოსახვევებით დაიწყე, მერე სცადე მკვეთრი."),
    ],
    extensions: [
      l("Use motor speed (PWM) instead of on/off to make the turns smoother.", "ჩართვა/გამორთვის ნაცვლად გამოიყენე ძრავის სიჩქარე (PWM), რომ მოხვევები უფრო გლუვი იყოს."),
      l("Add a third sensor and stop at a crossing line.", "დაამატე მესამე სენსორი და გადამკვეთ ხაზზე გაჩერება."),
    ],
  },
  {
    id: "plant-monitor",
    difficulty: 2,
    title: l("Plant watering reminder", "მცენარის მორწყვის შემხსენებელი"),
    goal: l("A soil-moisture sensor lights a warning LED when the plant needs water.", "ნიადაგის ტენიანობის სენსორი გამაფრთხილებელ შუქდიოდს ანთებს, როცა მცენარეს წყალი სჭირდება."),
    parts: [
      l("Arduino-compatible board", "Arduino-თავსებადი დაფა"),
      l("Capacitive soil-moisture sensor", "ტევადობითი ნიადაგის ტენიანობის სენსორი"),
      l("Red LED and 220 Ω resistor", "წითელი შუქდიოდი და 220 Ω რეზისტორი"),
    ],
    wiring: [l("Sensor: VCC → 5V, GND → GND, AOUT → A1.", "სენსორი: VCC → 5V, GND → GND, AOUT → A1."), l("Pin 10 → 220 Ω → LED → GND.", "პინი 10 → 220 Ω → შუქდიოდი → GND.")],
    code: `const int MOISTURE = A1;
const int LED = 10;
const int DRY = 600;   // measure dry and wet soil, then choose a value between

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(MOISTURE);   // capacitive sensors: higher = drier
  Serial.println(value);
  digitalWrite(LED, value > DRY ? HIGH : LOW);
  delay(1000);
}
`,
    steps: [
      l("Measure the reading in dry soil and in freshly watered soil.", "გაზომე მაჩვენებელი მშრალ და ახლად მორწყულ ნიადაგში."),
      l("Choose DRY between the two and test over several days.", "DRY შეარჩიე ამ ორ მნიშვნელობას შორის და რამდენიმე დღე შეამოწმე."),
      l("Record your readings in the STEM project workspace as data.", "შენი მაჩვენებლები STEM პროექტის სამუშაო სივრცეში მონაცემებად ჩაიწერე."),
    ],
    extensions: [
      l("Log readings every hour and plot how fast the soil dries.", "მაჩვენებლები ყოველ საათში ჩაიწერე და ააგე გრაფიკი, რა სისწრაფით შრება ნიადაგი."),
      l("Compare two plants in different light.", "შეადარე ორი მცენარე სხვადასხვა განათებაში."),
    ],
  },
];

export const ROBOTICS_CHALLENGES: ChallengeSet[] = [
  {
    id: "robot-logic",
    area: "robotics",
    difficulty: 2,
    title: l("Robot control logic", "რობოტის მართვის ლოგიკა"),
    summary: l("Read short control programs and predict what the robot does.", "წაიკითხე მოკლე მართვის პროგრამები და იწინასწარმეტყველე რობოტის ქცევა."),
    items: [
      {
        type: "choice",
        id: "rl1",
        prompt: l("In the night-light code, the room is bright and analogRead returns 800 (DARK = 300). What does the LED do?", "ღამის სანათის კოდში ოთახი ნათელია და analogRead 800-ს აბრუნებს (DARK = 300). რას აკეთებს შუქდიოდი?"),
        options: [
          { id: "on", text: l("Turns on", "ირთვება") },
          { id: "off", text: l("Stays off", "გამორთული რჩება") },
          { id: "blink", text: l("Blinks", "ციმციმებს") },
          { id: "half", text: l("Glows at half brightness", "ნახევარი სიკაშკაშით ანათებს") },
        ],
        correct: "off",
        explanation: l("800 is not less than 300, so the else branch runs: digitalWrite(LED, LOW).", "800 არ არის 300-ზე ნაკლები, ამიტომ სრულდება else შტო: digitalWrite(LED, LOW)."),
      },
      {
        type: "numeric",
        id: "rl2",
        prompt: l("An ultrasonic echo takes 1160 µs to return. Using 58 µs per cm, how far away is the obstacle?", "ულტრაბგერითი ექო 1160 მკწმ-ში ბრუნდება. თუ 1 სმ-ს 58 მკწმ შეესაბამება, რა მანძილზეა დაბრკოლება?"),
        unit: "cm",
        answer: 20,
        tolerance: 0.2,
        explanation: l("1160 ÷ 58 = 20 cm. (Sound travels to the obstacle and back, which is why the factor is 58, not 29.)", "1160 ÷ 58 = 20 სმ. (ბგერა დაბრკოლებამდე მიდის და ბრუნდება — ამიტომაა კოეფიციენტი 58 და არა 29.)"),
      },
      {
        type: "choice",
        id: "rl3",
        prompt: l("The line follower’s left sensor sees the line and the right one does not. What should the robot do?", "ხაზის მიმყოლი რობოტის მარცხენა სენსორი ხაზს ხედავს, მარჯვენა — არა. რა უნდა გააკეთოს რობოტმა?"),
        options: [
          { id: "left", text: l("Turn left, back towards the line", "მარცხნივ მოუხვიოს, ხაზისკენ") },
          { id: "right", text: l("Turn right", "მარჯვნივ მოუხვიოს") },
          { id: "stop", text: l("Stop", "გაჩერდეს") },
          { id: "back", text: l("Reverse", "უკან წავიდეს") },
        ],
        correct: "left",
        explanation: l("The line has drifted to the left of the robot, so it turns left to centre itself again.", "ხაზი რობოტის მარცხნივ გადაინაცვლა, ამიტომ ის მარცხნივ უხვევს, რომ ისევ ცენტრში მოექცეს."),
      },
      {
        type: "choice",
        id: "rl4",
        prompt: l("Why should the motors be powered from a separate battery pack, not from the microcontroller’s 5V pin?", "რატომ უნდა იკვებებოდეს ძრავები ცალკე ბატარეების ბლოკიდან და არა მიკროკონტროლერის 5V პინიდან?"),
        options: [
          { id: "current", text: l("Motors draw more current than the board can safely supply", "ძრავები იმაზე მეტ დენს მოიხმარს, ვიდრე დაფას უსაფრთხოდ შეუძლია მიაწოდოს") },
          { id: "colour", text: l("Because the wires are a different colour", "იმიტომ, რომ სადენები სხვა ფერისაა") },
          { id: "faster", text: l("To make the code run faster", "რომ კოდი უფრო სწრაფად შესრულდეს") },
          { id: "none", text: l("There is no reason", "მიზეზი არ არსებობს") },
        ],
        correct: "current",
        explanation: l("Motors can draw hundreds of milliamps and cause voltage drops that reset or damage the board.", "ძრავებს ასობით მილიამპერის მოხმარება შეუძლია, რაც ძაბვის ვარდნას იწვევს და დაფას გადატვირთავს ან აზიანებს."),
      },
    ],
  },
];

export function findRoboticsProject(id: string) {
  return ROBOTICS_PROJECTS.find((p) => p.id === id) ?? null;
}
